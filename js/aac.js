/* AAC system profiles: which program the student uses (TouchChat, LAMP, TD Snap,
   Proloquo2Go...), its grid size, language(s), and an editable button layout.
   Profiles are saved per student name so each student's board matches their device.

   NOTE: these are practice layouts in the *style* of each program (grid size,
   navigation, fringe use). They are not the official vocabulary files; use the
   board editor to place words where they are on the student's own device. */
(function (SG) {
  'use strict';
  var el = SG.el;

  /* Grid presets: [label, rows, cols, extra]. "Custom" is always offered too. */
  SG.AAC_PROGRAMS = {
    touchchat: {
      name: 'TouchChat (WordPower)',
      sizes: [['WordPower 20', 4, 5], ['WordPower 25', 5, 5], ['WordPower 42', 6, 7], ['WordPower 48', 6, 8],
              ['WordPower 60', 6, 10], ['WordPower 80', 8, 10], ['WordPower 108', 9, 12]],
      defaults: { size: 'WordPower 60', fringe: true, autoReturn: true, layout: 'pages' },
      tip: 'Category pages return to Home after a word, like TouchChat.'
    },
    lamp: {
      name: 'LAMP Words for Life',
      sizes: [['LAMP 84 – Full', 7, 12, { layout: 'pages' }], ['LAMP 84 – 1-Hit', 7, 12, { layout: 'onepage' }]],
      defaults: { size: 'LAMP 84 – Full', fringe: false, autoReturn: true, layout: 'pages' },
      tip: 'Motor planning: words stay in the same spot, and the activity-word row is off by default so students use their motor plan.'
    },
    tdmotor: {
      name: 'TD Snap Motor Plan',
      sizes: [['Motor Plan 42', 6, 7], ['Motor Plan 66', 6, 11], ['Motor Plan 112', 8, 14]],
      defaults: { size: 'Motor Plan 66', fringe: false, autoReturn: true, layout: 'pages' },
      tip: 'Motor planning: fixed word positions, activity-word row off by default. Check your device’s Grid Size setting and pick Custom if it differs.'
    },
    tdcore: {
      name: 'TD Snap Core First',
      sizes: [['3 × 3', 3, 3], ['4 × 4', 4, 4], ['4 × 5', 4, 5], ['5 × 6', 5, 6], ['5 × 8', 5, 8], ['6 × 8', 6, 8], ['7 × 10', 7, 10]],
      defaults: { size: '5 × 8', fringe: true, autoReturn: true, layout: 'pages' },
      tip: 'Core First has expandable grid sizes. Pick the one on the device or use Custom.'
    },
    p2g: {
      name: 'Proloquo2Go (Crescendo)',
      sizes: [['3 × 3', 3, 3], ['4 × 4', 4, 4], ['4 × 5', 4, 5], ['5 × 6', 5, 6], ['6 × 6', 6, 6], ['6 × 8', 6, 8],
              ['7 × 9', 7, 9], ['8 × 10', 8, 10], ['9 × 11', 9, 11]],
      defaults: { size: '6 × 8', fringe: true, autoReturn: false, layout: 'pages' },
      tip: 'Crescendo comes in many grid sizes. Pick the closest or use Custom with the exact rows and columns.'
    },
    other: {
      name: 'Other / my own board',
      sizes: [],
      defaults: { size: 'custom', rows: 6, cols: 8, fringe: true, autoReturn: true, layout: 'pages' },
      tip: 'Set rows and columns, then edit the buttons to match the student’s board.'
    }
  };

  /* Language levels: decide which questions a student gets. */
  SG.LEVELS = {
    1: { name: 'Level 1 – Emerging', short: 'L1',
         desc: 'Yes/no and this-or-that questions; concrete WHAT/WHO; 1–2 word answers.' },
    2: { name: 'Level 2 – Developing', short: 'L2',
         desc: 'WHO, WHAT, WHERE questions; 3-word answers.' },
    3: { name: 'Level 3 – Expanding', short: 'L3',
         desc: 'WHO, WHAT, WHERE, WHEN; 3–5 word answers; asking questions.' },
    4: { name: 'Level 4 – Advanced', short: 'L4',
         desc: 'WHY and HOW, predicting and inferring; 4–6 word answers.' }
  };
  /* Activities for the current student's level (untagged activities are for everyone). */
  SG.levelFilter = function (acts) {
    var lvl = Number(SG.Profile.current().langLevel) || 0;
    if (!lvl) return acts.slice();
    var mine = acts.filter(function (a) { return !a.level || Number(a.level) === lvl; });
    return mine.length ? mine : acts.slice();
  };

  var CAT_EMOJI = { people: '👪', places: '🏘️', actions: '🏃', things: '🧺', describe: '🎨', time: '🕒' };
  var LANG_LABEL = { en: 'EN', es: 'ES', bi: 'EN + ES' };

  /* ---------- Profiles (one per student) ---------- */
  function key() { return SG.norm(SG.settings.student) || '_default'; }
  function all() { return SG.store.get('sg.profiles', {}); }

  function makeProfile(program, base) {
    var prog = SG.AAC_PROGRAMS[program] || SG.AAC_PROGRAMS.touchchat;
    var d = prog.defaults;
    var size = prog.sizes.find(function (s) { return s[0] === d.size; });
    return Object.assign({
      program: program,
      size: size ? size[0] : 'custom',
      rows: size ? size[1] : d.rows,
      cols: size ? size[2] : d.cols,
      layout: (size && size[3] && size[3].layout) || d.layout,
      fringe: d.fringe,
      autoReturn: d.autoReturn,
      lang: 'bi',
      startLang: 'en',
      langLevel: 0,
      pages: { en: null, es: null }
    }, base || {});
  }

  SG.Profile = {
    current: function () {
      var list = all();
      if (!list._default) {
        // First run: create the shared default, carrying over the old language settings.
        list._default = makeProfile('touchchat', { lang: SG.settings.uiLang || 'bi', startLang: SG.settings.answerLang || 'en' });
        SG.store.set('sg.profiles', list);
      }
      // Students without their own profile start from the shared default.
      var p = JSON.parse(JSON.stringify(list[key()] || list._default));
      p.pages = p.pages || { en: null, es: null };
      return p;
    },
    save: function (p) {
      var list = all();
      list[key()] = p;
      SG.store.set('sg.profiles', list);
      SG.Profile.apply();
    },
    /* Push profile language into the settings the activities read. */
    apply: function () {
      var p = SG.Profile.current();
      SG.settings.uiLang = p.lang;
      SG.settings.answerLang = p.lang === 'bi' ? p.startLang : p.lang;
      SG.saveSettings();
      if (SG.Profile.onChange) SG.Profile.onChange(p);
    },
    label: function (p) {
      p = p || SG.Profile.current();
      var prog = SG.AAC_PROGRAMS[p.program] || SG.AAC_PROGRAMS.other;
      var size = p.size === 'custom' ? p.rows + '×' + p.cols : p.size.replace(/^(WordPower|Motor Plan|LAMP) ?/, '');
      return prog.name.replace(/ \(.*\)/, '') + ' ' + size + ' · ' + LANG_LABEL[p.lang];
    },
    make: makeProfile,
    onChange: null
  };

  /* ---------- Layout ---------- */
  function wordCell(it) { return { type: 'word', text: it[0], emoji: it[1], pos: it[2] }; }

  /* Build pages automatically from the vocabulary for a grid size.
     Pages that don't fit continue on a "More" page. */
  SG.autoPages = function (lang, rows, cols, layout) {
    var cap = Math.max(4, rows * cols);
    var cats = SG.VOCAB[lang];
    var pages = {};
    var more = lang === 'es' ? 'Más' : 'More';

    function paginate(id, label, cells, withBack) {
      var i = 0, n = 1, curId = id;
      for (;;) {
        var hasBack = withBack || n > 1;
        var slots = cap - (hasBack ? 1 : 0);
        var rest = cells.length - i;
        var needMore = rest > slots;
        var take = needMore ? slots - 1 : rest;
        var page = hasBack ? [{ type: 'back' }] : [];
        page = page.concat(cells.slice(i, i + take));
        i += take;
        var nextId = id + '-' + (n + 1);
        if (needMore) {
          while (page.length < cap - 1) page.push(null);
          page.push({ type: 'page', page: nextId, label: more, emoji: '➡️' });
        }
        pages[curId] = { label: n > 1 ? label + ' ' + n : label, cells: page };
        if (!needMore) break;
        curId = nextId;
        n++;
      }
    }

    var homeLabel = lang === 'es' ? 'Inicio' : 'Home';
    if (layout === 'onepage') {
      var seen = {}, words = [];
      cats.forEach(function (c) {
        c.items.forEach(function (it) {
          var k = SG.norm(it[0]);
          if (!seen[k]) { seen[k] = true; words.push(wordCell(it)); }
        });
      });
      paginate('home', homeLabel, words, false);
    } else {
      var nav = cats.filter(function (c) { return c.id !== 'core'; }).map(function (c) {
        return { type: 'page', page: c.id, label: c.label, emoji: CAT_EMOJI[c.id] || '📁' };
      });
      var core = cats.find(function (c) { return c.id === 'core'; }).items.map(wordCell);
      paginate('home', homeLabel, nav.concat(core), false);
      cats.forEach(function (c) {
        if (c.id !== 'core') paginate(c.id, c.label, c.items.map(wordCell), true);
      });
    }
    return pages;
  };

  /* The pages the board should show for a language (custom edits or automatic). */
  SG.boardPages = function (lang, p) {
    p = p || SG.Profile.current();
    return (p.pages && p.pages[lang]) || SG.autoPages(lang, p.rows, p.cols, p.layout);
  };

  /* ---------- Settings UI: AAC setup + board editor ---------- */
  var ed = { lang: null, page: 'home', cell: null, swapFrom: null };

  function materialize(p, lang) {
    if (!p.pages[lang]) p.pages[lang] = JSON.parse(JSON.stringify(SG.autoPages(lang, p.rows, p.cols, p.layout)));
    return p.pages[lang];
  }

  function setupCard(root, rerender) {
    var p = SG.Profile.current();
    var prog = SG.AAC_PROGRAMS[p.program] || SG.AAC_PROGRAMS.other;
    var who = SG.settings.student ? 'for ' + SG.settings.student : 'for everyone (type a student name at the top to make one per student)';

    function update(changes, resetPages) {
      var np = Object.assign({}, p, changes);
      if (resetPages) np.pages = { en: null, es: null };
      SG.Profile.save(np);
      rerender();
    }
    function hasCustom() { return !!(p.pages && (p.pages.en || p.pages.es)); }
    function confirmReset() {
      return !hasCustom() || confirm('This student has a customized board. Reset it to the automatic layout for the new size?\n\nOK = reset, Cancel = keep my buttons (they will re-flow into the new grid).');
    }

    var programSel = el('select', { onchange: function () {
      var ok = confirmReset();
      var np = makeProfile(this.value, { lang: p.lang, startLang: p.startLang });
      if (!ok) np.pages = p.pages;
      SG.Profile.save(np);
      rerender();
    } }, Object.keys(SG.AAC_PROGRAMS).map(function (k) {
      return el('option', { value: k, selected: p.program === k }, SG.AAC_PROGRAMS[k].name);
    }));

    var sizeSel = el('select', { onchange: function () {
      var v = this.value;
      if (v === 'custom') { update({ size: 'custom' }); return; }
      var s = prog.sizes.find(function (x) { return x[0] === v; });
      var ok = confirmReset();
      update({ size: s[0], rows: s[1], cols: s[2], layout: (s[3] && s[3].layout) || p.layout }, ok);
    } }, prog.sizes.map(function (s) {
      return el('option', { value: s[0], selected: p.size === s[0] }, s[0] + ' (' + s[1] + ' rows × ' + s[2] + ' columns)');
    }), el('option', { value: 'custom', selected: p.size === 'custom' }, 'Custom rows × columns'));

    function num(keyName) {
      return el('input', { type: 'number', min: 2, max: 16, value: p[keyName], style: { width: '5em' }, onchange: function () {
        var n = Math.max(2, Math.min(16, Number(this.value) || p[keyName]));
        var ch = { size: 'custom' }; ch[keyName] = n;
        update(ch, confirmReset());
      } });
    }

    var langSel = el('select', { onchange: function () { update({ lang: this.value }); } },
      el('option', { value: 'en', selected: p.lang === 'en' }, 'English'),
      el('option', { value: 'es', selected: p.lang === 'es' }, 'Español (Spanish)'),
      el('option', { value: 'bi', selected: p.lang === 'bi' }, 'Both – bilingual (switch button on the board)'));

    var startSel = p.lang === 'bi' ? el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Board starts in' }),
      el('select', { onchange: function () { update({ startLang: this.value }); } },
        el('option', { value: 'en', selected: p.startLang === 'en' }, 'English'),
        el('option', { value: 'es', selected: p.startLang === 'es' }, 'Español'))) : null;

    return el('div', { class: 'card settings aac-setup' },
      el('h2', {}, '🗂️ Student setup ', el('span', { class: 'muted', text: who })),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'AAC program' }), programSel),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Grid size' }), sizeSel),
      p.size === 'custom' ? el('div', { class: 'row wrap' }, el('label', {}, 'Rows ', num('rows')), el('label', {}, 'Columns ', num('cols'))) : null,
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Layout' }),
        el('select', { onchange: function () { update({ layout: this.value }, confirmReset()); } },
          el('option', { value: 'pages', selected: p.layout === 'pages' }, 'Core words + category folders (2-hit)'),
          el('option', { value: 'onepage', selected: p.layout === 'onepage' }, 'All words on one page (1-hit)'))),
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Language' }), langSel),
      startSel,
      el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Language level (which questions this student gets)' }),
        el('select', { onchange: function () { update({ langLevel: Number(this.value) }); } },
          el('option', { value: 0, selected: !p.langLevel }, 'All questions (no level filter)'),
          Object.keys(SG.LEVELS).map(function (k) {
            return el('option', { value: k, selected: Number(p.langLevel) === Number(k) }, SG.LEVELS[k].name + ': ' + SG.LEVELS[k].desc);
          }))),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: p.fringe, onchange: function () { update({ fringe: this.checked }); } }),
        ' Show an activity-word row above the grid (turn off to practice motor plans)'),
      el('label', { class: 'check' }, el('input', { type: 'checkbox', checked: p.autoReturn, onchange: function () { update({ autoReturn: this.checked }); } }),
        ' Go back to Home after choosing a word in a folder'),
      el('p', { class: 'muted', text: '💡 ' + prog.tip }),
      el('p', { class: 'muted small-note', text: 'These are practice layouts in the style of each program, not the official vocabulary files. Use “Customize the board” below to put words where they are on the student’s device.' }));
  }

  function editorCard(root, rerender) {
    var p = SG.Profile.current();
    var langs = p.lang === 'bi' ? ['en', 'es'] : [p.lang];
    if (langs.indexOf(ed.lang) === -1) ed.lang = langs[0];
    var lang = ed.lang;
    var pages = SG.boardPages(lang, p);
    if (!pages[ed.page]) ed.page = 'home';
    var page = pages[ed.page];
    var cap = p.rows * p.cols;
    var custom = !!p.pages[lang];

    function commit(mutator) {
      var np = SG.Profile.current();
      var pg = materialize(np, lang);
      mutator(pg);
      SG.Profile.save(np);
      rerender();
    }

    var grid = el('div', { class: 'board-grid editor-grid' + (p.cols >= 10 ? ' dense' : ''),
      style: { gridTemplateColumns: 'repeat(' + p.cols + ', minmax(0, 1fr))' } });
    for (var i = 0; i < cap; i++) {
      (function (idx) {
        var c = page.cells[idx] || null;
        var cls = 'tile edit-cell' + (ed.cell === idx ? ' selected' : '') + (ed.swapFrom === idx ? ' swapping' : '');
        var content;
        if (!c) { cls += ' empty'; content = [el('span', { class: 'tile-word muted', text: '+' })]; }
        else if (c.type === 'back') { cls += ' nav-tile'; content = [el('span', { class: 'tile-emoji', text: '⬅️' }), el('span', { class: 'tile-word', text: lang === 'es' ? 'Atrás' : 'Back' })]; }
        else if (c.type === 'page') { cls += ' folder'; content = [el('span', { class: 'tile-emoji', text: c.emoji || '📁' }), el('span', { class: 'tile-word', text: c.label })]; }
        else { cls += ' pos-' + (c.pos || 'small'); content = [c.emoji ? el('span', { class: 'tile-emoji', text: c.emoji }) : null, el('span', { class: 'tile-word', text: c.text })]; }
        grid.append(el('button', { class: cls, type: 'button', title: 'Row ' + (Math.floor(idx / p.cols) + 1) + ', column ' + (idx % p.cols + 1),
          onclick: function () {
            if (ed.swapFrom != null && ed.swapFrom !== idx) {
              var from = ed.swapFrom;
              ed.swapFrom = null;
              ed.cell = idx;
              commit(function (pg) {
                var cells = pg[ed.page].cells;
                while (cells.length < cap) cells.push(null);
                var t = cells[from]; cells[from] = cells[idx]; cells[idx] = t;
              });
              return;
            }
            ed.cell = ed.cell === idx ? null : idx;
            rerender();
          } }, content));
      })(i);
    }

    var pageSel = el('select', { onchange: function () { ed.page = this.value; ed.cell = null; ed.swapFrom = null; rerender(); } },
      Object.keys(pages).map(function (id) { return el('option', { value: id, selected: ed.page === id }, pages[id].label); }));

    var card = el('div', { class: 'card' },
      el('h2', {}, '✏️ Customize the board'),
      el('p', { class: 'muted', text: 'Tap a button to change it. Use “Swap” to move a word to the spot where it is on the student’s device. Changes save automatically for this student.' }),
      el('div', { class: 'row wrap' },
        langs.length > 1 ? el('div', { class: 'row' }, langs.map(function (l) {
          return el('button', { class: 'btn small' + (l === lang ? ' primary' : ''), type: 'button', onclick: function () {
            ed.lang = l; ed.page = 'home'; ed.cell = null; rerender();
          } }, l === 'en' ? '🇺🇸 English' : '🇲🇽 Español');
        })) : null,
        el('label', {}, 'Page ', pageSel),
        el('button', { class: 'btn small', type: 'button', onclick: function () {
          var name = prompt('Name of the new page (for example: Food, Animals, Comida):');
          if (!name) return;
          var id = 'custom-' + SG.uid('pg');
          commit(function (pg) { pg[id] = { label: name, cells: [{ type: 'back' }] }; });
          ed.page = id;
          rerender();
        } }, '+ New page'),
        custom ? el('button', { class: 'btn small danger', type: 'button', onclick: function () {
          if (!confirm('Reset the ' + (lang === 'es' ? 'Spanish' : 'English') + ' board to the automatic layout?')) return;
          var np = SG.Profile.current();
          np.pages[lang] = null;
          ed.cell = null;
          SG.Profile.save(np);
          rerender();
        } }, 'Reset to automatic') : el('span', { class: 'muted', text: '(automatic layout)' })),
      grid);

    if (ed.cell != null) card.append(cellEditor(p, lang, pages, page.cells[ed.cell] || null, commit, rerender));
    card.append(SG.BoardImport.render({
      profile: p, lang: lang, pageLabel: page.label,
      onPages: function (newPages) {
        var np = SG.Profile.current();
        np.pages[lang] = newPages;
        ed.page = 'home'; ed.cell = null; ed.swapFrom = null;
        SG.Profile.save(np);
        rerender();
      },
      onCells: function (cells) {
        ed.cell = null;
        commit(function (pg) { pg[ed.page].cells = cells; });
      }
    }));
    return card;
  }

  function cellEditor(p, lang, pages, cell, commit, rerender) {
    var idx = ed.cell;
    var draft = cell ? JSON.parse(JSON.stringify(cell)) : { type: 'word', text: '', emoji: '', pos: 'noun' };
    var box = el('div', { class: 'cell-editor' });

    function draw() {
      box.innerHTML = '';
      box.append(el('h3', {}, 'Button at row ' + (Math.floor(idx / p.cols) + 1) + ', column ' + (idx % p.cols + 1)));
      box.append(el('label', { class: 'field' }, el('span', { class: 'field-label', text: 'Type' }),
        el('select', { onchange: function () { draft.type = this.value; draw(); } },
          [['word', 'Word'], ['page', 'Folder (opens a page)'], ['back', 'Back / Home'], ['empty', 'Empty']].map(function (o) {
            return el('option', { value: o[0], selected: draft.type === o[0] }, o[1]);
          }))));
      if (draft.type === 'word') {
        box.append(el('div', { class: 'row wrap' },
          el('label', {}, 'Word ', el('input', { type: 'text', value: draft.text || '', oninput: function () { draft.text = this.value; } })),
          el('label', {}, 'Picture ', el('input', { type: 'text', class: 'emoji-input', value: draft.emoji || '', placeholder: '🙂', oninput: function () { draft.emoji = this.value; } })),
          el('label', {}, 'Color ', el('select', { onchange: function () { draft.pos = this.value; } },
            [['pronoun', 'Yellow – people/pronouns'], ['verb', 'Green – actions'], ['noun', 'Orange – things'], ['describe', 'Blue – describing'],
             ['question', 'Purple – questions'], ['social', 'Pink – social'], ['negate', 'Red – not/no'], ['small', 'White – little words'], ['time', 'Brown – time']]
              .map(function (o) { return el('option', { value: o[0], selected: draft.pos === o[0] }, o[1]); })))));
      } else if (draft.type === 'page') {
        box.append(el('div', { class: 'row wrap' },
          el('label', {}, 'Opens ', el('select', { onchange: function () {
            draft.page = this.value;
            if (pages[draft.page] && !draft.label) draft.label = pages[draft.page].label;
          } }, el('option', { value: '' }, '— choose a page —'),
            Object.keys(pages).filter(function (id) { return id !== ed.page; }).map(function (id) {
              return el('option', { value: id, selected: draft.page === id }, pages[id].label);
            }))),
          el('label', {}, 'Label ', el('input', { type: 'text', value: draft.label || '', oninput: function () { draft.label = this.value; } })),
          el('label', {}, 'Picture ', el('input', { type: 'text', class: 'emoji-input', value: draft.emoji || '', placeholder: '📁', oninput: function () { draft.emoji = this.value; } }))));
      }
      box.append(el('div', { class: 'row wrap' },
        el('button', { class: 'btn primary', type: 'button', onclick: function () {
          var value;
          if (draft.type === 'empty') value = null;
          else if (draft.type === 'back') value = { type: 'back' };
          else if (draft.type === 'page') {
            if (!draft.page) { SG.toast('Choose which page the folder opens.'); return; }
            value = { type: 'page', page: draft.page, label: draft.label || pages[draft.page].label, emoji: draft.emoji || '📁' };
          } else {
            if (!String(draft.text || '').trim()) { SG.toast('Type the word.'); return; }
            value = { type: 'word', text: draft.text.trim(), emoji: draft.emoji || '', pos: draft.pos || 'noun' };
          }
          commit(function (pg) {
            var cells = pg[ed.page].cells;
            while (cells.length <= idx) cells.push(null);
            cells[idx] = value;
          });
        } }, '✔ Save button'),
        el('button', { class: 'btn', type: 'button', onclick: function () { ed.swapFrom = idx; SG.toast('Now tap the spot to swap with.'); rerender(); } }, '↔ Swap with…'),
        el('button', { class: 'btn', type: 'button', onclick: function () { ed.cell = null; ed.swapFrom = null; rerender(); } }, 'Close')));
    }
    draw();
    return box;
  }

  SG.AACSetup = {
    render: function (root) {
      root.innerHTML = '';
      var rerender = function () { SG.AACSetup.render(root); };
      root.append(setupCard(root, rerender), editorCard(root, rerender));
    }
  };
})(window.SG);
