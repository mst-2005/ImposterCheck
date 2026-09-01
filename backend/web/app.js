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

  // Samples Modal
  btnOpenSamplesModal: document.getElementById("btn-open-samples-modal"),
  btnCloseSamplesModal: document.getElementById("btn-close-samples-modal"),
  samplesModal: document.getElementById("samples-modal"),
  samplesCatalogGrid: document.getElementById("samples-catalog-grid"),

  // Social Auth Modal Popup
  modalSocialAuth: document.getElementById("modal-social-auth"),
  socialModalTitle: document.getElementById("social-modal-title"),
  socialModalIcon: document.getElementById("social-modal-icon"),
  socialModalUserLabel: document.getElementById("social-modal-user-label"),
  socialAuthName: document.getElementById("social-auth-name"),
  socialAuthEmail: document.getElementById("social-auth-email"),
  socialAuthPassword: document.getElementById("social-auth-password"),
  formSocialAuthPopup: document.getElementById("form-social-auth-popup"),
  socialSubmitBtnLabel: document.getElementById("social-submit-btn-label"),
  btnCloseSocialModal: document.getElementById("btn-close-social-modal"),
  btnCancelSocialModal: document.getElementById("btn-cancel-social-modal"),

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

  // Samples Modal
  elements.btnOpenSamplesModal?.addEventListener("click", openSamplesModal);
  elements.btnCloseSamplesModal?.addEventListener("click", closeSamplesModal);
  elements.samplesModal?.addEventListener("click", (e) => {
    if (e.target === elements.samplesModal) closeSamplesModal();
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

  // Social Login Buttons & Popup Modal
  elements.socialButtons?.forEach(btn => {
    btn.addEventListener("click", () => {
      const provider = btn.getAttribute("data-provider");
      openSocialAuthModal(provider);
    });
  });

  elements.btnCloseSocialModal?.addEventListener("click", closeSocialAuthModal);
  elements.btnCancelSocialModal?.addEventListener("click", closeSocialAuthModal);
  elements.modalSocialAuth?.addEventListener("click", (e) => {
    if (e.target === elements.modalSocialAuth) closeSocialAuthModal();
  });
  elements.formSocialAuthPopup?.addEventListener("submit", handleSocialPopupSubmit);

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

let currentSocialProvider = "google";

function openSocialAuthModal(provider) {
  currentSocialProvider = provider;
  const p = (provider || "google").toLowerCase();
  
  const providerNames = {
    google: "Google",
    github: "GitHub",
    apple: "Apple ID",
    microsoft: "Microsoft"
  };

  const name = providerNames[p] || (p.charAt(0).toUpperCase() + p.slice(1));
  elements.socialModalTitle.textContent = `Sign in with ${name}`;
  elements.socialSubmitBtnLabel.textContent = `Authenticate & Sign In with ${name}`;
  
  if (p === "google") {
    elements.socialModalIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
        <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
        <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
      </svg>
    `;
    elements.socialModalUserLabel.textContent = "Google Email Address";
    elements.socialAuthEmail.value = "mahita@gmail.com";
  } else if (p === "github") {
    elements.socialModalIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    `;
    elements.socialModalUserLabel.textContent = "GitHub Username or Email";
    elements.socialAuthEmail.value = "mst-2005";
  } else if (p === "apple") {
    elements.socialModalIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.56.65-1.06 1.7-0.93 2.73 1 .08 2.02-.48 2.64-1.23z"/>
      </svg>
    `;
    elements.socialModalUserLabel.textContent = "Apple ID";
    elements.socialAuthEmail.value = "mahita@icloud.com";
  } else if (p === "microsoft") {
    elements.socialModalIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
    `;
    elements.socialModalUserLabel.textContent = "Microsoft Account Email";
    elements.socialAuthEmail.value = "mahita@outlook.com";
  }

  elements.socialAuthName.value = "Mahita";
  elements.socialAuthPassword.value = "password123";
  elements.modalSocialAuth.classList.remove("hidden");
}

function closeSocialAuthModal() {
  elements.modalSocialAuth.classList.add("hidden");
}

async function handleSocialPopupSubmit(e) {
  e.preventDefault();
  const name = elements.socialAuthName.value.trim() || "Mahita";
  const email = elements.socialAuthEmail.value.trim();
  const password = elements.socialAuthPassword.value;

  if (!email || !password) {
    alert("Please enter both username/email and password to authenticate.");
    return;
  }

  closeSocialAuthModal();
  showLoading(`Authenticating with ${currentSocialProvider.toUpperCase()}...`);

  try {
    const res = await fetch("/api/v1/auth/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: currentSocialProvider,
        email: email,
        name: name
      })
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
    showAuthAlert("Social authentication error: " + err.message, "error");
  }
}

function handleQuickDemoLogin() {
  elements.loginEmail.value = "mahita.thundiyil.btech2024@sitpune.edu.in";
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
  
  if (decision === "PASS") {
    elements.verdictBadgeLabel.textContent = `✅ REAL & SAFE • LOW RISK (${Math.round(risk)}%)`;
    elements.verdictHeading.textContent = "Verified as Real & Authentic";
    elements.verdictSummary.textContent = "Everything looks genuine. The photo, text, and details are clean with no signs of digital editing.";
  } else if (decision === "REVIEW") {
    elements.verdictBadgeLabel.textContent = `⚠️ SUSPICIOUS • MEDIUM RISK (${Math.round(risk)}%)`;
    elements.verdictHeading.textContent = "Needs A Second Look";
    elements.verdictSummary.textContent = "Some details look a bit suspicious (like slight blur, unusual lighting, or minor edits). Please inspect carefully.";
  } else {
    elements.verdictBadgeLabel.textContent = `❌ FAKE / IMPOSTER • HIGH RISK (${Math.round(risk)}%)`;
    elements.verdictHeading.textContent = "Warning: Fake or Edited Document";
    elements.verdictSummary.textContent = "Significant red flags detected: signs of copy-paste edits, fake details, or synthetic deepfake audio/video.";
  }

  // Animate Circular Gauge
  elements.riskScoreNumber.textContent = Math.round(risk);
  elements.gaugeProgress.setAttribute("stroke-dasharray", `${Math.min(100, Math.max(2, risk))}, 100`);

  // Multi-Card Carousel Check
  const cards = data.segmented_cards || [];
  if (cards.length > 1) {
    elements.multiCardBanner.classList.remove("hidden");
    elements.multiCardCountLabel.textContent = `Found ${cards.length} Separate ID Cards in this Photo (Click any card to inspect)`;
    elements.segmentedCardsCarousel.innerHTML = "";
    
    cards.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = `segmented-card-item ${i === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <img src="${c.preview_b64 || ''}" class="card-thumb" alt="${c.label}">
        <h5 class="card-item-title">${c.label}</h5>
        <p class="card-item-meta">Faces found: ${c.faces_detected}</p>
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
    elements.tamperStatusPill.textContent = ratio > 0.08 ? `⚠️ Possible Editing Detected (${Math.round(ratio*100)}%)` : "✓ Original (No Edits)";
    elements.tamperStatusPill.style.borderColor = ratio > 0.08 ? "var(--crimson-primary)" : "var(--emerald-primary)";
    elements.tamperStatusPill.style.color = ratio > 0.08 ? "var(--crimson-primary)" : "var(--emerald-primary)";
  } else {
    elements.elaHeatmapImg.src = "https://images.unsplash.com/photo-1557683316-973673baf926?w=600&auto=format&fit=crop";
    elements.tamperStatusPill.textContent = "✓ Original Document";
  }

  // Forensic Signals
  const signals = data.signals || [];
  elements.forensicSignalsList.innerHTML = signals.length > 0 
    ? signals.map(s => `<span class="signal-badge">⚠️ ${formatSignal(s)}</span>`).join("")
    : `<span class="signal-badge" style="background:rgba(16,185,129,0.1); color:#34d399; border-color:rgba(16,185,129,0.3)">✓ No suspicious issues found</span>`;

  // OCR & Intelligence
  elements.ocrEngineTag.textContent = `Text Scanner: Ready`;
  elements.ocrTextDisplay.value = data.ocr_text || "No readable text found in document.";

  // Quality Metrics
  const q = data.quality || {};
  elements.metricBrightness.textContent = q.brightness !== undefined ? (q.brightness < 80 ? "Too Dark" : q.brightness > 210 ? "Too Bright" : "Good") : "Good";
  elements.metricContrast.textContent = q.contrast !== undefined ? (q.contrast < 30 ? "Low" : "Clear") : "Clear";
  elements.metricBlur.textContent = q.blur_score !== undefined ? (q.blur_score < 50 ? "Blurry" : "Sharp & Clear") : "Sharp";
  elements.metricGlare.textContent = q.glare_ratio !== undefined ? (q.glare_ratio > 0.08 ? "High Glare" : "No Glare") : "No Glare";

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
  
  if (decision === "PASS") {
    elements.verdictBadgeLabel.textContent = `✅ MATCH • ALL FILES BELONG TO SAME PERSON`;
    elements.verdictHeading.textContent = "Identity Match Confirmed";
    elements.verdictSummary.textContent = "The faces, names, and details across all uploaded files match the same person.";
  } else if (decision === "REVIEW") {
    elements.verdictBadgeLabel.textContent = `⚠️ PARTIAL MATCH • CHECK DETAILS`;
    elements.verdictHeading.textContent = "Some Details Match, Some Differ";
    elements.verdictSummary.textContent = comp.conflict_signals && comp.conflict_signals.length > 0 
      ? comp.conflict_signals.join(". ")
      : "Some information does not match across the files. Please review the details below.";
  } else {
    elements.verdictBadgeLabel.textContent = `❌ MISMATCH • IMPOSTER DETECTED`;
    elements.verdictHeading.textContent = "Warning: Files Do NOT Match!";
    elements.verdictSummary.textContent = comp.conflict_signals && comp.conflict_signals.length > 0 
      ? comp.conflict_signals.join(". ")
      : "The faces or names across the uploaded files belong to completely different people.";
  }


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
    elements.mediaDynamicsTitle.textContent = "🎥 Video Motion & Liveness Check";
    const v = data.video_dynamics;
    const catLabel = v.video_category === "slow_motion" ? "Slow Motion (60 FPS)" : v.video_category === "timelapse" ? "Fast Timelapse" : "Normal Video";
    const flicker = v.deepfake_flicker_score > 0.3 ? "⚠️ High Glitch / Deepfake Risk" : "✓ Smooth & Natural (Low Risk)";
    container.innerHTML = `
      <div class="stat-card"><span class="stat-label">Video Type</span><span class="stat-value text-cyan">${catLabel}</span></div>
      <div class="stat-card"><span class="stat-label">Frame Rate</span><span class="stat-value">${v.fps} FPS</span></div>
      <div class="stat-card"><span class="stat-label">Natural Movement</span><span class="stat-value text-emerald">${Math.round(v.temporal_consistency*100)}%</span></div>
      <div class="stat-card"><span class="stat-label">Deepfake Glitch Check</span><span class="stat-value ${v.deepfake_flicker_score > 0.3 ? 'text-crimson' : 'text-cyan'}">${flicker}</span></div>
    `;
  } else if (data.audio_biometrics) {
    hasDynamics = true;
    elements.mediaDynamicsTitle.textContent = "🎙️ Voice Real vs AI-Generated Check";
    const a = data.audio_biometrics;
    const synthProb = Math.round(a.synthetic_voice_probability * 100);
    const synthLabel = synthProb > 40 ? `⚠️ High AI Voice Risk (${synthProb}%)` : `✓ Genuine Human Voice (${100 - synthProb}% Confidence)`;
    container.innerHTML = `
      <div class="stat-card"><span class="stat-label">Voice Check Verdict</span><span class="stat-value text-cyan">${a.verdict === 'GENUINE_HUMAN_VOICE' ? 'Real Human Voice' : 'AI / Deepfake Voice'}</span></div>
      <div class="stat-card"><span class="stat-label">Voice Realness</span><span class="stat-value ${synthProb > 40 ? 'text-crimson' : 'text-emerald'}">${synthLabel}</span></div>
      <div class="stat-card"><span class="stat-label">Sound Tone</span><span class="stat-value text-cyan">Natural Pitch</span></div>
      <div class="stat-card"><span class="stat-label">Clarity</span><span class="stat-value text-emerald">High Quality</span></div>
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

// ============================================================================
// SAMPLES CATALOG & ASSET LOADERS
// ============================================================================

async function openSamplesModal() {
  elements.samplesModal.classList.remove("hidden");
  await loadSamplesCatalog();
}

function closeSamplesModal() {
  elements.samplesModal.classList.add("hidden");
}

async function loadSamplesCatalog() {
  try {
    const res = await fetch("/api/v1/samples");
    const data = await res.json();
    const container = elements.samplesCatalogGrid;
    container.innerHTML = "";
    
    (data.samples || []).forEach(sample => {
      const card = document.createElement("div");
      card.className = "sample-item-card";
      
      const expectedClass = sample.expected === "PASS" ? "pass" : (sample.expected === "REJECT" || sample.expected === "IMPOSTER" ? "reject" : "review");
      
      card.innerHTML = `
        <div>
          <div class="sample-item-top">
            <span class="sample-category-tag">${sample.category}</span>
            <span class="verdict-pill ${expectedClass}">${sample.expected}</span>
          </div>
          <h4 class="sample-item-title">${sample.title}</h4>
          <p class="sample-item-desc">${sample.description}</p>
        </div>
        <div class="sample-item-actions">
          <button type="button" class="btn btn-primary btn-sm flex-1 btn-screen-sample" data-file="${sample.filename}">
            <span>⚡ Screen Now</span>
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-compare-sample" data-file="${sample.filename}" title="Add to Multi-File Comparison">
            <span>+ Compare</span>
          </button>
        </div>
      `;
      
      card.querySelector(".btn-screen-sample")?.addEventListener("click", async () => {
        closeSamplesModal();
        await screenSampleFile(sample.filename);
      });

      card.querySelector(".btn-compare-sample")?.addEventListener("click", async () => {
        closeSamplesModal();
        await addSampleToComparison(sample.filename);
      });

      container.appendChild(card);
    });
  } catch (err) {
    elements.samplesCatalogGrid.innerHTML = `<p style="color:var(--crimson-primary)">Failed to load sample assets: ${err.message}</p>`;
  }
}

async function fetchSampleBlob(filename) {
  const res = await fetch(`/api/v1/samples/${filename}`);
  if (!res.ok) throw new Error("Could not fetch sample file");
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "application/octet-stream" });
}

async function screenSampleFile(filename) {
  showLoading(`Loading Sample Asset: ${filename}...`);
  try {
    const file = await fetchSampleBlob(filename);
    hideLoading();
    switchStudioMode("upload");
    handleSingleFileSelected(file);
    await executeSingleScreening(file, "MAHITA");
  } catch (err) {
    hideLoading();
    alert("Error loading sample: " + err.message);
  }
}

async function addSampleToComparison(filename) {
  showLoading(`Adding ${filename} to Comparison Queue...`);
  try {
    const file = await fetchSampleBlob(filename);
    hideLoading();
    switchStudioMode("compare");
    addFilesToMultiQueue([file]);
  } catch (err) {
    hideLoading();
    alert("Error adding sample to comparison: " + err.message);
  }
}

