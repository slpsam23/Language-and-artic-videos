/* TouchChat-style AAC board: message window, fringe row of activity words,
   category pages, colour-coded word grid, and an English/Spanish switch. */
(function (SG) {
  'use strict';
  var el = SG.el;

  SG.createBoard = function (root) {
    var lang = SG.settings.answerLang || 'en';
    var cat = 'core';
    var items = [];        // sentence: [{text, locked, slot}]
    var fringe = [];       // [{text, emoji, pos}]
    var isQuestion = false;

    var tilesEl = el('div', { class: 'sentence-tiles', 'aria-live': 'polite' });
    var langBtn = el('button', { class: 'btn lang-btn', type: 'button', title: 'Switch board language / Cambiar idioma' });
    var fringeEl = el('div', { class: 'fringe' });
    var tabsEl = el('div', { class: 'board-tabs', role: 'tablist' });
    var gridEl = el('div', { class: 'board-grid' });

    var bar = el('div', { class: 'sentence-bar' },
      el('button', { class: 'sentence-window', type: 'button', title: 'Speak sentence', onclick: speakAll }, tilesEl),
      el('button', { class: 'btn icon', type: 'button', title: 'Speak / Hablar', onclick: speakAll }, '🔊'),
      el('button', { class: 'btn icon', type: 'button', title: 'Delete word / Borrar', onclick: backspace }, '⌫'),
      el('button', { class: 'btn icon', type: 'button', title: 'Clear / Borrar todo', onclick: function () { api.clear(); } }, '🗑️'),
      langBtn);

    langBtn.addEventListener('click', function () {
      api.setLang(lang === 'en' ? 'es' : 'en');
      if (api.onLang) api.onLang(lang);
    });

    root.innerHTML = '';
    root.append(el('div', { class: 'board' }, bar, fringeEl, tabsEl, gridEl));

    function tile(word, emoji, pos, extraClass) {
      var info = SG.lookupWord(word, lang);
      pos = pos || (info && info.pos) || 'small';
      if (emoji == null) emoji = info ? info.emoji : '';
      return el('button', {
        class: 'tile pos-' + pos + (extraClass ? ' ' + extraClass : ''),
        type: 'button', lang: lang,
        onclick: function () { addWord(word); }
      }, emoji ? el('span', { class: 'tile-emoji', 'aria-hidden': 'true', text: emoji }) : null,
         el('span', { class: 'tile-word', text: word }));
    }

    function addWord(word) {
      if (SG.settings.speakEachWord) SG.Speech.speak(word, lang);
      var slot = items.find(function (it) { return it.slot && !it.text; });
      if (slot) slot.text = word;
      else items.push({ text: word });
      renderSentence();
    }

    function backspace() {
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (it.locked || !it.text) continue;
        if (it.slot) it.text = '';
        else items.splice(i, 1);
        break;
      }
      renderSentence();
    }

    function speakAll() {
      var w = api.getWords();
      if (w.length) SG.Speech.speak(SG.formatSentence(w, lang, isQuestion), lang);
    }

    function renderSentence() {
      tilesEl.innerHTML = '';
      if (!items.length) {
        tilesEl.append(el('span', { class: 'placeholder', text: lang === 'es' ? 'Toca palabras…' : 'Tap words…' }));
      }
      items.forEach(function (it) {
        if (it.slot && !it.text) tilesEl.append(el('span', { class: 'sent-word slot', text: '____' }));
        else tilesEl.append(el('span', { class: 'sent-word' + (it.locked ? ' locked' : ''), text: it.text }));
      });
      if (items.length && isQuestion) tilesEl.append(el('span', { class: 'sent-word punct', text: '?' }));
      if (api.onChange) api.onChange(api.getWords());
    }

    function renderFringe() {
      fringeEl.innerHTML = '';
      fringeEl.hidden = !fringe.length;
      fringe.forEach(function (f) { fringeEl.append(tile(f.text, f.emoji, f.pos, 'fringe-tile')); });
    }

    function renderTabs() {
      tabsEl.innerHTML = '';
      SG.VOCAB[lang].forEach(function (c) {
        tabsEl.append(el('button', {
          class: 'tab' + (c.id === cat ? ' active' : ''), type: 'button', role: 'tab',
          'aria-selected': c.id === cat ? 'true' : 'false',
          onclick: function () { cat = c.id; renderTabs(); renderGrid(); }
        }, c.label));
      });
    }

    function renderGrid() {
      gridEl.innerHTML = '';
      var page = SG.VOCAB[lang].find(function (c) { return c.id === cat; }) || SG.VOCAB[lang][0];
      page.items.forEach(function (it) { gridEl.append(tile(it[0], it[1], it[2])); });
    }

    function renderAll() {
      langBtn.textContent = lang === 'en' ? '🇺🇸 EN' : '🇲🇽 ES';
      renderSentence(); renderFringe(); renderTabs(); renderGrid();
    }

    var api = {
      onChange: null,
      onLang: null,
      get lang() { return lang; },
      setLang: function (l) { lang = l; items = []; renderAll(); },
      setFringe: function (list) { fringe = list || []; renderFringe(); },
      /* Pre-fill the message window with a predictable-chart frame. */
      setFrame: function (list) { items = list.map(function (x) { return Object.assign({}, x); }); renderSentence(); },
      setQuestionMode: function (q) { isQuestion = !!q; renderSentence(); },
      getWords: function () {
        return items.filter(function (it) { return it.text; }).map(function (it) { return it.text; });
      },
      hasEmptySlot: function () { return items.some(function (it) { return it.slot && !it.text; }); },
      clear: function () {
        items = items.filter(function (it) { return it.locked || it.slot; });
        items.forEach(function (it) { if (it.slot) it.text = ''; });
        renderSentence();
      },
      reset: function () { items = []; fringe = []; isQuestion = false; cat = 'core'; renderAll(); },
      show: function () { root.hidden = false; },
      hide: function () { root.hidden = true; }
    };

    renderAll();
    return api;
  };
})(window.SG);
