/* Articulation practice, from sound in isolation -> syllables -> words.
   Words: CVC, VCV, CVCV, 3/4/5 syllables, consonant clusters, R words
   (Spanish tap and trill, English prevocalic and vocalic R).
   Each card has a spoken model, optional self-recording, and clinician scoring. */
(function (SG) {
  'use strict';
  var el = SG.el;

  var SCORE_LABELS = {
    correct: SG.L('Correct', 'Correcto'),
    approx: SG.L('Close', 'Casi'),
    incorrect: SG.L('Try again', 'Otra vez')
  };
  var T = function (lang, en, es) { return lang === 'es' ? es : en; };

  function soundLabel(id) {
    return SG.SOUND_LABELS[id] || ('/' + id.replace(/^-/, '…') + '/');
  }

  /* Record / play-back buttons for the student's own attempt. */
  function selfRecord(lang) {
    if (!SG.Recorder.supported) return null;
    var audioUrl = null;
    var recBtn = el('button', { class: 'btn', type: 'button' }, '🎙️ ' + T(lang, 'Record', 'Grabar'));
    var playBtn = el('button', { class: 'btn', type: 'button', disabled: true }, '▶️ ' + T(lang, 'Hear me', 'Escúchame'));
    recBtn.addEventListener('click', function () {
      if (SG.Recorder.isRecording()) {
        SG.Recorder.stop().then(function (url) {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = url;
          playBtn.disabled = !url;
          recBtn.classList.remove('recording');
          recBtn.textContent = '🎙️ ' + T(lang, 'Record', 'Grabar');
        });
      } else {
        SG.Recorder.start().then(function () {
          recBtn.classList.add('recording');
          recBtn.textContent = '⏹️ ' + T(lang, 'Stop', 'Parar');
        }).catch(micError);
      }
    });
    playBtn.addEventListener('click', function () { if (audioUrl) new Audio(audioUrl).play(); });
    return [recBtn, playBtn];
  }
  function micError() {
    SG.toast(SG.L('Microphone not available. The site must use https and allow the mic.',
                  'Micrófono no disponible. El sitio debe usar https y permitir el micrófono.'));
  }

  function scoreRow(lang, onScore) {
    if (!onScore) return null;
    return el('div', { class: 'score-row' }, ['correct', 'approx', 'incorrect'].map(function (s) {
      return el('button', { class: 'btn score score-' + s, type: 'button', onclick: function () {
        if (s === 'correct') SG.celebrate();
        onScore(s);
      } }, (s === 'correct' ? '✅ ' : s === 'approx' ? '🟡 ' : '🔁 ') + SG.pick(SCORE_LABELS[s], lang));
    }));
  }

  /* Word or syllable card.
     item: {word, emoji, parts, target?}, type: key of SG.ARTIC_TYPES (or 'syl'), lang: 'en'|'es'
     opts.onScore(score) gets 'correct' | 'approx' | 'incorrect'. */
  SG.ArticCard = function (item, type, lang, opts) {
    opts = opts || {};
    var info = SG.ARTIC_TYPES[type] || { label: opts.label || type };
    var parts = item.parts && item.parts.length ? item.parts : [item.word];
    var hl = SG.articHighlight(item, type, opts.sound);

    var partsEl = el('div', { class: 'artic-parts' });
    parts.forEach(function (p, i) {
      var kind = info.cv && type !== 'cvcv' ? (/^[aeiouáéíóúüy]+$/i.test(p) ? 'v' : 'c') : 'syl';
      if (i > 0 && kind === 'syl' && type !== 'clusters') partsEl.append(el('span', { class: 'artic-dot', text: '•' }));
      partsEl.append(el('span', { class: 'artic-part part-' + kind + (hl.indexOf(i) !== -1 ? ' part-target' : ''), text: p }));
    });

    var label = el('div', { class: 'artic-shape' });
    if (info.cv) {
      info.label.split('').forEach(function (ch) { label.append(el('span', { class: ch === 'C' ? 'part-c' : 'part-v', text: ch })); });
    } else {
      label.append(el('span', { class: 'chip', text: info.label + (item.target ? ' · ' + soundLabel(item.target) : '') }));
    }

    var many = parts.length > 1 && !info.cv || type === 'cvcv';
    var modelBtns = el('div', { class: 'row wrap center' },
      el('button', { class: 'btn primary', type: 'button', onclick: function () {
        SG.Speech.speak(item.word, lang, { rate: Math.min(SG.settings.rate, 0.8) });
      } }, '🔊 ' + T(lang, 'Listen', 'Escuchar')),
      many ? el('button', { class: 'btn', type: 'button', onclick: function () {
        SG.Speech.stop();
        parts.forEach(function (p) { SG.Speech.speak(p, lang, { queue: true, rate: 0.6 }); });
      } }, '🐢 ' + T(lang, 'Syllables', 'Sílabas')) : null,
      selfRecord(lang));

    return el('div', { class: 'artic-card' },
      el('div', { class: 'artic-emoji', 'aria-hidden': 'true', text: item.emoji || '🗣️' }),
      el('div', { class: 'artic-word', lang: lang, text: item.word }),
      label, partsEl, modelBtns, scoreRow(lang, opts.onScore));
  };

  /* Sound in isolation card, with the clinician's own recorded model. */
  SG.IsoCard = function (sound, lang, opts) {
    opts = opts || {};
    var key = lang + ':' + sound.id;
    var modelUrl = null;

    var playModel = el('button', { class: 'btn primary', type: 'button', disabled: true, onclick: function () {
      if (modelUrl) new Audio(modelUrl).play();
    } }, '🔊 ' + T(lang, 'Model', 'Modelo'));
    var recModel = el('button', { class: 'btn', type: 'button' }, '🎙️ Record your model');
    var delModel = el('button', { class: 'btn small', type: 'button', hidden: true, title: 'Delete your recorded model' }, '🗑️');

    function loadModel() {
      SG.AudioStore.get(key).then(function (blob) {
        if (modelUrl) URL.revokeObjectURL(modelUrl);
        modelUrl = blob ? URL.createObjectURL(blob) : null;
        playModel.disabled = !modelUrl;
        delModel.hidden = !modelUrl;
        recModel.textContent = modelUrl ? '🎙️ Re-record model' : '🎙️ Record your model';
      });
    }
    recModel.addEventListener('click', function () {
      if (!SG.Recorder.supported) { micError(); return; }
      if (SG.Recorder.isRecording()) {
        SG.Recorder.stop().then(function () {
          recModel.classList.remove('recording');
          return SG.AudioStore.put(key, SG.Recorder.lastBlob);
        }).then(function () { SG.toast('Model saved on this device ✔'); loadModel(); })
          .catch(function () { SG.toast('Could not save the recording on this device.'); });
      } else {
        SG.Recorder.start().then(function () {
          recModel.classList.add('recording');
          recModel.textContent = '⏹️ Stop';
        }).catch(micError);
      }
    });
    delModel.addEventListener('click', function () {
      if (confirm('Delete your recorded model for this sound?')) SG.AudioStore.remove(key).then(loadModel);
    });
    loadModel();

    var syl = SG.isoSyllables(sound.id, lang);
    return el('div', { class: 'artic-card iso-card' },
      el('div', { class: 'artic-emoji', 'aria-hidden': 'true', text: sound.emoji }),
      el('div', { class: 'artic-word iso-symbol', text: sound.show }),
      el('div', { class: 'artic-shape' }, el('span', { class: 'chip', text: T(lang, 'Sound in isolation', 'Sonido aislado') + ' · ' + sound.name })),
      el('p', { class: 'iso-cue', lang: lang, text: sound.cue }),
      el('div', { class: 'row wrap center' }, playModel, recModel, delModel,
        el('button', { class: 'btn', type: 'button', title: 'The computer voice can’t say sounds alone, so this plays them in syllables', onclick: function () {
          SG.Speech.stop();
          syl.forEach(function (x) { SG.Speech.speak(x, lang, { queue: true, rate: 0.6 }); });
        } }, '🐢 ' + T(lang, 'In syllables', 'En sílabas'))),
      el('div', { class: 'row wrap center' }, selfRecord(lang)),
      el('p', { class: 'muted small-note', text: 'Tip: record yourself saying the sound once. It’s saved on this device and plays as the model every time.' }),
      scoreRow(lang, opts.onScore));
  };

  /* ---------- Articulation tab ---------- */
  var state = {
    lang: null, level: 'word', type: 'cvc', sound: '', list: [], index: 0,
    tally: { correct: 0, approx: 0, incorrect: 0 }
  };

  function types() { return state.type === 'all' ? Object.keys(SG.ARTIC_TYPES) : [state.type]; }

  function buildList() {
    var list = [];
    if (state.level === 'iso' || state.level === 'syl') {
      SG.ISO_SOUNDS[state.lang].forEach(function (snd) {
        if (state.sound && snd.id !== state.sound) return;
        if (state.level === 'iso') list.push({ kind: 'iso', sound: snd });
        else SG.isoSyllables(snd.id, state.lang).forEach(function (sy) { list.push({ kind: 'syl', sound: snd, syl: sy }); });
      });
    } else {
      types().forEach(function (ty) {
        (SG.ARTIC[state.lang][ty] || []).forEach(function (it) {
          if (!state.sound || SG.articSounds(it, ty, state.lang).indexOf(state.sound) !== -1) list.push({ kind: 'word', item: it, type: ty });
        });
      });
      // A word can be in two lists (perro is CVCV and an R word); show it once, keeping its target.
      var seen = {};
      list = list.filter(function (x) { return x.item.target; }).concat(list.filter(function (x) { return !x.item.target; }))
        .filter(function (x) { var k = SG.norm(x.item.word); if (seen[k]) return false; seen[k] = true; return true; });
      list = SG.shuffle(list);
    }
    state.list = list;
    state.index = 0;
  }

  function soundOptions() {
    if (state.level !== 'word') return SG.ISO_SOUNDS[state.lang].map(function (s) { return [s.id, s.name]; });
    var set = {};
    types().forEach(function (ty) {
      (SG.ARTIC[state.lang][ty] || []).forEach(function (it) {
        SG.articSounds(it, ty, state.lang).forEach(function (s) { set[s] = true; });
      });
    });
    return Object.keys(set).sort(function (a, b) {
      var ra = /^r-|^r$/.test(a), rb = /^r-|^r$/.test(b);
      return ra === rb ? a.localeCompare(b) : ra ? -1 : 1;   // R targets first
    }).map(function (s) { return [s, soundLabel(s)]; });
  }

  function skillName(cur) {
    if (cur.kind === 'iso') return 'Artic – isolation ' + cur.sound.name;
    if (cur.kind === 'syl') return 'Artic – syllables ' + cur.sound.name;
    return 'Artic – ' + SG.ARTIC_TYPES[cur.type].label + (state.sound ? ' ' + soundLabel(state.sound) : '');
  }

  SG.Artic = {
    render: function (root) {
      if (!state.lang) state.lang = SG.settings.answerLang;
      if (!state.list.length) buildList();
      root.innerHTML = '';
      var rerender = function () { SG.Artic.render(root); };
      var reset = function () { state.sound = ''; buildList(); rerender(); };

      var langSel = el('select', { onchange: function () { state.lang = this.value; reset(); } },
        el('option', { value: 'en', selected: state.lang === 'en' }, 'English'),
        el('option', { value: 'es', selected: state.lang === 'es' }, 'Español'));
      var levelSel = el('select', { onchange: function () { state.level = this.value; reset(); } },
        [['iso', 'Sound in isolation'], ['syl', 'Syllables'], ['word', 'Words']].map(function (o) {
          return el('option', { value: o[0], selected: state.level === o[0] }, o[1]);
        }));
      var typeSel = state.level === 'word' ? el('select', { onchange: function () { state.type = this.value; reset(); } },
        Object.keys(SG.ARTIC_TYPES).map(function (k) {
          return el('option', { value: k, selected: state.type === k }, SG.ARTIC_TYPES[k].label);
        }), el('option', { value: 'all', selected: state.type === 'all' }, 'All word types')) : null;
      var soundSel = el('select', { onchange: function () { state.sound = this.value; buildList(); rerender(); } },
        el('option', { value: '' }, state.level === 'word' ? 'Any sound' : 'All sounds'),
        soundOptions().map(function (s) { return el('option', { value: s[0], selected: state.sound === s[0] }, s[1]); }));

      root.append(el('div', { class: 'card row wrap' },
        el('label', {}, 'Language ', langSel),
        el('label', {}, 'Practice ', levelSel),
        typeSel ? el('label', {}, 'Word type ', typeSel) : null,
        el('label', {}, 'Target sound ', soundSel),
        state.level === 'word' ? el('button', { class: 'btn', type: 'button', onclick: function () { buildList(); rerender(); } }, '🔀 Shuffle') : null));

      var t = state.tally, total = t.correct + t.approx + t.incorrect;
      var goal = SG.settings.articGoal || 20;
      var pct = total ? Math.round((t.correct / total) * 100) : 0;
      root.append(el('div', { class: 'card tally' },
        el('span', {}, '✅ ' + t.correct), el('span', {}, '🟡 ' + t.approx), el('span', {}, '🔁 ' + t.incorrect),
        el('span', {}, 'Trials: ' + total + ' / ' + goal), el('strong', {}, pct + '% correct'),
        el('progress', { max: goal, value: Math.min(total, goal) }),
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          state.tally = { correct: 0, approx: 0, incorrect: 0 }; rerender();
        } }, 'Reset tally')));

      if (!state.list.length) {
        root.append(el('p', { class: 'card muted', text: 'No words match that filter yet. Try “All word types”, or add words in js/data/artic-more.js.' }));
        return;
      }
      var cur = state.list[state.index];
      function onScore(score) {
        state.tally[score]++;
        SG.Log.add({
          type: 'artic', skill: skillName(cur), lang: state.lang, lesson: 'Articulation drill',
          prompt: cur.kind === 'iso' ? cur.sound.name : cur.kind === 'syl' ? cur.syl : cur.item.word,
          response: score, result: score === 'approx' ? 'cued' : score
        });
        if (score !== 'incorrect') state.index = (state.index + 1) % state.list.length;
        var n = state.tally.correct + state.tally.approx + state.tally.incorrect;
        if (n === goal) SG.toast(SG.L('Goal reached! 🎉', '¡Meta cumplida! 🎉'));
        rerender();
      }
      var card;
      if (cur.kind === 'iso') card = SG.IsoCard(cur.sound, state.lang, { onScore: onScore });
      else if (cur.kind === 'syl') card = SG.ArticCard({ word: cur.syl, emoji: cur.sound.emoji, parts: [cur.syl] }, 'syl', state.lang, { onScore: onScore, label: 'Syllable' });
      else card = SG.ArticCard(cur.item, cur.type, state.lang, { onScore: onScore, sound: state.sound });

      root.append(el('div', { class: 'artic-stage' },
        el('button', { class: 'btn nav', type: 'button', title: 'Previous', onclick: function () {
          state.index = (state.index - 1 + state.list.length) % state.list.length; rerender();
        } }, '◀'),
        card,
        el('button', { class: 'btn nav', type: 'button', title: 'Next', onclick: function () {
          state.index = (state.index + 1) % state.list.length; rerender();
        } }, '▶')));
      root.append(el('p', { class: 'muted center', text: (state.index + 1) + ' / ' + state.list.length }));
    }
  };
})(window.SG);
