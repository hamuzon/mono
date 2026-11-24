(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const isEn = (urlParams.get('lang') || '').toLowerCase() === 'en';

  window.SushiConfig = {
    isEn: isEn,
    W: 420,
    H_DEFAULT: 720,
    PLAT_Y: 650,
    PLAT_H: 18,
    PLAT_TOP: 650 - 9,
    CM: 12,
    STEP: 1000 / 60,
    FALL_TIME_WINDOW: 1800,
    FALL_LIFE_WINDOW: 700,
    FALL_PENALTY: 3,
    SETTLE_MS: 1500
  };

  if (!isEn && window.location.search) {
    try {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
    } catch (e) { }
  }

  if (isEn) {
    document.documentElement.lang = 'en';
    document.title = 'Sushi Tower';
  }

  window.SushiI18N = {
    unit: isEn ? ' pcs' : '貫',
    bestLbl: isEn ? 'Best' : 'ベスト',
    lblMode: isEn ? 'Mode' : 'ゲームモード',
    lblLevel: isEn ? 'Difficulty' : '難易度',
    lblCtrl: isEn ? 'Control' : '動作モード',
    pauseTitle: isEn ? 'Paused' : '一時停止',
    pauseBtnTitle: isEn ? 'Pause (P)' : '一時停止 (P)',
    muteBtnTitle: isEn ? 'Sound' : '効果音',
    resumeBtn: isEn ? 'Resume' : '再開',
    restartBtn: isEn ? 'Restart' : '最初からやり直す',
    topBtn: isEn ? 'Title Screen' : 'トップ画面へ',
    startTitle: isEn ? 'Sushi Tower' : '寿司タワー',
    startDesc1: isEn
      ? 'Press <b>Enter</b> to start.<br>Drop swinging sushi with <b>Tap / Space</b> to stack!'
      : '<b>Enterキー</b>で開始。<br>揺れる寿司を<b>タップ / スペースキー</b>で落として積み上げよう。',
    startDesc2: isEn
      ? '<b>Time Mode</b>: Stack within time limit.<br><b>Life Mode</b>: Collapses cost a life.<br>Penalty if sushi falls off.'
      : '<b>秒数モード</b>は制限時間内にどこまで積めるか。<br><b>ライフモード</b>は崩れるとライフが減るよ。<br>台から落ちるとペナルティ。',
    startBtn: isEn ? 'Start (Enter)' : 'はじめる (Enter)',
    tourHint: isEn ? 'Reviewing your tower... Tap to skip' : '積んだタワーを振り返り中… タップでスキップ',
    overResLabel: isEn ? 'Peak Height' : '最高の高さ',
    shareXBtn: isEn ? 'Share on 𝕏' : '𝕏 で記録をシェア',
    saveTowerBtn: isEn ? 'Save Tower Image' : '📷 タワー画像を保存',
    viewBtn: isEn ? 'View Tower' : 'タワーを見る',
    againBtn: isEn ? 'Play Again (Enter)' : 'もう一度 (Enter)',
    timeUp: isEn ? 'Time Up!' : 'タイムアップ！',
    gameOver: isEn ? 'Game Over' : 'ゲームオーバー',
    recsTitle: isEn ? 'Best Records ・ ' : 'ベスト記録 ・ ',
    splash: isEn ? 'Splash' : 'ポチャッ',
    outOfLives: isEn ? 'Out of lives!' : 'ライフがなくなった！',
    collapseTime: isEn ? ('Collapsed! −3s') : ('崩れた！ −3秒'),
    collapseLife: n => isEn ? ('Collapsed! Left: ' + n) : ('崩れた！ のこり' + n),
    milestone: m => isEn ? ('✨ ' + m + ' pcs!') : ('✨ ' + m + '貫！'),
    newBoth: isEn ? '🎉 New Record for both Height & Pieces!' : '🎉 高さ・貫数ともにベスト更新！',
    newH: isEn ? '🎉 New Record for Height!' : '🎉 高さのベスト更新！',
    newN: isEn ? '🎉 New Record for Pieces!' : '🎉 貫数のベスト更新！',
    overTitleTime: isEn ? 'Time Up!' : 'タイムアップ！',
    overTitleLife: isEn ? 'Game Over' : 'ゲームオーバー',
    shareUrl: 'https://mono.hamusata.f5.si/AI-Game/sushi-tower/',
    hashtags: isEn ? '#SushiTower #MiniGame' : '#寿司タワー #SushiTower #寿司を重ねてタワーを高く #ミニゲーム'
  };

  window.SushiLevels = isEn ? {
    easy: { label: 'Easy', w: 240, base: .85, grow: 0, t: 90, lives: 5, note: 'Very wide plate, slow swing' },
    normal: { label: 'Normal', w: 168, base: 1.5, grow: 0, t: 60, lives: 3, note: 'Moderate plate, moderate swing' },
    hard: { label: 'Hard', w: 105, base: 2.3, grow: 0, t: 45, lives: 2, note: 'Narrow plate, fast swing' }
  } : {
    easy: { label: 'やさしい', w: 240, base: .85, grow: 0, t: 90, lives: 5, note: '台がとても広く、ゆっくり揺れる' },
    normal: { label: 'ふつう', w: 168, base: 1.5, grow: 0, t: 60, lives: 3, note: '台は少し広め、速さも少しゆるめ' },
    hard: { label: 'むずかしい', w: 105, base: 2.3, grow: 0, t: 45, lives: 2, note: '台が狭く、最初から速い' }
  };

  window.SushiModes = isEn ? {
    time: { label: 'Time Mode', info: 'Stack within time limit (45-90s) ・ −3s when collapsed' },
    life: { label: 'Life Mode', info: 'Life mode (2-5 lives) ・ Collapsing loses a life, game over at 0' }
  } : {
    time: { label: '秒数モード', info: '制限時間（45〜90秒）内に高く積む ・ 崩れると−3秒ペナルティ' },
    life: { label: 'ライフモード', info: '残機モード (2〜5機) ・ 崩れるとライフが1つ減り、0で終了' }
  };

  window.SushiCtrls = isEn ? {
    auto: { label: 'Auto', info: 'Sushi swings automatically ・ Tap / Space to drop' },
    user: { label: 'User Control', info: 'Move with ←/→ keys or Drag ・ Space / Tap to drop' }
  } : {
    auto: { label: '自動', info: '寿司が自動で左右に揺れる ・ タップ / スペースで落とす' },
    user: { label: '手動操作 (キーボード/TAP)', info: '←/→キーやドラッグで寿司を移動 ・ スペース / 離す / タップで落とす' }
  };
})();