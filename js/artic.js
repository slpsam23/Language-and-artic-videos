/* Articulation practice: CVC, VCV, CVCV word cards with a spoken model,
   optional self-recording, and clinician scoring (correct / approx / try again). */
(function (SG) {
  'use strict';
  var el = SG.el;

  var SCORE_LABELS = {
    correct: SG.L('Correct', 'Correcto'),
    approx: SG.L('Close', 'Casi'),
    incorrect: SG.L('Try again', 'Otra vez')
  };

  /* item: {word, emoji, parts}, shape: 'cvc'|'vcv'|'cvcv', lang: 'en'|'es'
     opts.onScore(score) is called with 'correct' | 'approx' | 'incorrect'. */
  SG.ArticCard = function (item, shape, lang, opts) {
    opts = opts || {};
    var audioUrl = null;

    var partsEl = el('div', { class: 'artic-parts' });
    (item.parts || []).forEach(function (p, i) {
      var kind;
      if (shape === 'cvcv') kind = 'syl';
      else kind = /^[aeiouáéíóúüy]+$/i.test(p) ? 'v' : 'c';
      if (i > 0 && shape === 'cvcv') partsEl.append(el('span', { class: 'artic-dot', text: '•' }));
      partsEl.append(el('span', { class: 'artic-part part-' + kind, text: p }));
    });

    var shapeLabel = el('div', { class: 'artic-shape' });
    SG.SHAPES[shape].split('').forEach(function (ch) {
      shapeLabel.append(el('span', { class: ch === 'C' ? 'part-c' : 'part-v', text: ch }));
    });

    var recBtn = el('button', { class: 'btn', type: 'button' }, '🎙️ ' + (lang === 'es' ? 'Grabar' : 'Record'));
    var playBtn = el('button', { class: 'btn', type: 'button', disabled: true }, '▶️ ' + (lang === 'es' ? 'Escúchame' : 'Hear me'));

    recBtn.addEventListener('click', function () {
      if (SG.Recorder.isRecording()) {
        SG.Recorder.stop().then(function (url) {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = url;
          playBtn.disabled = !url;
          recBtn.classList.remove('recording');
          recBtn.textContent = '🎙️ ' + (lang === 'es' ? 'Grabar' : 'Record');
        });
      } else {
        SG.Recorder.start().then(function () {
          recBtn.classList.add('recording');
          recBtn.textContent = '⏹️ ' + (lang === 'es' ? 'Parar' : 'Stop');
        }).catch(function () {
          SG.toast(SG.L('Microphone not available. The site must use https and allow the mic.',
                        'Micrófono no disponible. El sitio debe usar https y permitir el micrófono.'));
        });
      }
    });
    playBtn.addEventListener('click', function () { if (audioUrl) new Audio(audioUrl).play(); });

    var modelBtns = el('div', { class: 'row wrap center' },
      el('button', { class: 'btn primary', type: 'button', onclick: function () {
        SG.Speech.speak(item.word, lang, { rate: Math.min(SG.settings.rate, 0.8) });
      } }, '🔊 ' + (lang === 'es' ? 'Escuchar' : 'Listen')),
      shape === 'cvcv' ? el('button', { class: 'btn', type: 'button', onclick: function () {
        SG.Speech.stop();
        item.parts.forEach(function (p) { SG.Speech.speak(p, lang, { queue: true, rate: 0.6 }); });
      } }, '🐢 ' + (lang === 'es' ? 'Sílabas' : 'Syllables')) : null,
      SG.Recorder.supported ? recBtn : null,
      SG.Recorder.supported ? playBtn : null);

    var scoreRow = null;
    if (opts.onScore) {
      scoreRow = el('div', { class: 'score-row' },
        ['correct', 'approx', 'incorrect'].map(function (s) {
          return el('button', { class: 'btn score score-' + s, type: 'button', onclick: function () {
            if (s === 'correct') SG.celebrate();
            opts.onScore(s);
          } }, (s === 'correct' ? '✅ ' : s === 'approx' ? '🟡 ' : '🔁 ') + SG.pick(SCORE_LABELS[s], lang));
        }));
    }

    return el('div', { class: 'artic-card' },
      el('div', { class: 'artic-emoji', 'aria-hidden': 'true', text: item.emoji || '🗣️' }),
      el('div', { class: 'artic-word', lang: lang, text: item.word }),
      shapeLabel, partsEl, modelBtns, scoreRow);
  };

  /* ---------- Articulation tab ---------- */
  var state = { lang: null, shape: 'cvc', sound: '', list: [], index: 0, tally: { correct: 0, approx: 0, incorrect: 0 } };

  function buildList() {
    var shapes = state.shape === 'all' ? Object.keys(SG.SHAPES) : [state.shape];
    var list = [];
    shapes.forEach(function (sh) {
      SG.ARTIC[state.lang][sh].forEach(function (it) {
        if (!state.sound || SG.articSounds(it, sh).indexOf(state.sound) !== -1) list.push({ item: it, shape: sh });
      });
    });
    state.list = SG.shuffle(list);
    state.index = 0;
  }

  function soundOptions() {
    var shapes = state.shape === 'all' ? Object.keys(SG.SHAPES) : [state.shape];
    var set = {};
    shapes.forEach(function (sh) {
      SG.ARTIC[state.lang][sh].forEach(function (it) {
        SG.articSounds(it, sh).forEach(function (s) { set[s] = true; });
      });
    });
    return Object.keys(set).sort();
  }

  SG.Artic = {
    render: function (root) {
      if (!state.lang) state.lang = SG.settings.answerLang;
      if (!state.list.length) buildList();
      root.innerHTML = '';

      var langSel = el('select', { onchange: function () { state.lang = this.value; state.sound = ''; buildList(); SG.Artic.render(root); } },
        el('option', { value: 'en', selected: state.lang === 'en' }, 'English'),
        el('option', { value: 'es', selected: state.lang === 'es' }, 'Español'));
      var shapeSel = el('select', { onchange: function () { state.shape = this.value; state.sound = ''; buildList(); SG.Artic.render(root); } },
        ['cvc', 'vcv', 'cvcv', 'all'].map(function (s) {
          return el('option', { value: s, selected: state.shape === s }, s === 'all' ? 'All / Todos' : SG.SHAPES[s]);
        }));
      var soundSel = el('select', { onchange: function () { state.sound = this.value; buildList(); SG.Artic.render(root); } },
        el('option', { value: '' }, 'Any sound / Cualquier sonido'),
        soundOptions().map(function (s) { return el('option', { value: s, selected: state.sound === s }, '/' + s + '/'); }));

      var controls = el('div', { class: 'card row wrap' },
        el('label', {}, 'Language / Idioma ', langSel),
        el('label', {}, 'Shape / Forma ', shapeSel),
        el('label', {}, 'Target sound ', soundSel),
        el('button', { class: 'btn', type: 'button', onclick: function () { buildList(); SG.Artic.render(root); } }, '🔀 Shuffle'));
      root.append(controls);

      var t = state.tally, total = t.correct + t.approx + t.incorrect;
      var goal = SG.settings.articGoal || 20;
      var pct = total ? Math.round((t.correct / total) * 100) : 0;
      root.append(el('div', { class: 'card tally' },
        el('span', {}, '✅ ' + t.correct), el('span', {}, '🟡 ' + t.approx), el('span', {}, '🔁 ' + t.incorrect),
        el('span', {}, 'Trials: ' + total + ' / ' + goal), el('strong', {}, pct + '% correct'),
        el('progress', { max: goal, value: Math.min(total, goal) }),
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          state.tally = { correct: 0, approx: 0, incorrect: 0 }; SG.Artic.render(root);
        } }, 'Reset tally')));

      if (!state.list.length) {
        root.append(el('p', { class: 'card', text: 'No words match that filter yet. Add some in js/data/artic-words.js.' }));
        return;
      }
      var cur = state.list[state.index];
      var card = SG.ArticCard(cur.item, cur.shape, state.lang, {
        onScore: function (score) {
          state.tally[score]++;
          SG.Log.add({
            type: 'artic', skill: 'Artic – ' + SG.SHAPES[cur.shape], lang: state.lang,
            lesson: 'Articulation drill', prompt: cur.item.word, response: score,
            result: score === 'approx' ? 'cued' : score
          });
          if (score !== 'incorrect') state.index = (state.index + 1) % state.list.length;
          var goalNow = state.tally.correct + state.tally.approx + state.tally.incorrect;
          if (goalNow === goal) SG.toast(SG.L('Goal reached! 🎉', '¡Meta cumplida! 🎉'));
          SG.Artic.render(root);
        }
      });
      root.append(el('div', { class: 'artic-stage' },
        el('button', { class: 'btn nav', type: 'button', title: 'Previous', onclick: function () {
          state.index = (state.index - 1 + state.list.length) % state.list.length; SG.Artic.render(root);
        } }, '◀'),
        card,
        el('button', { class: 'btn nav', type: 'button', title: 'Next', onclick: function () {
          state.index = (state.index + 1) % state.list.length; SG.Artic.render(root);
        } }, '▶')));
      root.append(el('p', { class: 'muted center', text: (state.index + 1) + ' / ' + state.list.length }));
    }
  };
})(window.SG);
