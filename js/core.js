/* Core helpers shared by every module. Everything hangs off the global SG
   namespace so the app works from plain <script> tags (no build step). */
window.SG = window.SG || {};
(function (SG) {
  'use strict';

  /* Build DOM nodes safely: el('button', {class: 'x', onclick: fn}, 'Label') */
  SG.el = function (tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'value') node.value = v;
        else if (k === 'checked' || k === 'selected' || k === 'hidden' || k === 'disabled') node[k] = !!v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
        else node.setAttribute(k, v === true ? '' : v);
      });
    }
    var kids = Array.prototype.slice.call(arguments, 2);
    (function add(list) {
      list.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) return add(c);
        node.append(c instanceof Node ? c : String(c));
      });
    })(kids);
    return node;
  };

  /* Bump this (and version.json, and the ?v= in index.html) with every update. */
  SG.VERSION = '2026.10.26-1';

  SG.$ = function (sel, root) { return (root || document).querySelector(sel); };

  /* localStorage wrapper that never throws (private mode, blocked storage). */
  SG.store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
    remove: function (key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
  };

  /* Text normalising so "¿Dónde?" matches "donde". */
  SG.norm = function (s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[¿?¡!.,;:"()]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  };
  SG.words = function (s) { return SG.norm(s).split(' ').filter(Boolean); };
  SG.hasPhrase = function (sentence, phrase) {
    var p = SG.norm(phrase);
    if (!p) return false;
    return (' ' + SG.norm(sentence) + ' ').indexOf(' ' + p + ' ') !== -1;
  };

  SG.formatSentence = function (words, lang, isQuestion) {
    var s = words.join(' ').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    s = s.replace(/^[¿¡]+/, '').replace(/[.?!]+$/, '');
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (isQuestion) return (lang === 'es' ? '¿' : '') + s + '?';
    return s + '.';
  };

  SG.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  SG.uid = function (prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  };

  /* "1:23" / "83" / "1:02:03" -> seconds. Blank -> null. */
  SG.parseTime = function (str) {
    if (str == null) return null;
    str = String(str).trim();
    if (!str) return null;
    var parts = str.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    return parts.reduce(function (acc, n) { return acc * 60 + n; }, 0);
  };
  SG.formatTime = function (sec) {
    if (sec == null || isNaN(sec)) return '';
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  /* ---------- Settings ---------- */
  var DEFAULTS = {
    student: '',
    uiLang: 'bi',          // 'en' | 'es' | 'bi' (bilingual prompts)
    answerLang: 'en',      // language the AAC board starts in
    level: 2,              // 1 = frame filled in, 2 = model shown, 3 = independent
    deviceMode: false,     // student answers on their own TouchChat device
    speakEachWord: true,
    autoSpeak: true,
    rate: 0.9,
    voiceEn: '',
    voiceEs: '',
    articGoal: 20
  };
  SG.settings = Object.assign({}, DEFAULTS, SG.store.get('sg.settings', {}));
  SG.saveSettings = function () { SG.store.set('sg.settings', SG.settings); };

  SG.langs = function () {
    return SG.settings.uiLang === 'bi' ? ['en', 'es'] : [SG.settings.uiLang];
  };
  SG.pick = function (obj, lang) {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || '';
  };
  SG.L = function (en, es) { return { en: en, es: es }; };

  /* Render a bilingual label: one line per active language. */
  SG.biText = function (obj, cls) {
    var wrap = SG.el('span', { class: 'bi ' + (cls || '') });
    SG.langs().forEach(function (l) {
      var t = SG.pick(obj, l);
      if (t) wrap.append(SG.el('span', { class: 'bi-' + l, lang: l, text: t }));
    });
    return wrap;
  };
  SG.biString = function (obj) {
    return SG.langs().map(function (l) { return SG.pick(obj, l); }).filter(Boolean).join(' / ');
  };

  var toastTimer = null;
  SG.toast = function (msg) {
    var t = SG.$('#toast');
    if (!t) return;
    t.textContent = typeof msg === 'string' ? msg : SG.biString(msg);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  /* Shrink an uploaded picture so lessons stay small enough to save in the browser. */
  SG.compressImage = function (file, maxSide, quality) {
    maxSide = maxSide || 1000;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Not an image'));
      var reader = new FileReader();
      reader.onerror = function () { reject(reader.error); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Could not read that picture')); };
        img.onload = function () {
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality || 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };
  /* Pictures may be web links or pictures uploaded into the lesson. */
  SG.safeImage = function (src) {
    src = String(src || '');
    if (/^https?:\/\//i.test(src)) return src;
    if (/^img\/[\w\/-]+\.(svg|png|jpe?g|webp)$/i.test(src)) return src;   // pictures that ship with the game
    if (/^data:image\/svg\+xml;base64,[A-Za-z0-9+\/=]+$/.test(src) && src.length < 1500000) return src;
    if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(src) && src.length < 3000000) return src;
    return '';
  };

  /* Turn SVG code (e.g. drawn by Claude) into a picture. Shown through <img>, which never runs
     scripts; risky parts are stripped anyway. */
  SG.svgToImage = function (text) {
    var m = String(text || '').match(/<svg[\s\S]*<\/svg>/i);
    if (!m) return '';
    var svg = m[0]
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/(href\s*=\s*)("|')\s*(javascript:|https?:)[^"']*\2/gi, '$1$2#$2');
    if (!/xmlns=/.test(svg)) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    var bytes = new TextEncoder().encode(svg), bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return 'data:image/svg+xml;base64,' + btoa(bin);
  };

  SG.download = function (filename, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' });
    var a = SG.el('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* Short celebratory burst for correct answers. */
  SG.celebrate = function () {
    var layer = SG.el('div', { class: 'confetti', 'aria-hidden': 'true' });
    var bits = ['⭐', '🎉', '✨', '🌟', '💫'];
    for (var i = 0; i < 18; i++) {
      layer.append(SG.el('span', {
        text: bits[i % bits.length],
        style: { left: Math.random() * 100 + '%', animationDelay: Math.random() * 0.4 + 's' }
      }));
    }
    document.body.append(layer);
    setTimeout(function () { layer.remove(); }, 1800);
  };
})(window.SG);
