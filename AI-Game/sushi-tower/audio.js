(function () {
  let audio = null;
  let muted = false;

  try {
    muted = localStorage.getItem('sushi-tower-muted') === '1';
  } catch (e) { }

  function ac() {
    if (!audio) {
      try {
        audio = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { }
    }
    if (audio && audio.state === 'suspended') {
      try {
        audio.resume();
      } catch (e) { }
    }
    return audio;
  }

  function tone(freq, dur, type, vol, slide, delay) {
    if (muted) return;
    const a = ac();
    if (!a) return;

    try {
      const t0 = a.currentTime + (delay || 0);
      const osc = a.createOscillator();
      const gain = a.createGain();

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      if (slide) {
        osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
      }

      gain.gain.setValueAtTime(vol || .12, t0);
      gain.gain.exponentialRampToValueAtTime(.0001, t0 + dur);

      osc.connect(gain);
      gain.connect(a.destination);
      osc.start(t0);
      osc.stop(t0 + dur + .02);
    } catch (e) { }
  }

  window.SushiAudio = {
    ac: ac,
    isMuted: function () {
      return muted;
    },
    toggleMute: function () {
      muted = !muted;
      try {
        localStorage.setItem('sushi-tower-muted', muted ? '1' : '0');
      } catch (e) { }
      return muted;
    },
    tone: tone,
    drop: function () {
      tone(560, .12, 'triangle', .1, 300);
    },
    land: function (speed) {
      tone(150, .12, 'sine', Math.min(.25, .05 + speed * .025), 65);
    },
    fall: function () {
      tone(240, .45, 'sawtooth', .09, 60);
    },
    milestone: function () {
      tone(784, .12, 'square', .06);
      tone(1047, .18, 'square', .06, 0, .11);
    },
    over: function () {
      tone(330, .7, 'sawtooth', .1, 70);
    },
    count: function () {
      tone(880, .08, 'square', .05);
    }
  };
})();