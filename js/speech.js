/* Text-to-speech (English + Spanish voices) and microphone recording. */
(function (SG) {
  'use strict';

  var synth = window.speechSynthesis;
  var voices = [];

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
    if (SG.Speech.onVoices) SG.Speech.onVoices(voices);
  }

  function voiceFor(lang) {
    var chosen = lang === 'es' ? SG.settings.voiceEs : SG.settings.voiceEn;
    if (chosen) {
      var exact = voices.find(function (v) { return v.voiceURI === chosen; });
      if (exact) return exact;
    }
    var prefs = lang === 'es' ? ['es-US', 'es-MX', 'es-419', 'es-ES', 'es'] : ['en-US', 'en-GB', 'en'];
    for (var i = 0; i < prefs.length; i++) {
      var p = prefs[i].toLowerCase();
      var v = voices.find(function (x) { return x.lang && x.lang.toLowerCase().replace('_', '-').indexOf(p) === 0; });
      if (v) return v;
    }
    return null;
  }

  SG.Speech = {
    supported: !!synth,
    voices: function () { return voices; },
    onVoices: null,

    /* Speak text in 'en' or 'es'. Returns a promise that resolves when done. */
    speak: function (text, lang, opts) {
      opts = opts || {};
      if (!synth || !text) return Promise.resolve();
      if (!opts.queue) synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'es' ? 'es-US' : 'en-US';
      var v = voiceFor(lang);
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = opts.rate || SG.settings.rate || 0.9;
      return new Promise(function (resolve) {
        u.onend = resolve;
        u.onerror = resolve;
        synth.speak(u);
      });
    },

    /* Speak a {en, es} object in every active prompt language. */
    speakBi: function (obj) {
      if (!synth) return;
      synth.cancel();
      SG.langs().forEach(function (l) {
        var t = SG.pick(obj, l);
        if (t) SG.Speech.speak(t, l, { queue: true });
      });
    },

    stop: function () { if (synth) synth.cancel(); }
  };

  if (synth) {
    loadVoices();
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', loadVoices);
  }

  /* Microphone recorder for articulation practice (needs https or localhost). */
  var stream = null, rec = null, chunks = [];
  SG.Recorder = {
    supported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    isRecording: function () { return !!rec && rec.state === 'recording'; },
    start: function () {
      return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s;
        chunks = [];
        rec = new MediaRecorder(s);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.start();
      });
    },
    stop: function () {
      return new Promise(function (resolve) {
        if (!rec || rec.state !== 'recording') return resolve(null);
        rec.onstop = function () {
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
          var blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
          rec = null;
          resolve(URL.createObjectURL(blob));
        };
        rec.stop();
      });
    }
  };
})(window.SG);
