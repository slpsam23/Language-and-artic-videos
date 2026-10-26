/* Session data (for progress monitoring / IEP data) and the predictable chart. */
(function (SG) {
  'use strict';
  var el = SG.el;
  var LOG_KEY = 'sg.log';

  SG.Log = {
    all: function () { return SG.store.get(LOG_KEY, []); },
    /* entry: {type, skill, lang, lesson, prompt, response, result: 'correct'|'cued'|'incorrect', attempts} */
    add: function (entry) {
      var list = SG.Log.all();
      list.push(Object.assign({ ts: new Date().toISOString(), student: SG.settings.student || '' }, entry));
      if (list.length > 5000) list = list.slice(-5000);
      SG.store.set(LOG_KEY, list);
    },
    clear: function () { SG.store.set(LOG_KEY, []); },
    removeLastManual: function () {
      var list = SG.Log.all();
      for (var i = list.length - 1; i >= 0; i--) { if (list[i].type === 'manual') { list.splice(i, 1); break; } }
      SG.store.set(LOG_KEY, list);
    },
    toCSV: function (list) {
      var cols = ['ts', 'student', 'lesson', 'skill', 'lang', 'prompt', 'response', 'result', 'cues', 'attempts'];
      var esc = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      return [cols.join(',')].concat(list.map(function (r) {
        return cols.map(function (c) { return esc(r[c]); }).join(',');
      })).join('\n');
    }
  };

  /* Predictable chart writing: everyone completes the same sentence starter
     ("The ___ is kicking."). Each correct answer is written on that starter's
     chart with the student's name, so a group builds the chart together and
     rereads it. Saved per lesson on this device. */
  function chartTitle(frame, lang) {
    if (frame === '?') return lang === 'es' ? 'Nuestras preguntas' : 'Our questions';
    if (!frame) return lang === 'es' ? 'Otras oraciones' : 'Other sentences';
    return SG.formatSentence(frame.split(/\s+/).map(function (t) { return /^_+$/.test(t) ? '______' : t; }), lang, false);
  }

  SG.Chart = {
    get: function (lessonId) { return SG.store.get('sg.chart.' + lessonId, []); },
    add: function (lessonId, text, lang, frame) {
      var list = SG.Chart.get(lessonId);
      list.push({ text: text, lang: lang, frame: frame || '', student: SG.settings.student || '', date: new Date().toLocaleDateString() });
      SG.store.set('sg.chart.' + lessonId, list);
      var same = list.filter(function (r) { return r.frame === (frame || '') && r.lang === lang; }).length;
      SG.toast(SG.L('⭐ Added to our chart (' + same + ' on this chart)', '⭐ Se agregó a nuestra tabla (' + same + ')'));
      if (SG.Chart.onChange) SG.Chart.onChange(lessonId);
    },
    clear: function (lessonId) {
      SG.store.remove('sg.chart.' + lessonId);
      if (SG.Chart.onChange) SG.Chart.onChange(lessonId);
    },
    /* Group entries into charts by sentence starter and language. */
    groups: function (lessonId) {
      var groups = [], byKey = {};
      SG.Chart.get(lessonId).forEach(function (r) {
        var key = (r.frame || '') + '|' + r.lang;
        if (!byKey[key]) { byKey[key] = { frame: r.frame || '', lang: r.lang, rows: [] }; groups.push(byKey[key]); }
        byKey[key].rows.push(r);
      });
      return groups;
    },
    render: function (lessonId) {
      var groups = SG.Chart.groups(lessonId);
      if (!groups.length) {
        return el('p', { class: 'muted', text: 'No sentences yet. When a student answers a question correctly, their sentence is written here with their name. / Aún no hay oraciones.' });
      }
      return el('div', { class: 'charts' }, groups.map(function (g) {
        var lines = g.rows.map(function (r) { return r.text; });
        return el('div', { class: 'chart-paper', lang: g.lang },
          el('div', { class: 'row between' },
            el('h3', { class: 'chart-title', text: chartTitle(g.frame, g.lang) }),
            el('button', { class: 'btn small', type: 'button', title: 'Read the chart aloud', onclick: function () {
              SG.Speech.stop();
              g.rows.forEach(function (r) { SG.Speech.speak(r.text, g.lang, { queue: true }); });
            } }, '🔊 ' + (g.lang === 'es' ? 'Leer' : 'Read'))),
          el('ol', { class: 'chart-list' }, g.rows.map(function (r) {
            return el('li', {}, el('span', { class: 'chart-text', text: r.text }),
              r.student ? el('span', { class: 'chart-name', text: ' (' + r.student + ')' }) : null);
          })));
      }));
    },
    print: function (lesson) {
      var area = SG.$('#print-area');
      area.innerHTML = '';
      area.append(el('h1', {}, SG.biString(lesson.title)),
        SG.safeImage(lesson.image) ? el('img', { class: 'print-img', src: SG.safeImage(lesson.image), alt: '' }) : el('p', { class: 'print-scene', text: lesson.scene || '' }),
        SG.Chart.render(lesson.id));
      window.print();
    },
    onChange: null
  };

  /* ---------- Data tab ---------- */
  SG.DataView = {
    render: function (root) {
      root.innerHTML = '';
      var all = SG.Log.all();
      var students = Array.from(new Set(all.map(function (r) { return r.student || '(no name)'; }))).sort();
      var filter = SG.DataView.filter || '';
      var rows = all.filter(function (r) { return !filter || (r.student || '(no name)') === filter; });

      var sel = el('select', { onchange: function () { SG.DataView.filter = this.value; SG.DataView.render(root); } },
        el('option', { value: '' }, 'All students'),
        students.map(function (s) { return el('option', { value: s, selected: s === filter }, s); }));

      root.append(el('div', { class: 'card row wrap' },
        el('label', {}, 'Student ', sel),
        el('button', { class: 'btn primary', type: 'button', onclick: function () {
          SG.download('speech-game-data-' + new Date().toISOString().slice(0, 10) + '.csv', SG.Log.toCSV(rows), 'text/csv');
        } }, '⬇️ Export CSV'),
        el('button', { class: 'btn danger', type: 'button', onclick: function () {
          if (confirm('Delete ALL saved session data on this device?')) { SG.Log.clear(); SG.DataView.render(root); }
        } }, 'Clear data')));

      if (!rows.length) {
        root.append(el('p', { class: 'card muted', text: 'No data yet. Play a lesson or an articulation drill to collect data.' }));
        return;
      }

      /* Summary by skill */
      var bySkill = {};
      rows.forEach(function (r) {
        var k = r.skill || r.type;
        bySkill[k] = bySkill[k] || { correct: 0, cued: 0, incorrect: 0 };
        bySkill[k][r.result] = (bySkill[k][r.result] || 0) + 1;
      });
      var pct = function (n, d) { return d ? Math.round((n / d) * 100) + '%' : '–'; };
      root.append(el('div', { class: 'card' },
        el('h2', {}, 'Summary by skill'),
        el('div', { class: 'table-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, ['Skill', 'Trials', 'Independent', 'With cues / approx.', 'Incorrect'].map(function (h) { return el('th', {}, h); }))),
          el('tbody', {}, Object.keys(bySkill).sort().map(function (k) {
            var s = bySkill[k], n = s.correct + s.cued + s.incorrect;
            return el('tr', {}, el('td', {}, k), el('td', {}, n), el('td', {}, pct(s.correct, n)),
              el('td', {}, pct(s.cued, n)), el('td', {}, pct(s.incorrect, n)));
          }))))));

      /* Recent trials */
      var recent = rows.slice(-100).reverse();
      root.append(el('div', { class: 'card' },
        el('h2', {}, 'Recent trials'),
        el('div', { class: 'table-wrap' }, el('table', {},
          el('thead', {}, el('tr', {}, ['Date', 'Student', 'Lesson', 'Skill', 'Lang', 'Prompt', 'Response', 'Result', 'Cues'].map(function (h) { return el('th', {}, h); }))),
          el('tbody', {}, recent.map(function (r) {
            return el('tr', { class: 'result-' + r.result },
              el('td', {}, new Date(r.ts).toLocaleString()), el('td', {}, r.student), el('td', {}, r.lesson),
              el('td', {}, r.skill), el('td', {}, r.lang), el('td', {}, r.prompt), el('td', {}, r.response), el('td', {}, r.result), el('td', {}, r.cues || ''));
          }))))));
    }
  };
})(window.SG);
