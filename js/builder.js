/* Lesson Builder: paste a YouTube link, play to a moment, and add a question
   at that exact time. Lessons are saved in this browser and can be exported,
   imported, or shared as a link. */
(function (SG) {
  'use strict';
  var el = SG.el, L = SG.L;
  var KEY = 'sg.customLessons';

  /* ---------- storage ---------- */
  SG.Lessons = {
    custom: function () { return SG.store.get(KEY, []); },
    all: function () { return SG.BUILTIN_LESSONS.concat(SG.Lessons.custom()); },
    find: function (id) { return SG.Lessons.all().find(function (l) { return l.id === id; }); },
    save: function (lesson) {
      var list = SG.Lessons.custom();
      var i = list.findIndex(function (l) { return l.id === lesson.id; });
      if (i >= 0) list[i] = lesson; else list.push(lesson);
      return SG.store.set(KEY, list);
    },
    remove: function (id) {
      SG.store.set(KEY, SG.Lessons.custom().filter(function (l) { return l.id !== id; }));
    },
    /* Clean up lessons coming from files / links. */
    sanitize: function (raw) {
      if (!raw || typeof raw !== 'object' || !Array.isArray(raw.activities)) return null;
      var txt = function (o) {
        if (typeof o === 'string') return { en: o, es: '' };
        return { en: String((o && o.en) || ''), es: String((o && o.es) || '') };
      };
      var choice = function (c) {
        return { en: String(c.en || ''), es: String(c.es || ''), emoji: String(c.emoji || ''), correct: !!c.correct };
      };
      var image = String(raw.image || '');
      return {
        id: String(raw.id || SG.uid('lesson')),
        title: txt(raw.title || 'Untitled'),
        description: txt(raw.description || ''),
        video: String(raw.video || raw.videoId || ''),
        scene: String(raw.scene || ''),
        image: /^https?:\/\//i.test(image) ? image : '',
        activities: raw.activities.filter(function (a) { return a && a.type; }).map(function (a) {
          var out = { type: String(a.type) };
          if (typeof a.at === 'number' && a.at >= 0) out.at = a.at;
          ['question', 'frame', 'prompt', 'example', 'word', 'shape'].forEach(function (k) { if (a[k]) out[k] = txt(a[k]); });
          if (a.wh) out.wh = String(a.wh);
          if (a.cue) out.cue = String(a.cue);
          if (a.emoji) out.emoji = String(a.emoji);
          if (Array.isArray(a.choices)) out.choices = a.choices.map(choice);
          if (a.parts) out.parts = { en: [].concat(a.parts.en || []).map(String), es: [].concat(a.parts.es || []).map(String) };
          ['min', 'max', 'trials'].forEach(function (k) { if (Number(a[k]) > 0) out[k] = Number(a[k]); });
          return out;
        })
      };
    },
    encodeShare: function (lesson) {
      var bytes = new TextEncoder().encode(JSON.stringify(lesson));
      var bin = '';
      bytes.forEach(function (b) { bin += String.fromCharCode(b); });
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    decodeShare: function (str) {
      try {
        var b64 = str.replace(/-/g, '+').replace(/_/g, '/');
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return SG.Lessons.sanitize(JSON.parse(new TextDecoder().decode(bytes)));
      } catch (e) { return null; }
    }
  };

  /* ---------- builder UI ---------- */
  var draft = null;        // lesson being edited
  var editing = null;      // {index, act} activity being edited
  var player = null;
  var clock = null;

  function blankLesson() {
    return { id: SG.uid('lesson'), title: L('', ''), description: L('', ''), video: '', scene: '', image: '', activities: [] };
  }
  function blankActivity(type) {
    var base = { type: type };
    if (type === 'wh') Object.assign(base, { wh: 'what', question: L('', ''), frame: L('', ''), choices: [
      { en: '', es: '', emoji: '', correct: true }, { en: '', es: '', emoji: '' }, { en: '', es: '', emoji: '' }] });
    if (type === 'binary') Object.assign(base, { question: L('', ''), choices: [
      { en: 'yes', es: 'sí', emoji: '👍', correct: true }, { en: 'no', es: 'no', emoji: '👎' }] });
    if (type === 'formulate') Object.assign(base, { cue: 'what',
      prompt: L('Ask a WHAT question about the picture.', 'Haz una pregunta con QUÉ sobre la imagen.'),
      example: L('', ''), choices: [{ en: '', es: '', emoji: '' }, { en: '', es: '', emoji: '' }] });
    if (type === 'artic') Object.assign(base, { emoji: '', word: L('', ''), shape: L('cvc', 'cvcv'), parts: { en: [], es: [] }, trials: 3 });
    if (player && player.time() > 0) base.at = Math.round(player.time() * 10) / 10;
    return base;
  }

  function input(obj, key, attrs) {
    return el('input', Object.assign({ type: 'text', value: obj[key] == null ? '' : obj[key],
      oninput: function () { obj[key] = this.value; } }, attrs || {}));
  }
  function biInputs(label, obj, key, placeholders) {
    obj[key] = obj[key] || L('', '');
    placeholders = placeholders || {};
    return el('div', { class: 'field' }, el('div', { class: 'field-label', text: label }),
      el('div', { class: 'bi-inputs' },
        el('label', {}, '🇺🇸 ', input(obj[key], 'en', { placeholder: placeholders.en || 'English' })),
        el('label', {}, '🇲🇽 ', input(obj[key], 'es', { placeholder: placeholders.es || 'Español' }))));
  }
  function select(obj, key, options, onchange) {
    return el('select', { onchange: function () { obj[key] = this.value; if (onchange) onchange(); } },
      options.map(function (o) { return el('option', { value: o[0], selected: obj[key] === o[0] }, o[1]); }));
  }

  function choicesEditor(act, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'field' });
    function draw() {
      wrap.innerHTML = '';
      wrap.append(el('div', { class: 'field-label', text: opts.label || 'Answer choices (tick the correct one)' }));
      var table = el('div', { class: 'choices-editor' });
      act.choices.forEach(function (c, i) {
        table.append(el('div', { class: 'choice-row' },
          input(c, 'emoji', { class: 'emoji-input', placeholder: '🙂', 'aria-label': 'emoji' }),
          input(c, 'en', { placeholder: 'English' }),
          input(c, 'es', { placeholder: 'Español' }),
          opts.noCorrect ? null : el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: !!c.correct,
            onchange: function () {
              if (opts.single) act.choices.forEach(function (x) { x.correct = false; });
              c.correct = this.checked;
              draw();
            } }), ' correct'),
          opts.fixed ? null : el('button', { class: 'btn small', type: 'button', title: 'Remove', onclick: function () {
            act.choices.splice(i, 1); draw();
          } }, '✕')));
      });
      wrap.append(table);
      if (!opts.fixed) wrap.append(el('button', { class: 'btn small', type: 'button', onclick: function () {
        act.choices.push({ en: '', es: '', emoji: '' }); draw();
      } }, '+ Add choice'));
    }
    draw();
    return wrap;
  }

  function timeField(act) {
    var inp = el('input', { type: 'text', value: SG.formatTime(act.at), placeholder: 'e.g. 1:05',
      oninput: function () { var t = SG.parseTime(this.value); if (t == null) delete act.at; else act.at = t; } });
    return el('div', { class: 'field' },
      el('div', { class: 'field-label', text: 'Pause the video at (leave blank = ask after the video / in order)' }),
      el('div', { class: 'row wrap' }, inp,
        el('button', { class: 'btn small', type: 'button', disabled: !player, onclick: function () {
          if (!player) return;
          act.at = Math.round(player.time() * 10) / 10;
          inp.value = SG.formatTime(act.at);
        } }, '⏱ Use current video time'),
        el('button', { class: 'btn small', type: 'button', onclick: function () { delete act.at; inp.value = ''; } }, 'Clear')));
  }

  function activityForm(root) {
    if (!editing) return null;
    var act = editing.act;
    var form = el('div', { class: 'card act-form' });
    form.append(el('h3', {}, (editing.index == null ? 'New ' : 'Edit ') + typeName(act.type)));
    form.append(timeField(act));

    if (act.type === 'wh') {
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'WH word' }),
        select(act, 'wh', Object.keys(SG.WH_WORDS).map(function (k) { return [k, k + ' / ' + SG.WH_WORDS[k].es]; }))));
      form.append(biInputs('Question', act, 'question', { en: 'Who is kicking the ball?', es: '¿Quién está pateando la pelota?' }));
      form.append(biInputs('Predictable chart frame — use ___ for the answer (3-5 words total)', act, 'frame',
        { en: 'The ___ is kicking', es: 'El ___ está pateando' }));
      form.append(choicesEditor(act));
    } else if (act.type === 'binary') {
      form.append(biInputs('Question', act, 'question', { en: 'Is the dog happy?', es: '¿Está feliz el perro?' }));
      form.append(el('div', { class: 'row wrap' },
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          act.choices = [{ en: 'yes', es: 'sí', emoji: '👍', correct: true }, { en: 'no', es: 'no', emoji: '👎' }];
          renderBuilder(root);
        } }, 'Preset: Yes / No'),
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          act.choices = [{ en: '', es: '', emoji: '', correct: true }, { en: '', es: '', emoji: '' }];
          renderBuilder(root);
        } }, 'Preset: This or that')));
      form.append(choicesEditor(act, { single: true, fixed: true, label: 'Two options (tick the correct one)' }));
    } else if (act.type === 'formulate') {
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Question word the student must use' }),
        select(act, 'cue', [['', 'Any question word']].concat(Object.keys(SG.WH_WORDS).map(function (k) {
          return [k, k + ' / ' + SG.WH_WORDS[k].es];
        })), function () {
          if (act.cue) {
            var w = SG.WH_WORDS[act.cue];
            act.prompt = L('Ask a ' + w.en.toUpperCase() + ' question about the picture.',
                           'Haz una pregunta con ' + w.es.toUpperCase() + ' sobre la imagen.');
          } else {
            act.prompt = L('Ask a question about the picture.', 'Haz una pregunta sobre la imagen.');
          }
          renderBuilder(root);
        })));
      form.append(biInputs('Prompt', act, 'prompt'));
      form.append(biInputs('Example question (shown as a model)', act, 'example', { en: 'Where is the ball?', es: '¿Dónde está la pelota?' }));
      form.append(choicesEditor(act, { noCorrect: true, label: 'Scene words to put on the board' }));
    } else if (act.type === 'artic') {
      act.parts = act.parts || { en: [], es: [] };
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Picture (emoji)' }),
        input(act, 'emoji', { class: 'emoji-input', placeholder: '🐕' })));
      form.append(biInputs('Word', act, 'word', { en: 'dog', es: 'perro' }));
      act.shape = act.shape || L('cvc', 'cvcv');
      var shapes = Object.keys(SG.SHAPES).map(function (k) { return [k, SG.SHAPES[k]]; });
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Syllable shape' }),
        el('div', { class: 'row wrap' }, el('label', {}, '🇺🇸 ', select(act.shape, 'en', shapes)),
          el('label', {}, '🇲🇽 ', select(act.shape, 'es', shapes)))));
      var partsObj = { en: act.parts.en.join(', '), es: act.parts.es.join(', ') };
      var partsInput = function (l) {
        return el('input', { type: 'text', value: partsObj[l], placeholder: l === 'en' ? 'd, o, g' : 'pe, rro',
          oninput: function () { act.parts[l] = this.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); } });
      };
      form.append(el('div', { class: 'field' },
        el('div', { class: 'field-label', text: 'Sounds (CVC/VCV) or syllables (CVCV), comma separated' }),
        el('div', { class: 'bi-inputs' }, el('label', {}, '🇺🇸 ', partsInput('en')), el('label', {}, '🇲🇽 ', partsInput('es')))));
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Trials' }),
        el('input', { type: 'number', min: 1, max: 10, value: act.trials || 3, oninput: function () { act.trials = Number(this.value) || 3; } })));
    }

    form.append(el('div', { class: 'row wrap' },
      el('button', { class: 'btn primary', type: 'button', onclick: function () {
        var err = validateActivity(act);
        if (err) { SG.toast(err); return; }
        if (editing.index == null) draft.activities.push(act);
        else draft.activities[editing.index] = act;
        sortActivities();
        editing = null;
        renderBuilder(root);
      } }, '✔ Save activity'),
      el('button', { class: 'btn', type: 'button', onclick: function () { editing = null; renderBuilder(root); } }, 'Cancel')));
    return form;
  }

  function validateActivity(a) {
    var has = function (o) { return o && (String(o.en || '').trim() || String(o.es || '').trim()); };
    if (a.type === 'wh') {
      if (!has(a.question)) return 'Type the question.';
      if (!has(a.frame) || !/_+/.test((a.frame.en || '') + (a.frame.es || ''))) return 'The frame needs ___ where the answer goes.';
      if (!a.choices.some(function (c) { return c.correct && has(c); })) return 'Tick at least one correct choice.';
      a.choices = a.choices.filter(has);
    }
    if (a.type === 'binary') {
      if (!has(a.question)) return 'Type the question.';
      if (a.choices.filter(has).length !== 2) return 'Fill in both options.';
      if (a.choices.filter(function (c) { return c.correct; }).length !== 1) return 'Tick exactly one correct option.';
    }
    if (a.type === 'formulate') a.choices = (a.choices || []).filter(has);
    if (a.type === 'artic' && !has(a.word)) return 'Type the word.';
    return '';
  }

  function sortActivities() {
    // Timed activities in time order, untimed ones keep their order at the end.
    var timed = draft.activities.filter(function (a) { return typeof a.at === 'number'; })
      .sort(function (x, y) { return x.at - y.at; });
    var rest = draft.activities.filter(function (a) { return typeof a.at !== 'number'; });
    draft.activities = timed.concat(rest);
  }

  function typeName(t) {
    return { wh: 'WH question', binary: 'Yes/No or choice', formulate: 'Ask-a-question', artic: 'Articulation word' }[t] || t;
  }

  function loadPreview(root) {
    var holder = SG.$('#builder-player', root);
    var timeEl = SG.$('#builder-time', root);
    if (player) { player.destroy(); player = null; }
    clearInterval(clock);
    var id = SG.YT.parseId(draft.video);
    if (!id) {
      holder.innerHTML = '';
      holder.append(el('div', { class: 'player-empty', text: draft.video ? 'That does not look like a YouTube link.' : 'Paste a YouTube link above, then press Load.' }));
      return;
    }
    player = SG.YT.create(holder, id, { start: SG.YT.parseStart(draft.video) });
    player.ready.then(function () {
      clock = setInterval(function () { if (player) timeEl.textContent = '⏱ ' + SG.formatTime(player.time()); }, 400);
      renderList(root);
    }).catch(function (e) { SG.toast(e.message); });
  }

  function renderList(root) {
    var listEl = SG.$('#builder-list', root);
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!draft.activities.length) listEl.append(el('p', { class: 'muted', text: 'No activities yet. Play the video, pause where you want a question, and add one.' }));
    draft.activities.forEach(function (a, i) {
      listEl.append(el('div', { class: 'act-row' },
        el('span', { class: 'act-time', text: typeof a.at === 'number' ? SG.formatTime(a.at) : '—' }),
        el('span', { class: 'badge badge-' + (a.wh || a.type), text: a.type === 'wh' ? (a.wh || 'wh').toUpperCase() : typeName(a.type) }),
        el('span', { class: 'act-summary', text: SG.Activities.promptText(a) || '(blank)' }),
        typeof a.at === 'number' && player ? el('button', { class: 'btn small', type: 'button', title: 'Jump video here', onclick: function () {
          player.seek(a.at); player.pause();
        } }, '⏩') : null,
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          editing = { index: i, act: JSON.parse(JSON.stringify(a)) }; renderBuilder(root);
        } }, 'Edit'),
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          draft.activities.splice(i, 1); renderBuilder(root);
        } }, '✕')));
    });
  }

  /* The player card is built once; re-renders only touch the other sections
     (moving a YouTube iframe in the DOM would reload the video). */
  function skeleton(root) {
    root.innerHTML = '';
    root.append(
      el('div', { id: 'b-head' }),
      el('div', { class: 'card' },
        el('div', { class: 'row between' }, el('h3', {}, 'Video preview'),
          el('span', { id: 'builder-time', class: 'time-readout', text: '⏱ 0:00' })),
        el('div', { id: 'builder-player', class: 'player-box' })),
      el('div', { id: 'b-acts' }),
      el('div', { id: 'b-form' }),
      el('div', { id: 'b-actions' }));
  }

  function renderBuilder(root) {
    var headBox = SG.$('#b-head', root);
    headBox.innerHTML = '';
    headBox.append(el('div', { class: 'card' },
      el('h2', {}, draft._isNew ? 'New lesson' : 'Edit lesson'),
      biInputs('Title', draft, 'title', { en: 'At the Park', es: 'En el parque' }),
      biInputs('Short description (optional)', draft, 'description'),
      el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'YouTube video link (optional)' }),
        el('div', { class: 'row wrap' },
          input(draft, 'video', { placeholder: 'https://www.youtube.com/watch?v=…', class: 'grow' }),
          el('button', { class: 'btn primary', type: 'button', onclick: function () { loadPreview(root); } }, 'Load video'))),
      el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Picture scene: emojis and/or an image link (used when there is no video, and on the printed chart)' }),
        el('div', { class: 'row wrap' },
          input(draft, 'scene', { placeholder: '🌳👦⚽🐕', class: 'emoji-wide' }),
          input(draft, 'image', { placeholder: 'https://…/picture.png', class: 'grow' })))));

    var actsBox = SG.$('#b-acts', root);
    actsBox.innerHTML = '';
    actsBox.append(el('div', { class: 'card' },
      el('h2', {}, 'Activities'),
      el('div', { id: 'builder-list' }),
      el('div', { class: 'row wrap' }, ['wh', 'binary', 'formulate', 'artic'].map(function (t) {
        return el('button', { class: 'btn', type: 'button', onclick: function () {
          editing = { index: null, act: blankActivity(t) };
          if (player) player.pause();
          renderBuilder(root);
        } }, '+ ' + typeName(t));
      }))));

    var formBox = SG.$('#b-form', root);
    formBox.innerHTML = '';
    var form = activityForm(root);
    if (form) formBox.append(form);

    var actionsBox = SG.$('#b-actions', root);
    actionsBox.innerHTML = '';
    actionsBox.append(el('div', { class: 'card row wrap' },
      el('button', { class: 'btn primary big', type: 'button', onclick: function () {
        if (!draft.title.en && !draft.title.es) { SG.toast('Give the lesson a title.'); return; }
        var clean = SG.Lessons.sanitize(draft);
        if (!SG.Lessons.save(clean)) { SG.toast('Could not save (browser storage blocked).'); return; }
        draft._isNew = false;
        SG.toast('Lesson saved ✔');
        if (SG.App) SG.App.refreshHome();
        renderBuilder(root);
      } }, '💾 Save lesson'),
      el('button', { class: 'btn', type: 'button', onclick: function () {
        if (SG.App) SG.App.play(SG.Lessons.sanitize(draft));
      } }, '▶ Try it'),
      el('button', { class: 'btn', type: 'button', onclick: function () {
        var url = location.href.split('#')[0] + '#lesson=' + SG.Lessons.encodeShare(SG.Lessons.sanitize(draft));
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () {
          SG.toast('Share link copied! Send it to families for home practice.');
        }, function () { prompt('Copy this share link:', url); });
      } }, '🔗 Copy share link'),
      el('button', { class: 'btn', type: 'button', onclick: function () {
        var clean = SG.Lessons.sanitize(draft);
        SG.download((SG.norm(clean.title.en || clean.title.es) || 'lesson').replace(/\s+/g, '-') + '.json', JSON.stringify(clean, null, 2));
      } }, '⬇️ Export JSON'),
      draft._isNew ? null : el('button', { class: 'btn danger', type: 'button', onclick: function () {
        if (!confirm('Delete this lesson?')) return;
        SG.Lessons.remove(draft.id);
        if (SG.App) { SG.App.refreshHome(); SG.App.show('home'); }
      } }, 'Delete')));

    renderList(root);
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  SG.Builder = {
    /* Open the builder with an existing lesson (copied) or a blank one. */
    open: function (root, lesson) {
      if (player) { player.destroy(); player = null; }
      clearInterval(clock);
      editing = null;
      if (lesson) {
        draft = JSON.parse(JSON.stringify(lesson));
        if (draft.builtin) { draft.id = SG.uid('lesson'); delete draft.builtin; draft.title.en += ' (copy)'; draft.title.es += ' (copia)'; draft._isNew = true; }
      } else {
        draft = blankLesson();
        draft._isNew = true;
      }
      skeleton(root);
      renderBuilder(root);
      loadPreview(root);
    },
    leave: function () {
      if (player) player.pause();
    },
    importFile: function (file, done) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          var list = Array.isArray(data) ? data : Array.isArray(data.lessons) ? data.lessons : [data];
          var existing = SG.Lessons.all().map(function (l) { return l.id; });
          var n = 0;
          list.forEach(function (raw) {
            var clean = SG.Lessons.sanitize(raw);
            if (!clean) return;
            if (existing.indexOf(clean.id) !== -1 && !SG.Lessons.custom().some(function (l) { return l.id === clean.id; })) clean.id = SG.uid('lesson');
            SG.Lessons.save(clean);
            n++;
          });
          SG.toast(n ? 'Imported ' + n + ' lesson(s) ✔' : 'No lessons found in that file.');
          if (done) done();
        } catch (e) { SG.toast('That file is not valid lesson JSON.'); }
      };
      reader.readAsText(file);
    }
  };
})(window.SG);
