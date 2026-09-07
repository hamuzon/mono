const video = document.getElementById('video');
video.setAttribute('playsinline', '');
video.setAttribute('webkit-playsinline', '');
const canvas = document.getElementById('captureCanvas');
const ctx = canvas.getContext('2d');
const settingsPanel = document.getElementById('settingsPanel');
const zoomRange = document.getElementById('zoomRange');
const exposureRange = document.getElementById('exposureRange');
const btnTorch = document.getElementById('btnTorch');
const btnTimer = document.getElementById('btnTimer');
const galleryPreview = document.getElementById('galleryPreview');
const recordingUI = document.getElementById('recordingUI');
const aboutPanel = document.getElementById('aboutPanel');
const permissionStatusEl = document.getElementById('permissionStatus');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const previewFileList = document.getElementById('previewFileList');
const zoomToast = document.getElementById('zoomToast');

const translations = {
  en: {
    title: "Camera App",
    settingsTitle: "Settings",
    done: "Done",
    language: "Language",
    resolution: "Resolution",
    resolutionIdeal: "4K (Ideal)",
    resolutionFHD: "Full HD",
    resolutionHD: "HD",
    aspectRatio: "Aspect Ratio",
    aspectAuto: "Auto (Device)",
    aspectSensor: "Sensor (Native)",
    filter: "Filter",
    filterNone: "None",
    filterBW: "B&W",
    filterSepia: "Sepia",
    filterHighContrast: "High Contrast",
    filterVivid: "Vivid",
    filterInvert: "Invert",
    timer: "Timer (seconds)",
    timerOff: "Off",
    mirrorFrontCamera: "Mirror Front Camera",
    yes: "Yes",
    no: "No",
    format: "Format",
    recordAudio: "Record audio in video mode",
    permissionStatus: "Permissions status",
    permissionUnknown: "Camera: unknown / Mic: unknown",
    permissionStateLine: "Camera: {camera} / Mic: {microphone}",
    retryCameraPermission: "Retry camera permission",
    retryMicPermission: "Retry microphone permission",
    permissionGranted: "granted",
    permissionDenied: "denied",
    permissionPrompt: "prompt",
    permissionUnavailable: "unavailable",
    filePrefix: "Saved file name prefix",
    saveLocation: "Save location (supported browsers only)",
    chooseFolder: "Choose folder",
    clearFolder: "Clear folder",
    saveDirNotSet: "Folder: not selected",
    saveDirReady: "Folder: {name}",
    on: "On",
    off: "Off",
    resetAllSettings: "Reset All Settings",
    cameraError: "Camera Error: ",
    cameraPermissionError: "Camera access is denied. Please allow camera permission and retry.",
    micPermissionError: "Microphone access is denied. Please allow microphone permission and retry.",
    audioFallback: "Microphone permission failed. Continuing with video-only recording.",
    saveFolderUnavailable: "Folder save is not supported in this browser. Using normal download.",
    filePreview: "File preview",
    choosePreviewFile: "Choose image / video",
    folderPreviewEmpty: "No previewable files in selected folder.",
    folderPreviewError: "Could not read files from selected folder.",
    recordingUnsupported: "Video recording is not supported on this browser/device.",
    recordingNoStream: "Camera stream is not ready yet.",
    resetConfirm: "Reset all settings?",
    footerText: "Camera App",
    aboutAndLicenses: "About & Licenses",
    appDescription: "A simple camera web application.",
    turnCameraOffTitle: "Turn Camera Off",
  },
  ja: {
    title: "Camera App",
    settingsTitle: "設定",
    done: "完了",
    language: "言語",
    resolution: "解像度",
    resolutionIdeal: "4K (最高)",
    resolutionFHD: "フルHD",
    resolutionHD: "HD",
    aspectRatio: "アスペクト比",
    aspectAuto: "自動（端末に合わせる）",
    aspectSensor: "センサー（ネイティブ）",
    filter: "フィルター",
    filterNone: "なし",
    filterBW: "白黒",
    filterSepia: "セピア",
    filterHighContrast: "ハイコントラスト",
    filterVivid: "ビビッド",
    filterInvert: "反転",
    timer: "タイマー (秒)",
    timerOff: "オフ",
    mirrorFrontCamera: "フロントカメラを反転",
    yes: "はい",
    no: "いいえ",
    format: "フォーマット",
    recordAudio: "動画モードで音声を録音",
    permissionStatus: "権限の状態",
    permissionUnknown: "カメラ：不明 / マイク：不明",
    permissionStateLine: "カメラ：{camera} / マイク：{microphone}",
    retryCameraPermission: "カメラ権限を再取得",
    retryMicPermission: "マイク権限を再取得",
    permissionGranted: "許可",
    permissionDenied: "拒否",
    permissionPrompt: "確認待ち",
    permissionUnavailable: "未対応",
    filePrefix: "保存ファイル名の接頭辞",
    saveLocation: "保存先（対応ブラウザのみ）",
    chooseFolder: "フォルダを選択",
    clearFolder: "フォルダを解除",
    saveDirNotSet: "フォルダ：未選択",
    saveDirReady: "フォルダ：{name}",
    on: "オン",
    off: "オフ",
    resetAllSettings: "すべての設定をリセット",
    cameraError: "カメラエラー：",
    cameraPermissionError: "カメラ権限が拒否されています。許可後に再取得してください。",
    micPermissionError: "マイク権限が拒否されています。許可後に再取得してください。",
    audioFallback: "マイク権限を取得できなかったため、映像のみで録画します。",
    saveFolderUnavailable: "このブラウザはフォルダ保存に対応していません。通常ダウンロードを使用します。",
    filePreview: "ファイルプレビュー",
    choosePreviewFile: "画像 / 動画を選択",
    folderPreviewEmpty: "選択フォルダにプレビュー可能なファイルがありません。",
    folderPreviewError: "選択フォルダのファイルを読み取れませんでした。",
    recordingUnsupported: "このブラウザ / 端末では動画録画に対応していません。",
    recordingNoStream: "カメラ映像の準備ができていません。",
    resetConfirm: "すべての設定をリセットしますか？",
    footerText: "Camera App",
    aboutAndLicenses: "このアプリについて",
    appDescription: "シンプルなウェブカメラアプリケーションです。",
    turnCameraOffTitle: "カメラをオフにする",
  }
};

let stream = null;
let microphoneStream = null;
let videoTrack = null;
let facingMode = 'environment';
let torchState = false;
let capabilities = {};
let settings = {
  resolution: 'fhd',
  aspect: 'auto',
  filter: 'none',
  timer: 0,
  mirror: 'yes',
  format: 'image/jpeg',
  recordAudio: 'off',
  filePrefix: 'CameraApp',
  lang: 'en',
  cameraState: 'off'
};
let currentLang = settings.lang;
let currentMode = 'photo';
let mediaRecorder = null;
let recordedChunks = [];
let recordStartTime = 0;
let recordInterval = null;
let preferredDirectoryHandle = null;
let zoomToastTimer = null;
let preferredRearDeviceId = null;
let hasProbedRearZoom = false;

function getTimestampWithMilliseconds() {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}.${ms}`;
}

function setLanguage(lang) {
  if (!translations[lang]) lang = 'en';
  currentLang = lang;
  document.documentElement.lang = lang;
  const langStrings = translations[lang];
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.dataset.translate;
    if (langStrings[key]) {
      el.textContent = langStrings[key];
    }
  });
  document.querySelectorAll('[data-translate-title]').forEach(el => {
    const key = el.dataset.translateTitle;
    if (langStrings[key]) {
      el.title = langStrings[key];
    }
  });
  document.title = langStrings.title;
  updateFooter();
  updateSaveDirStatus();
  refreshPermissionStatus();
}

function loadSettings() {
  const saved = localStorage.getItem('cameraSettings');
  if (saved) {
    const savedSettings = JSON.parse(saved);
    if (!savedSettings.lang) {
      const browserLang = navigator.language.split('-')[0];
      savedSettings.lang = translations[browserLang] ? browserLang : 'en';
    }
    settings = { ...settings, ...savedSettings };
    if (settings.cameraState !== 'on' && settings.cameraState !== 'off') {
      settings.cameraState = 'on';
    }
  }
  document.getElementById('selLang').value = settings.lang;
  document.getElementById('selResolution').value = settings.resolution;
  const aspectMap = {
    '1.777': '16:9',
    '1.333': '4:3',
    '1': '1:1'
  };
  if (typeof settings.aspect === 'number') {
    settings.aspect = aspectMap[String(settings.aspect)] || 'auto';
  } else if (aspectMap[settings.aspect]) {
    settings.aspect = aspectMap[settings.aspect];
  }
  document.getElementById('selAspect').value = settings.aspect || 'auto';
  document.getElementById('selFilter').value = settings.filter;
  document.getElementById('selTimer').value = settings.timer;
  document.getElementById('selMirror').value = settings.mirror;
  document.getElementById('selFormat').value = settings.format;
  document.getElementById('selRecordAudio').value = settings.recordAudio;
  document.getElementById('txtFilePrefix').value = settings.filePrefix;
  setLanguage(settings.lang);
  applyFilter();
  if (settings.timer > 0) {
    btnTimer.textContent = settings.timer + 's';
  } else {
    btnTimer.innerHTML = '<span class="material-symbols-outlined">timer</span>';
  }
}

function persistSettings() {
  settings.lang = document.getElementById('selLang').value;
  settings.resolution = document.getElementById('selResolution').value;
  settings.aspect = document.getElementById('selAspect').value;
  settings.filter = document.getElementById('selFilter').value;
  settings.timer = parseInt(document.getElementById('selTimer').value);
  settings.mirror = document.getElementById('selMirror').value;
  settings.format = document.getElementById('selFormat').value;
  settings.recordAudio = document.getElementById('selRecordAudio').value;
  settings.filePrefix = sanitizeFilePrefix(document.getElementById('txtFilePrefix').value);
  document.getElementById('txtFilePrefix').value = settings.filePrefix;
  localStorage.setItem('cameraSettings', JSON.stringify(settings));
}

function sanitizeFilePrefix(raw) {
  const cleaned = (raw || '').trim().replace(/[\\/:*?"<>|]/g, '_');
  return cleaned || 'CameraApp';
}

function getFileName(prefix, ext) {
  return `${sanitizeFilePrefix(prefix)}_${getTimestampWithMilliseconds()}.${ext}`;
}

async function saveBlob(blob, filename) {
  if (preferredDirectoryHandle && 'showDirectoryPicker' in window) {
    try {
      const fileHandle = await preferredDirectoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('Directory save failed, fallback to browser download.', err);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  return url;
}

function updateSaveDirStatus() {
  const statusEl = document.getElementById('saveDirStatus');
  const t = translations[currentLang];
  if (!statusEl || !t) return;
  if (preferredDirectoryHandle?.name) {
    statusEl.textContent = t.saveDirReady.replace('{name}', preferredDirectoryHandle.name);
  } else {
    statusEl.textContent = t.saveDirNotSet;
  }
}

async function pickSaveDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alert(translations[currentLang].saveFolderUnavailable);
    return;
  }
  try {
    preferredDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    updateSaveDirStatus();
  } catch (err) {
    console.warn('Directory selection canceled or failed.', err);
  }
}

function clearSaveDirectory() {
  preferredDirectoryHandle = null;
  updateSaveDirStatus();
}


function setCameraUiState(isOn) {
  document.querySelector('.overlay').style.display = isOn ? 'flex' : 'none';
  document.getElementById('cameraOffOverlay').style.display = isOn ? 'none' : 'flex';
  document.body.classList.toggle('camera-off-state', !isOn);
}

function renderPreview(url, type) {
  previewContent.innerHTML = '';
  const mediaType = type || 'image/*';
  const el = document.createElement(mediaType.startsWith('video/') ? 'video' : 'img');
  el.id = 'previewMedia';
  el.src = url;
  if (el.tagName.toLowerCase() === 'video') {
    el.controls = true;
    el.playsInline = true;
    el.autoplay = true;
  }
  previewContent.appendChild(el);
  previewModal.style.display = 'flex';
}

async function previewFromFileHandle(fileHandle, buttonEl) {
  const file = await fileHandle.getFile();
  const url = URL.createObjectURL(file);
  renderPreview(url, file.type || 'image/*');
  if (buttonEl) {
    previewFileList.querySelectorAll('.preview-file-item').forEach(el => el.classList.remove('active'));
    buttonEl.classList.add('active');
  }
}

async function previewFolderFiles() {
  if (!preferredDirectoryHandle) return false;
  previewFileList.innerHTML = '';
  const fileHandles = [];
  try {
    for await (const entry of preferredDirectoryHandle.values()) {
      if (entry.kind === 'file') fileHandles.push(entry);
    }
  } catch (err) {
    alert(translations[currentLang].folderPreviewError);
    return true;
  }

  const previewable = [];
  for (const fh of fileHandles) {
    try {
      const f = await fh.getFile();
      if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
        previewable.push({ handle: fh, name: f.name, type: f.type });
      }
    } catch (_) {}
  }

  if (!previewable.length) {
    alert(translations[currentLang].folderPreviewEmpty);
    return true;
  }

  previewable.sort((a, b) => b.name.localeCompare(a.name));
  previewFileList.style.display = 'flex';

  previewable.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `preview-file-item${index === 0 ? ' active' : ''}`;
    const ext = item.name.includes('.') ? item.name.split('.').pop().toUpperCase() : (item.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
    btn.innerHTML = `<span class="preview-file-name">${item.name}</span><span class="preview-file-type">${ext}</span>`;
    btn.title = item.name;
    btn.onclick = async () => {
      await previewFromFileHandle(item.handle, btn);
    };
    previewFileList.appendChild(btn);
  });

  await previewFromFileHandle(previewable[0].handle, previewFileList.querySelector('.preview-file-item'));
  return true;
}

async function previewLatestMedia() {
  const openedFromFolder = await previewFolderFiles();
  if (openedFromFolder) return;

  previewFileList.style.display = 'none';
  const latest = galleryPreview.querySelector('img, video');
  if (!latest || !latest.src) return;
  renderPreview(latest.src, latest.tagName.toLowerCase() === 'video' ? 'video/webm' : 'image/jpeg');
}

function closePreviewModal() {
  const previewVideo = previewContent.querySelector('video');
  if (previewVideo) previewVideo.pause();
  previewFileList.style.display = 'none';
  previewFileList.innerHTML = '';
  previewModal.style.display = 'none';
}

previewModal.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const items = [...previewFileList.querySelectorAll('.preview-file-item')];
    const active = previewFileList.querySelector('.preview-file-item.active');
    let nextIndex = items.indexOf(active) + (e.key === 'ArrowDown' ? 1 : -1);
    if (nextIndex < 0) nextIndex = items.length - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    items[nextIndex]?.click();
    items[nextIndex]?.scrollIntoView({ block: 'nearest' });
  }
});

function openPreviewFilePicker() {
  previewFileList.style.display = 'none';
  previewFileList.innerHTML = '';
  document.getElementById('filePicker').click();
}



function showZoomToast(zoomValue) {
  if (!zoomToast) return;
  zoomToast.textContent = `${Number(zoomValue).toFixed(1)}x`;
  zoomToast.style.display = 'block';
  if (zoomToastTimer) clearTimeout(zoomToastTimer);
  zoomToastTimer = setTimeout(() => {
    zoomToast.style.display = 'none';
  }, 1500);
}

function resolveAspectRatio(vw, vh) {
  const selected = settings.aspect;
  if (selected === 'sensor') return null;
  if (selected === 'auto') {
    const screenRatio = window.innerWidth && window.innerHeight ? (window.innerWidth / window.innerHeight) : (vw / vh);
    return Math.max(0.5, Math.min(2.0, screenRatio));
  }
  const [w, h] = String(selected).split(':').map(Number);
  if (w > 0 && h > 0) return w / h;
  return 16 / 9;
}

function cropToAspect(vw, vh, aspectRatio) {
  if (!aspectRatio) return { cw: vw, ch: vh };
  let cw = vw;
  let ch = vh;
  if (vw / vh > aspectRatio) cw = vh * aspectRatio;
  else ch = vw / aspectRatio;
  return { cw, ch };
}

function mapPermissionState(state) {
  const t = translations[currentLang];
  if (state === 'granted') return t.permissionGranted;
  if (state === 'denied') return t.permissionDenied;
  if (state === 'prompt') return t.permissionPrompt;
  return t.permissionUnavailable;
}

async function refreshPermissionStatus() {
  const t = translations[currentLang];
  if (!permissionStatusEl || !navigator.permissions?.query) {
    if (permissionStatusEl) permissionStatusEl.textContent = t.permissionUnknown;
    return;
  }
  let cameraState = 'unavailable';
  let micState = 'unavailable';
  try {
    cameraState = (await navigator.permissions.query({ name: 'camera' })).state;
  } catch (_) {}
  try {
    micState = (await navigator.permissions.query({ name: 'microphone' })).state;
  } catch (_) {}
  permissionStatusEl.textContent = t.permissionStateLine
    .replace('{camera}', mapPermissionState(cameraState))
    .replace('{microphone}', mapPermissionState(micState));
}

async function retryCameraPermission() {
  settings.cameraState = 'on';
  persistSettings();
  setCameraUiState(true);
  await startCamera();
  await refreshPermissionStatus();
}

async function retryMicPermission() {
  try {
    if (microphoneStream) microphoneStream.getTracks().forEach(t => t.stop());
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false
    });
  } catch (err) {
    const isDenied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError';
    alert(isDenied ? translations[currentLang].micPermissionError : `${translations[currentLang].cameraError}${err.message}`);
  }
  if (settings.recordAudio === 'on') await startCamera();
  await refreshPermissionStatus();
}

function saveSettings() {
  persistSettings();
  if (settings.recordAudio !== 'on' && microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
  setLanguage(settings.lang);
  applyFilter();
  startCamera();
}

function applyFilter() {
  video.style.filter = settings.filter;
  if (settings.mirror === 'yes' && facingMode === 'user') {
    video.style.transform = 'scaleX(-1)';
  } else {
    video.style.transform = 'none';
  }
}


async function pickBestRearCameraByZoom() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  let devices = [];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch (_) {
    return;
  }

  const videoInputs = devices.filter(d => d.kind === 'videoinput');
  const rearCandidates = videoInputs.filter(d => /back|rear|environment|wide|ultra|tele/i.test(d.label || ''));
  const targets = rearCandidates.length ? rearCandidates : videoInputs;
  if (!targets.length) return;

  let best = null;
  for (const device of targets) {
    let probeStream = null;
    try {
      probeStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: device.deviceId } }
      });
      const track = probeStream.getVideoTracks()[0];
      const caps = track?.getCapabilities ? track.getCapabilities() : {};
      const minZoom = caps.zoom?.min ?? 1;
      const maxZoom = caps.zoom?.max ?? 1;
      const score = maxZoom - minZoom;
      if (!best || score > best.score || (score === best.score && maxZoom > best.maxZoom)) {
        best = { deviceId: device.deviceId, score, maxZoom };
      }
    } catch (_) {
      // Ignore non-accessible camera probes
    } finally {
      if (probeStream) probeStream.getTracks().forEach(t => t.stop());
    }
  }

  if (best?.deviceId) preferredRearDeviceId = best.deviceId;
}

async function startCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }

  if (facingMode === 'environment' && !hasProbedRearZoom) {
    await pickBestRearCameraByZoom();
    hasProbedRearZoom = true;
  }

  const baseVideoConstraints = {
    width: { ideal: settings.resolution === '4k' ? 3840 : (settings.resolution === 'fhd' ? 1920 : 1280) },
    height: { ideal: settings.resolution === '4k' ? 2160 : (settings.resolution === 'fhd' ? 1080 : 720) }
  };

  const constraints = {
    // Request the microphone only when recording starts. This is a user gesture,
    // which avoids browsers dropping the audio track from an initial camera request.
    audio: false,
    video: facingMode === 'environment' && preferredRearDeviceId
      ? { ...baseVideoConstraints, deviceId: { exact: preferredRearDeviceId } }
      : { ...baseVideoConstraints, facingMode: facingMode }
  };

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    videoTrack = stream.getVideoTracks()[0];
    
    await new Promise(r => video.onloadedmetadata = r);
    
    capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
    
    const zoomSliderContainer = document.getElementById('zoomSliderContainer');
    const exposureSliderContainer = document.getElementById('exposureSliderContainer');
    zoomSliderContainer.classList.add('hidden');
    exposureSliderContainer.classList.add('hidden');
    
    if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
      zoomSliderContainer.classList.remove('hidden');
      zoomRange.min = capabilities.zoom.min;
      zoomRange.max = capabilities.zoom.max;
      zoomRange.step = capabilities.zoom.step;
      zoomRange.value = videoTrack.getSettings().zoom || 1;
      zoomRange.oninput = () => {
        videoTrack.applyConstraints({ advanced: [{ zoom: zoomRange.value }] });
        showZoomToast(zoomRange.value);
      };
      document.getElementById('resetZoomBtn').onclick = () => {
        const defaultZoom = Number(capabilities.zoom?.min ?? 1);
        zoomRange.value = defaultZoom;
        videoTrack.applyConstraints({ advanced: [{ zoom: defaultZoom }] });
        showZoomToast(defaultZoom);
      };
    }

    if (capabilities.exposureCompensation && capabilities.exposureCompensation.max > capabilities.exposureCompensation.min) {
      exposureSliderContainer.classList.remove('hidden');
      exposureRange.min = capabilities.exposureCompensation.min;
      exposureRange.max = capabilities.exposureCompensation.max;
      exposureRange.step = capabilities.exposureCompensation.step;
      exposureRange.value = videoTrack.getSettings().exposureCompensation || 0;
      exposureRange.oninput = () => videoTrack.applyConstraints({ advanced: [{ exposureCompensation: exposureRange.value }] });
      document.getElementById('resetExposureBtn').onclick = () => {
        const defaultExposure = 0;
        exposureRange.value = defaultExposure;
        videoTrack.applyConstraints({ advanced: [{ exposureCompensation: defaultExposure }] });
      };
    }

    if (capabilities.torch) {
      btnTorch.classList.remove('hidden');
    } else {
      btnTorch.classList.add('hidden');
    }

  } catch (e) {
    console.error(e);
    const isDenied = e?.name === 'NotAllowedError' || e?.name === 'SecurityError';
    alert(isDenied ? translations[currentLang].cameraPermissionError : (translations[currentLang].cameraError + e.message));
  } finally {
    refreshPermissionStatus();
  }
}

async function toggleTorch() {
  if (!videoTrack) return;
  torchState = !torchState;
  try {
    await videoTrack.applyConstraints({ advanced: [{ torch: torchState }] });
    btnTorch.style.color = torchState ? '#ffeb3b' : 'white';
  } catch (e) {
    torchState = !torchState;
  }
}

function turnCameraOff() {
  settings.cameraState = 'off';
  persistSettings();
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (microphoneStream) microphoneStream.getTracks().forEach(t => t.stop());
  microphoneStream = null;
  setCameraUiState(false);
}

function turnCameraOn() {
  settings.cameraState = 'on';
  persistSettings();
  setCameraUiState(true);
  startCamera();
}

function switchCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  torchState = false;
  btnTorch.style.color = 'white';
  startCamera();
}

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`).classList.add('active');

  const shutter = document.getElementById('shutterBtn');
  shutter.style.display = 'flex';
  shutter.style.borderColor = 'white';
  shutter.innerHTML = '';
  
  if (mode === 'video') {
    shutter.style.borderColor = 'red';
    shutter.style.backgroundColor = 'transparent';
  } else {
    shutter.classList.remove('recording');
  }
}

function triggerShutter() {
  if (currentMode === 'video') {
    toggleRecording();
    return;
  }

  if (settings.timer > 0) {
    let count = settings.timer;
    btnTimer.textContent = count;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        btnTimer.innerHTML = '<span class="material-symbols-outlined">timer</span>';
        capture();
      } else {
        btnTimer.textContent = count;
      }
    }, 1000);
  } else {
    capture();
  }
}

function capture() {
  const flash = document.getElementById('flashOverlay');
  flash.style.opacity = 1;
  setTimeout(() => flash.style.opacity = 0, 100);

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  
  const aspectRatio = resolveAspectRatio(vw, vh);
  const { cw, ch } = cropToAspect(vw, vh, aspectRatio);

  canvas.width = cw;
  canvas.height = ch;

  const sx = (vw - cw) / 2;
  const sy = (vh - ch) / 2;

  ctx.filter = settings.filter;
  
  if (settings.mirror === 'yes' && facingMode === 'user') {
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, sx, sy, cw, ch, 0, 0, cw, ch);

  canvas.toBlob(async blob => {
    const fileName = getFileName(settings.filePrefix, settings.format.split('/')[1]);
    const url = await saveBlob(blob, fileName);
    
    const img = document.createElement('img');
    img.src = url;
    galleryPreview.innerHTML = '';
    galleryPreview.appendChild(img);
  }, settings.format, 0.95);
}

function getRecordingMimeType(hasAudio) {
  const preferredMimeTypes = hasAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=opus',
        'video/webm'
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];

  for (const mimeType of preferredMimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return '';
}

async function getRecordingAudioTrack() {
  if (settings.recordAudio !== 'on') return null;

  const cameraAudioTrack = stream?.getAudioTracks().find(track => track.readyState === 'live');
  if (cameraAudioTrack) return cameraAudioTrack;

  const existingTrack = microphoneStream?.getAudioTracks().find(track => track.readyState === 'live');
  if (existingTrack) return existingTrack;

  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false
    });
    return microphoneStream.getAudioTracks().find(track => track.readyState === 'live') || null;
  } catch (err) {
    console.warn('Microphone access failed; recording video without audio.', err);
    alert(translations[currentLang].audioFallback);
    refreshPermissionStatus();
    return null;
  }
}

async function getRecordingStreamAndMimeType() {
  if (!stream) return null;
  const videoTracks = stream.getVideoTracks();
  if (!videoTracks.length) return null;

  const tracks = [videoTracks[0]];
  const audioTrack = await getRecordingAudioTrack();
  const hasAudio = Boolean(audioTrack);
  if (audioTrack) tracks.push(audioTrack);

  const recordingStream = new MediaStream(tracks);
  const mimeType = getRecordingMimeType(hasAudio);
  return { recordingStream, mimeType };
}

async function toggleRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    clearInterval(recordInterval);
    recordingUI.style.display = 'none';
    const shutterBtn = document.getElementById('shutterBtn');
    shutterBtn.style.backgroundColor = 'transparent';
    if (capabilities.zoom) {
      document.getElementById('zoomSliderContainer').classList.remove('hidden');
    }
    shutterBtn.classList.remove('recording');
    return;
  }

  const result = await getRecordingStreamAndMimeType();
  if (!result || !result.recordingStream) {
    alert(translations[currentLang].recordingNoStream);
    return;
  }

  const { recordingStream, mimeType } = result;
  recordedChunks = [];

  try {
    mediaRecorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream);
  } catch (e) {
    console.error(e);
    alert(translations[currentLang].recordingUnsupported);
    return;
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = async () => {
    const blobType = mediaRecorder?.mimeType || 'video/webm';
    const blob = new Blob(recordedChunks, { type: blobType });
    const url = await saveBlob(blob, getFileName(settings.filePrefix || 'Video', 'webm'));

    const videoEl = document.createElement('video');
    videoEl.src = url;
    videoEl.muted = true;
    videoEl.onloadeddata = () => videoEl.currentTime = 0;
    galleryPreview.innerHTML = '';
    galleryPreview.appendChild(videoEl);
  };

  mediaRecorder.start();
  recordStartTime = Date.now();
  recordingUI.style.display = 'flex';
  const shutterBtn = document.getElementById('shutterBtn');
  shutterBtn.style.backgroundColor = 'red';
  if (capabilities.zoom) {
    document.getElementById('zoomSliderContainer').classList.remove('hidden');
  }
  shutterBtn.classList.add('recording');

  recordInterval = setInterval(() => {
    const diff = Date.now() - recordStartTime;
    const sec = Math.floor(diff / 1000) % 60;
    const min = Math.floor(diff / 60000);
    document.getElementById('recordTimer').textContent =
      `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }, 1000);
}

function openSettings() { settingsPanel.style.display = 'block'; }
function closeSettings() { settingsPanel.style.display = 'none'; saveSettings(); }
function openAboutPanel() { aboutPanel.style.display = 'block'; updateFooter(); }
function closeAboutPanel() { aboutPanel.style.display = 'none'; }
function resetApp() {
  if(confirm(translations[currentLang].resetConfirm)) {
    localStorage.removeItem('cameraSettings');
    location.reload();
  }
}

document.getElementById('btnSettings').onclick = openSettings;
document.getElementById('btnSwitch').onclick = switchCamera;
document.getElementById('shutterBtn').onclick = triggerShutter;
document.getElementById('btnTorch').onclick = toggleTorch;
document.getElementById('btnPower').onclick = turnCameraOff;
document.getElementById('btnPowerOn').onclick = turnCameraOn;
document.getElementById('btnPickSaveDir').onclick = pickSaveDirectory;
document.getElementById('btnClearSaveDir').onclick = clearSaveDirectory;
document.getElementById('btnPickPreviewFile').onclick = openPreviewFilePicker;
document.getElementById('btnClosePreview').onclick = closePreviewModal;
document.getElementById('btnRetryCameraPermission').onclick = retryCameraPermission;
document.getElementById('btnRetryMicPermission').onclick = retryMicPermission;
document.getElementById('shutterBtn').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') triggerShutter();
});

galleryPreview.onclick = previewLatestMedia;
document.getElementById('filePicker').onchange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const mediaType = file.type || 'image/*';
  renderPreview(url, mediaType);
  event.target.value = '';
};

document.getElementById('btnTimer').onclick = () => {
  const timers = [0, 3, 5, 10];
  const idx = timers.indexOf(settings.timer);
  settings.timer = timers[(idx + 1) % timers.length];
  document.getElementById('selTimer').value = settings.timer;
  if (settings.timer > 0) {
    btnTimer.textContent = settings.timer + 's';
  } else {
    btnTimer.innerHTML = '<span class="material-symbols-outlined">timer</span>';
  }
};

document.querySelectorAll('#settingsPanel select').forEach(el => {
  el.onchange = saveSettings;
});
document.getElementById('txtFilePrefix').onchange = saveSettings;

window.addEventListener('beforeunload', () => {
  persistSettings();
});

function updateFooter() {
  const baseYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearString = `${baseYear}${currentYear > baseYear ? "–" + currentYear : ""}`;
  const hostname = location.hostname;
  const appName = translations[currentLang].footerText;
  let footerHTML = ` &copy; ${yearString} ${appName}`;
  if (hostname === "hamuzon.github.io") {
    footerHTML = ` &copy; ${yearString} <a class="link" href="https://hamuzon.github.io" target="_blank" rel="noopener noreferrer">@hamuzon</a> ${appName}`;
  } else if (hostname.includes("hamuzon-jp.f5.si")) {
    footerHTML = ` &copy; ${yearString} <a class="link" href="https://hamuzon-jp.f5.si" target="_blank" rel="noopener noreferrer">@hamuzon</a> ${appName}`;
  } else if (hostname.includes("hamusata.f5.si")) {
    footerHTML = ` &copy; ${yearString} <a class="link" href="https://hamusata.f5.si" target="_blank" rel="noopener noreferrer">@hamusata</a> ${appName}`;
  }
  document.getElementById('footer-copy').innerHTML = footerHTML;
  if (document.getElementById('about-footer-copy')) document.getElementById('about-footer-copy').innerHTML = footerHTML;
}

loadSettings();
refreshPermissionStatus();
if (settings.cameraState !== 'off') {
  setCameraUiState(true);
  startCamera();
} else {
  setCameraUiState(false);
}
