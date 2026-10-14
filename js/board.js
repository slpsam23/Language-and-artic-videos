/* AAC board: message window, optional activity-word (fringe) row, and a fixed
   rows × columns grid with folders, laid out from the student's AAC profile
   (see js/aac.js). Words stay in the same cell every time, which supports
   motor planning. */
(function (SG) {
  'use strict';
  var el = SG.el;

  SG.createBoard = function (root) {
    var profile = SG.Profile.current();
    var lang = SG.settings.answerLang || 'en';
    var pageId = 'home';
    var items = [];        // sentence: [{text, locked, slot}]
    var fringe = [];       // activity words [{text, emoji, pos}]
    var isQuestion = false;

    var tilesEl = el('div', { class: 'sentence-tiles', 'aria-live': 'polite' });
    var langBtn = el('button', { class: 'btn lang-btn', type: 'button', title: 'Switch board language / Cambiar idioma' });
    var fringeEl = el('div', { class: 'fringe' });
    var navEl = el('div', { class: 'board-nav' });
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
    root.append(el('div', { class: 'board' }, bar, fringeEl, navEl, gridEl));

    function pages() { return SG.boardPages(lang, profile); }

    /* Every word on this language's board, for spotting activity words that are missing. */
    function boardWords() {
      var set = {};
      var pg = pages();
      Object.keys(pg).forEach(function (id) {
        pg[id].cells.forEach(function (c) { if (c && c.type === 'word') set[SG.norm(c.text)] = true; });
      });
      return set;
    }
    function missingWords() {
      var set = boardWords();
      return fringe.filter(function (f) { return !set[SG.norm(f.text)]; });
    }

    function wordTile(word, emoji, pos, extraClass) {
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

    function navTile(emoji, label, cls, onclick) {
      return el('button', { class: 'tile ' + cls, type: 'button', onclick: onclick },
        el('span', { class: 'tile-emoji', 'aria-hidden': 'true', text: emoji }),
        el('span', { class: 'tile-word', text: label }));
    }

    function goto(id) { pageId = id; renderNav(); renderGrid(); }

    function addWord(word) {
      if (SG.settings.speakEachWord) SG.Speech.speak(word, lang);
      var slot = items.find(function (it) { return it.slot && !it.text; });
      if (slot) slot.text = word;
      else items.push({ text: word });
      renderSentence();
      if (profile.autoReturn && pageId !== 'home' && !/^home-/.test(pageId)) goto('home');
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
      var show = profile.fringe && fringe.length;
      fringeEl.hidden = !show;
      if (show) fringe.forEach(function (f) { fringeEl.append(wordTile(f.text, f.emoji, f.pos, 'fringe-tile')); });
    }

    function renderNav() {
      navEl.innerHTML = '';
      var pg = pages();
      var title = pageId === 'lesson' ? (lang === 'es' ? 'Palabras de la lección' : 'Lesson words') : (pg[pageId] || pg.home).label;
      var missing = profile.fringe ? [] : missingWords();
      // Native append() would print null as text, so filter first.
      navEl.append.apply(navEl, [
        el('button', { class: 'btn small', type: 'button', disabled: pageId === 'home', onclick: function () { goto('home'); } }, '🏠 ' + (lang === 'es' ? 'Inicio' : 'Home')),
        el('strong', { class: 'board-page-title', text: title }),
        missing.length ? el('button', { class: 'btn small lesson-words-btn', type: 'button', onclick: function () { goto('lesson'); } },
          '⭐ ' + (lang === 'es' ? 'Palabras de la lección' : 'Lesson words') + ' (' + missing.length + ')') : null,
        el('span', { class: 'chip board-profile', text: SG.Profile.label(profile) })].filter(Boolean));
    }

    function renderGrid() {
      gridEl.innerHTML = '';
      var cols = profile.cols, cap = profile.rows * profile.cols;
      gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
      gridEl.classList.toggle('dense', cols >= 10);
      gridEl.classList.toggle('xdense', cols >= 13);

      var cells;
      if (pageId === 'lesson') {
        cells = [{ type: 'back' }].concat(missingWords().map(function (f) {
          return { type: 'word', text: f.text, emoji: f.emoji, pos: f.pos };
        }));
      } else {
        var pg = pages();
        if (!pg[pageId]) pageId = 'home';
        cells = pg[pageId].cells;
      }

      for (var i = 0; i < cap; i++) {
        var c = cells[i];
        if (!c) { gridEl.append(el('div', { class: 'tile empty', 'aria-hidden': 'true' })); continue; }
        if (c.type === 'word') gridEl.append(wordTile(c.text, c.emoji || '', c.pos));
        else if (c.type === 'back') gridEl.append(navTile('⬅️', lang === 'es' ? 'Atrás' : 'Back', 'nav-tile', function () { goto('home'); }));
        else if (c.type === 'page') {
          (function (target) {
            gridEl.append(navTile(c.emoji || '📁', c.label, 'folder', function () { goto(target); }));
          })(c.page);
        }
      }
    }

    function renderAll() {
      langBtn.hidden = profile.lang !== 'bi';
      langBtn.textContent = lang === 'en' ? '🇺🇸 EN' : '🇲🇽 ES';
      renderSentence(); renderFringe(); renderNav(); renderGrid();
    }

    var api = {
      onChange: null,
      onLang: null,
      get lang() { return lang; },
      setLang: function (l) {
        if (profile.lang !== 'bi') l = profile.lang;   // single-language boards can't switch
        lang = l; items = []; pageId = 'home'; renderAll();
      },
      setFringe: function (list) { fringe = list || []; renderFringe(); renderNav(); },
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
      reset: function () { items = []; fringe = []; isQuestion = false; pageId = 'home'; renderAll(); },
      /* Re-read the AAC profile (after settings change or a new student). */
      reload: function () {
        profile = SG.Profile.current();
        api.setLang(profile.lang === 'bi' ? (lang || profile.startLang) : profile.lang);
      },
      show: function () { root.hidden = false; },
      hide: function () { root.hidden = true; }
    };

    renderAll();
    if (profile.lang !== 'bi') api.setLang(profile.lang);
    return api;
  };
})(window.SG);
