/* Activity renderers. Each takes (box, activity, ctx) where
   ctx = { board, lesson, index, total, done(result) }
   result = { result: 'correct'|'cued'|'incorrect', response, attempts, lang } */
(function (SG) {
  'use strict';
  var el = SG.el, L = SG.L;

  var MSG = {
    done: L('Done', 'Listo'),
    hint: L('Help', 'Ayuda'),
    tryAgain: L('Try again! Look at the picture.', '¡Inténtalo otra vez! Mira la imagen.'),
    tooShort: L('Add more words.', 'Agrega más palabras.'),
    tooLong: L('Use fewer words.', 'Usa menos palabras.'),
    fillBlank: L('Fill in the blank.', 'Llena el espacio.'),
    great: L('Great job!', '¡Muy bien!'),
    greatQ: L('Great question!', '¡Muy buena pregunta!'),
    notQ: L('Start with a question word.', 'Empieza con una palabra de pregunta.'),
    useCue: L('Use the question word: ', 'Usa la palabra: '),
    device: L('Answer on your talker (AAC device).', 'Contesta en tu dispositivo de comunicación.'),
    copy: L('Copy the model.', 'Copia el modelo.'),
    model: L('Model', 'Modelo'),
    example: L('Example', 'Ejemplo'),
    say: L('Say it 3 times!', '¡Dilo 3 veces!')
  };
  var BADGES = {
    who: L('WHO?', '¿QUIÉN?'), what: L('WHAT?', '¿QUÉ?'), where: L('WHERE?', '¿DÓNDE?'),
    when: L('WHEN?', '¿CUÁNDO?'), why: L('WHY?', '¿POR QUÉ?'), how: L('HOW?', '¿CÓMO?'),
    binary: L('CHOOSE', 'ESCOGE'), formulate: L('ASK!', '¡PREGUNTA!'), artic: L('SAY IT', 'DILO')
  };

  function isSlot(tok) { return /^_+$/.test(tok); }
  function frameTokens(act, lang) {
    return (SG.pick(act.frame, lang) || '___').split(/\s+/).filter(Boolean);
  }
  function wordsIn(sentence) { return SG.words(sentence).length; }
  function level() { return Number(SG.settings.level) || 2; }

  /* Question header: badge, bilingual question text and a speak button. */
  function header(box, act, ctx, textObj) {
    var badge = BADGES[act.type === 'wh' ? act.wh : act.type] || BADGES.what;
    box.append(el('div', { class: 'act-head' },
      el('span', { class: 'badge badge-' + (act.wh || act.type) }, SG.biText(badge)),
      el('span', { class: 'muted' }, (ctx.index + 1) + ' / ' + ctx.total)));
    box.append(el('div', { class: 'act-question' },
      SG.biText(textObj),
      el('button', { class: 'btn icon', type: 'button', title: 'Read aloud', onclick: function () { SG.Speech.speakBi(textObj); } }, '🔊')));
    if (SG.settings.autoSpeak) setTimeout(function () { SG.Speech.speakBi(textObj); }, 250);
  }

  function feedback(box) {
    var f = el('div', { class: 'feedback', 'aria-live': 'assertive' });
    box.append(f);
    return function (msg, kind, extra) {
      f.className = 'feedback ' + (kind || '');
      f.innerHTML = '';
      if (msg) f.append(SG.biText(msg));
      if (extra) f.append(el('span', { class: 'feedback-extra', text: extra }));
    };
  }

  /* Clinician scoring buttons; primary in device mode, small otherwise. */
  function clinicianRow(onScore, primary) {
    return el('div', { class: 'clinician' + (primary ? ' primary' : '') },
      el('span', { class: 'muted' }, 'Clinician:'),
      el('button', { class: 'btn small score-correct', type: 'button', onclick: function () { onScore('correct'); } }, '✓ Independent'),
      el('button', { class: 'btn small score-approx', type: 'button', onclick: function () { onScore('cued'); } }, '✓ With cues'),
      el('button', { class: 'btn small score-incorrect', type: 'button', onclick: function () { onScore('incorrect'); } }, '✗ Incorrect'));
  }

  function choiceTile(c, lang) {
    return { text: SG.pick(c, lang), emoji: c.emoji || '', pos: (SG.lookupWord(SG.pick(c, lang), lang) || {}).pos || 'noun' };
  }
  function dedupeTiles(list) {
    var seen = {};
    return list.filter(function (t) {
      var k = SG.norm(t.text);
      if (!k || seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  /* ---------------- WH comprehension with predictable chart frame ---------------- */
  function renderWh(box, act, ctx) {
    var board = ctx.board;
    var attempts = 0, helped = false, finished = false;
    var correct = (act.choices || []).filter(function (c) { return c.correct; });
    var min = act.min || 3, max = act.max || 5;

    header(box, act, ctx, act.question);
    var modelEl = el('div', { class: 'model-chart' });
    box.append(modelEl);
    var say = feedback(box);

    function renderModel(filled) {
      modelEl.innerHTML = '';
      modelEl.append(el('div', { class: 'model-label' }, SG.biText(MSG.model)));
      var langs = SG.settings.uiLang === 'bi' ? [board.lang, board.lang === 'en' ? 'es' : 'en'] : [board.lang];
      langs.forEach(function (l, i) {
        var line = el('div', { class: 'model-line' + (i ? ' secondary' : ''), lang: l });
        frameTokens(act, l).forEach(function (tok) {
          if (isSlot(tok)) line.append(el('span', { class: 'blank' + (filled ? ' filled' : ''), text: filled && correct[0] ? SG.pick(correct[0], l) : '' }));
          else line.append(el('span', { text: tok }));
          line.append(' ');
        });
        line.append(el('span', { text: '.' }));
        modelEl.append(line);
      });
    }

    function setup() {
      var l = board.lang;
      var toks = frameTokens(act, l);
      var frameWords = toks.filter(function (t) { return !isSlot(t); }).map(function (t) {
        var info = SG.lookupWord(t, l);
        return { text: t, emoji: info ? info.emoji : '', pos: info ? info.pos : 'small' };
      });
      var choices = (act.choices || []).map(function (c) { return choiceTile(c, l); });
      var tiles = dedupeTiles(level() === 1 ? choices : frameWords.concat(choices));
      board.setFringe(level() === 3 ? SG.shuffle(tiles) : tiles);
      board.setQuestionMode(false);
      if (level() === 1) {
        board.setFrame(toks.map(function (t) { return isSlot(t) ? { slot: true, text: '' } : { text: t, locked: true }; }));
      } else {
        board.setFrame([]);
      }
      modelEl.hidden = level() === 3 && !helped;
      renderModel(helped && attempts >= 2);
    }

    function finish(result, response) {
      if (finished) return;
      finished = true;
      ctx.done({ result: result, response: response || board.getWords().join(' '), attempts: attempts, lang: board.lang });
    }

    function check() {
      if (finished) return;
      var l = board.lang;
      var words = board.getWords();
      var sentence = words.join(' ');
      if (!words.length) return;
      if (board.hasEmptySlot()) { say(MSG.fillBlank, 'bad'); return; }
      attempts++;
      var n = wordsIn(sentence);
      var accepted = correct.map(function (c) { return SG.pick(c, l); })
        .concat((act.accept && act.accept[l]) || []);
      var hasAnswer = accepted.some(function (a) { return SG.hasPhrase(sentence, a); });
      if (hasAnswer && n >= min && n <= max) {
        var formatted = SG.formatSentence(words, l, false);
        SG.Speech.speak(formatted, l);
        SG.celebrate();
        say(MSG.great, 'good', '“' + formatted + '” (' + n + ' words)');
        SG.Chart.add(ctx.lesson.id, formatted, l);
        renderModel(true);
        modelEl.hidden = false;
        finish(attempts === 1 && !helped ? 'correct' : 'cued', formatted);
        return;
      }
      var msg = !hasAnswer ? MSG.tryAgain : n < min ? MSG.tooShort : MSG.tooLong;
      say(msg, 'bad', min + '–' + max + ' words · ' + n + ' now');
      if (attempts >= 2) {
        helped = true;
        modelEl.hidden = false;
        renderModel(true);
        say(MSG.copy, 'bad');
      }
    }

    if (SG.settings.deviceMode) {
      board.hide();
      modelEl.hidden = level() === 3;
      renderModel(false);
      box.append(el('p', { class: 'device-note' }, '📱 ', SG.biText(MSG.device)));
      box.append(el('div', { class: 'choice-preview' }, (act.choices || []).map(function (c) {
        return el('span', { class: 'chip' }, (c.emoji || '') + ' ' + SG.biString(c));
      })));
      box.append(clinicianRow(function (r) { finish(r, '(device)'); }, true));
      return;
    }

    board.show();
    board.onLang = function () { attempts = 0; setup(); say(null); };
    setup();
    box.append(el('div', { class: 'row wrap' },
      el('button', { class: 'btn primary big', type: 'button', onclick: check }, '✔ ', SG.biText(MSG.done)),
      el('button', { class: 'btn', type: 'button', onclick: function () {
        helped = true; modelEl.hidden = false; renderModel(true);
      } }, '💡 ', SG.biText(MSG.hint))));
    box.append(clinicianRow(function (r) { finish(r); }, false));
  }

  /* ---------------- Binary: yes/no or this-or-that ---------------- */
  function renderBinary(box, act, ctx) {
    ctx.board.hide();
    var attempts = 0, finished = false;
    header(box, act, ctx, act.question);
    var say = feedback(box);
    var lang = ctx.board.lang;

    function finish(result, response) {
      if (finished) return;
      finished = true;
      ctx.done({ result: result, response: response, attempts: attempts, lang: lang });
    }

    var buttons = (act.choices || []).slice(0, 2).map(function (c) {
      var b = el('button', { class: 'binary-btn', type: 'button' },
        el('span', { class: 'binary-emoji', 'aria-hidden': 'true', text: c.emoji || '' }),
        SG.biText(c));
      b.addEventListener('click', function () {
        if (finished) return;
        attempts++;
        SG.Speech.speakBi(c);
        if (c.correct) {
          b.classList.add('right');
          SG.celebrate();
          say(MSG.great, 'good');
          finish(attempts === 1 ? 'correct' : 'cued', SG.pick(c, lang) || SG.biString(c));
        } else {
          b.classList.add('wrong');
          if (attempts >= 2) {
            buttons.forEach(function (x, i) { if (act.choices[i].correct) x.classList.add('right', 'pulse'); });
            say(MSG.tryAgain, 'bad');
            finish('incorrect', SG.pick(c, lang) || SG.biString(c));
          } else {
            say(MSG.tryAgain, 'bad');
          }
        }
      });
      return b;
    });
    box.append(el('div', { class: 'binary-row' }, buttons));
    box.append(clinicianRow(function (r) { finish(r, '(clinician)'); }, SG.settings.deviceMode));
  }

  /* ---------------- Formulate a question about the scene ---------------- */
  function renderFormulate(box, act, ctx) {
    var board = ctx.board;
    var attempts = 0, helped = false, finished = false;
    var min = act.min || 3, max = act.max || 5;
    var cue = act.cue ? SG.WH_WORDS[act.cue] : null;
    var prompt = act.prompt || L('Ask a question about the picture.', 'Haz una pregunta sobre la imagen.');

    header(box, act, ctx, prompt);
    if (cue) box.append(el('div', { class: 'cue-chip' }, '❓ ', SG.biText(cue)));
    var exampleEl = el('div', { class: 'model-chart' });
    box.append(exampleEl);
    var say = feedback(box);

    function renderExample() {
      exampleEl.innerHTML = '';
      if (!act.example) { exampleEl.hidden = true; return; }
      exampleEl.append(el('div', { class: 'model-label' }, SG.biText(MSG.example)));
      exampleEl.append(el('div', { class: 'model-line' }, SG.biText(act.example)));
    }

    function setup() {
      var l = board.lang;
      var tiles = [];
      if (cue) {
        tiles.push({ text: SG.pick(cue, l), pos: 'question' });
      } else {
        Object.keys(SG.WH_WORDS).forEach(function (k) { tiles.push({ text: SG.pick(SG.WH_WORDS[k], l), pos: 'question' }); });
      }
      SG.QUESTION_HELPERS[l].forEach(function (w) { tiles.push({ text: w }); });
      (act.choices || []).forEach(function (c) { tiles.push(choiceTile(c, l)); });
      board.setFringe(dedupeTiles(tiles));
      board.setQuestionMode(true);
      board.setFrame(level() === 1 && cue ? [{ text: SG.pick(cue, l), locked: true }] : []);
      exampleEl.hidden = !act.example || (level() === 3 && !helped);
      renderExample();
    }

    function finish(result, response) {
      if (finished) return;
      finished = true;
      ctx.done({ result: result, response: response || board.getWords().join(' '), attempts: attempts, lang: board.lang });
    }

    function check() {
      if (finished) return;
      var l = board.lang;
      var words = board.getWords();
      if (!words.length) return;
      attempts++;
      var sentence = words.join(' ');
      var n = wordsIn(sentence);
      var first = SG.words(sentence)[0];
      var startsOk = SG.QUESTION_STARTERS[l].indexOf(first) !== -1;
      var cueOk = !cue || SG.hasPhrase(sentence, SG.pick(cue, l));
      if (startsOk && cueOk && n >= min && n <= max) {
        var q = SG.formatSentence(words, l, true);
        SG.Speech.speak(q, l);
        SG.celebrate();
        say(MSG.greatQ, 'good', '“' + q + '”');
        SG.Chart.add(ctx.lesson.id, q, l);
        finish(attempts === 1 && !helped ? 'correct' : 'cued', q);
        return;
      }
      if (!cueOk) say(MSG.useCue, 'bad', SG.biString(cue));
      else if (!startsOk) say(MSG.notQ, 'bad');
      else say(n < min ? MSG.tooShort : MSG.tooLong, 'bad', min + '–' + max + ' words · ' + n + ' now');
      if (attempts >= 2 && act.example) { helped = true; exampleEl.hidden = false; }
    }

    if (SG.settings.deviceMode) {
      board.hide();
      renderExample();
      exampleEl.hidden = !act.example || level() === 3;
      box.append(el('p', { class: 'device-note' }, '📱 ', SG.biText(MSG.device)));
      box.append(clinicianRow(function (r) { finish(r, '(device)'); }, true));
      return;
    }

    board.show();
    board.onLang = function () { attempts = 0; setup(); say(null); };
    setup();
    box.append(el('div', { class: 'row wrap' },
      el('button', { class: 'btn primary big', type: 'button', onclick: check }, '✔ ', SG.biText(MSG.done)),
      act.example ? el('button', { class: 'btn', type: 'button', onclick: function () {
        helped = true; exampleEl.hidden = false;
      } }, '💡 ', SG.biText(MSG.hint)) : null));
    box.append(clinicianRow(function (r) { finish(r); }, false));
  }

  /* ---------------- Articulation word inside a lesson ---------------- */
  function renderArtic(box, act, ctx) {
    ctx.board.hide();
    var lang = ctx.board.lang;
    var trials = act.trials || 3;
    var scores = [];
    var finished = false;

    header(box, act, ctx, MSG.say);
    var holder = el('div');
    var dots = el('div', { class: 'trial-dots' });
    box.append(holder, dots);

    function item(l) {
      var parts = act.parts && act.parts[l] && act.parts[l].length ? act.parts[l] : [SG.pick(act.word, l)];
      var it = { word: SG.pick(act.word, l), emoji: act.emoji, parts: parts };
      if (act.target && SG.pick(act.target, l)) it.target = SG.pick(act.target, l);
      return it;
    }
    function shapeFor(l) { return (act.shape && SG.pick(act.shape, l)) || 'cvc'; }
    function isoSound(l) {
      var id = act.sound && SG.pick(act.sound, l);
      return SG.ISO_SOUNDS[l].find(function (x) { return x.id === id; }) || SG.ISO_SOUNDS[l][0];
    }
    function usable(l) { return shapeFor(l) === 'iso' ? !!(act.sound && SG.pick(act.sound, l)) : !!SG.pick(act.word, l); }
    if (!usable(lang)) lang = lang === 'en' ? 'es' : 'en';
    function promptText(l) { return shapeFor(l) === 'iso' ? isoSound(l).name : item(l).word; }
    function skill(l) { return shapeFor(l) === 'iso' ? 'Artic – isolation ' + isoSound(l).name : 'Artic – ' + SG.SHAPES[shapeFor(l)]; }

    function draw() {
      holder.innerHTML = '';
      var langToggle = usable('en') && usable('es') ? el('button', {
        class: 'btn small', type: 'button', onclick: function () { lang = lang === 'en' ? 'es' : 'en'; draw(); }
      }, lang === 'en' ? '🇲🇽 Español' : '🇺🇸 English') : null;
      holder.append(el('div', { class: 'row center' }, langToggle));
      var make = shapeFor(lang) === 'iso'
        ? function (o) { return SG.IsoCard(isoSound(lang), lang, o); }
        : function (o) { return SG.ArticCard(item(lang), shapeFor(lang), lang, o); };
      holder.append(make({
        onScore: function (s) {
          if (finished) return;
          scores.push(s);
          SG.Log.add({
            type: 'artic', skill: skill(lang), lang: lang,
            lesson: SG.biString(ctx.lesson.title), prompt: promptText(lang), response: s,
            result: s === 'approx' ? 'cued' : s
          });
          drawDots();
          if (scores.length >= trials) {
            finished = true;
            var good = scores.filter(function (x) { return x === 'correct'; }).length;
            ctx.done({
              result: good === trials ? 'correct' : good + scores.filter(function (x) { return x === 'approx'; }).length > 0 ? 'cued' : 'incorrect',
              response: good + '/' + trials, attempts: trials, lang: lang, logged: true
            });
          }
        }
      }));
    }
    function drawDots() {
      dots.innerHTML = '';
      for (var i = 0; i < trials; i++) {
        var s = scores[i];
        dots.append(el('span', { class: 'dot ' + (s ? 'dot-' + s : '') }));
      }
    }
    draw();
    drawDots();
  }

  SG.Activities = {
    render: function (box, act, ctx) {
      box.innerHTML = '';
      ctx.board.onLang = null;
      var fn = { wh: renderWh, binary: renderBinary, formulate: renderFormulate, artic: renderArtic }[act.type];
      if (!fn) { box.append(el('p', { text: 'Unknown activity type: ' + act.type })); return; }
      fn(box, act, ctx);
    },
    skillName: function (act) {
      if (act.type === 'wh') return 'WH – ' + (act.wh || 'what');
      if (act.type === 'binary') {
        var yn = (act.choices || []).some(function (c) { return SG.norm(c.en) === 'yes'; });
        return yn ? 'Binary – yes/no' : 'Binary – choice';
      }
      if (act.type === 'formulate') return 'Formulate question' + (act.cue ? ' – ' + act.cue : '');
      return act.type;
    },
    promptText: function (act) {
      var word = act.word && (act.word.en || act.word.es) ? act.word : null;
      return SG.biString(act.question || act.prompt || word || act.sound || '');
    }
  };
})(window.SG);
