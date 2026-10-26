/* Where each sound is in a word (beginning / middle / end), syllable counts,
   and syllable drills by position and length.
   Uses spelling rules for English and Latin American Spanish, so a few English
   words may be approximate; the curated word lists keep that rare. */
(function (SG) {
  'use strict';

  var CLUSTERS = {
    en: ['spl', 'spr', 'str', 'scr', 'thr', 'shr', 'sk', 'sc', 'sl', 'sm', 'sn', 'sp', 'st', 'sw',
         'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'tw', 'kl', 'kr'],
    es: ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'kl', 'kr']
  };
  var FINAL_CLUSTERS = ['st', 'nt', 'lk', 'nd', 'sk', 'mp', 'nk', 'ft', 'lt', 'ld', 'ks', 'sp', 'pt', 'kt'];
  // Placeholders for sounds spelled with two letters.
  var BACK = { S: 'sh', C: 'ch', T: 'th', G: 'ng', R: 'rr', N: 'ñ', K: 'k', Y: 'y', Q: 'g' };

  function prep(word, lang) {
    var w = String(word || '').toLowerCase().replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
      .replace(/[óò]/g, 'o').replace(/[úùü]/g, 'u');
    if (lang === 'es') {
      w = w.replace(/ch/g, 'C').replace(/h/g, '').replace(/rr/g, 'R').replace(/ll/g, 'Y').replace(/ñ/g, 'N')
        .replace(/qu(?=[ei])/g, 'K').replace(/gu(?=[ei])/g, 'Q').replace(/g(?=[ei])/g, 'j')
        .replace(/c(?=[ei])/g, 's').replace(/c/g, 'K').replace(/z/g, 's').replace(/v/g, 'b').replace(/x/g, 'Ks');
    } else {
      w = w.replace(/^gh/, 'g').replace(/^kn/, 'n').replace(/^wr/, 'r').replace(/ck/g, 'K').replace(/ph/g, 'f')
        .replace(/sh/g, 'S').replace(/tch/g, 'C').replace(/ch/g, 'C').replace(/th/g, 'T').replace(/wh/g, 'w')
        .replace(/qu/g, 'Kw').replace(/ng(?![aeiou])/g, 'G').replace(/c(?=[eiy])/g, 's').replace(/c/g, 'K')
        .replace(/x/g, 'Ks').replace(/k/g, 'K').replace(/([bdfglmnprstz])\1/g, '$1');
      if (/[aeiouy][^aeiouy]+e$/.test(w) && !/le$/.test(w)) w = w.slice(0, -1);   // silent e (snake, rose)
    }
    return w;
  }

  function isVowel(w, i, lang) {
    var ch = w[i];
    if ('aeiou'.indexOf(ch) !== -1) return true;
    if (ch === 'y' || (lang === 'en' && ch === 'w')) {
      // y / w are consonants before a vowel (yes, ya, away), vowels otherwise (baby, muy, cow).
      var next = w[i + 1];
      return !(next && 'aeiou'.indexOf(next) !== -1);
    }
    return false;
  }

  function soundId(tok, lang, ctx) {
    var s = BACK[tok] || tok;
    if (s === 'rr') return 'r-trill';
    if (s === 'r') {
      if (lang === 'es') return ctx.wordStart || ctx.afterNLS ? 'r-trill' : 'r-tap';
      return ctx.coda ? 'r-vocalic' : 'r';
    }
    return s;
  }

  /* [{id, pos}] for every consonant sound/cluster in the word. pos: initial | medial | final */
  SG.articTargets = function (word, lang) {
    var w = prep(word, lang);
    var runs = [], cur = null;
    for (var i = 0; i < w.length; i++) {
      var v = isVowel(w, i, lang);
      if (!cur || cur.v !== v) { cur = { v: v, s: '' }; runs.push(cur); }
      cur.s += w[i];
    }
    var out = [];
    function add(id, pos) { if (id && !/^[aeiou]+$/.test(id)) out.push({ id: id, pos: pos }); }
    function lc(s) { return s.split('').map(function (t) { return BACK[t] || t; }).join(''); }

    runs.forEach(function (run, ri) {
      if (run.v) return;
      var toks = run.s.split('');
      var first = ri === 0, last = ri === runs.length - 1;
      var plain = lc(run.s);
      if (first && last) { toks.forEach(function (t) { add(soundId(t, lang, { wordStart: true }), 'initial'); }); return; }
      if (first) {
        if (toks.length > 1 && CLUSTERS[lang].indexOf(plain) !== -1) add(plain === 'sc' ? 'sk' : plain, 'initial');
        else toks.forEach(function (t, k) { add(soundId(t, lang, { wordStart: k === 0, afterNLS: k > 0 && /[nls]/.test(toks[k - 1]) }), 'initial'); });
        return;
      }
      if (last) {
        if (lang === 'en' && toks.length > 1 && FINAL_CLUSTERS.indexOf(plain) !== -1) add('-' + plain, 'final');
        else toks.forEach(function (t) { add(soundId(t, lang, { coda: true }), 'final'); });
        return;
      }
      // Middle of the word: split into the end of one syllable and the start of the next.
      var split = toks.length - 1;
      for (var k = 0; k < toks.length - 1; k++) {
        if (CLUSTERS[lang].indexOf(lc(toks.slice(k).join(''))) !== -1) { split = k; break; }
      }
      var coda = toks.slice(0, split), onset = toks.slice(split);
      coda.forEach(function (t) { add(soundId(t, lang, { coda: true }), 'medial'); });
      var on = lc(onset.join(''));
      if (onset.length > 1) add(on, 'medial');
      else add(soundId(onset[0], lang, { afterNLS: coda.length > 0 && /[nls]/.test(coda[coda.length - 1]) }), 'medial');
    });
    return out;
  };

  /* Target sounds in a word, for the sound filter (replaces the simpler version). */
  SG.articSounds = function (item, type, lang) {
    var ids = SG.articTargets(item.word, lang).map(function (t) { return t.id; });
    if (item.target) ids.push(item.target);
    return ids.filter(function (x, i, a) { return a.indexOf(x) === i; });
  };

  SG.articHasTarget = function (item, lang, sound, pos) {
    if (!sound) return true;
    return SG.articTargets(item.word, lang).some(function (t) { return t.id === sound && (!pos || t.pos === pos); }) ||
      (!pos && item.target === sound);
  };

  /* Syllables = parts that contain a vowel (parts are sounds for CVC/VCV, syllables otherwise). */
  SG.syllableCount = function (item) {
    var n = (item.parts || [item.word]).filter(function (p) { return /[aeiouáéíóúy]/i.test(p); }).length;
    return Math.max(1, n);
  };

  /* Highlight the part holding the target, at the chosen position. */
  var SPELL = {
    es: { k: ['qu', 'c', 'k'], s: ['s', 'z', 'c'], y: ['ll', 'y'], j: ['j', 'g'], b: ['b', 'v'], g: ['gu', 'g'], 'r-tap': ['r'], 'r-trill': ['rr', 'r'] },
    en: { k: ['ck', 'c', 'k', 'q'], f: ['ph', 'f'], s: ['s', 'c'], w: ['wh', 'w'], j: ['j', 'g', 'dge'], ch: ['tch', 'ch'], 'r-vocalic': ['r'], r: ['r'] }
  };
  SG.articHighlight = function (item, type, sound, lang, pos) {
    var parts = item.parts || [];
    var t = sound || item.target;
    if (!t || !parts.length) return [];
    var spellings = (SPELL[lang || 'en'] || {})[t] || [t.replace(/^-/, '')];
    var idx = parts.map(function (p, i) { return i; });
    if (pos === 'initial') idx = [0];
    else if (pos === 'final') idx = [parts.length - 1];
    else if (pos === 'medial' && parts.length > 2) idx = idx.slice(1, -1).concat(type === 'cvcv' || parts.length > 3 ? [parts.length - 1] : []);
    else if (pos === 'medial') idx = [parts.length - 1];
    return idx.filter(function (i) {
      var p = String(parts[i]).toLowerCase();
      return spellings.some(function (s) { return p.indexOf(s) !== -1; });
    });
  };

  /* ---------- Syllable drills ---------- */
  var ALLOWED = {
    es: { 'r-tap': ['medial', 'final'], 'r-trill': ['initial', 'medial'], 'ñ': ['initial', 'medial'], ch: ['initial', 'medial'], y: ['initial', 'medial'] },
    en: { ng: ['medial', 'final'], h: ['initial', 'medial'], w: ['initial', 'medial'], y: ['initial', 'medial'], 'r-vocalic': ['final'] }
  };
  SG.drillPositionOk = function (soundId, lang, pos) {
    var a = (ALLOWED[lang] || {})[soundId];
    return !a || a.indexOf(pos) !== -1;
  };
  SG.drillPositions = function (soundId, lang) {
    return ['initial', 'medial', 'final'].filter(function (p) { return SG.drillPositionOk(soundId, lang, p); });
  };

  function esCons(id, v, pos) {
    if (id === 'k') return /[ei]/.test(v) ? 'qu' : 'c';
    if (id === 'g') return /[ei]/.test(v) ? 'gu' : 'g';
    if (id === 'r-trill') return pos === 'initial' ? 'r' : 'rr';
    if (id === 'r-tap') return 'r';
    return id;
  }
  var EN_FINAL = { j: 'dge', k: 'ck', ch: 'tch' };

  /* One syllable (or VCV) with the sound at a position. */
  function syllable(id, lang, pos, vi) {
    if (lang === 'es') {
      var V = ['a', 'e', 'i', 'o', 'u'], v = V[vi % 5];
      if (pos === 'initial') return esCons(id, v, pos) + v;
      if (pos === 'medial') return v + esCons(id, v, pos) + v;
      return v + (id === 'k' ? 'c' : id === 'g' ? 'g' : id === 'r-tap' ? 'r' : id);
    }
    if (id === 'r-vocalic') return ['ar', 'er', 'or', 'ear', 'air'][vi % 5];
    var cons = id === 'r' ? 'r' : id;
    var v2 = ['ee', 'oo', 'o', 'ay', 'a'][vi % 5];
    if (pos === 'initial') return cons + v2;
    if (pos === 'medial') return v2 + cons + v2;
    return v2 + (EN_FINAL[id] || cons);
  }

  /* Drill items: length 1–3 syllables, e.g. sa · se · si. */
  SG.syllableDrill = function (id, lang, pos, len) {
    pos = SG.drillPositionOk(id, lang, pos) ? pos : SG.drillPositions(id, lang)[0];
    len = len || 1;
    var items = [];
    for (var start = 0; start < 5; start++) {
      var seq = [];
      for (var k = 0; k < len; k++) seq.push(syllable(id, lang, pos, start + k));
      items.push(seq);
    }
    return { pos: pos, items: items };
  };
})(window.SG);
