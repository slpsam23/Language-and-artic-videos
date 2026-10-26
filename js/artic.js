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
    var hl = SG.articHighlight(item, type, opts.sound, lang, opts.pos);

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
    if (type !== 'syl' && !/^multi/.test(type)) {
      var n = SG.syllableCount(item);
      label.append(el('span', { class: 'chip', text: n + (n === 1 ? ' syllable' : ' syllables') }));
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
  var POS_LABEL = {
    initial: SG.L('Beginning', 'Inicio'), medial: SG.L('Middle', 'Medio'), final: SG.L('End', 'Final')
  };
  var state = {
    lang: null, level: 'word', type: 'all', sound: '', pos: '', len: '', list: [], index: 0,
    tally: { correct: 0, approx: 0, incorrect: 0 }
  };

  function types() { return state.type === 'all' ? Object.keys(SG.ARTIC_TYPES) : [state.type]; }

  function wordPool() {
    var seen = {}, list = [];
    types().forEach(function (ty) {
      (SG.ARTIC[state.lang][ty] || []).forEach(function (it) {
        if (state.len && SG.syllableCount(it) !== Number(state.len)) return;
        list.push({ kind: 'word', item: it, type: ty });
      });
    });
    // A word can be in two lists (perro is CVCV and an R word); keep one, preferring the one with a target.
    list.sort(function (a, b) { return (b.item.target ? 1 : 0) - (a.item.target ? 1 : 0); });
    return list.filter(function (x) { var k = SG.norm(x.item.word); if (seen[k]) return false; seen[k] = true; return true; });
  }

  function buildList() {
    var list = [];
    if (state.level === 'iso') {
      SG.ISO_SOUNDS[state.lang].forEach(function (snd) {
        if (!state.sound || snd.id === state.sound) list.push({ kind: 'iso', sound: snd });
      });
    } else if (state.level === 'syl') {
      SG.ISO_SOUNDS[state.lang].forEach(function (snd) {
        if (state.sound && snd.id !== state.sound) return;
        var d = SG.syllableDrill(snd.id, state.lang, state.pos || 'initial', Number(state.len) || 1);
        d.items.forEach(function (seq) { list.push({ kind: 'syl', sound: snd, seq: seq, pos: d.pos }); });
      });
    } else {
      list = SG.shuffle(wordPool().filter(function (x) {
        return SG.articHasTarget(x.item, state.lang, state.sound, state.pos);
      }));
    }
    state.list = list;
    state.index = 0;
  }

  function soundOptions() {
    if (state.level !== 'word') return SG.ISO_SOUNDS[state.lang].map(function (s) { return [s.id, s.name]; });
    var set = {};
    wordPool().forEach(function (x) { SG.articSounds(x.item, x.type, state.lang).forEach(function (s) { set[s] = true; }); });
    var iso = {};
    SG.ISO_SOUNDS[state.lang].forEach(function (s) { iso[s.id] = s.name; });
    return Object.keys(set).sort(function (a, b) {
      var ra = /^r-|^r$/.test(a), rb = /^r-|^r$/.test(b);
      var ca = a.replace(/^-/, '').length > 2 || /^-/.test(a) || (a.length === 2 && !iso[a]);
      var cb = b.replace(/^-/, '').length > 2 || /^-/.test(b) || (b.length === 2 && !iso[b]);
      if (ra !== rb) return ra ? -1 : 1;          // R targets first
      if (ca !== cb) return ca ? 1 : -1;          // then single sounds, then clusters
      return a.localeCompare(b);
    }).map(function (s) { return [s, iso[s] || soundLabel(s)]; });
  }

  function skillName(cur) {
    if (cur.kind === 'iso') return 'Artic – isolation ' + cur.sound.name;
    if (cur.kind === 'syl') return 'Artic – syllables ' + cur.sound.name + ' ' + cur.pos + (cur.seq.length > 1 ? ', ' + cur.seq.length + ' syl' : '');
    return 'Artic – words' + (state.sound ? ' ' + soundLabel(state.sound) : '') + (state.pos ? ' ' + state.pos : '') +
      (state.len ? ', ' + state.len + ' syl' : '') + (state.type !== 'all' ? ' (' + SG.ARTIC_TYPES[state.type].label + ')' : '');
  }

  SG.Artic = {
    render: function (root) {
      if (!state.lang) state.lang = SG.settings.answerLang;
      if (!state.list.length) buildList();
      root.innerHTML = '';
      var rerender = function () { SG.Artic.render(root); };
      var rebuild = function () { buildList(); rerender(); };
      var L = state.lang;
      var opt = function (v, label, cur) { return el('option', { value: v, selected: String(cur) === String(v) }, label); };
      var sel = function (key, options, after) {
        return el('select', { onchange: function () { state[key] = this.value; if (after) after(); rebuild(); } },
          options.map(function (o) { return opt(o[0], o[1], state[key]); }));
      };

      var controls = [
        el('label', {}, 'Language ', sel('lang', [['en', 'English'], ['es', 'Español']], function () { state.sound = ''; })),
        el('label', {}, 'Practice ', sel('level', [['iso', 'Sound in isolation'], ['syl', 'Syllables'], ['word', 'Words']], function () {
          state.pos = ''; state.len = '';
        }))
      ];
      var posChoices = function (anyLabel) {
        var ps = state.level === 'syl' && state.sound ? SG.drillPositions(state.sound, L) : ['initial', 'medial', 'final'];
        return (anyLabel ? [['', anyLabel]] : []).concat(ps.map(function (p) { return [p, SG.biString(POS_LABEL[p])]; }));
      };
      if (state.level === 'word') {
        controls.push(
          el('label', {}, 'Word type ', sel('type', [['all', 'All word types']].concat(Object.keys(SG.ARTIC_TYPES).map(function (k) {
            return [k, SG.ARTIC_TYPES[k].label];
          })), function () { state.sound = ''; })),
          el('label', {}, 'Syllables ', sel('len', [['', 'Any length'], ['1', '1 syllable'], ['2', '2 syllables'], ['3', '3 syllables'], ['4', '4 syllables'], ['5', '5 syllables']])),
          el('label', {}, 'Target sound ', sel('sound', [['', 'Any sound']].concat(soundOptions()))),
          el('label', {}, 'Position ', sel('pos', posChoices('Any position'))));
      } else {
        controls.push(el('label', {}, 'Target sound ', sel('sound', [['', 'All sounds']].concat(soundOptions()), function () {
          if (state.level === 'syl' && state.pos && state.sound && !SG.drillPositionOk(state.sound, L, state.pos)) state.pos = '';
        })));
        if (state.level === 'syl') {
          controls.push(
            el('label', {}, 'Position ', sel('pos', posChoices())),
            el('label', {}, 'Length ', sel('len', [['1', '1 syllable'], ['2', '2 syllables'], ['3', '3 syllables'], ['4', '4 syllables'], ['5', '5 syllables']])));
        }
      }
      if (state.level !== 'iso') controls.push(el('button', { class: 'btn', type: 'button', onclick: rebuild }, '🔀 Shuffle'));
      root.append(el('div', { class: 'card row wrap artic-controls' }, controls));
      if (state.level === 'word' && state.pos && !state.sound) {
        root.append(el('p', { class: 'muted', text: 'Pick a target sound to practice it at the ' + SG.pick(POS_LABEL[state.pos], 'en').toLowerCase() + ' of words.' }));
      }

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
        root.append(el('p', { class: 'card muted', text: 'No words match all of those choices yet. Try “Any length”, another position, or “All word types” — or add words in js/data/artic-more.js.' }));
        return;
      }
      var cur = state.list[state.index];
      function onScore(score) {
        state.tally[score]++;
        SG.Log.add({
          type: 'artic', skill: skillName(cur), lang: L, lesson: 'Articulation drill',
          prompt: cur.kind === 'iso' ? cur.sound.name : cur.kind === 'syl' ? cur.seq.join('-') : cur.item.word,
          response: score, result: score === 'approx' ? 'cued' : score
        });
        if (score !== 'incorrect') state.index = (state.index + 1) % state.list.length;
        var n = state.tally.correct + state.tally.approx + state.tally.incorrect;
        if (n === goal) SG.toast(SG.L('Goal reached! 🎉', '¡Meta cumplida! 🎉'));
        rerender();
      }
      var card;
      if (cur.kind === 'iso') {
        card = SG.IsoCard(cur.sound, L, { onScore: onScore });
      } else if (cur.kind === 'syl') {
        card = SG.ArticCard({ word: cur.seq.join('-'), emoji: cur.sound.emoji, parts: cur.seq }, 'syl', L, {
          onScore: onScore, label: (cur.seq.length > 1 ? cur.seq.length + ' syllables' : 'Syllable') + ' · ' + cur.sound.name + ' · ' + SG.pick(POS_LABEL[cur.pos], 'en')
        });
      } else {
        card = SG.ArticCard(cur.item, cur.type, L, { onScore: onScore, sound: state.sound, pos: state.pos });
      }

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
