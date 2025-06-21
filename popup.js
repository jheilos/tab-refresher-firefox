// popup.js
let statusDiv = document.getElementById('status');
let startBtn = document.getElementById('startBtn');
let pauseBtn = document.getElementById('pauseBtn');
let saveBtn = document.getElementById('saveBtn');

let urlsTextarea = document.getElementById('urls');
let urlError = document.getElementById('urlError');
let longWaitInput = document.getElementById('longWait');
let shortWaitInput = document.getElementById('shortWait');
let preRefreshInput = document.getElementById('preRefresh');

// Time-based rules elements
let timeRulesList = document.getElementById('timeRulesList');
let currentTimeSpan = document.getElementById('currentTime');
let newRuleOriginal = document.getElementById('newRuleOriginal');
let newRuleReplacement = document.getElementById('newRuleReplacement');
let newRuleStart = document.getElementById('newRuleStart');
let newRuleEnd = document.getElementById('newRuleEnd');
let addRuleBtn = document.getElementById('addRuleBtn');
let ruleError = document.getElementById('ruleError');

// Backup & Restore elements
let exportBtn = document.getElementById('exportBtn');
let importBtn = document.getElementById('importBtn');
let importFile = document.getElementById('importFile');
let backupStatus = document.getElementById('backupStatus');
let backupError = document.getElementById('backupError');

let timeBasedRules = [];

// Update current time display
function updateCurrentTime() {
  const now = new Date();
  currentTimeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Update time every second
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Load current settings
browser.storage.local.get(['urls', 'longWait', 'shortWait', 'preRefresh', 'timeBasedRules']).then(result => {
  if (result.urls) urlsTextarea.value = result.urls.join('\n');
  if (result.longWait) longWaitInput.value = result.longWait;
  if (result.shortWait) shortWaitInput.value = result.shortWait;
  if (result.preRefresh) preRefreshInput.value = result.preRefresh;
  if (result.timeBasedRules) {
    timeBasedRules = result.timeBasedRules;
    renderTimeRules();
  }
});

// Update status
function updateStatus() {
  browser.runtime.sendMessage({ action: 'getStatus' }).then(response => {
    if (response && response.isRunning) {
      statusDiv.textContent = 'Running';
      statusDiv.className = 'status running';
      pauseBtn.disabled = false;
    } else {
      statusDiv.textContent = 'Stopped';
      statusDiv.className = 'status stopped';
      pauseBtn.disabled = true;
    }
  }).catch(error => {
    console.error('Error getting status:', error);
  });
}

// Initial status check
updateStatus();

// Validate URLs
function validateUrls(urlsText) {
  if (!urlsText.trim()) {
    return { valid: false, error: 'Please enter at least one URL' };
  }

  let urls = urlsText.split('\n').filter(url => url.trim() !== '');
  if (urls.length === 0) {
    return { valid: false, error: 'Please enter at least one URL' };
  }

  for (let url of urls) {
    try {
      new URL(url.trim());
    } catch (e) {
      return { valid: false, error: `Invalid URL: ${url}` };
    }
  }

  return { valid: true, urls: urls.map(url => url.trim()) };
}

// Validate time-based rule
function validateTimeRule(originalUrl, replacementUrl, startTime, endTime) {
  if (!originalUrl.trim()) {
    return { valid: false, error: 'Please enter an original URL' };
  }

  if (!replacementUrl.trim()) {
    return { valid: false, error: 'Please enter a replacement URL' };
  }

  try {
    new URL(originalUrl.trim());
  } catch (e) {
    return { valid: false, error: 'Invalid original URL' };
  }

  try {
    new URL(replacementUrl.trim());
  } catch (e) {
    return { valid: false, error: 'Invalid replacement URL' };
  }

  if (!startTime || !endTime) {
    return { valid: false, error: 'Please set both start and end times' };
  }

  // Check if rule already exists for this URL
  const existingRule = timeBasedRules.find(rule => rule.originalUrl === originalUrl.trim());
  if (existingRule) {
    return { valid: false, error: 'A rule already exists for this URL' };
  }

  return { valid: true };
}

// Render time-based rules list
function renderTimeRules() {
  timeRulesList.innerHTML = '';

  if (timeBasedRules.length === 0) {
    timeRulesList.innerHTML = '<div class="info">No time-based rules configured</div>';
    return;
  }

  timeBasedRules.forEach((rule, index) => {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'time-rule';

    // Determine if rule is currently active
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const start = parseInt(rule.startTime.replace(':', ''));
    const end = parseInt(rule.endTime.replace(':', ''));

    let isActive;
    if (start > end) {
      isActive = currentTime >= start || currentTime < end;
    } else {
      isActive = currentTime >= start && currentTime < end;
    }

    const activeStatus = isActive ?
        `<strong style="color: #4CAF50;">✓ ACTIVE</strong> - Using original URL` :
        `<strong style="color: #ff9800;">○ INACTIVE</strong> - Using replacement URL`;

    ruleDiv.innerHTML = `
      <div class="rule-display">
        <div style="margin-bottom: 5px;">${activeStatus}</div>
        <div><strong>Original:</strong> <span class="url">${rule.originalUrl}</span></div>
        <div><strong>Replacement:</strong> <span class="url">${rule.replacementUrl}</span></div>
        <div><strong>Active Time:</strong> <span class="time-range">${rule.startTime} - ${rule.endTime}</span></div>
      </div>
      <div class="rule-actions">
        <button class="delete-rule-btn" data-rule-index="${index}">Delete</button>
      </div>
    `;

    // Add event listener for delete button
    const deleteBtn = ruleDiv.querySelector('.delete-rule-btn');
    deleteBtn.addEventListener('click', () => {
      deleteTimeRule(index);
    });

    timeRulesList.appendChild(ruleDiv);
  });
}

// Delete time-based rule
function deleteTimeRule(index) {
  timeBasedRules.splice(index, 1);
  renderTimeRules();
  saveTimeRules();
}

// Save time-based rules to storage
function saveTimeRules() {
  browser.storage.local.set({ timeBasedRules: timeBasedRules });
}

// Add time-based rule
addRuleBtn.addEventListener('click', () => {
  const originalUrl = newRuleOriginal.value.trim();
  const replacementUrl = newRuleReplacement.value.trim();
  const startTime = newRuleStart.value;
  const endTime = newRuleEnd.value;

  const validation = validateTimeRule(originalUrl, replacementUrl, startTime, endTime);

  if (!validation.valid) {
    ruleError.textContent = validation.error;
    ruleError.style.display = 'block';
    return;
  }

  ruleError.style.display = 'none';

  // Add new rule
  const newRule = {
    originalUrl: originalUrl,
    replacementUrl: replacementUrl,
    startTime: startTime,
    endTime: endTime
  };

  timeBasedRules.push(newRule);

  // Clear form
  newRuleOriginal.value = '';
  newRuleReplacement.value = '';
  newRuleStart.value = '15:00';
  newRuleEnd.value = '00:00';

  // Re-render and save
  renderTimeRules();
  saveTimeRules();
});

// Button handlers
startBtn.addEventListener('click', () => {
  let validation = validateUrls(urlsTextarea.value);

  if (!validation.valid) {
    urlError.textContent = validation.error;
    urlError.style.display = 'block';
    return;
  }

  urlError.style.display = 'none';

  // Save URLs and time rules before starting
  browser.storage.local.set({
    urls: validation.urls,
    timeBasedRules: timeBasedRules
  }).then(() => {
    browser.runtime.sendMessage({ action: 'start' }).then(() => {
      window.close();
    });
  });
});

pauseBtn.addEventListener('click', () => {
  browser.runtime.sendMessage({ action: 'pause' }).then(() => {
    updateStatus();
  });
});

saveBtn.addEventListener('click', () => {
  let validation = validateUrls(urlsTextarea.value);

  if (!validation.valid) {
    urlError.textContent = validation.error;
    urlError.style.display = 'block';
    return;
  }

  urlError.style.display = 'none';

  let settings = {
    urls: validation.urls,
    timeBasedRules: timeBasedRules,
    longWait: parseInt(longWaitInput.value),
    shortWait: parseInt(shortWaitInput.value),
    preRefresh: parseFloat(preRefreshInput.value)
  };

  browser.storage.local.set(settings).then(() => {
    browser.runtime.sendMessage({ action: 'updateSettings', settings: settings });
    saveBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
    }, 1500);
  });
});

// Re-render rules every minute to update active status
setInterval(() => {
  if (timeBasedRules.length > 0) {
    renderTimeRules();
  }
}, 60000);

// Export settings
exportBtn.addEventListener('click', () => {
  // Gather all current settings
  const currentSettings = {
    urls: urlsTextarea.value.split('\n').filter(url => url.trim() !== '').map(url => url.trim()),
    longWait: parseInt(longWaitInput.value),
    shortWait: parseInt(shortWaitInput.value),
    preRefresh: parseFloat(preRefreshInput.value),
    timeBasedRules: timeBasedRules,
    exportDate: new Date().toISOString(),
    version: "1.0"
  };

  // Create filename with current date
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `tab-refresher-settings-${dateStr}.json`;

  // Create and download file
  const dataStr = JSON.stringify(currentSettings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  // Show success message
  backupStatus.textContent = `Settings exported to ${filename}`;
  backupStatus.style.display = 'block';
  backupError.style.display = 'none';
  setTimeout(() => {
    backupStatus.style.display = 'none';
  }, 3000);
});

// Import settings
importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedSettings = JSON.parse(e.target.result);

      // Validate imported settings
      if (!importedSettings.urls || !Array.isArray(importedSettings.urls)) {
        throw new Error('Invalid settings file: missing or invalid URLs');
      }

      // Apply imported settings to UI
      urlsTextarea.value = importedSettings.urls.join('\n');
      longWaitInput.value = importedSettings.longWait || 5;
      shortWaitInput.value = importedSettings.shortWait || 10;
      preRefreshInput.value = importedSettings.preRefresh || 2;

      if (importedSettings.timeBasedRules && Array.isArray(importedSettings.timeBasedRules)) {
        timeBasedRules = importedSettings.timeBasedRules;
        renderTimeRules();
      } else {
        timeBasedRules = [];
        renderTimeRules();
      }

      // Save imported settings
      const settings = {
        urls: importedSettings.urls,
        longWait: importedSettings.longWait || 5,
        shortWait: importedSettings.shortWait || 10,
        preRefresh: importedSettings.preRefresh || 2,
        timeBasedRules: timeBasedRules
      };

      browser.storage.local.set(settings).then(() => {
        browser.runtime.sendMessage({ action: 'updateSettings', settings: settings });

        // Show success message
        backupStatus.textContent = `Settings imported successfully from ${file.name}`;
        backupStatus.style.display = 'block';
        backupError.style.display = 'none';
        setTimeout(() => {
          backupStatus.style.display = 'none';
        }, 3000);
      });

    } catch (error) {
      console.error('Import error:', error);
      backupError.textContent = `Import failed: ${error.message}`;
      backupError.style.display = 'block';
      backupStatus.style.display = 'none';
    }
  };

  reader.onerror = () => {
    backupError.textContent = 'Failed to read file';
    backupError.style.display = 'block';
    backupStatus.style.display = 'none';
  };

  reader.readAsText(file);

  // Reset file input
  event.target.value = '';
});