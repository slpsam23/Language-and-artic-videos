/* App shell: navigation, lesson list, lesson runner (video cues -> activities), settings. */
(function (SG) {
  'use strict';
  var el = SG.el, L = SG.L;
  var board = null;

  var views = ['home', 'play', 'artic', 'builder', 'data', 'settings'];

  function show(name) {
    views.forEach(function (v) {
      var sec = SG.$('#view-' + v);
      if (sec) sec.hidden = v !== name;
      var tab = SG.$('[data-view="' + v + '"]');
      if (tab) tab.classList.toggle('active', v === name);
    });
    if (name !== 'play') Runner.pause();
    if (name !== 'builder') SG.Builder.leave();
    if (name === 'artic') SG.Artic.render(SG.$('#artic-root'));
    if (name === 'data') SG.DataView.render(SG.$('#data-root'));
    if (name === 'settings') renderSettings();
    if (name === 'home') renderHome();
    window.scrollTo(0, 0);
  }

  /* ---------- Home: lesson cards ---------- */
  function renderHome() {
    var root = SG.$('#lesson-grid');
    root.innerHTML = '';
    SG.Lessons.all().forEach(function (lesson) {
      var hasVideo = !!SG.YT.parseId(lesson.video);
      var counts = {};
      lesson.activities.forEach(function (a) { counts[a.type] = (counts[a.type] || 0) + 1; });
      root.append(el('article', { class: 'lesson-card' },
        el('div', { class: 'lesson-scene', 'aria-hidden': 'true' },
          hasVideo ? el('img', { src: 'https://i.ytimg.com/vi/' + SG.YT.parseId(lesson.video) + '/mqdefault.jpg', alt: '' })
            : lesson.image ? el('img', { src: lesson.image, alt: '' }) : el('span', { text: lesson.scene || '🖼️' })),
        el('h3', {}, SG.biText(lesson.title)),
        el('div', { class: 'chips' },
          el('span', { class: 'chip' }, hasVideo ? '🎬 Video' : '🖼️ Picture scene'),
          counts.wh ? el('span', { class: 'chip' }, '❓ WH ×' + counts.wh) : null,
          counts.binary ? el('span', { class: 'chip' }, '👍👎 ×' + counts.binary) : null,
          counts.formulate ? el('span', { class: 'chip' }, '🙋 Ask ×' + counts.formulate) : null,
          counts.artic ? el('span', { class: 'chip' }, '🗣️ Artic ×' + counts.artic) : null),
        el('div', { class: 'row wrap' },
          el('button', { class: 'btn primary big', type: 'button', onclick: function () { Runner.start(lesson); } }, '▶ Play / Jugar'),
          el('button', { class: 'btn', type: 'button', onclick: function () {
            show('builder'); SG.Builder.open(SG.$('#builder-root'), lesson);
          } }, lesson.builtin ? 'Copy & edit' : 'Edit'))));
    });
  }

  /* ---------- Lesson runner ---------- */
  var Runner = {
    lesson: null, player: null, results: [], doneCount: 0, finished: false, uncued: [],

    start: function (lesson) {
      Runner.stop();
      // Only the questions for this student's language level.
      lesson = Object.assign({}, lesson, { activities: SG.levelFilter(lesson.activities) });
      Runner.lesson = lesson;
      Runner.results = [];
      Runner.doneCount = 0;
      Runner.finished = false;
      Runner.ended = false;
      Runner.total = lesson.activities.length;
      show('play');
      board.reset();
      board.setLang(SG.settings.answerLang);
      board.hide();

      SG.$('#play-title').innerHTML = '';
      SG.$('#play-title').append(SG.biText(lesson.title));
      renderChart();

      var stage = SG.$('#stage');
      var scene = SG.$('#scene-card');
      var holder = SG.$('#player-box');
      var vid = SG.YT.parseId(lesson.video);
      renderScene(scene, lesson);

      if (!vid) {
        holder.hidden = true;
        scene.hidden = false;
        Runner.sequence(lesson.activities.slice());
        return;
      }

      holder.hidden = false;
      scene.hidden = true;
      stage.classList.add('has-video');
      var cued = lesson.activities.filter(function (a) { return typeof a.at === 'number'; });
      Runner.uncued = lesson.activities.filter(function (a) { return typeof a.at !== 'number'; });
      Runner.watchPanel();
      Runner.player = SG.YT.create(holder, vid, {
        start: SG.YT.parseStart(lesson.video),
        onEnded: function () {
          Runner.ended = true;
          if (!Runner.finished && !Runner.busy) Runner.afterVideo();
        },
        onError: function () {
          SG.toast(L('This video cannot be played here. Showing the picture scene instead.',
                     'Este video no se puede ver aquí. Se mostrará la imagen.'));
          Runner.player.destroy();
          Runner.player = null;
          holder.hidden = true;
          scene.hidden = false;
          Runner.sequence(lesson.activities.slice(Runner.doneCount));
        }
      });
      Runner.player.ready.then(function (p) {
        p.setCues(cued, function (act) { Runner.show(act, { fromVideo: true }); });
      }).catch(function (e) {
        SG.toast(e.message);
        holder.hidden = true;
        scene.hidden = false;
        Runner.sequence(lesson.activities.slice());
      });
    },

    watchPanel: function () {
      board.hide();
      var panel = SG.$('#activity-panel');
      panel.innerHTML = '';
      panel.append(el('div', { class: 'watch' },
        el('div', { class: 'watch-emoji', 'aria-hidden': 'true', text: '🎬' }),
        el('p', {}, SG.biText(L('Watch the video. It will stop for questions!', '¡Mira el video. Se va a parar para preguntas!'))),
        el('div', { class: 'row wrap center' },
          el('button', { class: 'btn primary big', type: 'button', onclick: function () { if (Runner.player) Runner.player.play(); } }, '▶ Play / Jugar'),
          el('button', { class: 'btn', type: 'button', onclick: function () {
            if (!Runner.player) return;
            if (!Runner.player.nextCue()) { Runner.player.pause(); Runner.afterVideo(); }
          } }, '⏭ Next question'))));
    },

    /* Video is over: ask the untimed activities, then wrap up. */
    afterVideo: function () {
      if (Runner.uncued.length) Runner.sequence(Runner.uncued.splice(0));
      else Runner.finish();
    },

    /* Run a list of activities one after another. */
    sequence: function (list) {
      var i = 0;
      function step() {
        if (i >= list.length) return Runner.finish();
        Runner.show(list[i++], { next: step });
      }
      step();
    },

    show: function (act, opts) {
      Runner.busy = true;
      var panel = SG.$('#activity-panel');
      panel.innerHTML = '';
      var box = el('div', { class: 'activity type-' + act.type });
      panel.append(box);
      SG.Activities.render(box, act, {
        board: board,
        lesson: Runner.lesson,
        index: Runner.doneCount,
        total: Runner.total,
        done: function (res) {
          Runner.doneCount++;
          Runner.results.push(res.result);
          if (!res.logged) {
            SG.Log.add({
              type: act.type, skill: SG.Activities.skillName(act), lang: res.lang,
              lesson: SG.biString(Runner.lesson.title), prompt: SG.Activities.promptText(act),
              response: res.response, result: res.result, attempts: res.attempts
            });
          }
          var label = opts.fromVideo ? L('Keep watching', 'Seguir viendo') : L('Next', 'Siguiente');
          box.append(el('div', { class: 'row center next-row' },
            el('button', { class: 'btn primary big', type: 'button', onclick: function () {
              Runner.busy = false;
              if (opts.fromVideo) {
                // The video can end while a cue near the very end is on screen.
                if (Runner.ended) { Runner.afterVideo(); return; }
                Runner.watchPanel();
                if (Runner.player) Runner.player.play();
              } else if (opts.next) {
                opts.next();
              }
            } }, SG.biText(label), ' ▶')));
          box.lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    },

    finish: function () {
      if (Runner.finished) return;
      Runner.finished = true;
      Runner.busy = false;
      board.hide();
      var r = Runner.results;
      var count = function (k) { return r.filter(function (x) { return x === k; }).length; };
      var panel = SG.$('#activity-panel');
      panel.innerHTML = '';
      panel.append(el('div', { class: 'finish' },
        el('div', { class: 'finish-emoji', 'aria-hidden': 'true', text: '🏆' }),
        el('h2', {}, SG.biText(L('All done!', '¡Terminamos!'))),
        el('p', { class: 'tally' },
          el('span', {}, '⭐ Independent: ' + count('correct')),
          el('span', {}, '🤝 With cues: ' + count('cued')),
          el('span', {}, '🔁 Not yet: ' + count('incorrect'))),
        el('div', { class: 'row wrap center' },
          el('button', { class: 'btn primary', type: 'button', onclick: function () { Runner.start(Runner.lesson); } }, '🔁 Play again'),
          el('button', { class: 'btn', type: 'button', onclick: function () { SG.Chart.print(Runner.lesson); } }, '🖨️ Print chart'),
          el('button', { class: 'btn', type: 'button', onclick: function () { show('home'); } }, '🏠 Lessons'))));
      SG.$('#chart-details').open = true;
    },

    pause: function () { if (Runner.player) Runner.player.pause(); },
    stop: function () {
      if (Runner.player) Runner.player.destroy();
      Runner.player = null;
      Runner.total = 0;
      Runner.busy = false;
      Runner.uncued = [];
      SG.$('#stage').classList.remove('has-video');
    }
  };

  function renderScene(root, lesson) {
    root.innerHTML = '';
    if (lesson.image) root.append(el('img', { src: lesson.image, alt: SG.biString(lesson.description) || 'Picture scene' }));
    else root.append(el('div', { class: 'scene-emoji', role: 'img', 'aria-label': SG.biString(lesson.description) || 'Picture scene', text: lesson.scene || '🖼️' }));
    if (lesson.description && (lesson.description.en || lesson.description.es)) {
      root.append(el('div', { class: 'scene-caption' }, SG.biText(lesson.description),
        el('button', { class: 'btn icon', type: 'button', title: 'Read aloud', onclick: function () { SG.Speech.speakBi(lesson.description); } }, '🔊')));
    }
  }

  function renderChart() {
    var root = SG.$('#chart-body');
    root.innerHTML = '';
    if (!Runner.lesson) return;
    root.append(SG.Chart.render(Runner.lesson.id));
  }
  SG.Chart.onChange = function () { renderChart(); };

  /* ---------- Settings ---------- */
  function renderSettings() {
    var root = SG.$('#settings-root');
    root.innerHTML = '';
    var aacRoot = el('div', { id: 'aac-root' });
    root.append(aacRoot);
    SG.AACSetup.render(aacRoot);
    var s = SG.settings;
    function bind(key, transform) {
      return function () { s[key] = transform ? transform(this) : this.value; SG.saveSettings(); syncHeader(); };
    }
    function voiceSelect(lang, key) {
      var sel = el('select', { onchange: bind(key) }, el('option', { value: '' }, 'Automatic'));
      SG.Speech.voices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(lang) === 0; }).forEach(function (v) {
        sel.append(el('option', { value: v.voiceURI, selected: s[key] === v.voiceURI }, v.name + ' (' + v.lang + ')'));
      });
      return sel;
    }
    root.append(el('div', { class: 'card settings' },
      el('h2', {}, '⚙️ Game settings'),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Support level for WH answers' }),
        el('select', { onchange: bind('level', function (x) { return Number(x.value); }) },
          el('option', { value: 1, selected: s.level === 1 }, '1 – Max support: frame filled in, choose the answer word'),
          el('option', { value: 2, selected: s.level === 2 }, '2 – Model chart shown, student builds the whole sentence'),
          el('option', { value: 3, selected: s.level === 3 }, '3 – Independent: no model (Help button still available)'))),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: s.deviceMode, onchange: bind('deviceMode', function (x) { return x.checked; }) }),
        ' Student answers on their own AAC device (hide the on-screen board; clinician scores)'),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: s.speakEachWord, onchange: bind('speakEachWord', function (x) { return x.checked; }) }),
        ' Speak each word when tapped'),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: s.autoSpeak, onchange: bind('autoSpeak', function (x) { return x.checked; }) }),
        ' Read questions aloud automatically'),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Speech rate' }),
        el('input', { type: 'range', min: 0.5, max: 1.3, step: 0.05, value: s.rate, onchange: bind('rate', function (x) { return Number(x.value); }) })),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'English voice' }), voiceSelect('en', 'voiceEn')),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Spanish voice / Voz en español' }), voiceSelect('es', 'voiceEs')),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Articulation trials goal' }),
        el('input', { type: 'number', min: 5, max: 100, value: s.articGoal, onchange: bind('articGoal', function (x) { return Number(x.value) || 20; }) })),
      el('div', { class: 'row wrap' },
        el('button', { class: 'btn', type: 'button', onclick: function () { SG.Speech.speak('Hello! Let’s play.', 'en'); } }, '🔊 Test English'),
        el('button', { class: 'btn', type: 'button', onclick: function () { SG.Speech.speak('¡Hola! Vamos a jugar.', 'es'); } }, '🔊 Probar español'))));
  }
  SG.Speech.onVoices = function () { if (!SG.$('#view-settings').hidden) renderSettings(); };

  function syncHeader() {
    SG.$('#student-name').value = SG.settings.student;
    SG.$('#ui-lang').value = SG.settings.uiLang;
    SG.$('#aac-chip').textContent = '🗂️ ' + SG.Profile.label();
  }

  /* ---------- Startup ---------- */
  function init() {
    SG.Profile.apply();
    board = SG.createBoard(SG.$('#board-root'));
    board.hide();
    SG.Profile.onChange = function () { board.reload(); syncHeader(); };

    document.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-view');
        if (v === 'builder') {
          show('builder');
          SG.AILesson.render(SG.$('#ai-lesson-body'));
          SG.Builder.open(SG.$('#builder-root'), null);
          return;
        }
        show(v);
      });
    });
    // Each student keeps their own AAC profile (program, grid, language, buttons).
    SG.$('#student-name').addEventListener('change', function () {
      SG.settings.student = this.value.trim();
      SG.saveSettings();
      SG.Profile.apply();
      if (!SG.$('#view-settings').hidden) renderSettings();
      else renderHome();
    });
    SG.$('#ui-lang').addEventListener('change', function () {
      var p = SG.Profile.current();
      p.lang = this.value;
      SG.Profile.save(p);
      if (!SG.$('#view-settings').hidden) renderSettings();
      else renderHome();
    });
    SG.$('#import-file').addEventListener('change', function () {
      if (this.files[0]) SG.Builder.importFile(this.files[0], renderHome);
      this.value = '';
    });
    SG.$('#export-all').addEventListener('click', function () {
      SG.download('my-speech-game-lessons.json', JSON.stringify({ lessons: SG.Lessons.custom() }, null, 2));
    });
    SG.$('#chart-print').addEventListener('click', function () { if (Runner.lesson) SG.Chart.print(Runner.lesson); });
    SG.$('#chart-clear').addEventListener('click', function () {
      if (Runner.lesson && confirm('Clear this lesson’s chart?')) SG.Chart.clear(Runner.lesson.id);
    });
    SG.$('#back-home').addEventListener('click', function () { Runner.stop(); show('home'); });

    syncHeader();

    // Shared lesson link: index.html#lesson=...
    var m = location.hash.match(/lesson=([\w-]+)/);
    if (m) {
      var shared = SG.Lessons.decodeShare(m[1]);
      if (shared) {
        var keep = el('button', { class: 'btn small', type: 'button', onclick: function () {
          SG.Lessons.save(shared); SG.toast('Saved to your lessons ✔'); keep.remove();
        } }, '💾 Save this lesson');
        SG.$('#play-tools').prepend(keep);
        Runner.start(shared);
        return;
      }
      SG.toast('That share link could not be opened.');
    }
    show('home');
  }

  SG.App = {
    show: show,
    play: function (lesson) { Runner.start(lesson); },
    refreshHome: renderHome
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.SG);
