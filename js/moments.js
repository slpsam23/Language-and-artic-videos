/* "Mark moments" for silent videos (no transcript): play the video, tap at each
   key moment, and jot what happens. On a computer the app can also grab a
   picture of the video at each mark (screen capture of this tab) and combine
   them into one numbered picture sheet to attach in Claude. */
(function (SG) {
  'use strict';
  var el = SG.el;

  var capture = { stream: null, video: null };

  function captureSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }

  function startCapture() {
    return navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser', frameRate: 10 }, audio: false,
      preferCurrentTab: true, selfBrowserSurface: 'include'
    }).then(function (stream) {
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.srcObject = stream;
      return v.play().then(function () {
        capture.stream = stream; capture.video = v;
        stream.getVideoTracks()[0].addEventListener('ended', stopCapture);
      });
    });
  }
  function stopCapture() {
    if (capture.stream) capture.stream.getTracks().forEach(function (t) { t.stop(); });
    capture.stream = null; capture.video = null;
    if (SG.Moments.onCaptureChange) SG.Moments.onCaptureChange();
  }

  /* Wait until the capture has delivered new frames (after scrolling/pausing). */
  function afterFreshFrames(cb) {
    var v = capture.video;
    setTimeout(function () {
      if (v && v.requestVideoFrameCallback) {
        var n = 0, done = false;
        var tick = function () { if (++n >= 3 && !done) { done = true; cb(); } else v.requestVideoFrameCallback(tick); };
        v.requestVideoFrameCallback(tick);
        setTimeout(function () { if (!done) { done = true; cb(); } }, 1500);   // a still page may send no new frames
      } else {
        cb();
      }
    }, 300);
  }

  /* Grab the part of the captured tab where the video player is. */
  function grabFrame(playerBox) {
    var v = capture.video;
    if (!v || !v.videoWidth) return null;
    var r = playerBox.getBoundingClientRect();
    var scale = v.videoWidth / window.innerWidth;
    var sx = Math.max(0, r.left * scale), sy = Math.max(0, r.top * scale);
    var sw = Math.min(v.videoWidth - sx, r.width * scale), sh = Math.min(v.videoHeight - sy, r.height * scale);
    if (sw <= 0 || sh <= 0) return null;
    var c = document.createElement('canvas');
    c.width = 480; c.height = Math.round(480 * sh / sw);
    c.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }

  /* One image with every captured frame, numbered and timed, to attach in Claude. */
  function makeSheet(moments) {
    var withPics = moments.filter(function (m) { return m.frame; });
    if (!withPics.length) return Promise.resolve(null);
    var cols = withPics.length > 4 ? 3 : 2, cw = 480, ch = 270, pad = 12, label = 36;
    var rows = Math.ceil(withPics.length / cols);
    var c = document.createElement('canvas');
    c.width = cols * (cw + pad) + pad;
    c.height = rows * (ch + label + pad) + pad;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    return Promise.all(withPics.map(function (m) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { resolve(null); };
        img.src = m.frame;
      });
    })).then(function (imgs) {
      imgs.forEach(function (img, i) {
        var m = withPics[i];
        var x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + label + pad);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('#' + (moments.indexOf(m) + 1) + '   ' + SG.formatTime(m.t), x, y + 28);
        if (img) ctx.drawImage(img, x, y + label, cw, ch);
      });
      return c;
    });
  }

  SG.Moments = {
    onCaptureChange: null,
    capturing: function () { return !!capture.stream; },

    /* o: { moments: [], video: '' } — shared with the Claude request builder. */
    render: function (root, o) {
      var player = null;
      root.innerHTML = '';
      var playerBox = el('div', { class: 'player-box' }, el('div', { class: 'player-empty', text: 'Paste the YouTube link in step 1, then press Load video.' }));
      var list = el('div', { class: 'moment-list' });
      var capBtn = el('button', { class: 'btn', type: 'button' });
      var sheetRow = el('div', { class: 'row wrap' });

      function drawCapBtn() {
        capBtn.hidden = !captureSupported();
        capBtn.textContent = SG.Moments.capturing() ? '⏹️ Stop picture capture' : '📸 Turn on picture capture (computer)';
      }
      SG.Moments.onCaptureChange = drawCapBtn;
      capBtn.addEventListener('click', function () {
        if (SG.Moments.capturing()) { stopCapture(); return; }
        startCapture().then(function () {
          SG.toast('Picture capture is on. Each 📍 mark now saves a picture of the video.');
          drawCapBtn();
        }).catch(function () { SG.toast('Capture was not started. Choose “This tab” when the browser asks.'); });
      });
      drawCapBtn();

      function drawList() {
        list.innerHTML = '';
        if (!o.moments.length) list.append(el('p', { class: 'muted', text: 'No moments yet. Play the video and tap 📍 at each important moment.' }));
        o.moments.forEach(function (m, i) {
          var timeIn = el('input', { type: 'text', class: 'moment-time', value: SG.formatTime(m.t), onchange: function () {
            var t = SG.parseTime(this.value);
            if (t != null) m.t = t;
          } });
          list.append(el('div', { class: 'moment-row' },
            el('strong', { text: '#' + (i + 1) }),
            m.frame ? el('img', { class: 'pic-thumb', src: m.frame, alt: 'Picture at ' + SG.formatTime(m.t) }) : null,
            timeIn,
            el('input', { type: 'text', class: 'grow', value: m.note || '', placeholder: 'What happens? e.g. the dog jumps in the pool',
              oninput: function () { m.note = this.value; } }),
            player ? el('button', { class: 'btn small', type: 'button', title: 'Go to this moment', onclick: function () { player.seek(m.t); player.pause(); } }, '⏩') : null,
            el('button', { class: 'btn small', type: 'button', title: 'Remove', onclick: function () { o.moments.splice(i, 1); drawList(); } }, '✕')));
        });
        sheetRow.hidden = !o.moments.some(function (m) { return m.frame; });
      }

      function mark() {
        if (!player) { SG.toast('Load the video first.'); return; }
        player.pause();
        var m = { t: Math.round(player.time() * 10) / 10, note: '' };
        if (SG.Moments.capturing()) {
          // Make sure the whole video is on screen (not under the sticky top bar), then
          // give the paused frame a moment to reach the capture before grabbing it.
          var bar = SG.$('.topbar');
          var barH = bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().height : 0;
          var r = playerBox.getBoundingClientRect();
          if (r.top < barH + 4 || r.bottom > window.innerHeight) window.scrollTo(0, window.scrollY + r.top - barH - 10);
          var t = SG.$('#toast'); if (t) t.classList.remove('show');   // keep messages out of the picture
          afterFreshFrames(function () { m.frame = grabFrame(playerBox); drawList(); });
        }
        o.moments.push(m);
        o.moments.sort(function (a, b) { return a.t - b.t; });
        drawList();
        var inputs = list.querySelectorAll('.moment-row input.grow');
        var idx = o.moments.indexOf(m);
        if (inputs[idx]) inputs[idx].focus();
      }

      function withSheet(fn) {
        makeSheet(o.moments).then(function (canvas) {
          if (!canvas) { SG.toast('No pictures yet. Turn on picture capture, then mark moments.'); return; }
          fn(canvas);
        });
      }
      sheetRow.append(
        el('button', { class: 'btn primary', type: 'button', onclick: function () {
          withSheet(function (canvas) {
            canvas.toBlob(function (blob) {
              if (navigator.clipboard && window.ClipboardItem) {
                navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                  .then(function () { SG.toast('Picture sheet copied! Paste it into Claude along with the request.'); },
                        function () { SG.toast('Could not copy the picture. Use Download instead.'); });
              } else { SG.toast('Copying pictures isn’t supported here. Use Download instead.'); }
            }, 'image/png');
          });
        } }, '📋 Copy picture sheet'),
        el('button', { class: 'btn', type: 'button', onclick: function () {
          withSheet(function (canvas) {
            var a = el('a', { href: canvas.toDataURL('image/jpeg', 0.85), download: 'video-moments.jpg' });
            document.body.append(a); a.click(); a.remove();
          });
        } }, '⬇️ Download picture sheet'));

      root.append(
        el('p', { class: 'muted', text: 'For silent videos: play the video here and tap 📍 at each moment you want a question about. Type (or dictate with the keyboard microphone) what happens.' }),
        el('div', { class: 'row wrap' },
          el('button', { class: 'btn', type: 'button', onclick: function () {
            var id = SG.YT.parseId(o.video);
            if (!id) { SG.toast('Paste a YouTube link in step 1 first.'); return; }
            if (player) player.destroy();
            player = SG.YT.create(playerBox, id, { start: SG.YT.parseStart(o.video) });
            player.ready.then(drawList).catch(function (e) { SG.toast(e.message); });
          } }, '▶ Load video'),
          el('button', { class: 'btn primary big', type: 'button', onclick: mark }, '📍 Mark this moment'),
          capBtn),
        playerBox, list, sheetRow,
        el('p', { class: 'muted small-note', text: captureSupported()
          ? 'Picture capture works in Chrome or Edge on a computer: choose “This tab” when asked. On an iPad, take screenshots (top button + volume up) at each mark and attach them in Claude instead.'
          : 'On this device, take screenshots (top button + volume up on iPad) at each mark and attach them in Claude.' }));
      drawList();
    }
  };
})(window.SG);
