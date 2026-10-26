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
      return {
        id: String(raw.id || SG.uid('lesson')),
        title: txt(raw.title || 'Untitled'),
        description: txt(raw.description || ''),
        video: String(raw.video || raw.videoId || ''),
        scene: String(raw.scene || ''),
        image: SG.safeImage(raw.image),
        picturePrompt: String(raw.picturePrompt || raw.picture_prompt || ''),
        activities: raw.activities.filter(function (a) { return a && a.type; }).map(function (a) {
          var out = { type: String(a.type) };
          if (typeof a.at === 'number' && a.at >= 0) out.at = a.at;
          ['question', 'frame', 'prompt', 'example', 'word', 'shape', 'sound', 'target'].forEach(function (k) { if (a[k]) out[k] = txt(a[k]); });
          if (a.wh) out.wh = String(a.wh);
          if (a.cue) out.cue = String(a.cue);
          if (Number(a.level) >= 1 && Number(a.level) <= 4) out.level = Number(a.level);
          if (a.emoji) out.emoji = String(a.emoji);
          if (SG.safeImage(a.image)) out.image = SG.safeImage(a.image);
          if (a.point && a.point.x >= 0 && a.point.x <= 1 && a.point.y >= 0 && a.point.y <= 1) {
            out.point = { x: Math.round(a.point.x * 1000) / 1000, y: Math.round(a.point.y * 1000) / 1000 };
          }
          if (Array.isArray(a.choices)) out.choices = a.choices.map(choice);
          if (a.parts) out.parts = { en: [].concat(a.parts.en || []).map(String), es: [].concat(a.parts.es || []).map(String) };
          ['min', 'max', 'trials'].forEach(function (k) { if (Number(a[k]) > 0) out[k] = Number(a[k]); });
          return out;
        })
      };
    },
    encodeShare: function (lesson) {
      var stripped = false;
      lesson = JSON.parse(JSON.stringify(lesson));
      [lesson].concat(lesson.activities).forEach(function (o) {
        if (o.image && o.image.indexOf('data:') === 0) { delete o.image; stripped = true; }
      });
      if (stripped) SG.toast('Uploaded pictures aren’t included in share links. Use Export JSON to share them.');
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

  /* Upload a picture (shrunk and kept in the lesson) or paste a link. */
  function drawRequest(desc) {
    return 'Draw a picture scene for a children’s speech therapy activity, as SVG code.\n\n' +
      'SCENE: ' + desc + '\n\n' +
      'Style: simple, bright, friendly cartoon with flat colors and clean shapes, like a picture book. ' +
      'Make the people, animals and objects in the scene large and easy to recognize, with clear actions. ' +
      'Use viewBox="0 0 800 500". No text or letters, no external images or fonts, no scripts.\n' +
      'Reply with only the SVG code in one code block.';
  }

  function pictureField(obj, label, describe) {
    var wrap = el('div', { class: 'field' });
    var drawing = false;
    function draw() {
      wrap.innerHTML = '';
      var file = el('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
        var f = this.files[0];
        if (!f) return;
        SG.compressImage(f).then(function (data) { obj.image = data; draw(); })
          .catch(function () { SG.toast('Could not use that picture. Try a JPG or PNG.'); });
      } });
      var link = el('input', { type: 'text', class: 'grow', placeholder: 'or paste a picture link: https://…',
        value: obj.image && obj.image.indexOf('data:') !== 0 ? obj.image : '',
        oninput: function () { obj.image = this.value.trim(); } });
      wrap.append(el('div', { class: 'field-label', text: label }),
        el('div', { class: 'row wrap' },
          obj.image && SG.safeImage(obj.image) ? el('img', { class: 'pic-thumb', src: SG.safeImage(obj.image), alt: 'Picture preview' }) : null,
          el('button', { class: 'btn', type: 'button', onclick: function () { file.click(); } }, '📷 Upload picture'),
          el('button', { class: 'btn', type: 'button', onclick: function () { drawing = !drawing; draw(); } }, '🎨 Ask Claude to draw it'),
          obj.image ? el('button', { class: 'btn small', type: 'button', onclick: function () { obj.image = ''; draw(); } }, 'Remove') : null,
          file, link));
      if (drawing) {
        var desc = el('textarea', { rows: 2, class: 'draw-desc' });
        desc.value = (describe && describe()) || '';
        var answer = el('textarea', { rows: 3, class: 'draw-desc', placeholder: 'Paste Claude’s answer (the SVG code) here' });
        wrap.append(el('div', { class: 'draw-box' },
          el('div', { class: 'field-label', text: 'What should the picture show?' }), desc,
          el('div', { class: 'row wrap' },
            el('button', { class: 'btn primary', type: 'button', onclick: function () {
              if (!desc.value.trim()) { SG.toast('Describe the picture first.'); return; }
              var req = drawRequest(desc.value.trim());
              (navigator.clipboard ? navigator.clipboard.writeText(req) : Promise.reject()).then(function () {
                SG.toast('Copied! Paste it into Claude, then paste Claude’s answer below.');
              }, function () { prompt('Copy this request for Claude:', req); });
            } }, '📋 Copy request'),
            el('a', { class: 'btn', href: 'https://claude.ai/new', target: '_blank', rel: 'noopener' }, 'Open Claude ↗')),
          answer,
          el('button', { class: 'btn primary', type: 'button', onclick: function () {
            var img = SG.svgToImage(answer.value);
            if (!img) { SG.toast('No picture found. Copy Claude’s whole answer (it starts with <svg).'); return; }
            obj.image = img;
            drawing = false;
            draw();
            SG.toast('Picture added ✔ Not quite right? Ask Claude to change it, then paste again.');
          } }, '✔ Use this picture')));
      }
    }
    draw();
    return wrap;
  }

  /* Where the "Point to it" cue arrow goes: tap the picture (or the video preview). */
  function pointField(act) {
    var wrap = el('div', { class: 'field' });
    function draw() {
      wrap.innerHTML = '';
      wrap.append(el('div', { class: 'field-label', text: '👉 Point-to spot for the arrow cue (optional): tap the answer in the picture' }));
      var src = SG.safeImage(act.image) || SG.safeImage(draft.image);
      var status = el('span', { class: 'muted', text: act.point ? 'Spot set ✔' : 'No spot yet' });
      var clear = act.point ? el('button', { class: 'btn small', type: 'button', onclick: function () { delete act.point; draw(); } }, 'Clear spot') : null;
      if (src) {
        var img = el('img', { src: src, alt: 'Tap where the arrow should point', class: 'point-img' });
        var box = el('div', { class: 'point-box' }, img);
        if (act.point) box.append(el('div', { class: 'point-dot', style: { left: act.point.x * 100 + '%', top: act.point.y * 100 + '%' } }));
        img.addEventListener('click', function (e) {
          var r = img.getBoundingClientRect();
          act.point = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
          draw();
        });
        wrap.append(box, el('div', { class: 'row wrap' }, status, clear));
      } else if (player) {
        wrap.append(el('div', { class: 'row wrap' },
          el('button', { class: 'btn small', type: 'button', onclick: function () {
            var holder = SG.$('#builder-player');
            player.pause();
            holder.scrollIntoView({ behavior: 'smooth', block: 'center' });
            var cover = el('div', { class: 'point-cover', text: 'Tap the answer on the video' });
            cover.addEventListener('click', function (e) {
              var r = holder.getBoundingClientRect();
              act.point = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
              cover.remove();
              draw();
              wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            holder.append(cover);
          } }, '🎯 Set spot on the video'), status, clear));
      } else {
        wrap.append(el('p', { class: 'muted', text: 'Add a picture (above) or load the video to set a spot.' }));
      }
    }
    draw();
    return wrap;
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
    if (act.type !== 'artic') form.append(pictureField(act, 'Picture for this question (optional — e.g. a different scene for each question)', function () {
      return SG.pick(act.question || act.prompt, 'en');
    }));
    if (act.type !== 'artic') form.append(pointField(act));
    form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Language level' }),
      el('select', { onchange: function () { if (Number(this.value)) act.level = Number(this.value); else delete act.level; } },
        el('option', { value: 0, selected: !act.level }, 'All levels'),
        Object.keys(SG.LEVELS).map(function (k) { return el('option', { value: k, selected: Number(act.level) === Number(k) }, SG.LEVELS[k].name); }))));

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
      act.shape = act.shape || L('cvc', 'cvcv');
      act.sound = act.sound || L('', '');
      act.target = act.target || L('', '');
      var kinds = [['iso', 'Sound in isolation']].concat(Object.keys(SG.ARTIC_TYPES).map(function (k) { return [k, SG.ARTIC_TYPES[k].label]; }));
      var targetOpts = function (l) {
        var ids = SG.ISO_SOUNDS[l].map(function (x) { return x.id; });
        var extra = l === 'es' ? ['bl', 'br', 'pl', 'pr', 'tr', 'dr', 'cl', 'cr', 'gr', 'gl', 'fl', 'fr']
          : ['r-vocalic', 'st', 'sp', 'sk', 'sn', 'sm', 'sl', 'sw', 'bl', 'pl', 'cl', 'fl', 'gl', 'br', 'tr', 'dr', 'cr', 'gr', 'fr', 'pr', 'spl', 'scr', 'str', '-st', '-nt', '-lk', '-nd'];
        return [['', '(none)']].concat(ids.concat(extra).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (id) {
          var iso = SG.ISO_SOUNDS[l].find(function (x) { return x.id === id; });
          return [id, iso ? iso.name : (SG.SOUND_LABELS[id] || '/' + id + '/')];
        }));
      };
      var perLang = function (l) {
        var flag = l === 'en' ? '🇺🇸 English' : '🇲🇽 Español';
        var box = el('div', { class: 'artic-lang-col' }, el('strong', { text: flag }),
          el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Practice' }),
            select(act.shape, l, kinds, function () { renderBuilder(root); })));
        if (act.shape[l] === 'iso') {
          box.append(el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Sound' }),
            select(act.sound, l, [['', '— choose —']].concat(SG.ISO_SOUNDS[l].map(function (x) { return [x.id, x.name]; })))));
        } else {
          box.append(
            el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Word' }), input(act.word, l, { placeholder: l === 'en' ? 'dog' : 'perro' })),
            el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Target sound (highlighted)' }), select(act.target, l, targetOpts(l))),
            el('label', { class: 'field' }, el('span', { class: 'field-label', text: act.shape[l] === 'cvc' || act.shape[l] === 'vcv' ? 'Sounds, comma separated' : 'Syllables, comma separated' }),
              el('input', { type: 'text', value: (act.parts[l] || []).join(', '), placeholder: l === 'en' ? 'd, o, g' : 'pe, rro',
                oninput: function () { act.parts[l] = this.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); } })));
        }
        return box;
      };
      act.word = act.word || L('', '');
      form.append(el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Picture (emoji)' }),
        input(act, 'emoji', { class: 'emoji-input', placeholder: '🐕' })));
      form.append(el('div', { class: 'artic-lang-cols' }, perLang('en'), perLang('es')));
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
    if (a.type === 'artic') {
      var ok = ['en', 'es'].some(function (l) {
        return a.shape && a.shape[l] === 'iso' ? !!(a.sound && a.sound[l]) : String((a.word && a.word[l]) || '').trim();
      });
      if (!ok) return 'Type a word, or choose a sound for “Sound in isolation”.';
    }
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
        a.level ? el('span', { class: 'chip', text: 'L' + a.level }) : null,
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
      pictureField(draft, 'Picture scene (shown when there is no video, and on the printed chart). Upload a photo, ask Claude to draw one, or paste a link.', function () {
        return draft.picturePrompt || SG.pick(draft.description, 'en') || SG.pick(draft.title, 'en');
      }),
      draft.picturePrompt ? el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Need a picture? Paste this description into an AI picture maker (see the README), then upload the picture above.' }),
        el('div', { class: 'row wrap' }, el('span', { class: 'muted grow', text: draft.picturePrompt }),
          el('button', { class: 'btn small', type: 'button', onclick: function () {
            if (navigator.clipboard) navigator.clipboard.writeText(draft.picturePrompt).then(function () { SG.toast('Copied ✔'); });
          } }, '📋 Copy'))) : null,
      el('div', { class: 'field' }, el('div', { class: 'field-label', text: 'Emoji fallback (used only when there is no picture)' }),
        input(draft, 'scene', { placeholder: '🌳👦⚽🐕', class: 'emoji-wide' }))));

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
        if (!SG.Lessons.save(clean)) { SG.toast('Could not save: this browser’s storage is full or blocked. Try smaller or fewer uploaded pictures, or use picture links.'); return; }
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
        if (draft.builtin) { draft.id = SG.uid('lesson'); delete draft.builtin; draft.title.en += ' (copy)'; draft.title.es += ' (copia)'; }
        draft._isNew = !SG.Lessons.custom().some(function (l) { return l.id === draft.id; });
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
