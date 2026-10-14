/* YouTube IFrame Player wrapper. Pauses the video at each activity's `at`
   time ("cue points") and hands the activity to the lesson runner. */
(function (SG) {
  'use strict';

  var apiPromise = null;
  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === 'function') prev();
        resolve(window.YT);
      };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = function () {
        apiPromise = null;
        reject(new Error('Could not load YouTube. Check the internet connection.'));
      };
      document.head.append(s);
    });
    return apiPromise;
  }

  /* Accepts watch?v=, youtu.be/, /embed/, /shorts/, /live/ links or a bare 11-char ID. */
  function parseId(input) {
    if (!input) return '';
    input = String(input).trim();
    if (/^[\w-]{11}$/.test(input)) return input;
    try {
      var u = new URL(input);
      var host = u.hostname.replace(/^www\.|^m\./, '');
      if (host === 'youtu.be') return (u.pathname.slice(1).match(/^[\w-]{11}/) || [''])[0];
      if (host.indexOf('youtube') !== -1) {
        var v = u.searchParams.get('v');
        if (v && /^[\w-]{11}/.test(v)) return v.slice(0, 11);
        var m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
        if (m) return m[2];
      }
    } catch (e) { /* not a URL */ }
    return '';
  }

  /* Start time from a link like ...?t=90 or &t=1m30s */
  function parseStart(input) {
    try {
      var t = new URL(String(input)).searchParams.get('t') || new URL(String(input)).searchParams.get('start');
      if (!t) return 0;
      if (/^\d+$/.test(t)) return Number(t);
      var m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
      return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
    } catch (e) { return 0; }
  }

  function create(container, videoId, opts) {
    opts = opts || {};
    var target = document.createElement('div');
    container.innerHTML = '';
    container.append(target);

    var player = null, timer = null, cues = [], next = 0, lastT = 0, onCue = null, destroyed = false;

    function time() {
      return player && player.getCurrentTime ? player.getCurrentTime() || 0 : 0;
    }
    function syncNext(t) {
      next = cues.findIndex(function (c) { return c.at > t + 0.05; });
      if (next < 0) next = cues.length;
    }
    function tick() {
      if (!player || !player.getPlayerState) return;
      var t = time();
      var state = player.getPlayerState();
      if (Math.abs(t - lastT) > 2.5) {
        syncNext(t);            // the user scrubbed; don't fire every skipped cue
      } else if (state === 1 && next < cues.length && t >= cues[next].at) {
        var cue = cues[next++];
        player.pauseVideo();
        if (onCue) onCue(cue);
      }
      lastT = t;
    }

    var api = {
      time: time,
      play: function () { if (player && player.playVideo) player.playVideo(); },
      pause: function () { if (player && player.pauseVideo) player.pauseVideo(); },
      seek: function (t) {
        if (!player || !player.seekTo) return;
        player.seekTo(Math.max(0, t), true);
        lastT = t;
        syncNext(t);
      },
      setCues: function (list, handler) {
        cues = list.slice().sort(function (a, b) { return a.at - b.at; });
        onCue = handler;
        syncNext(time());
      },
      /* Jump to just before the next question. */
      nextCue: function () {
        if (next >= cues.length) return false;
        api.seek(cues[next].at - 1);
        api.play();
        return true;
      },
      remainingCues: function () { return cues.length - next; },
      destroy: function () {
        destroyed = true;
        clearInterval(timer);
        try { if (player && player.destroy) player.destroy(); } catch (e) { /* ignore */ }
        container.innerHTML = '';
      }
    };

    api.ready = loadApi().then(function (YT) {
      return new Promise(function (resolve) {
        if (destroyed) return;
        player = new YT.Player(target, {
          videoId: videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(opts.start || 0) },
          events: {
            onReady: function () {
              timer = setInterval(tick, 200);
              resolve(api);
            },
            onStateChange: function (e) {
              if (e.data === YT.PlayerState.ENDED && opts.onEnded) opts.onEnded();
              if (opts.onState) opts.onState(e.data);
            },
            onError: function (e) { if (opts.onError) opts.onError(e.data); }
          }
        });
      });
    });

    return api;
  }

  SG.YT = { load: loadApi, parseId: parseId, parseStart: parseStart, create: create };
})(window.SG);
