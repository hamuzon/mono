(function () {
  const { Engine, Composite, Body } = Matter;
  const C = window.SushiConfig;
  let I18N = window.SushiI18N;
  let LEVELS = window.SushiLevels;
  let MODES = window.SushiModes;
  let CTRLS = window.SushiCtrls;
  const Audio = window.SushiAudio;
  const Renderer = window.SushiRenderer;
  const Physics = window.SushiPhysics;

  let H = C.H_DEFAULT;
  let PLAT_W = 150;
  let baseCam = 0;
  let scale = 1;

  let level = 'normal';
  let mode = 'time';
  let controlMode = 'auto';

  // URLパラメータまたはlocalStorageから復元
  const urlParams = new URLSearchParams(window.location.search);
  const pLang = (urlParams.get('lang') || '').toLowerCase();
  const pMode = urlParams.get('mode');
  const pLevel = urlParams.get('level');
  const pCtrl = urlParams.get('ctrl');

  if (pLang === 'en' || pLang === 'ja') {
    window.SushiApplyLangData(pLang);
    I18N = window.SushiI18N;
    LEVELS = window.SushiLevels;
    MODES = window.SushiModes;
    CTRLS = window.SushiCtrls;
  }

  try {
    const savedLevel = localStorage.getItem('sushi-tower-level');
    if (LEVELS[savedLevel]) level = savedLevel;
    const savedMode = localStorage.getItem('sushi-tower-mode');
    if (MODES[savedMode]) mode = savedMode;
    const savedCtrl = localStorage.getItem('sushi-tower-ctrl');
    if (CTRLS[savedCtrl]) controlMode = savedCtrl;
  } catch (e) { }

  if (pMode && MODES[pMode]) mode = pMode;
  if (pLevel && LEVELS[pLevel]) level = pLevel;
  if (pCtrl && CTRLS[pCtrl]) controlMode = pCtrl;
  if (!CTRLS[controlMode]) controlMode = 'auto';

  // URLパラメータの同期: lang=en は出す（末尾）。日本語時はクリーンに保つ
  function syncUrlQuery() {
    try {
      const u = new URL(window.location.href);
      if (C.isEn) {
        u.search = '?lang=en';
      } else {
        u.search = '';
      }
      window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { }
  }
  syncUrlQuery();

  // シェアURL: 英語なら英語版(?lang=en)、日本語なら通常URL
  function getShareUrl() {
    return C.isEn
      ? (C.BASE_URL + '?lang=en')
      : C.BASE_URL;
  }

  let userX = C.W / 2;
  let keyLeft = false;
  let keyRight = false;
  let isDragging = false;

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const hudH = document.getElementById('h');
  const hudN = document.getElementById('n');
  const hudBest = document.getElementById('best');
  const hudBestN = document.getElementById('bestn');
  const hudLives = document.getElementById('lives');

  const startEl = document.getElementById('start');
  const overEl = document.getElementById('over');
  const pauseEl = document.getElementById('pause');
  const tourEl = document.getElementById('tour');
  const overTitle = document.getElementById('overTitle');
  const muteBtn = document.getElementById('muteBtn');

  function resize() {
    const cw = stage.clientWidth;
    const ch = stage.clientHeight;
    if (!cw || !ch) return;

    stage.style.fontSize = (cw / C.W * 16) + 'px';
    scale = cw / C.W;
    H = ch / scale;
    baseCam = H - 720;

    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(stage);
  }
  resize();

  let best = 0;
  let bestN = 0;
  const recs = {};

  function readNum(key) {
    try {
      const value = parseFloat(localStorage.getItem(key));
      return isNaN(value) ? 0 : value;
    } catch (e) {
      return 0;
    }
  }

  function readRecs() {
    for (const m of Object.keys(MODES)) {
      recs[m] = {};
      for (const l of Object.keys(LEVELS)) {
        recs[m][l] = {
          h: readNum('sushi-rec-' + m + '-' + l + '-h'),
          n: Math.round(readNum('sushi-rec-' + m + '-' + l + '-n'))
        };
      }
    }
  }

  function loadBest() {
    readRecs();
    if (!recs[mode] || !recs[mode][level]) {
      best = 0;
      bestN = 0;
      return;
    }
    best = recs[mode][level].h;
    bestN = recs[mode][level].n;
  }

  function saveBest() {
    try {
      localStorage.setItem('sushi-rec-' + mode + '-' + level + '-h', best);
      localStorage.setItem('sushi-rec-' + mode + '-' + level + '-n', bestN);
    } catch (e) { }
    if (!recs[mode]) recs[mode] = {};
    recs[mode][level] = { h: best, n: bestN };
  }

  const engine = Engine.create({
    positionIterations: 16,
    velocityIterations: 12,
    constraintIterations: 4,
    enableSleeping: true
  });
  engine.gravity.scale = 0.0018;

  const physicsWorld = Physics.create(engine);

  let state = 'ready';
  let cam = 0;
  let camTarget = 0;
  let held = null;
  let phase = 0;
  let dropped = 0;

  let lives = 3;
  let timeLeft = 60;
  let ending = false;
  let endAt = 0;

  let lastFall = -1e9;
  let lastSec = -1;
  let nextSpawn = 0;

  let curH = 0;
  let curN = 0;
  let peakH = 0;
  let peakN = 0;
  let maxN = 0;
  let lastMilestone = 0;

  let texts = [];
  let flash = 0;
  let paused = false;
  let touring = false;

  function resetLimits() {
    timeLeft = LEVELS[level].t;
    lives = LEVELS[level].lives;
    lastSec = -1;
  }

  function renderLives() {
    if (mode === 'time') {
      const t = Math.max(0, Math.ceil(timeLeft));
      const cls = t <= 10 ? 'warn' : '';
      hudLives.innerHTML = '<span class="' + cls + '">⏱ ' + t + '</span>';
      return;
    }

    let html = '';
    const maxL = LEVELS[level].lives;
    for (let i = 0; i < maxL; i++) {
      let cls = '';
      if (i < lives) {
        cls = lives <= 1 ? 'warn' : '';
      } else {
        cls = 'off';
      }
      html += '<span class="' + cls + '">🍣</span>';
    }
    hudLives.innerHTML = html;
  }

  function updateHud() {
    hudH.textContent = curH.toFixed(1);
    hudN.textContent = curN;
    hudBest.textContent = Math.max(best, peakH).toFixed(1);
    hudBestN.textContent = Math.max(bestN, maxN);
  }

  function addText(txt, x, y, color, size) {
    texts.push({
      txt: txt,
      x: x,
      y: y,
      t: 0,
      color: color || '#fff',
      size: size || 22
    });
  }

  function levelInfo(lv) {
    const L = LEVELS[lv];
    const tail = mode === 'time'
      ? (C.isEn ? ' ・ Time limit ' + L.t + 's' : ' ・ 制限時間' + L.t + '秒')
      : (C.isEn ? ' ・ Lives: ' + L.lives : ' ・ 残機' + L.lives + '機');
    return L.note + tail;
  }

  function renderRecs() {
    const rows = Object.keys(LEVELS).map(lv => {
      const r = (recs[mode] && recs[mode][lv]) ? recs[mode][lv] : { h: 0, n: 0 };
      const on = lv === level ? ' on' : '';
      return '<div class="rec' + on + '">' +
        '<span>' + LEVELS[lv].label + '</span>' +
        '<b>' + r.h.toFixed(1) + ' cm</b>' +
        '<b>' + r.n + I18N.unit + '</b>' +
        '</div>';
    }).join('');

    const title = '<div class="rect">' + I18N.recsTitle + MODES[mode].label + '</div>';
    document.querySelectorAll('.recs').forEach(el => {
      el.innerHTML = title + rows;
    });
  }

  function getLevelBtnLabel(k) {
    const L = LEVELS[k];
    if (mode === 'time') {
      return C.isEn ? (L.label + ' (' + L.t + 's)') : (L.label + ' (' + L.t + '秒)');
    } else {
      return C.isEn ? (L.label + ' (' + L.lives + ' Lives)') : (L.label + ' (' + L.lives + '機)');
    }
  }

  function updateLevelButtons() {
    document.querySelectorAll('.lv button').forEach(b => {
      const k = b.dataset.lv;
      if (k && LEVELS[k]) {
        b.textContent = getLevelBtnLabel(k);
      }
    });
  }

  function updateModeButtons() {
    document.querySelectorAll('.md button').forEach(b => {
      const k = b.dataset.md;
      if (k && MODES[k]) {
        b.textContent = MODES[k].label;
      }
    });
  }

  function updateControlButtons() {
    document.querySelectorAll('.ctrl button').forEach(b => {
      const k = b.dataset.ctrl;
      if (k && CTRLS[k]) {
        b.textContent = CTRLS[k].label;
      }
    });
  }

  function markLevels() {
    updateLevelButtons();
    document.querySelectorAll('.lv button').forEach(b => {
      b.classList.toggle('on', b.dataset.lv === level);
    });
    document.querySelectorAll('.lvinfo').forEach(el => {
      el.textContent = levelInfo(level);
    });
  }

  function markModes() {
    updateModeButtons();
    document.querySelectorAll('.md button').forEach(b => {
      b.classList.toggle('on', b.dataset.md === mode);
    });
    document.querySelectorAll('.mdinfo').forEach(el => {
      el.textContent = MODES[mode].info;
    });
  }

  function markControls() {
    updateControlButtons();
    document.querySelectorAll('.ctrl button').forEach(b => {
      b.classList.toggle('on', b.dataset.ctrl === controlMode);
    });
    document.querySelectorAll('.ctrlinfo').forEach(el => {
      el.textContent = CTRLS[controlMode].info;
    });
  }

  function resetWorld() {
    physicsWorld.clearWorld();
    PLAT_W = LEVELS[level].w;
    physicsWorld.makePlatform(PLAT_W);
  }

  function setLevel(l) {
    level = l;
    try {
      localStorage.setItem('sushi-tower-level', l);
    } catch (e) { }
    loadBest();
    markLevels();
    renderRecs();
    if (state === 'ready') {
      resetWorld();
      curH = 0;
      curN = 0;
      resetLimits();
      renderLives();
      updateHud();
    } else if (state === 'over') {
      updateOverScreen();
    }
  }

  function setMode(m) {
    mode = m;
    try {
      localStorage.setItem('sushi-tower-mode', m);
    } catch (e) { }
    loadBest();
    markModes();
    markLevels();
    renderRecs();
    if (state === 'ready') {
      resetWorld();
      curH = 0;
      curN = 0;
      resetLimits();
      renderLives();
      updateHud();
    } else if (state === 'over') {
      updateOverScreen();
    }
  }

  function setControl(c) {
    controlMode = c;
    try {
      localStorage.setItem('sushi-tower-ctrl', c);
    } catch (e) { }
    markControls();
    if (state === 'over') {
      updateOverScreen();
    }
  }

  function buildButtons() {
    document.querySelectorAll('.lv').forEach(box => {
      box.innerHTML = '';
      Object.keys(LEVELS).forEach(k => {
        const b = document.createElement('button');
        b.textContent = getLevelBtnLabel(k);
        b.dataset.lv = k;
        b.addEventListener('click', () => setLevel(k));
        box.appendChild(b);
      });
    });

    document.querySelectorAll('.md').forEach(box => {
      box.innerHTML = '';
      Object.keys(MODES).forEach(k => {
        const b = document.createElement('button');
        b.textContent = MODES[k].label;
        b.dataset.md = k;
        b.addEventListener('click', () => setMode(k));
        box.appendChild(b);
      });
    });

    document.querySelectorAll('.ctrl').forEach(box => {
      box.innerHTML = '';
      Object.keys(CTRLS).forEach(k => {
        const b = document.createElement('button');
        b.textContent = CTRLS[k].label;
        b.dataset.ctrl = k;
        b.addEventListener('click', () => setControl(k));
        box.appendChild(b);
      });
    });
  }

  function applyLanguage() {
    document.querySelectorAll('.menu-lang-btn').forEach(btn => {
      btn.innerHTML = '<span class="material-symbols-outlined lang-icon">translate</span>' +
        '<div class="lang-text-group">' +
        '<span class="lang-line1">' + I18N.langLine1 + '</span>' +
        '<span class="lang-line2">' + I18N.langLine2 + '</span>' +
        '</div>';
    });

    document.getElementById('pauseTitle').textContent = I18N.pauseTitle;
    document.getElementById('pauseBtn').title = I18N.pauseBtnTitle;
    document.getElementById('muteBtn').title = I18N.muteBtnTitle;
    document.getElementById('resumeBtn').textContent = I18N.resumeBtn;
    document.getElementById('restartBtn').textContent = I18N.restartBtn;
    document.getElementById('topBtn1').textContent = I18N.topBtn;
    document.getElementById('topBtn2').textContent = I18N.topBtn;

    document.getElementById('startTitle').textContent = I18N.startTitle;
    document.getElementById('startDesc1').innerHTML = I18N.startDesc1;
    document.getElementById('startDesc2').innerHTML = I18N.startDesc2;
    document.getElementById('startBtn').textContent = I18N.startBtn;

    document.getElementById('tour').textContent = I18N.tourHint;
    document.getElementById('overResLabel').textContent = I18N.overResLabel;
    document.getElementById('shareX').textContent = I18N.shareXBtn;

    const stBtn = document.getElementById('saveTowerBtn');
    if (stBtn) stBtn.textContent = I18N.saveTowerBtn;
    document.getElementById('viewBtn').textContent = I18N.viewBtn;
    document.getElementById('againBtn').textContent = I18N.againBtn;

    document.getElementById('unit1').textContent = I18N.unit;
    document.getElementById('unit2').textContent = I18N.unit;
    document.getElementById('lblBest').textContent = I18N.bestLbl;

    const lm = document.getElementById('lblMode');
    if (lm) lm.textContent = I18N.lblMode;
    const ll = document.getElementById('lblLevel');
    if (ll) ll.textContent = I18N.lblLevel;
    const lc = document.getElementById('lblCtrl');
    if (lc) lc.textContent = I18N.lblCtrl;
  }

  function switchLanguage(newLang) {
    window.SushiApplyLangData(newLang);
    I18N = window.SushiI18N;
    LEVELS = window.SushiLevels;
    MODES = window.SushiModes;
    CTRLS = window.SushiCtrls;

    try {
      localStorage.setItem('sushi-tower-lang', newLang);
    } catch (e) { }

    syncUrlQuery();
    applyLanguage();
    buildButtons();
    markModes();
    markLevels();
    markControls();
    renderRecs();
    renderLives();
    updateHud();

    if (state === 'over') {
      updateOverScreen();
    }
  }

  buildButtons();
  applyLanguage();
  markModes();
  markLevels();
  markControls();

  function startGame() {
    resetWorld();
    texts = [];
    state = 'play';

    setPause(false);
    Audio.ac();

    touring = false;
    tourEl.classList.add('hide');

    flash = 0;
    cam = 0;
    camTarget = 0;

    held = null;
    phase = 0;
    dropped = 0;
    userX = C.W / 2;
    keyLeft = false;
    keyRight = false;
    isDragging = false;

    ending = false;

    curH = 0;
    curN = 0;
    peakH = 0;
    peakN = 0;
    maxN = 0;
    lastMilestone = 0;
    lastFall = -1e9;

    resetLimits();
    nextSpawn = performance.now() + 350;

    renderLives();
    updateHud();

    startEl.classList.add('hide');
    overEl.classList.add('hide');
  }

  function updateOverScreen() {
    overTitle.textContent = mode === 'time' ? I18N.overTitleTime : I18N.overTitleLife;

    const newH = peakH > best + 1e-9 && peakH > 0;
    const newN = maxN > bestN;

    document.getElementById('rh').textContent = peakH.toFixed(1);

    // リザルト画面で動作モードの文字を明記
    document.getElementById('rn').innerHTML = C.isEn
      ? ('Max <b>' + maxN + ' pcs</b> ・ [' + MODES[mode].label + ' / ' + LEVELS[level].label + ' / ' + CTRLS[controlMode].label + ']<br>' +
        'Best ' + best.toFixed(1) + ' cm / ' + bestN + ' pcs')
      : ('最多 <b>' + maxN + ' 貫</b> ・ 【' + MODES[mode].label + ' / ' + LEVELS[level].label + ' / ' + CTRLS[controlMode].label + '】<br>' +
        'ベスト ' + best.toFixed(1) + ' cm / ' + bestN + ' 貫');

    document.getElementById('rnew').textContent =
      (newH && newN) ? I18N.newBoth :
        newH ? I18N.newH :
          newN ? I18N.newN :
            '';

    const shareUrl = getShareUrl();
    const hashtags = I18N.hashtags;

    // 𝕏 シェア文（動作モードは含めない）
    const tweet = C.isEn
      ? ('🍣 Challenged Sushi Tower [' + MODES[mode].label + ' / ' + LEVELS[level].label + ']!\n' +
        'Height: ' + peakH.toFixed(1) + 'cm\n' +
        'Stacked: ' + maxN + ' pcs' + (newH || newN ? ' (New Personal Best! 🎉)' : '') + '\n' +
        'Can you stack higher?\n\n' +
        shareUrl + '\n' + hashtags)
      : ('🍣 寿司タワー【' + MODES[mode].label + '・' + LEVELS[level].label + '】に挑戦！\n' +
        '最高の高さ: ' + peakH.toFixed(1) + 'cm\n' +
        '最多記録: ' + maxN + '貫' + (newH || newN ? '（自己ベスト更新🎉）' : '') + '\n' +
        'グラグラ揺れる寿司をどこまで積めるか挑戦しよう！\n\n' +
        shareUrl + '\n' + hashtags);

    document.getElementById('shareX').href =
      'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweet);

    markModes();
    markLevels();
    markControls();
    renderRecs();
  }

  function endGame() {
    state = 'over';
    held = null;

    setPause(false);
    Audio.over();
    overEl.classList.remove('hide');
    overEl.scrollTop = 0;

    const newH = peakH > best + 1e-9 && peakH > 0;
    const newN = maxN > bestN;

    if (newH) best = peakH;
    if (newN) bestN = maxN;
    if (newH || newN) saveBest();

    updateOverScreen();

    setTimeout(() => {
      if (state === 'over') startTour();
    }, 900);

    updateHud();
  }

  function omega() {
    const L = LEVELS[level];
    return L.base + Math.min(dropped, 32) * L.grow;
  }

  function dropNow() {
    if (state !== 'play' || !held || paused || ending) return;

    const bodies = physicsWorld.getBodies();
    const body = physicsWorld.makeBody(held.spec, held.x, held.y - cam - baseCam);

    Body.setAngle(body, (Math.random() - .5) * 0.06);
    Body.setAngularVelocity(body, (Math.random() - .5) * 0.01);

    Composite.add(engine.world, body);
    bodies.push(body);

    Body.setVelocity(body, { x: 0, y: 3 });
    Audio.drop();

    held = null;
    dropped++;
    nextSpawn = performance.now() + 520;
  }

  function setPause(v) {
    if (state !== 'play') v = false;
    paused = v;
    pauseEl.classList.toggle('hide', !v);
  }

  function refreshMute() {
    muteBtn.textContent = Audio.isMuted() ? '🔇' : '🔊';
  }

  function startEnding(now, msg) {
    if (ending) return;
    ending = true;
    endAt = now + 1300;
    held = null;

    addText(msg, C.W / 2, H * .4 - cam - baseCam, '#ffe14a', 34);
    Audio.milestone();
  }

  function handleFall(now, x) {
    const tx = Math.max(60, Math.min(C.W - 60, x));
    const fy = H - 170 - cam - baseCam;
    const windowMs = mode === 'time' ? C.FALL_TIME_WINDOW : C.FALL_LIFE_WINDOW;

    if (now - lastFall > windowMs) {
      flash = 1;
      Audio.fall();

      if (mode === 'time') {
        timeLeft = Math.max(0, timeLeft - C.FALL_PENALTY);
        renderLives();
        addText(I18N.collapseTime, tx, fy, '#ff9d8a', 26);
        if (timeLeft <= 0) startEnding(now, I18N.timeUp);
      } else {
        lives = Math.max(0, lives - 1);
        renderLives();
        addText(I18N.collapseLife(lives), tx, fy, '#ff9d8a', 26);
        if (lives <= 0) startEnding(now, I18N.outOfLives);
      }
    } else {
      addText(I18N.splash, tx, fy + 30, '#ffc9bd', 16);
    }
    lastFall = now;
  }

  function tickLimits(now, dt) {
    if (ending) {
      if (now >= endAt) {
        peakH = curH;
        peakN = curN;
        maxN = curN;
        endGame();
      }
      return;
    }

    if (mode !== 'time') return;
    timeLeft -= dt;
    const sec = Math.ceil(timeLeft);

    if (sec !== lastSec) {
      lastSec = sec;
      renderLives();
      if (sec > 0 && sec <= 5) {
        Audio.count();
      }
    }

    if (timeLeft <= 0) {
      timeLeft = 0;
      renderLives();
      startEnding(now, I18N.timeUp);
    }
  }

  function spawnHeld(now) {
    if (held || ending || now < nextSpawn) return;
    held = {
      spec: Renderer.randomSpec(),
      x: userX,
      y: 105
    };
  }

  function moveHeld() {
    if (!held) return;
    const pad = held.spec.w / 2 + 10;
    const minX = pad;
    const maxX = C.W - pad;
    const amp = C.W / 2 - pad;

    if (controlMode === 'auto') {
      phase += omega() * C.STEP / 1000;
      held.x = C.W / 2 + Math.sin(phase) * amp;
      userX = held.x;
    } else {
      // 手動操作: キーボード (左右) またはドラッグ
      const moveSpeed = 3.6;
      if (keyLeft) userX = Math.max(minX, userX - moveSpeed);
      if (keyRight) userX = Math.min(maxX, userX + moveSpeed);
      held.x = userX;
    }
  }

  function updateTower(now) {
    const bodies = physicsWorld.getBodies();
    let towerTop = C.PLAT_TOP;
    let allSettled = true;

    for (let i = bodies.length - 1; i >= 0; i--) {
      const body = bodies[i];
      const screenBottom = H - cam - baseCam;
      const offSide =
        body.position.y > C.PLAT_TOP + 12 &&
        Math.abs(body.position.x - C.W / 2) > PLAT_W / 2 + 8;

      const offBottom =
        !body.isSleeping &&
        body.position.y > screenBottom + 30 &&
        body.speed > 2.5;

      if (offSide || offBottom) {
        Composite.remove(engine.world, body);
        bodies.splice(i, 1);
        if (state === 'play') {
          handleFall(now, body.position.x);
        }
        continue;
      }

      if (body.speed > 1.2 || Math.abs(body.angularVelocity) > 0.03) {
        allSettled = false;
      } else {
        if (body.bounds.min.y < C.PLAT_TOP) {
          towerTop = Math.min(towerTop, body.bounds.min.y);
        }
      }
    }

    if (state === 'play' || state === 'over') {
      curH = Math.max(0, (C.PLAT_TOP - towerTop) / C.CM);
      curN = bodies.length;

      if (state === 'play' && allSettled && curN > maxN) {
        maxN = curN;
      }

      if (state === 'play' && allSettled && bodies.length > 0 && curH > peakH) {
        peakH = curH;
        peakN = curN;
        const m = Math.floor(peakN / 5) * 5;

        if (m > lastMilestone) {
          lastMilestone = m;
          Audio.milestone();
          addText(I18N.milestone(m), C.W / 2, Math.max(180, C.PLAT_TOP - curH * C.CM - 140), '#ffe14a', 30);
        }
      }

      updateHud();
    }
  }

  let tourT0 = 0;
  let tourDur = 0;
  let tourFrom = 0;
  let tourTopCam = 0;

  function startTour() {
    const bodies = physicsWorld.getBodies();
    let top = C.PLAT_TOP;
    for (const body of bodies) {
      top = Math.min(top, body.bounds.min.y);
    }

    const count = bodies.length;
    const towerHeightCm = Math.max(0, (C.PLAT_TOP - top) / C.CM);

    tourTopCam = Math.max(0, 120 - top - baseCam);
    tourFrom = cam;

    // タワー振り返り時間: 高さや個数に応じて動的に変化
    // 少ない/低いときはサッと短く (1.8秒〜)、高くたくさん積んだ時はじっくり (最大8.5秒)
    const heightFactor = Math.min(4500, towerHeightCm * 52);
    const countFactor = Math.min(3000, count * 160);
    tourDur = Math.max(1800, Math.min(8500, 1800 + heightFactor + countFactor));

    tourT0 = performance.now();

    touring = true;
    overEl.classList.add('hide');
    tourEl.classList.remove('hide');
  }

  function finishTour() {
    if (!touring) return;
    touring = false;
    cam = tourTopCam;
    tourEl.classList.add('hide');
    overEl.classList.remove('hide');
    overEl.scrollTop = 0;
  }

  function updateCamera() {
    if (touring) {
      const p = Math.min(1, (performance.now() - tourT0) / tourDur);
      const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (p < .2) {
        cam = tourFrom * (1 - ease(p / .2));
      } else {
        cam = tourTopCam * ease((p - .2) / .8);
      }
      if (p >= 1) finishTour();
      return;
    }

    if (state === 'over') return;

    const bodies = physicsWorld.getBodies();
    let towerTop = C.PLAT_TOP;
    for (const body of bodies) {
      if (!body.landedAt && body.speed > 0.8) continue;
      if (body.bounds.min.y > C.PLAT_TOP) continue;
      towerTop = Math.min(towerTop, body.bounds.min.y);
    }

    camTarget = Math.max(0, Math.min(380, H * .45) - towerTop - baseCam);
    const lerp = camTarget > cam ? 0.04 : 0.02;
    cam += (camTarget - cam) * lerp;
  }

  function saveFullTower() {
    const bodies = physicsWorld.getBodies();
    let minTop = C.PLAT_TOP;
    for (const b of bodies) {
      if (b.bounds.min.y < minTop) minTop = b.bounds.min.y;
    }

    const padding = 60;
    const towerH = Math.max(200, (C.PLAT_Y + 70) - (minTop - padding));
    const offCanvas = document.createElement('canvas');
    offCanvas.width = C.W;
    offCanvas.height = towerH;
    const offCtx = offCanvas.getContext('2d');

    const g = offCtx.createLinearGradient(0, 0, 0, towerH);
    g.addColorStop(0, '#16213e');
    g.addColorStop(0.6, '#3a2a3f');
    g.addColorStop(1, '#6b3a2a');
    offCtx.fillStyle = g;
    offCtx.fillRect(0, 0, C.W, towerH);

    const shiftY = towerH - (C.PLAT_Y + 70);

    offCtx.save();
    offCtx.translate(0, shiftY);

    const u = 10 * C.CM;
    const maxK = Math.floor((C.PLAT_TOP - minTop + padding) / u);

    offCtx.save();
    offCtx.font = '600 11px sans-serif';
    offCtx.textAlign = 'left';
    offCtx.strokeStyle = 'rgba(255,255,255,.16)';
    offCtx.fillStyle = 'rgba(255,255,255,.45)';
    offCtx.setLineDash([3, 7]);
    offCtx.lineWidth = 1;

    for (let k = 1; k <= maxK; k++) {
      const y = C.PLAT_TOP - k * u;
      offCtx.beginPath();
      offCtx.moveTo(14, y);
      offCtx.lineTo(C.W - 14, y);
      offCtx.stroke();
      offCtx.fillText((k * 10) + ' cm', 18, y - 4);
    }
    offCtx.restore();

    Renderer.drawPlatform(offCtx, C.W, C.PLAT_Y, C.PLAT_TOP, PLAT_W, C.PLAT_H);

    for (const body of bodies) {
      offCtx.save();
      offCtx.translate(body.position.x, body.position.y);
      offCtx.rotate(body.angle);
      offCtx.fillStyle = 'rgba(0,0,0,.18)';
      offCtx.beginPath();
      offCtx.roundRect(-body.spec.w / 2 + 2, -body.spec.h / 2 + 5, body.spec.w, body.spec.h, 6);
      offCtx.fill();
      Renderer.drawSushi(body.spec, offCtx);
      offCtx.restore();
    }

    offCtx.restore();

    offCtx.fillStyle = '#ffd9a0';
    offCtx.font = '800 20px sans-serif';
    offCtx.textAlign = 'center';
    offCtx.shadowColor = '#000';
    offCtx.shadowBlur = 6;
    const titleText = C.isEn
      ? ('🍣 Sushi Tower: ' + peakH.toFixed(1) + 'cm (' + maxN + ' pcs)')
      : ('🍣 寿司タワー: ' + peakH.toFixed(1) + 'cm (' + maxN + '貫)');
    offCtx.fillText(titleText, C.W / 2, 34);

    const pad = n => String(n).padStart(2, '0');
    const d = new Date();
    const ts = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' +
      pad(d.getHours()) + '-' + pad(d.getMinutes()) + '-' + pad(d.getSeconds());

    const a = document.createElement('a');
    a.download = 'sushi-tower-' + ts + '.png';
    a.href = offCanvas.toDataURL('image/png');
    a.click();
  }

  function goTop() {
    state = 'ready';
    touring = false;
    ending = false;

    held = null;
    texts = [];

    cam = 0;
    camTarget = 0;
    flash = 0;

    setPause(false);

    tourEl.classList.add('hide');
    overEl.classList.add('hide');

    resetWorld();

    curH = 0;
    curN = 0;
    peakH = 0;
    peakN = 0;
    maxN = 0;

    resetLimits();
    renderLives();
    updateHud();
    renderRecs();

    startEl.classList.remove('hide');
  }

  function getStageX(e) {
    const rect = stage.getBoundingClientRect();
    return (e.clientX - rect.left) / scale;
  }

  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button') || e.target.closest('a')) return;

    if (touring) {
      finishTour();
      return;
    }

    if (state === 'play' && !paused) {
      if (controlMode === 'auto') {
        dropNow();
      } else {
        // user モード
        isDragging = true;
        const sx = getStageX(e);
        if (held) {
          const pad = held.spec.w / 2 + 10;
          userX = Math.max(pad, Math.min(C.W - pad, sx));
          held.x = userX;
        }
      }
    }
  });

  stage.addEventListener('pointermove', e => {
    if (controlMode === 'user' && isDragging && state === 'play' && !paused && held) {
      const sx = getStageX(e);
      const pad = held.spec.w / 2 + 10;
      userX = Math.max(pad, Math.min(C.W - pad, sx));
      held.x = userX;
    }
  });

  stage.addEventListener('pointerup', () => {
    if (controlMode === 'user' && isDragging) {
      isDragging = false;
      if (state === 'play' && !paused) {
        dropNow();
      }
    }
  });

  stage.addEventListener('pointercancel', () => {
    isDragging = false;
  });

  // メニュー上の言語切り替えボタン
  document.querySelectorAll('.menu-lang-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      switchLanguage(C.isEn ? 'ja' : 'en');
    });
  });

  document.getElementById('pauseBtn').addEventListener('click', () => setPause(!paused));
  document.getElementById('resumeBtn').addEventListener('click', () => setPause(false));
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('againBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
  document.getElementById('topBtn1').addEventListener('click', goTop);
  document.getElementById('topBtn2').addEventListener('click', goTop);
  document.getElementById('viewBtn').addEventListener('click', startTour);

  const sBtn = document.getElementById('saveTowerBtn');
  if (sBtn) sBtn.addEventListener('click', saveFullTower);

  muteBtn.addEventListener('click', () => {
    Audio.toggleMute();
    refreshMute();
    if (!Audio.isMuted()) {
      Audio.ac();
      Audio.drop();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'play') {
      setPause(true);
    }
  });

  window.addEventListener('keydown', e => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (state === 'play') setPause(!paused);
      return;
    }

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keyLeft = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keyRight = true;
    }

    if (e.code === 'Enter') {
      e.preventDefault();
      if (paused) {
        setPause(false);
      } else if (touring) {
        finishTour();
      } else if (state === 'ready' || (state === 'over' && !overEl.classList.contains('hide'))) {
        startGame();
      }
      return;
    }

    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
      e.preventDefault();
      if (touring) {
        finishTour();
      } else if (state === 'play' && !paused) {
        dropNow();
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keyLeft = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keyRight = false;
    }
  });

  refreshMute();

  function drawRuler() {
    const top = -cam - baseCam;
    const bottom = H - cam - baseCam;
    const u = 10 * C.CM;

    const kMin = Math.max(1, Math.ceil((C.PLAT_TOP - bottom) / u));
    const kMax = Math.floor((C.PLAT_TOP - top) / u);

    ctx.save();
    ctx.font = '600 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.setLineDash([3, 7]);
    ctx.lineWidth = 1;

    for (let k = kMin; k <= kMax; k++) {
      const y = C.PLAT_TOP - k * u;
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(C.W - 14, y);
      ctx.stroke();
      ctx.fillText((k * 10) + ' cm', 18, y - 4);
    }
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr * scale, dpr * scale);

    Renderer.drawBackground(ctx, C.W, H);

    ctx.save();
    ctx.translate(0, cam + baseCam);

    Renderer.drawPlatform(ctx, C.W, C.PLAT_Y, C.PLAT_TOP, PLAT_W, C.PLAT_H);
    drawRuler();

    const bodies = physicsWorld.getBodies();
    for (const body of bodies) {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      ctx.fillStyle = 'rgba(0,0,0,.18)';
      Renderer.rr(-body.spec.w / 2 + 2, -body.spec.h / 2 + 5, body.spec.w, body.spec.h, 6, ctx);
      ctx.fill();

      Renderer.drawSushi(body.spec, ctx);
      ctx.restore();
    }

    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.t += C.STEP / 1000;
      if (t.t > 1.2) {
        texts.splice(i, 1);
        continue;
      }
      const p = t.t / 1.2;
      const alpha = p < .2 ? p / .2 : 1 - (p - .2) / .8;
      const dy = Math.sin(p * Math.PI * .5) * 38;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = t.color;
      ctx.font = '800 ' + t.size + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 6;
      ctx.fillText(t.txt, t.x, t.y - dy);
      ctx.restore();
    }

    ctx.restore();

    if (held && state === 'play') {
      const s = held.spec;

      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(held.x, held.y + s.h / 2 + 6);
      ctx.lineTo(held.x, H);
      ctx.stroke();
      ctx.setLineDash([]);

      const topY = held.y - s.h / 2;
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;

      ctx.strokeStyle = '#c8914f';
      ctx.beginPath();
      ctx.moveTo(held.x - 5, 0);
      ctx.lineTo(held.x - s.w * .28, topY + 8);
      ctx.stroke();

      ctx.strokeStyle = '#a9743a';
      ctx.beginPath();
      ctx.moveTo(held.x + 5, 0);
      ctx.lineTo(held.x + s.w * .28, topY + 8);
      ctx.stroke();

      ctx.translate(held.x, held.y);
      Renderer.drawSushi(s, ctx);

      ctx.restore();
    }

    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,80,60,' + (flash * .25) + ')';
      ctx.fillRect(0, 0, C.W, H);
      flash = Math.max(0, flash - 0.05);
    }

    ctx.restore();
  }

  let lastTime = performance.now();

  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(C.STEP * 2, now - lastTime);
    lastTime = now;

    if (!paused) {
      if (state === 'play') {
        tickLimits(now, dt / 1000);
        spawnHeld(now);
        moveHeld();
      }

      Engine.update(engine, C.STEP);
      updateTower(now);
      updateCamera();
    }

    render();
  }

  readRecs();
  loadBest();
  markModes();
  markLevels();
  markControls();
  renderRecs();
  resetLimits();
  renderLives();
  updateHud();

  requestAnimationFrame(loop);
})();
