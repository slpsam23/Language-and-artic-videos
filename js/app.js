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
    if (name !== 'play') {
      Runner.pause();
      if (board) board.setLock(null);
      SG.Profile.apply();   // undo the lesson-only language choice
    }
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

    /* Pick the lesson language first when the student's board is bilingual. */
    chooseLanguage: function (lesson) {
      Runner.stop();
      show('play');
      board.hide();
      SG.$('#play-title').innerHTML = '';
      SG.$('#play-title').append(SG.biText(lesson.title));
      SG.$('#player-box').hidden = true;
      var scene = SG.$('#scene-card');
      renderScene(scene, lesson);
      scene.hidden = false;
      SG.$('#tally-panel').hidden = true;
      var panel = SG.$('#activity-panel');
      panel.innerHTML = '';
      var go = function (l) { Runner.start(lesson, l); };
      panel.append(el('div', { class: 'watch' },
        el('div', { class: 'watch-emoji', 'aria-hidden': 'true', text: '🌐' }),
        el('h2', { text: 'Which language is this lesson in?' }),
        el('p', { class: 'muted', text: '¿En qué idioma es esta lección?' }),
        el('div', { class: 'lang-choice' },
          el('button', { class: 'btn primary big', type: 'button', onclick: function () { go('en'); } }, '🇺🇸 English'),
          el('button', { class: 'btn primary big', type: 'button', onclick: function () { go('es'); } }, '🇲🇽 Español'),
          el('button', { class: 'btn', type: 'button', onclick: function () { go('bi'); } }, '🇺🇸🇲🇽 Both (bilingual)'))));
    },

    /* Use one language for this lesson only (the student's profile is not changed). */
    useLanguage: function (lang) {
      var p = SG.Profile.current();
      SG.settings.uiLang = lang;
      SG.settings.answerLang = lang === 'bi' ? (p.startLang || 'en') : lang;
      var tools = SG.$('#play-tools');
      var old = SG.$('#lang-chip');
      if (old) old.remove();
      var names = { en: '🇺🇸 English', es: '🇲🇽 Español', bi: '🇺🇸🇲🇽 English + Español' };
      tools.append(el('button', { id: 'lang-chip', class: 'btn small', type: 'button', title: 'Change the lesson language',
        onclick: function () {
          if (Runner.doneCount && !confirm('Start the lesson again in another language?')) return;
          Runner.chooseLanguage(Runner.source);
        } }, names[lang] + ' · change'));
    },

    start: function (lesson, lang) {
      var prof = SG.Profile.current();
      if (!lang) {
        if (prof.lang !== 'bi') lang = prof.lang;
        else { Runner.chooseLanguage(lesson); return; }
      }
      Runner.stop();
      Runner.source = lesson;
      Runner.lang = lang;
      Runner.useLanguage(lang);
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
      board.setLock(lang === 'bi' ? null : lang);
      board.setLang(SG.settings.answerLang);
      board.hide();
      SG.$('#tally-panel').hidden = false;
      renderTally();

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
      SG.$('#scene-card').hidden = true;   // the video is the picture while watching
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

    /* Arrow cue: point at a spot (x, y from 0 to 1) on the picture or video. */
    point: function (pt) {
      Runner.clearPoint();
      var scene = SG.$('#scene-card'), holder = SG.$('#player-box');
      var host = !scene.hidden ? scene : !holder.hidden ? holder : null;
      if (!host) return;
      var ref = host === scene ? (scene.querySelector('img') || scene.querySelector('.scene-emoji') || scene) : holder;
      var hr = host.getBoundingClientRect(), rr = ref.getBoundingClientRect();
      var ptr = el('div', { class: 'pointer', 'aria-hidden': 'true' }, el('div', { class: 'pointer-ring' }), el('div', { class: 'pointer-arrow', text: '⬇' }));
      ptr.style.left = (rr.left - hr.left + pt.x * rr.width) + 'px';
      ptr.style.top = (rr.top - hr.top + pt.y * rr.height) + 'px';
      host.append(ptr);
      host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    clearPoint: function () {
      document.querySelectorAll('.pointer').forEach(function (p) { p.remove(); });
    },

    show: function (act, opts) {
      Runner.busy = true;
      Runner.clearPoint();
      Runner.currentSkill = SG.Activities.skillName(act);
      // A question can bring its own picture; otherwise show the lesson's scene (or the paused video).
      var scene = SG.$('#scene-card');
      var hasVideo = !!Runner.player;
      if (act.image) { renderScene(scene, { image: act.image }); scene.hidden = false; }
      else { renderScene(scene, Runner.lesson); scene.hidden = hasVideo; }
      var panel = SG.$('#activity-panel');
      panel.innerHTML = '';
      var box = el('div', { class: 'activity type-' + act.type });
      panel.append(box);
      SG.Activities.render(box, act, {
        board: board,
        lesson: Runner.lesson,
        index: Runner.doneCount,
        total: Runner.total,
        point: function (pt) { Runner.point(pt); },
        done: function (res) {
          Runner.doneCount++;
          var cueNames = (res.cues || []).map(function (n) { return SG.CUE_INFO[n] ? SG.CUE_INFO[n].label.en : n; }).join(', ');
          Runner.results.push({ result: res.result, skill: SG.Activities.skillName(act), cues: cueNames });
          if (!res.logged) {
            SG.Log.add({
              type: act.type, skill: SG.Activities.skillName(act), lang: res.lang,
              lesson: SG.biString(Runner.lesson.title), prompt: SG.Activities.promptText(act),
              response: res.response, result: res.result, attempts: res.attempts, cues: cueNames
            });
          }
          renderTally();
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
      Runner.clearPoint();
      var r = Runner.results;
      var count = function (k) { return r.filter(function (x) { return x.result === k; }).length; };
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
          el('button', { class: 'btn primary', type: 'button', onclick: function () { Runner.start(Runner.source, Runner.lang); } }, '🔁 Play again'),
          el('button', { class: 'btn', type: 'button', onclick: function () { SG.Chart.print(Runner.lesson); } }, '🖨️ Print chart'),
          el('button', { class: 'btn', type: 'button', onclick: function () { show('home'); } }, '🏠 Lessons'))));
      SG.$('#chart-details').open = true;
    },

    pause: function () { if (Runner.player) Runner.player.pause(); },
    stop: function () {
      Runner.clearPoint();
      if (Runner.player) Runner.player.destroy();
      Runner.player = null;
      Runner.total = 0;
      Runner.busy = false;
      Runner.uncued = [];
      SG.$('#stage').classList.remove('has-video');
    }
  };

  /* Live tally for this lesson: counts by result and skill, plus buttons to add trials by hand. */
  function renderTally() {
    var root = SG.$('#tally-panel');
    if (!root) return;
    root.innerHTML = '';
    var r = Runner.results || [];
    var n = function (k, list) { return (list || r).filter(function (x) { return x.result === k; }).length; };
    var pct = function (a, b) { return b ? Math.round(a / b * 100) + '%' : '–'; };
    var skills = {};
    r.forEach(function (x) { (skills[x.skill] = skills[x.skill] || []).push(x); });
    function manual(result) {
      var skill = Runner.currentSkill || 'Manual tally';
      SG.Log.add({ type: 'manual', skill: skill, lang: SG.settings.answerLang, lesson: Runner.lesson ? SG.biString(Runner.lesson.title) : '',
        prompt: '(tally)', response: '(tally)', result: result });
      Runner.results.push({ result: result, skill: skill, cues: '', manual: true });
      renderTally();
    }
    root.append(
      el('div', { class: 'row between wrap' },
        el('strong', { text: '📊 Tally' }),
        el('span', { class: 'muted', text: r.length + ' trials · ' + pct(n('correct'), r.length) + ' independent' })),
      el('div', { class: 'tally-counts' },
        el('span', { class: 'tc tc-correct' }, '⭐ ' + n('correct'), el('small', { text: 'independent' })),
        el('span', { class: 'tc tc-cued' }, '🤝 ' + n('cued'), el('small', { text: 'with cues' })),
        el('span', { class: 'tc tc-incorrect' }, '🔁 ' + n('incorrect'), el('small', { text: 'not yet' }))),
      el('div', { class: 'row wrap tally-buttons' },
        el('span', { class: 'muted', text: 'Add a trial:' }),
        el('button', { class: 'btn small score-correct', type: 'button', onclick: function () { manual('correct'); } }, '+ ⭐'),
        el('button', { class: 'btn small score-approx', type: 'button', onclick: function () { manual('cued'); } }, '+ 🤝'),
        el('button', { class: 'btn small score-incorrect', type: 'button', onclick: function () { manual('incorrect'); } }, '+ 🔁'),
        el('button', { class: 'btn small', type: 'button', disabled: !r.some(function (x) { return x.manual; }), onclick: function () {
          for (var i = Runner.results.length - 1; i >= 0; i--) {
            if (Runner.results[i].manual) { Runner.results.splice(i, 1); SG.Log.removeLastManual(); break; }
          }
          renderTally();
        } }, '↩ Undo')),
      Object.keys(skills).length ? el('details', { class: 'tally-skills' }, el('summary', { text: 'By skill' }),
        el('table', {}, el('tbody', {}, Object.keys(skills).map(function (k) {
          var list = skills[k];
          return el('tr', {}, el('td', { text: k }), el('td', { text: '⭐ ' + n('correct', list) }), el('td', { text: '🤝 ' + n('cued', list) }),
            el('td', { text: '🔁 ' + n('incorrect', list) }));
        })))) : null);
  }

  function renderScene(root, lesson) {
    root.innerHTML = '';
    if (SG.safeImage(lesson.image)) root.append(el('img', { src: SG.safeImage(lesson.image), alt: SG.biString(lesson.description) || 'Picture scene' }));
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
      if (this.value.trim() === SG.settings.student) return;   // no change: don't redraw (it would swallow a tap)
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
    SG.$('#app-version').textContent = SG.VERSION;
    checkForUpdate();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checkForUpdate(); });

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

  /* Browsers (especially iPad home-screen apps) can keep an old copy. Ask the
     site which version is live and offer a reload if it's newer. */
  function checkForUpdate() {
    if (location.protocol === 'file:' || !window.fetch) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.version && j.version !== SG.VERSION) SG.$('#update-banner').hidden = false;
      }).catch(function () { /* offline: keep using this copy */ });
  }
  SG.$('#update-reload') && SG.$('#update-reload').addEventListener('click', function () {
    location.replace(location.pathname + '?v=' + Date.now() + location.hash);
  });

  SG.App = {
    show: show,
    play: function (lesson) { Runner.start(lesson); },
    refreshHome: renderHome
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.SG);
