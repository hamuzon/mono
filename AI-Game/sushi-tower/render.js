(function () {
  const TYPES = [
    { kind: 'nigiri', name: 'salmon', w: [82, 94], h: 38, c: '#ff7a45', c2: '#ffc09a', edge: '#c9582a', stripe: 'rgba(255,255,255,.55)' },
    { kind: 'nigiri', name: 'tuna', w: [82, 94], h: 38, c: '#c8213e', c2: '#ee7b90', edge: '#8f1229', stripe: 'rgba(255,200,210,.35)' },
    { kind: 'nigiri', name: 'ika', w: [80, 90], h: 36, c: '#efe8d8', c2: '#fffdf6', edge: '#cfc5ad', stripe: null },
    { kind: 'nigiri', name: 'ebi', w: [84, 94], h: 40, c: '#ff9466', c2: '#ffd0b3', edge: '#c9582a', stripe: 'ebi' },
    { kind: 'tamago', w: [84, 92], h: 38 }
  ];

  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }

  function randomSpec() {
    const t = TYPES[Math.floor(Math.random() * TYPES.length)];
    const w = Math.round(rnd(t.w[0], t.w[1]));
    const h = t.h;
    return Object.assign({}, t, { w: w, h: h, seed: Math.random() });
  }

  function rr(x, y, w, h, r, c) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  }

  function drawSushi(s, c) {
    const w = s.w;
    const h = s.h;

    c.lineWidth = 1.5;
    c.lineJoin = 'round';

    if (s.kind === 'nigiri' || s.kind === 'tamago') {
      const riceH = h * .6;
      const topH = h * .58;

      rr(-w / 2 + 5, h / 2 - riceH, w - 10, riceH, riceH * .45, c);
      c.fillStyle = '#fffdf5';
      c.fill();
      c.strokeStyle = '#d6ccb4';
      c.stroke();

      const topPath = () => rr(-w / 2, -h / 2, w, topH, [h * .32, h * .32, h * .18, h * .18], c);

      if (s.kind === 'nigiri') {
        const g = c.createLinearGradient(0, -h / 2, 0, -h / 2 + topH);
        g.addColorStop(0, s.c2);
        g.addColorStop(1, s.c);

        topPath();
        c.fillStyle = g;
        c.fill();

        c.save();
        topPath();
        c.clip();

        if (s.stripe === 'ebi') {
          c.fillStyle = 'rgba(214,70,50,.55)';
          for (let i = 0; i < 6; i++) {
            c.fillRect(-w / 2 + 6 + i * (w / 6), -h / 2, w / 12, topH);
          }
        } else if (s.stripe) {
          c.strokeStyle = s.stripe;
          c.lineWidth = 2.2;
          for (let i = 0; i < 4; i++) {
            const x = -w / 2 + 10 + i * (w / 4);
            c.beginPath();
            c.moveTo(x, -h / 2 + 2);
            c.quadraticCurveTo(x + 10, -h / 4, x + 4, -h / 2 + topH);
            c.stroke();
          }
        }

        c.fillStyle = 'rgba(255,255,255,.35)';
        c.beginPath();
        c.ellipse(-w * .18, -h / 2 + h * .12, w * .2, h * .06, 0, 0, 7);
        c.fill();

        c.restore();

        c.lineWidth = 1.5;
        topPath();
        c.strokeStyle = s.edge;
        c.stroke();
      } else {
        topPath();
        c.fillStyle = '#ffd24a';
        c.fill();

        c.fillStyle = '#ffe98a';
        rr(-w / 2 + 6, -h / 2 + 4, w - 12, 5, 3, c);
        c.fill();

        topPath();
        c.strokeStyle = '#c99a1a';
        c.stroke();

        c.fillStyle = '#1c2620';
        rr(-8, -h / 2 - 1, 16, h + 2, 2, c);
        c.fill();
      }
    } else if (s.kind === 'gunkan') {
      rr(-w / 2, -h * .12, w, h * .62, 6, c);
      c.fillStyle = '#1c2620';
      c.fill();

      c.fillStyle = '#fffdf5';
      rr(-w / 2 + 6, h / 2 - 6, w - 12, 6, 3, c);
      c.fill();

      c.fillStyle = '#2f4036';
      rr(-w / 2 + 4, -h * .12 + 4, 6, h * .62 - 10, 3, c);
      c.fill();

      const cols = 4;
      const rows = 3;
      const r = w / cols / 2 * 0.95;

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols - (j === rows - 1 ? 1 : 0); i++) {
          const x = -w / 2 + r + 4 + i * ((w - 2 * r - 8) / (cols - 1)) + (j === rows - 1 ? (w - 2 * r - 8) / (cols - 1) / 2 : 0);
          const y = -h / 2 + r + j * r * 1.5;
          const g = c.createRadialGradient(x - r * .3, y - r * .3, 1, x, y, r);

          g.addColorStop(0, '#ffc27a');
          g.addColorStop(1, '#e8531c');

          c.fillStyle = g;
          c.beginPath();
          c.arc(x, y, r, 0, 7);
          c.fill();
        }
      }
    } else if (s.kind === 'maki') {
      const r = Math.min(w, h) / 2;

      c.fillStyle = '#1c2620';
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.fill();

      c.fillStyle = '#fffdf5';
      c.beginPath();
      c.arc(0, 0, r * .78, 0, 7);
      c.fill();

      const fills = ['#ff7a45', '#5aa83a', '#ffd24a', '#c8213e'];
      c.fillStyle = fills[Math.floor(s.seed * fills.length)];
      c.beginPath();
      c.arc(0, 0, r * .34, 0, 7);
      c.fill();

      c.fillStyle = 'rgba(255,255,255,.35)';
      c.beginPath();
      c.arc(-r * .1, -r * .1, r * .12, 0, 7);
      c.fill();

      c.strokeStyle = '#d6ccb4';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(0, 0, r * .78, 0, 7);
      c.stroke();
    }
  }

  window.SushiRenderer = {
    rr: rr,
    randomSpec: randomSpec,
    drawSushi: drawSushi,
    drawBackground: function (c, W, H) {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#16213e');
      g.addColorStop(.6, '#3a2a3f');
      g.addColorStop(1, '#6b3a2a');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    },
    drawPlatform: function (c, W, PLAT_Y, PLAT_TOP, PLAT_W, PLAT_H) {
      c.fillStyle = '#4a2c1a';
      c.fillRect(-20, PLAT_Y + 46, W + 40, 2000);

      c.fillStyle = '#6a4028';
      c.fillRect(-20, PLAT_Y + 46, W + 40, 8);

      c.fillStyle = '#3b2214';
      c.fillRect(W / 2 - PLAT_W / 2 + 16, PLAT_Y + PLAT_H / 2, 22, 28);
      c.fillRect(W / 2 + PLAT_W / 2 - 38, PLAT_Y + PLAT_H / 2, 22, 28);

      const g = c.createLinearGradient(0, PLAT_TOP, 0, PLAT_TOP + PLAT_H);
      g.addColorStop(0, '#e6c58f');
      g.addColorStop(1, '#b98c55');

      c.fillStyle = g;
      rr(W / 2 - PLAT_W / 2, PLAT_TOP, PLAT_W, PLAT_H, 4, c);
      c.fill();

      c.strokeStyle = 'rgba(120,80,40,.5)';
      c.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo(W / 2 - PLAT_W / 2 + 8, PLAT_TOP + 4 + i * 3.5);
        c.lineTo(W / 2 + PLAT_W / 2 - 8, PLAT_TOP + 4 + i * 3.5);
        c.stroke();
      }

      c.strokeStyle = '#7a5430';
      c.lineWidth = 1.5;
      rr(W / 2 - PLAT_W / 2, PLAT_TOP, PLAT_W, PLAT_H, 4, c);
      c.stroke();
    }
  };
})();