/**
 * THE IMPOSTER CHECK — NEXTGEN IDENTITY FORENSICS CONTROLLER
 */

// Application State
const state = {
  user: null,
  token: localStorage.getItem("imposter_token") || null,
  currentTheme: localStorage.getItem("imposter_theme") || "cyberpunk",
  currentScreen: "auth", // 'auth' | 'dashboard' | 'results'
  currentMode: "upload", // 'upload' | 'camera' | 'audio' | 'url' | 'compare'
  selectedSingleFile: null,
  multiFilesQueue: [],
  capturedMediaBlob: null,
  recordedAudioBlob: null,
  lastScanResult: null,
  cameraStream: null,
  mediaRecorder: null,
  audioContext: null,
  audioAnalyser: null,
  audioStream: null,
  audioAnimFrame: null,
};

// DOM Elements
const elements = {
  // Screens
  screenAuth: document.getElementById("screen-auth"),
  screenDashboard: document.getElementById("screen-dashboard"),
  screenResults: document.getElementById("screen-results"),
  
  // Header / Auth
  navAuthButtons: document.getElementById("nav-auth-buttons"),
  navUserProfile: document.getElementById("nav-user-profile"),
  navUserAvatar: document.getElementById("nav-user-avatar"),
  navUserName: document.getElementById("nav-user-name"),
  navUserRole: document.getElementById("nav-user-role"),
  btnShowLogin: document.getElementById("btn-show-login"),
  btnShowSignup: document.getElementById("btn-show-signup"),
  btnLogout: document.getElementById("btn-logout"),
  brandLogo: document.getElementById("brand-logo"),

  // Theme Switcher Elements
  themeDropdownWrapper: document.getElementById("theme-dropdown-wrapper"),
  btnThemeToggle: document.getElementById("btn-theme-toggle"),
  currentThemeIcon: document.getElementById("current-theme-icon"),
  currentThemeName: document.getElementById("current-theme-name"),
  themeMenu: document.getElementById("theme-menu"),
  themeOptBtns: document.querySelectorAll(".theme-opt-btn"),

  // Auth Forms
  tabLoginBtn: document.getElementById("tab-login-btn"),
  tabSignupBtn: document.getElementById("tab-signup-btn"),
  formLogin: document.getElementById("form-login"),
  formSignup: document.getElementById("form-signup"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  signupName: document.getElementById("signup-name"),
  signupEmail: document.getElementById("signup-email"),
  signupRole: document.getElementById("signup-role"),
  signupPassword: document.getElementById("signup-password"),
  btnQuickDemo: document.getElementById("btn-quick-demo"),
  authAlert: document.getElementById("auth-alert"),
  socialButtons: document.querySelectorAll(".btn-social"),

  // Dashboard / Modes
  dashUserName: document.getElementById("dash-user-name"),
  modeTabs: document.querySelectorAll(".mode-tab"),
  panels: {
    upload: document.getElementById("panel-upload"),
    camera: document.getElementById("panel-camera"),
    audio: document.getElementById("panel-audio"),
    url: document.getElementById("panel-url"),
    compare: document.getElementById("panel-compare"),
  },

  // Single Upload
  dropZoneSingle: document.getElementById("drop-zone-single"),
  fileInputSingle: document.getElementById("file-input-single"),
  selectedFilePreview: document.getElementById("selected-file-preview"),
  previewFileName: document.getElementById("preview-file-name"),
  previewFileMeta: document.getElementById("preview-file-meta"),
  previewTypeIcon: document.getElementById("preview-type-icon"),
  btnRemoveSelected: document.getElementById("btn-remove-selected"),
  referenceText: document.getElementById("reference-text"),
  formUploadMedia: document.getElementById("form-upload-media"),

  // Camera Studio
  btnStartCamera: document.getElementById("btn-start-camera"),
  btnCapturePhoto: document.getElementById("btn-capture-photo"),
  btnRecordLivenessVideo: document.getElementById("btn-record-liveness-video"),
  cameraVideoFeed: document.getElementById("camera-video-feed"),
  cameraCanvas: document.getElementById("camera-canvas"),
  recordingIndicator: document.getElementById("recording-indicator"),
  recordingTimer: document.getElementById("recording-timer"),
  cameraSnapshotPreview: document.getElementById("camera-snapshot-preview"),
  cameraCapturedImg: document.getElementById("camera-captured-img"),
  btnScreenCaptured: document.getElementById("btn-screen-captured"),

  // Audio Studio
  btnRecordAudio: document.getElementById("btn-record-audio"),
  recordAudioLabel: document.getElementById("record-audio-label"),
  audioWaveformCanvas: document.getElementById("audio-waveform-canvas"),
  audioStudioStatus: document.getElementById("audio-studio-status"),
  audioPlayback: document.getElementById("audio-playback"),
  btnScreenAudioSample: document.getElementById("btn-screen-audio-sample"),

  // URL Scanner
  formUrlScreen: document.getElementById("form-url-screen"),
  inputTargetUrl: document.getElementById("input-target-url"),
  inputUrlReference: document.getElementById("input-url-reference"),

  // Multi-File Compare
  dropZoneMulti: document.getElementById("drop-zone-multi"),
  fileInputMulti: document.getElementById("file-input-multi"),
  multiFileQueue: document.getElementById("multi-file-queue"),
  multiReferenceText: document.getElementById("multi-reference-text"),
  btnSubmitCompare: document.getElementById("btn-submit-compare"),
  btnCompareLabel: document.getElementById("btn-compare-label"),
  formMultiCompare: document.getElementById("form-multi-compare"),

  // History Log
  historyTableBody: document.getElementById("history-table-body"),
  btnClearHistory: document.getElementById("btn-clear-history"),

  // Results Inspector
  btnBackToDashboard: document.getElementById("btn-back-to-dashboard"),
  btnExportJson: document.getElementById("btn-export-json"),
  btnPrintReport: document.getElementById("btn-print-report"),
  verdictBanner: document.getElementById("verdict-banner"),
  verdictBadgeLabel: document.getElementById("verdict-badge-label"),
  verdictHeading: document.getElementById("verdict-heading"),
  verdictSummary: document.getElementById("verdict-summary"),
  gaugeProgress: document.getElementById("gauge-progress"),
  riskScoreNumber: document.getElementById("risk-score-number"),
  
  multiCardBanner: document.getElementById("multi-card-banner"),
  multiCardCountLabel: document.getElementById("multi-card-count-label"),
  segmentedCardsCarousel: document.getElementById("segmented-cards-carousel"),

  multiFileCompareResults: document.getElementById("multi-file-compare-results"),
  compOverallScore: document.getElementById("comp-overall-score"),
  compFaceScore: document.getElementById("comp-face-score"),
  compTextScore: document.getElementById("comp-text-score"),
  pairwiseMatchesList: document.getElementById("pairwise-matches-list"),

  elaHeatmapImg: document.getElementById("ela-heatmap-img"),
  tamperStatusPill: document.getElementById("tamper-status-pill"),
  forensicSignalsList: document.getElementById("forensic-signals-list"),
  ocrEngineTag: document.getElementById("ocr-engine-tag"),
  ocrSimTag: document.getElementById("ocr-sim-tag"),
  ocrTextDisplay: document.getElementById("ocr-text-display"),
  metricBrightness: document.getElementById("metric-brightness"),
  metricContrast: document.getElementById("metric-contrast"),
  metricBlur: document.getElementById("metric-blur"),
  metricGlare: document.getElementById("metric-glare"),

  mediaDynamicsCard: document.getElementById("media-dynamics-card"),
  mediaDynamicsTitle: document.getElementById("media-dynamics-title"),
  mediaDynamicsContent: document.getElementById("media-dynamics-content"),

  // Loading Modal
  loadingOverlay: document.getElementById("loading-overlay"),
  loadingStatusText: document.getElementById("loading-status-text")
};

// Theme Definitions
const THEMES = {
  "cyberpunk": { name: "Cyberpunk", icon: "⚡" },
  "matrix": { name: "Matrix", icon: "💻" },
  "federal-navy": { name: "Federal Intel", icon: "🛡️" },
  "crimson-threat": { name: "Crimson Threat", icon: "🚨" },
  "aurora-violet": { name: "Aurora Violet", icon: "🌌" },
  "arctic-light": { name: "Arctic Forensic", icon: "☀️" },
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupEventListeners();
  if (state.token) {
    await checkCurrentUserSession();
  } else {
    showScreen("auth");
  }
});

function initTheme() {
  const savedTheme = localStorage.getItem("imposter_theme") || "cyberpunk";
  setTheme(savedTheme);
}

function setTheme(themeKey) {
  if (!THEMES[themeKey]) themeKey = "cyberpunk";
  state.currentTheme = themeKey;
  localStorage.setItem("imposter_theme", themeKey);
  
  if (themeKey === "cyberpunk") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", themeKey);
  }

  // Update button label and icon
  const meta = THEMES[themeKey];
  if (elements.currentThemeIcon) elements.currentThemeIcon.textContent = meta.icon;
  if (elements.currentThemeName) elements.currentThemeName.textContent = meta.name;

  // Update active state on option buttons
  elements.themeOptBtns?.forEach(btn => {
    if (btn.getAttribute("data-theme") === themeKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function setupEventListeners() {
  // Theme Switcher Toggle & Selection
  elements.btnThemeToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = elements.themeMenu.classList.contains("hidden");
    if (isHidden) {
      elements.themeMenu.classList.remove("hidden");
      elements.themeDropdownWrapper.classList.add("open");
    } else {
      elements.themeMenu.classList.add("hidden");
      elements.themeDropdownWrapper.classList.remove("open");
    }
  });

  elements.themeOptBtns?.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const selected = btn.getAttribute("data-theme");
      setTheme(selected);
      elements.themeMenu.classList.add("hidden");
      elements.themeDropdownWrapper.classList.remove("open");
    });
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!elements.themeDropdownWrapper?.contains(e.target)) {
      elements.themeMenu?.classList.add("hidden");
      elements.themeDropdownWrapper?.classList.remove("open");
    }
  });

  // Navigation & Screen Switchers
  elements.btnShowLogin?.addEventListener("click", () => {
    switchAuthTab("login");
    showScreen("auth");
  });
  elements.btnShowSignup?.addEventListener("click", () => {
    switchAuthTab("signup");
    showScreen("auth");
  });
  elements.btnLogout?.addEventListener("click", handleLogout);
  elements.brandLogo?.addEventListener("click", () => {
    if (state.user) showScreen("dashboard");
    else showScreen("auth");
  });
  elements.btnBackToDashboard?.addEventListener("click", () => showScreen("dashboard"));

  // Auth Tabs
  elements.tabLoginBtn?.addEventListener("click", () => switchAuthTab("login"));
  elements.tabSignupBtn?.addEventListener("click", () => switchAuthTab("signup"));

  // Forms
  elements.formLogin?.addEventListener("submit", handleLoginSubmit);
  elements.formSignup?.addEventListener("submit", handleSignupSubmit);
  elements.btnQuickDemo?.addEventListener("click", handleQuickDemoLogin);

  // Social Login Buttons
  elements.socialButtons?.forEach(btn => {
    btn.addEventListener("click", () => {
      const provider = btn.getAttribute("data-provider");
      handleSocialLogin(provider);
    });
  });

  // Mode Switchers
  elements.modeTabs?.forEach(tab => {
    tab.addEventListener("click", () => {
      const mode = tab.getAttribute("data-mode");
      switchStudioMode(mode);
    });
  });

  // Single Upload Drag & Drop
  setupSingleDropZone();

  // Camera Studio
  elements.btnStartCamera?.addEventListener("click", toggleCameraFeed);
  elements.btnCapturePhoto?.addEventListener("click", captureCameraPhoto);
  elements.btnRecordLivenessVideo?.addEventListener("click", recordLivenessVideo);
  elements.btnScreenCaptured?.addEventListener("click", screenCapturedMedia);

  // Audio Studio
  elements.btnRecordAudio?.addEventListener("click", toggleAudioRecording);
  elements.btnScreenAudioSample?.addEventListener("click", screenRecordedAudio);

  // URL Scanner
  elements.formUrlScreen?.addEventListener("submit", handleUrlScreenSubmit);

  // Multi-File Compare
  setupMultiDropZone();
  elements.formMultiCompare?.addEventListener("submit", handleMultiCompareSubmit);

  // History Actions
  elements.btnClearHistory?.addEventListener("click", handleClearHistory);

  // Report Export
  elements.btnExportJson?.addEventListener("click", exportResultsJson);
  elements.btnPrintReport?.addEventListener("click", () => window.print());
}

// ============================================================================
// NAVIGATION & SCREEN MANAGEMENT
// ============================================================================

function showScreen(screenId) {
  state.currentScreen = screenId;
  elements.screenAuth.classList.remove("active");
  elements.screenDashboard.classList.remove("active");
  elements.screenResults.classList.remove("active");

  if (screenId === "auth") {
    elements.screenAuth.classList.add("active");
    elements.navAuthButtons.classList.remove("hidden");
    elements.navUserProfile.classList.add("hidden");
  } else if (screenId === "dashboard") {
    elements.screenDashboard.classList.add("active");
    elements.navAuthButtons.classList.add("hidden");
    elements.navUserProfile.classList.remove("hidden");
    fetchHistoryLog();
  } else if (screenId === "results") {
    elements.screenResults.classList.add("active");
    elements.navAuthButtons.classList.add("hidden");
    elements.navUserProfile.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function switchAuthTab(tab) {
  if (tab === "login") {
    elements.tabLoginBtn.classList.add("active");
    elements.tabSignupBtn.classList.remove("active");
    elements.formLogin.classList.remove("hidden");
    elements.formSignup.classList.add("hidden");
  } else {
    elements.tabSignupBtn.classList.add("active");
    elements.tabLoginBtn.classList.remove("active");
    elements.formSignup.classList.remove("hidden");
    elements.formLogin.classList.add("hidden");
  }
  hideAuthAlert();
}

function switchStudioMode(mode) {
  state.currentMode = mode;
  elements.modeTabs.forEach(t => {
    if (t.getAttribute("data-mode") === mode) t.classList.add("active");
    else t.classList.remove("active");
  });

  Object.keys(elements.panels).forEach(k => {
    if (k === mode) elements.panels[k]?.classList.add("active");
    else elements.panels[k]?.classList.remove("active");
  });

  // Stop camera if leaving camera panel
  if (mode !== "camera" && state.cameraStream) {
    stopCameraFeed();
  }
}

// ============================================================================
// AUTHENTICATION LOGIC
// ============================================================================

async function checkCurrentUserSession() {
  try {
    const res = await fetch("/api/v1/auth/me", {
      headers: { "Authorization": `Bearer ${state.token}` }
    });
    if (res.ok) {
      const data = await res.json();
      onAuthSuccess(data.user, state.token);
    } else {
      handleLogout();
    }
  } catch (err) {
    handleLogout();
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value;
  showLoading("Authenticating Forensic Credentials...");

  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      showAuthAlert(data.detail || "Authentication failed", "error");
      return;
    }
    onAuthSuccess(data.user, data.token);
  } catch (err) {
    hideLoading();
    showAuthAlert("Server connection error: " + err.message, "error");
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const name = elements.signupName.value.trim();
  const email = elements.signupEmail.value.trim();
  const role = elements.signupRole.value;
  const password = elements.signupPassword.value;
  showLoading("Registering Forensic Account...");

  try {
    const res = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      showAuthAlert(data.detail || "Registration failed", "error");
      return;
    }
    onAuthSuccess(data.user, data.token);
  } catch (err) {
    hideLoading();
    showAuthAlert("Server connection error: " + err.message, "error");
  }
}

async function handleSocialLogin(provider) {
  showLoading(`Connecting with ${provider.toUpperCase()} Identity Provider...`);
  try {
    const res = await fetch("/api/v1/auth/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider })
    });
    const data = await res.json();
    hideLoading();
    if (res.ok) {
      onAuthSuccess(data.user, data.token);
    } else {
      showAuthAlert(data.detail || "Social authentication failed", "error");
    }
  } catch (err) {
    hideLoading();
    showAuthAlert("Social login error: " + err.message, "error");
  }
}

function handleQuickDemoLogin() {
  elements.loginEmail.value = "alex.mercer@impostercheck.ai";
  elements.loginPassword.value = "password123";
  elements.formLogin.dispatchEvent(new Event("submit"));
}

function onAuthSuccess(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem("imposter_token", token);

  // Update Navigation Profile
  elements.navUserName.textContent = user.name;
  elements.navUserRole.textContent = user.role || "Forensic Specialist";
  elements.navUserAvatar.src = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;

  // Update Welcome Banner
  elements.dashUserName.textContent = user.name;

  showScreen("dashboard");
}

function handleLogout() {
  state.user = null;
  state.token = null;
  localStorage.removeItem("imposter_token");
  showScreen("auth");
}

function showAuthAlert(msg, type = "error") {
  elements.authAlert.className = `auth-alert ${type}`;
  elements.authAlert.textContent = msg;
  elements.authAlert.classList.remove("hidden");
}
function hideAuthAlert() {
  elements.authAlert.classList.add("hidden");
}

// ============================================================================
// SINGLE UPLOAD HANDLER
// ============================================================================

function setupSingleDropZone() {
  const zone = elements.dropZoneSingle;
  const input = elements.fileInputSingle;

  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSingleFileSelected(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSingleFileSelected(e.target.files[0]);
    }
  });

  elements.btnRemoveSelected?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.selectedSingleFile = null;
    input.value = "";
    elements.selectedFilePreview.classList.add("hidden");
  });

  elements.formUploadMedia?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.selectedSingleFile) {
      alert("Please choose or drag & drop a file to screen.");
      return;
    }
    await executeSingleScreening(state.selectedSingleFile, elements.referenceText.value.trim());
  });
}

function handleSingleFileSelected(file) {
  state.selectedSingleFile = file;
  elements.previewFileName.textContent = file.name;
  elements.previewFileMeta.textContent = `${formatBytes(file.size)} • ${file.type || "Document"}`;
  
  // Icon based on type
  if (file.type.startsWith("image/")) elements.previewTypeIcon.textContent = "🖼️";
  else if (file.type.startsWith("video/")) elements.previewTypeIcon.textContent = "🎥";
  else if (file.type.startsWith("audio/")) elements.previewTypeIcon.textContent = "🎙️";
  else if (file.name.endsWith(".pdf")) elements.previewTypeIcon.textContent = "📄";
  else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) elements.previewTypeIcon.textContent = "📝";
  else elements.previewTypeIcon.textContent = "📁";

  elements.selectedFilePreview.classList.remove("hidden");
}

async function executeSingleScreening(file, reference = "") {
  showLoading("Executing Multi-Card & Forensics Deep Scan...");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("reference", reference);

  try {
    const res = await fetch("/api/v1/screen", {
      method: "POST",
      headers: state.token ? { "Authorization": `Bearer ${state.token}` } : {},
      body: fd
    });
    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      alert(data.detail || "Screening error occurred");
      return;
    }
    renderScreenResults(data);
  } catch (err) {
    hideLoading();
    alert("Network or processing error: " + err.message);
  }
}

// ============================================================================
// CAMERA STUDIO HANDLERS (LIVE PHOTOS & 5S LIVENESS VIDEO)
// ============================================================================

async function toggleCameraFeed() {
  if (state.cameraStream) {
    stopCameraFeed();
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
      });
      state.cameraStream = stream;
      elements.cameraVideoFeed.srcObject = stream;
      elements.btnStartCamera.innerHTML = `<span>Stop WebRTC Camera</span>`;
      elements.btnCapturePhoto.disabled = false;
      elements.btnRecordLivenessVideo.disabled = false;
    } catch (err) {
      alert("Camera access denied or unavailable: " + err.message);
    }
  }
}

function stopCameraFeed() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
    elements.cameraVideoFeed.srcObject = null;
    elements.btnStartCamera.innerHTML = `<span>Start WebRTC Camera</span>`;
    elements.btnCapturePhoto.disabled = true;
    elements.btnRecordLivenessVideo.disabled = true;
  }
}

function captureCameraPhoto() {
  if (!state.cameraStream) return;
  const video = elements.cameraVideoFeed;
  const canvas = elements.cameraCanvas;
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    state.capturedMediaBlob = new File([blob], "live_photo_capture.jpg", { type: "image/jpeg" });
    elements.cameraCapturedImg.src = URL.createObjectURL(blob);
    elements.cameraSnapshotPreview.classList.remove("hidden");
  }, "image/jpeg", 0.92);
}

function recordLivenessVideo() {
  if (!state.cameraStream) return;
  elements.btnRecordLivenessVideo.disabled = true;
  elements.recordingIndicator.classList.remove("hidden");

  let countdown = 5;
  elements.recordingTimer.textContent = `REC 00:0${countdown}`;
  const interval = setInterval(() => {
    countdown--;
    elements.recordingTimer.textContent = `REC 00:0${countdown}`;
    if (countdown <= 0) clearInterval(interval);
  }, 1000);

  const chunks = [];
  const recorder = new MediaRecorder(state.cameraStream, { mimeType: "video/webm" });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    elements.recordingIndicator.classList.add("hidden");
    elements.btnRecordLivenessVideo.disabled = false;
    const blob = new Blob(chunks, { type: "video/webm" });
    state.capturedMediaBlob = new File([blob], "live_video_5s.webm", { type: "video/webm" });
    
    // Capture snapshot for preview
    const video = elements.cameraVideoFeed;
    const canvas = elements.cameraCanvas;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    elements.cameraCapturedImg.src = canvas.toDataURL("image/jpeg");
    elements.cameraSnapshotPreview.classList.remove("hidden");
  };

  recorder.start();
  setTimeout(() => recorder.stop(), 5000);
}

async function screenCapturedMedia() {
  if (!state.capturedMediaBlob) return;
  await executeSingleScreening(state.capturedMediaBlob, "LIVE_CAMERA_CAPTURE");
}

// ============================================================================
// AUDIO BIOMETRIC STUDIO (LIVE WAVEFORM & SYNTHETIC VOICE CHECK)
// ============================================================================

async function toggleAudioRecording() {
  if (state.audioStream) {
    stopAudioRecording();
  } else {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.audioStream = stream;
      
      // Initialize Web Audio API visualizer
      state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      state.audioAnalyser = state.audioContext.createAnalyser();
      state.audioAnalyser.fftSize = 256;
      const source = state.audioContext.createMediaStreamSource(stream);
      source.connect(state.audioAnalyser);
      
      startWaveformVisualization();

      // MediaRecorder
      const chunks = [];
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      state.mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        state.recordedAudioBlob = new File([blob], "live_voice_sample.wav", { type: "audio/wav" });
        elements.audioPlayback.src = URL.createObjectURL(blob);
        elements.audioPlayback.classList.remove("hidden");
        elements.btnScreenAudioSample.classList.remove("hidden");
      };

      state.mediaRecorder.start();
      elements.recordAudioLabel.textContent = "Stop Voice Recording";
      elements.audioStudioStatus.textContent = "🔴 Recording Voice Biometrics... Speak clearly into microphone";
    } catch (err) {
      alert("Microphone access denied: " + err.message);
    }
  }
}

function stopAudioRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
  if (state.audioStream) {
    state.audioStream.getTracks().forEach(t => t.stop());
    state.audioStream = null;
  }
  if (state.audioAnimFrame) cancelAnimationFrame(state.audioAnimFrame);
  elements.recordAudioLabel.textContent = "Record Voice Sample";
  elements.audioStudioStatus.textContent = "Voice Recording Complete • Ready for Synthetic Speech Check";
}

function startWaveformVisualization() {
  const canvas = elements.audioWaveformCanvas;
  const ctx = canvas.getContext("2d");
  const analyser = state.audioAnalyser;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    state.audioAnimFrame = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = "#0d121d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#00f2fe";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(0, 242, 254, 0.8)";
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

async function screenRecordedAudio() {
  if (!state.recordedAudioBlob) return;
  await executeSingleScreening(state.recordedAudioBlob, "VOICE_SAMPLE");
}

// ============================================================================
// URL SCANNER HANDLER
// ============================================================================

async function handleUrlScreenSubmit(e) {
  e.preventDefault();
  const url = elements.inputTargetUrl.value.trim();
  const reference = elements.inputUrlReference.value.trim();
  showLoading("Fetching & Inspecting Remote Web Asset...");

  try {
    const res = await fetch("/api/v1/screen-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(state.token ? { "Authorization": `Bearer ${state.token}` } : {})
      },
      body: JSON.stringify({ url, reference })
    });
    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      alert(data.detail || "URL Screening failed");
      return;
    }
    renderScreenResults(data);
  } catch (err) {
    hideLoading();
    alert("URL screening network error: " + err.message);
  }
}

// ============================================================================
// MULTI-FILE COMPARE (CROSS-IDENTITY VERIFICATION)
// ============================================================================

function setupMultiDropZone() {
  const zone = elements.dropZoneMulti;
  const input = elements.fileInputMulti;

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files) {
      addFilesToMultiQueue(Array.from(e.dataTransfer.files));
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files) {
      addFilesToMultiQueue(Array.from(e.target.files));
    }
  });
}

function addFilesToMultiQueue(files) {
  files.forEach(f => {
    if (!state.multiFilesQueue.some(item => item.name === f.name && item.size === f.size)) {
      state.multiFilesQueue.push(f);
    }
  });
  renderMultiFileQueue();
}

function renderMultiFileQueue() {
  const container = elements.multiFileQueue;
  container.innerHTML = "";

  state.multiFilesQueue.forEach((file, idx) => {
    const card = document.createElement("div");
    card.className = "queue-file-card";
    
    let icon = "📁";
    if (file.type.startsWith("image/")) icon = "🖼️";
    else if (file.type.startsWith("video/")) icon = "🎥";
    else if (file.type.startsWith("audio/")) icon = "🎙️";
    else if (file.name.endsWith(".pdf")) icon = "📄";
    else if (file.name.endsWith(".docx")) icon = "📝";

    card.innerHTML = `
      <div class="queue-file-info">
        <span>${icon}</span>
        <div>
          <h5 class="queue-file-name" title="${file.name}">${file.name}</h5>
          <span class="selected-size">${formatBytes(file.size)}</span>
        </div>
      </div>
      <button type="button" class="btn-icon btn-remove" data-index="${idx}">✕</button>
    `;
    container.appendChild(card);
  });

  // Attach delete buttons
  container.querySelectorAll(".btn-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-index"));
      state.multiFilesQueue.splice(idx, 1);
      renderMultiFileQueue();
    });
  });

  const count = state.multiFilesQueue.length;
  elements.btnCompareLabel.textContent = `Compare ${count} Files for Identity Congruence`;
  elements.btnSubmitCompare.disabled = count < 2;
}

async function handleMultiCompareSubmit(e) {
  e.preventDefault();
  if (state.multiFilesQueue.length < 2) {
    alert("Please select at least 2 files to compare identities.");
    return;
  }

  showLoading(`Cross-Comparing ${state.multiFilesQueue.length} Files for Imposter Fraud...`);
  const fd = new FormData();
  state.multiFilesQueue.forEach(f => fd.append("files", f));
  fd.append("reference", elements.multiReferenceText.value.trim());

  try {
    const res = await fetch("/api/v1/compare", {
      method: "POST",
      headers: state.token ? { "Authorization": `Bearer ${state.token}` } : {},
      body: fd
    });
    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      alert(data.detail || "Cross-comparison error occurred");
      return;
    }
    renderCompareResults(data);
  } catch (err) {
    hideLoading();
    alert("Cross comparison request error: " + err.message);
  }
}

// ============================================================================
// RESULTS RENDERING & FORENSIC DOSSIER
// ============================================================================

function renderScreenResults(data) {
  state.lastScanResult = data;
  showScreen("results");

  // Multi-File vs Single File layout adjustments
  elements.multiFileCompareResults.classList.add("hidden");

  // Verdict Banner
  const risk = data.risk_score || 0;
  const decision = data.decision || "REVIEW";
  
  elements.verdictBanner.className = `verdict-hero verdict-${decision.toLowerCase()}`;
  elements.verdictBadgeLabel.textContent = `${decision} • RISK LEVEL ${risk}%`;
  
  if (decision === "PASS") {
    elements.verdictHeading.textContent = "Identity Authenticity Confirmed";
    elements.verdictSummary.textContent = "Optical quality, structural integrity, and tamper tests are within verified genuine thresholds.";
  } else if (decision === "REVIEW") {
    elements.verdictHeading.textContent = "Suspicious Discrepancies Detected";
    elements.verdictSummary.textContent = "Document signals indicate potential abnormalities in lighting, compression, or text alignment. Manual inspection advised.";
  } else {
    elements.verdictHeading.textContent = "High-Risk Imposter / Forgery Flagged";
    elements.verdictSummary.textContent = "Critical red flags detected: digital manipulation, severe quality mismatch, or synthetic artifacts.";
  }

  // Animate Circular Gauge
  elements.riskScoreNumber.textContent = Math.round(risk);
  elements.gaugeProgress.setAttribute("stroke-dasharray", `${Math.min(100, Math.max(2, risk))}, 100`);

  // Multi-Card Carousel Check
  const cards = data.segmented_cards || [];
  if (cards.length > 1) {
    elements.multiCardBanner.classList.remove("hidden");
    elements.multiCardCountLabel.textContent = `${cards.length} Distinct Identity Cards Found in File`;
    elements.segmentedCardsCarousel.innerHTML = "";
    
    cards.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = `segmented-card-item ${i === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <img src="${c.preview_b64 || ''}" class="card-thumb" alt="${c.label}">
        <h5 class="card-item-title">${c.label}</h5>
        <p class="card-item-meta">Aspect: ${c.aspect_ratio} • Faces: ${c.faces_detected}</p>
      `;
      item.addEventListener("click", () => {
        document.querySelectorAll(".segmented-card-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
        if (c.preview_b64) elements.elaHeatmapImg.src = c.preview_b64;
      });
      elements.segmentedCardsCarousel.appendChild(item);
    });
  } else {
    elements.multiCardBanner.classList.add("hidden");
  }

  // ELA Tamper Heatmap
  if (data.tamper_analysis && data.tamper_analysis.ela_heatmap_b64) {
    elements.elaHeatmapImg.src = data.tamper_analysis.ela_heatmap_b64;
    const ratio = data.tamper_analysis.tampering_ratio || 0;
    elements.tamperStatusPill.textContent = ratio > 0.08 ? `Tamper Anomaly (${Math.round(ratio*100)}%)` : "Structure Authentic";
    elements.tamperStatusPill.style.borderColor = ratio > 0.08 ? "var(--crimson-primary)" : "var(--emerald-primary)";
    elements.tamperStatusPill.style.color = ratio > 0.08 ? "var(--crimson-primary)" : "var(--emerald-primary)";
  } else {
    elements.elaHeatmapImg.src = "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop";
    elements.tamperStatusPill.textContent = "Standard Forensic Map";
  }

  // Forensic Signals
  const signals = data.signals || [];
  elements.forensicSignalsList.innerHTML = signals.length > 0 
    ? signals.map(s => `<span class="signal-badge">⚠️ ${formatSignal(s)}</span>`).join("")
    : `<span class="signal-badge" style="background:rgba(16,185,129,0.1); color:#34d399; border-color:rgba(16,185,129,0.3)">✓ No Adversarial Signals Detected</span>`;

  // OCR & Intelligence
  elements.ocrEngineTag.textContent = `Engine: ${data.models?.ocr || "Standard Engine"}`;
  elements.ocrTextDisplay.value = data.ocr_text || "No embedded or optical text extracted.";

  // Quality Metrics
  const q = data.quality || {};
  elements.metricBrightness.textContent = q.brightness !== undefined ? q.brightness : "N/A";
  elements.metricContrast.textContent = q.contrast !== undefined ? q.contrast : "N/A";
  elements.metricBlur.textContent = q.blur_score !== undefined ? q.blur_score : "N/A";
  elements.metricGlare.textContent = q.glare_ratio !== undefined ? `${(q.glare_ratio * 100).toFixed(1)}%` : "0.0%";

  // Media Dynamics (Video / Audio)
  renderMediaDynamics(data);
}

function renderCompareResults(data) {
  state.lastScanResult = data;
  showScreen("results");

  elements.multiCardBanner.classList.add("hidden");
  elements.multiFileCompareResults.classList.remove("hidden");

  const comp = data.comparison || {};
  const decision = data.decision || "REVIEW";
  const risk = data.risk_score || 0;

  elements.verdictBanner.className = `verdict-hero verdict-${decision.toLowerCase()}`;
  elements.verdictBadgeLabel.textContent = `${decision} • MULTI-FILE CROSS VERIFY (${risk}% RISK)`;
  elements.verdictHeading.textContent = decision === "PASS" ? "Cross-File Identity Matched" : "Cross-File Identity Discrepancy Found";
  elements.verdictSummary.textContent = comp.conflict_signals && comp.conflict_signals.length > 0 
    ? comp.conflict_signals.join(". ")
    : "Biometric and credential tokens across all submitted files align with the same authentic subject.";

  elements.riskScoreNumber.textContent = Math.round(risk);
  elements.gaugeProgress.setAttribute("stroke-dasharray", `${Math.min(100, Math.max(2, risk))}, 100`);

  // Scores
  elements.compOverallScore.textContent = `${comp.overall_identity_match_score || 0}%`;
  elements.compFaceScore.textContent = comp.face_match_score !== null ? `${comp.face_match_score}%` : "No Faces";
  elements.compTextScore.textContent = comp.text_entity_match_score !== null ? `${comp.text_entity_match_score}%` : "No Text";

  // Pairwise list
  const list = elements.pairwiseMatchesList;
  list.innerHTML = "";
  (comp.pairwise_comparisons || []).forEach(p => {
    const card = document.createElement("div");
    card.className = "pairwise-card";
    card.innerHTML = `
      <div class="pairwise-header">
        <span>${p.file_a} ↔ ${p.file_b}</span>
        <span class="verdict-pill ${p.status === 'MATCH' ? 'pass' : 'reject'}">${p.status}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:4px;">Type: ${p.media_types}</p>
      <p style="font-size:0.8rem;">Face Similarity: <strong>${p.face_similarity !== null ? p.face_similarity + '%' : 'N/A'}</strong></p>
      <p style="font-size:0.8rem;">Text Similarity: <strong>${p.text_similarity !== null ? p.text_similarity + '%' : 'N/A'}</strong></p>
    `;
    list.appendChild(card);
  });

  // Signals
  elements.forensicSignalsList.innerHTML = (comp.conflict_signals || []).map(s => `<span class="signal-badge">⚠️ ${s}</span>`).join("");
}

function renderMediaDynamics(data) {
  const container = elements.mediaDynamicsContent;
  container.innerHTML = "";
  
  let hasDynamics = false;
  if (data.video_dynamics) {
    hasDynamics = true;
    elements.mediaDynamicsTitle.textContent = "🎥 Video & Temporal Dynamics";
    const v = data.video_dynamics;
    container.innerHTML = `
      <div class="stat-card"><span class="stat-label">Category</span><span class="stat-value text-cyan">${v.video_category}</span></div>
      <div class="stat-card"><span class="stat-label">FPS</span><span class="stat-value">${v.fps}</span></div>
      <div class="stat-card"><span class="stat-label">Temporal Consistency</span><span class="stat-value text-emerald">${Math.round(v.temporal_consistency*100)}%</span></div>
      <div class="stat-card"><span class="stat-label">Deepfake Flicker Score</span><span class="stat-value ${v.deepfake_flicker_score > 0.3 ? 'text-crimson' : 'text-cyan'}">${v.deepfake_flicker_score}</span></div>
    `;
  } else if (data.audio_biometrics) {
    hasDynamics = true;
    elements.mediaDynamicsTitle.textContent = "🎙️ Voice Biometrics & Deepfake Speech Analysis";
    const a = data.audio_biometrics;
    container.innerHTML = `
      <div class="stat-card"><span class="stat-label">Audio Verdict</span><span class="stat-value text-cyan">${a.verdict}</span></div>
      <div class="stat-card"><span class="stat-label">Synthetic Speech Probability</span><span class="stat-value ${a.synthetic_voice_probability > 0.4 ? 'text-crimson' : 'text-emerald'}">${Math.round(a.synthetic_voice_probability*100)}%</span></div>
      <div class="stat-card"><span class="stat-label">Zero Crossing Rate</span><span class="stat-value">${a.zero_crossing_rate}</span></div>
      <div class="stat-card"><span class="stat-label">Spectral Flatness</span><span class="stat-value">${a.spectral_flatness}</span></div>
    `;
  }

  if (hasDynamics) elements.mediaDynamicsCard.classList.remove("hidden");
  else elements.mediaDynamicsCard.classList.add("hidden");
}

// ============================================================================
// AUDIT LOG & HISTORY LOG
// ============================================================================

async function fetchHistoryLog() {
  try {
    const res = await fetch("/api/v1/history", {
      headers: state.token ? { "Authorization": `Bearer ${state.token}` } : {}
    });
    if (!res.ok) return;
    const data = await res.json();
    renderHistoryTable(data.history || []);
  } catch (err) {
    console.error("Failed to load audit history:", err);
  }
}

function renderHistoryTable(items) {
  const tbody = elements.historyTableBody;
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-history-cell">No screenings recorded yet. Upload a document above to begin.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-family:var(--font-mono); font-size:0.8rem;">${item.timestamp}</td>
      <td><strong>${item.file_name}</strong></td>
      <td><span class="tag">${item.file_type || 'image'}</span></td>
      <td>${item.cards_detected || 1}</td>
      <td><strong>${item.risk_score}%</strong></td>
      <td><span class="verdict-pill ${(item.decision || 'review').toLowerCase()}">${item.decision}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="alert('Viewing archive for scan: ${item.id}')">View</button></td>
    </tr>
  `).join("");
}

async function handleClearHistory() {
  if (!confirm("Are you sure you want to purge all screening audit history records?")) return;
  try {
    await fetch("/api/v1/history/clear", { method: "POST" });
    fetchHistoryLog();
  } catch (err) {
    alert("Error clearing history: " + err.message);
  }
}

// ============================================================================
// EXPORT & HELPERS
// ============================================================================

function exportResultsJson() {
  if (!state.lastScanResult) return;
  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.lastScanResult, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonStr);
  downloadAnchor.setAttribute("download", `forensic_dossier_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function showLoading(msg = "Analyzing...") {
  elements.loadingStatusText.textContent = msg;
  elements.loadingOverlay.classList.remove("hidden");
}
function hideLoading() {
  elements.loadingOverlay.classList.add("hidden");
}

function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function formatSignal(str) {
  return str.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
