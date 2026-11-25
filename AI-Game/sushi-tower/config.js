(function () {
  const urlParams = new URLSearchParams(window.location.search);

  let initialLang = 'ja';
  try {
    const saved = localStorage.getItem('sushi-tower-lang');
    if (saved === 'en' || saved === 'ja') {
      initialLang = saved;
    }
  } catch (e) { }

  const paramLang = (urlParams.get('lang') || '').toLowerCase();
  if (paramLang === 'en' || paramLang === 'ja') {
    initialLang = paramLang;
  }

  const BASE_CONFIG = {
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
    SETTLE_MS: 1500,
    BASE_URL: 'https://mono.hamusata.f5.si/AI-Game/sushi-tower/'
  };

  const DICTIONARY = {
    ja: {
      I18N: {
        langCode: 'ja',
        langLine1: '日本語',
        langLine2: 'Japanese',
        langBtnText: '日本語 / Japanese',
        unit: '貫',
        bestLbl: 'ベスト',
        lblMode: 'ゲームモード',
        lblLevel: '難易度',
        lblCtrl: '動作モード',
        pauseTitle: '一時停止',
        pauseBtnTitle: '一時停止 (P)',
        muteBtnTitle: '効果音',
        resumeBtn: '再開',
        restartBtn: '最初からやり直す',
        topBtn: 'トップ画面へ',
        startTitle: '寿司タワー',
        startDesc1: '<b>Enterキー</b>で開始。<br>揺れる寿司を<b>タップ / スペースキー</b>で落として積み上げよう。',
        startDesc2: '<b>秒数モード</b>は制限時間内にどこまで積めるか。<br><b>ライフモード</b>は崩れるとライフが減るよ。<br>台から落ちるとペナルティ。',
        startBtn: 'はじめる (Enter)',
        tourHint: '積んだタワーを振り返り中… タップでスキップ',
        overResLabel: '最高の高さ',
        shareXBtn: '𝕏 で記録をシェア',
        saveTowerBtn: '📷 タワー画像を保存',
        viewBtn: 'タワーを見る',
        againBtn: 'もう一度 (Enter)',
        timeUp: 'タイムアップ！',
        gameOver: 'ゲームオーバー',
        recsTitle: 'ベスト記録 ・ ',
        splash: 'ポチャッ',
        outOfLives: 'ライフがなくなった！',
        collapseTime: '崩れた！ −3秒',
        collapseLife: n => '崩れた！ のこり' + n,
        milestone: m => '✨ ' + m + '貫！',
        newBoth: '🎉 高さ・貫数ともにベスト更新！',
        newH: '🎉 高さのベスト更新！',
        newN: '🎉 貫数のベスト更新！',
        overTitleTime: 'タイムアップ！',
        overTitleLife: 'ゲームオーバー',
        hashtags: '#寿司タワー #SushiTower #寿司を重ねてタワーを高く #ミニゲーム'
      },
      Levels: {
        easy: { label: 'やさしい', w: 240, base: .85, grow: 0, t: 90, lives: 5, note: '台がとても広く、ゆっくり揺れる' },
        normal: { label: 'ふつう', w: 168, base: 1.5, grow: 0, t: 60, lives: 3, note: '台は少し広め、速さも少しゆるめ' },
        hard: { label: 'むずかしい', w: 105, base: 2.3, grow: 0, t: 45, lives: 2, note: '台が狭く、最初から速い' }
      },
      Modes: {
        time: { label: '秒数モード', info: '制限時間（45〜90秒）内に高く積む ・ 崩れると−3秒ペナルティ' },
        life: { label: 'ライフモード', info: '残機モード (2〜5機) ・ 崩れるとライフが1つ減り、0で終了' }
      },
      Ctrls: {
        auto: { label: '自動', info: '寿司が自動で左右に揺れる ・ タップ / スペースで落とす' },
        user: { label: '手動 (キー/ドラッグ)', info: '←/→キーやドラッグで移動 ・ 離す/スペース/タップで落とす' }
      }
    },
    en: {
      I18N: {
        langCode: 'en',
        langLine1: '英語',
        langLine2: 'English',
        langBtnText: '英語 / English',
        unit: ' pcs',
        bestLbl: 'Best',
        lblMode: 'Mode',
        lblLevel: 'Difficulty',
        lblCtrl: 'Control Mode',
        pauseTitle: 'Paused',
        pauseBtnTitle: 'Pause (P)',
        muteBtnTitle: 'Sound',
        resumeBtn: 'Resume',
        restartBtn: 'Restart',
        topBtn: 'Title Screen',
        startTitle: 'Sushi Tower',
        startDesc1: 'Press <b>Enter</b> to start.<br>Drop swinging sushi with <b>Tap / Space</b> to stack!',
        startDesc2: '<b>Time Mode</b>: Stack within time limit.<br><b>Life Mode</b>: Collapses cost a life.<br>Penalty if sushi falls off.',
        startBtn: 'Start (Enter)',
        tourHint: 'Reviewing your tower... Tap to skip',
        overResLabel: 'Peak Height',
        shareXBtn: 'Share on 𝕏',
        saveTowerBtn: 'Save Tower Image',
        viewBtn: 'View Tower',
        againBtn: 'Play Again (Enter)',
        timeUp: 'Time Up!',
        gameOver: 'Game Over',
        recsTitle: 'Best Records ・ ',
        splash: 'Splash',
        outOfLives: 'Out of lives!',
        collapseTime: 'Collapsed! −3s',
        collapseLife: n => 'Collapsed! Left: ' + n,
        milestone: m => '✨ ' + m + ' pcs!',
        newBoth: '🎉 New Record for both Height & Pieces!',
        newH: '🎉 New Record for Height!',
        newN: '🎉 New Record for Pieces!',
        overTitleTime: 'Time Up!',
        overTitleLife: 'Game Over',
        hashtags: '#SushiTower #寿司タワー #寿司を重ねてタワーを高く #MiniGame'
      },
      Levels: {
        easy: { label: 'Easy', w: 240, base: .85, grow: 0, t: 90, lives: 5, note: 'Very wide plate, slow swing' },
        normal: { label: 'Normal', w: 168, base: 1.5, grow: 0, t: 60, lives: 3, note: 'Moderate plate, moderate swing' },
        hard: { label: 'Hard', w: 105, base: 2.3, grow: 0, t: 45, lives: 2, note: 'Narrow plate, fast swing' }
      },
      Modes: {
        time: { label: 'Time Mode', info: 'Stack within time limit (45-90s) ・ −3s when collapsed' },
        life: { label: 'Life Mode', info: 'Life mode (2-5 lives) ・ Collapsing loses a life, game over at 0' }
      },
      Ctrls: {
        auto: { label: 'Auto', info: 'Sushi swings automatically ・ Tap / Space to drop' },
        user: { label: 'Manual (Keys/Drag)', info: 'Move with ←/→ keys or drag ・ Drop on release / Space / Tap' }
      }
    }
  };

  window.SushiConfig = Object.assign({}, BASE_CONFIG, {
    lang: initialLang,
    isEn: initialLang === 'en'
  });

  function applyLangData(lang) {
    const data = DICTIONARY[lang] || DICTIONARY.ja;
    window.SushiConfig.lang = lang;
    window.SushiConfig.isEn = (lang === 'en');
    window.SushiI18N = data.I18N;
    window.SushiLevels = data.Levels;
    window.SushiModes = data.Modes;
    window.SushiCtrls = data.Ctrls;

    document.documentElement.lang = lang;
    document.title = (lang === 'en') ? 'Sushi Tower - @hamusata' : '寿司タワー - @hamusata';
  }

  window.SushiDictionary = DICTIONARY;
  window.SushiApplyLangData = applyLangData;

  applyLangData(initialLang);
})();
