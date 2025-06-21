// popup.js - Simplified UI-focused popup
console.log('[Popup] Initializing simplified popup...');

// DOM elements
const statusDiv = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const openSettingsBtn = document.getElementById('openSettings');
const quickPasteBtn = document.getElementById('quickPaste');
const errorDiv = document.getElementById('error');
const successDiv = document.getElementById('success');

// Settings display elements
const urlCountSpan = document.getElementById('urlCount');
const ruleCountSpan = document.getElementById('ruleCount');
const longWaitDisplay = document.getElementById('longWaitDisplay');
const shortWaitDisplay = document.getElementById('shortWaitDisplay');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Popup] DOM loaded, initializing...');
  await loadAndDisplaySettings();
  await updateStatus();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  startBtn.addEventListener('click', handleStart);
  pauseBtn.addEventListener('click', handlePause);
  openSettingsBtn.addEventListener('click', handleOpenSettings);
  quickPasteBtn.addEventListener('click', handleQuickPaste);
}

// Load and display current settings
async function loadAndDisplaySettings() {
  try {
    console.log('[Popup] Loading settings for display...');
    const response = await browser.runtime.sendMessage({ action: 'getSettings' });

    if (response && response.success) {
      const settings = response.settings;

      // Update display
      urlCountSpan.textContent = settings.urls ? settings.urls.length : 0;
      ruleCountSpan.textContent = settings.timeBasedRules ? settings.timeBasedRules.length : 0;
      longWaitDisplay.textContent = `${settings.longWait || 5} min`;
      shortWaitDisplay.textContent = `${settings.shortWait || 10} sec`;

      console.log('[Popup] Settings display updated');
    } else {
      console.warn('[Popup] Failed to load settings:', response);
    }
  } catch (error) {
    console.error('[Popup] Error loading settings:', error);
  }
}

// Update status display
async function updateStatus() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'getStatus' });

    if (response && response.isRunning) {
      statusDiv.textContent = 'Running';
      statusDiv.className = 'status running';
      startBtn.disabled = true;
      pauseBtn.disabled = false;
    } else {
      statusDiv.textContent = 'Not Running';
      statusDiv.className = 'status stopped';
      startBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  } catch (error) {
    console.error('[Popup] Error getting status:', error);
    statusDiv.textContent = 'Error';
    statusDiv.className = 'status stopped';
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }
}

// Handle start button
async function handleStart() {
  try {
    hideMessages();
    console.log('[Popup] Starting cycle...');

    startBtn.disabled = true;
    startBtn.textContent = 'Starting...';

    const response = await browser.runtime.sendMessage({ action: 'start' });

    if (response && response.success) {
      showSuccess('Cycle started successfully!');
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      showError(response.error || 'Failed to start cycle');
      startBtn.disabled = false;
      startBtn.textContent = 'Start Cycle';
    }
  } catch (error) {
    console.error('[Popup] Error starting cycle:', error);
    showError('Failed to start cycle. Please try again.');
    startBtn.disabled = false;
    startBtn.textContent = 'Start Cycle';
  }
}

// Handle pause button
async function handlePause() {
  try {
    hideMessages();
    console.log('[Popup] Pausing cycle...');

    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pausing...';

    const response = await browser.runtime.sendMessage({ action: 'pause' });

    if (response && response.success) {
      showSuccess('Cycle paused.');
      await updateStatus();
    } else {
      showError('Failed to pause cycle');
    }

    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
  } catch (error) {
    console.error('[Popup] Error pausing cycle:', error);
    showError('Failed to pause cycle');
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
  }
}

// Handle open settings
async function handleOpenSettings() {
  try {
    console.log('[Popup] Opening settings page...');
    await browser.runtime.openOptionsPage();
    window.close();
  } catch (error) {
    console.error('[Popup] Error opening settings:', error);
    showError('Failed to open settings page');
  }
}

// Handle quick paste import
async function handleQuickPaste() {
  try {
    hideMessages();
    console.log('[Popup] Quick paste import...');

    quickPasteBtn.disabled = true;
    quickPasteBtn.textContent = 'Reading Clipboard...';

    // Read from clipboard
    let clipboardText;
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (clipError) {
      console.error('[Popup] Clipboard read error:', clipError);
      showError('Could not read from clipboard. Please use the Settings page for file import.');
      quickPasteBtn.disabled = false;
      quickPasteBtn.textContent = '📋 Quick Import from Clipboard';
      return;
    }

    if (!clipboardText || !clipboardText.trim()) {
      showError('Clipboard is empty. Copy JSON settings first, then try again.');
      quickPasteBtn.disabled = false;
      quickPasteBtn.textContent = '📋 Quick Import from Clipboard';
      return;
    }

    console.log('[Popup] Clipboard content length:', clipboardText.length);

    // Send to background for processing
    quickPasteBtn.textContent = 'Processing...';
    const response = await browser.runtime.sendMessage({
      action: 'importFromText',
      text: clipboardText
    });

    if (response && response.success) {
      showSuccess(`✅ Import successful! ${response.message}`);
      await loadAndDisplaySettings(); // Refresh display
    } else {
      showError(`Import failed: ${response.error || 'Unknown error'}`);
    }

    quickPasteBtn.disabled = false;
    quickPasteBtn.textContent = '📋 Quick Import from Clipboard';

  } catch (error) {
    console.error('[Popup] Error in quick paste:', error);
    showError('Quick import failed. Please use the Settings page instead.');
    quickPasteBtn.disabled = false;
    quickPasteBtn.textContent = '📋 Quick Import from Clipboard';
  }
}

// Show error message
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  successDiv.style.display = 'none';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

// Show success message
function showSuccess(message) {
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  errorDiv.style.display = 'none';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 3000);
}

// Hide all messages
function hideMessages() {
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
}

console.log('[Popup] Popup script loaded successfully');