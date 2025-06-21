// options.js - Settings page logic with file operations
console.log('[Options] Initializing settings page...');

// DOM elements
const urlsTextarea = document.getElementById('urls');
const longWaitInput = document.getElementById('longWait');
const shortWaitInput = document.getElementById('shortWait');
const preRefreshInput = document.getElementById('preRefresh');

// Time rules elements
const timeRulesList = document.getElementById('timeRulesList');
const currentTimeSpan = document.getElementById('currentTime');
const newRuleOriginal = document.getElementById('newRuleOriginal');
const newRuleReplacement = document.getElementById('newRuleReplacement');
const newRuleStart = document.getElementById('newRuleStart');
const newRuleEnd = document.getElementById('newRuleEnd');
const addRuleBtn = document.getElementById('addRuleBtn');
const ruleError = document.getElementById('ruleError');

// Import/Export elements
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const importFileBtn = document.getElementById('importFileBtn');
const jsonPaste = document.getElementById('jsonPaste');
const importPasteBtn = document.getElementById('importPasteBtn');

// Action buttons
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');

// Status elements
const successAlert = document.getElementById('successAlert');
const errorAlert = document.getElementById('errorAlert');

// State
let timeBasedRules = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Options] DOM loaded, initializing...');
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    await loadSettings();
    setupEventListeners();

    console.log('[Options] Settings page initialized');
});

// Update current time display
function updateCurrentTime() {
    try {
        const now = new Date();
        currentTimeSpan.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        console.error('[Options] Error updating current time:', error);
        currentTimeSpan.textContent = '--:--';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Time rules
    addRuleBtn.addEventListener('click', handleAddRule);

    // Import/Export
    exportBtn.addEventListener('click', handleExport);
    importFileBtn.addEventListener('click', handleImportFile);
    importPasteBtn.addEventListener('click', handleImportPaste);
    fileInput.addEventListener('change', handleFileSelected);

    // Actions
    saveBtn.addEventListener('click', handleSave);
    resetBtn.addEventListener('click', handleReset);
}

// Load settings from background
async function loadSettings() {
    try {
        console.log('[Options] Loading settings...');
        const response = await browser.runtime.sendMessage({ action: 'getSettings' });

        if (response && response.success) {
            const settings = response.settings;
            console.log('[Options] Loaded settings:', settings);

            // Apply to UI
            urlsTextarea.value = settings.urls ? settings.urls.join('\n') : '';
            longWaitInput.value = settings.longWait || 5;
            shortWaitInput.value = settings.shortWait || 10;
            preRefreshInput.value = settings.preRefresh || 2;

            timeBasedRules = settings.timeBasedRules || [];
            renderTimeRules();

            showSuccess('Settings loaded successfully');
        } else {
            console.warn('[Options] Failed to load settings:', response);
            showError('Failed to load settings from storage');
        }
    } catch (error) {
        console.error('[Options] Error loading settings:', error);
        showError('Error loading settings: ' + error.message);
    }
}

// Render time-based rules
function renderTimeRules() {
    try {
        timeRulesList.innerHTML = '';

        if (!timeBasedRules || timeBasedRules.length === 0) {
            timeRulesList.innerHTML = '<div class="alert alert-info">No time-based rules configured yet.</div>';
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

            ruleDiv.innerHTML = `
        <div class="time-rule-header">
          <span class="rule-status ${isActive ? 'active' : 'inactive'}">
            ${isActive ? '✓ ACTIVE' : '○ INACTIVE'}
          </span>
          <button class="btn-danger" onclick="deleteTimeRule(${index})" style="padding: 5px 10px; font-size: 12px;">
            🗑️ Delete
          </button>
        </div>
        <div class="rule-details">
          <div><strong>Original URL:</strong> ${escapeHtml(rule.originalUrl)}</div>
          <div><strong>Replacement URL:</strong> ${escapeHtml(rule.replacementUrl)}</div>
          <div><strong>Active Time:</strong> ${escapeHtml(rule.startTime)} - ${escapeHtml(rule.endTime)}</div>
          <div style="margin-top: 8px; font-size: 12px; color: #6c757d;">
            ${isActive ? 'Currently using original URL' : 'Currently using replacement URL'}
          </div>
        </div>
      `;

            timeRulesList.appendChild(ruleDiv);
        });
    } catch (error) {
        console.error('[Options] Error rendering time rules:', error);
        timeRulesList.innerHTML = '<div class="alert alert-error">Error loading time rules</div>';
    }
}

// Delete time rule (global function for onclick)
window.deleteTimeRule = function(index) {
    try {
        if (index >= 0 && index < timeBasedRules.length) {
            const rule = timeBasedRules[index];
            if (confirm(`Delete rule for ${rule.originalUrl}?`)) {
                timeBasedRules.splice(index, 1);
                renderTimeRules();
                showSuccess('Time rule deleted');
            }
        }
    } catch (error) {
        console.error('[Options] Error deleting time rule:', error);
        showError('Failed to delete time rule');
    }
};

// Add new time rule
function handleAddRule() {
    try {
        hideMessages();

        const originalUrl = newRuleOriginal.value.trim();
        const replacementUrl = newRuleReplacement.value.trim();
        const startTime = newRuleStart.value;
        const endTime = newRuleEnd.value;

        console.log('[Options] Adding new rule:', { originalUrl, replacementUrl, startTime, endTime });

        // Validate
        const validation = validateTimeRule(originalUrl, replacementUrl, startTime, endTime);
        if (!validation.valid) {
            showRuleError(validation.error);
            return;
        }

        // Add rule
        const newRule = { originalUrl, replacementUrl, startTime, endTime };
        timeBasedRules.push(newRule);

        // Clear form
        newRuleOriginal.value = '';
        newRuleReplacement.value = '';
        newRuleStart.value = '15:00';
        newRuleEnd.value = '00:00';

        renderTimeRules();
        hideRuleError();
        showSuccess('Time rule added successfully');

    } catch (error) {
        console.error('[Options] Error adding time rule:', error);
        showRuleError('Failed to add time rule');
    }
}

// Validate time rule
function validateTimeRule(originalUrl, replacementUrl, startTime, endTime) {
    if (!originalUrl) return { valid: false, error: 'Please enter an original URL' };
    if (!replacementUrl) return { valid: false, error: 'Please enter a replacement URL' };

    try {
        new URL(originalUrl);
    } catch (e) {
        return { valid: false, error: 'Invalid original URL' };
    }

    try {
        new URL(replacementUrl);
    } catch (e) {
        return { valid: false, error: 'Invalid replacement URL' };
    }

    if (!startTime || !endTime) {
        return { valid: false, error: 'Please set both start and end times' };
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return { valid: false, error: 'Invalid time format. Use HH:MM format.' };
    }

    const existingRule = timeBasedRules.find(rule => rule.originalUrl === originalUrl);
    if (existingRule) {
        return { valid: false, error: 'A rule already exists for this URL' };
    }

    return { valid: true };
}

// Handle export
function handleExport() {
    try {
        console.log('[Options] Starting export...');
        hideMessages();

        // Get current values from UI
        const currentUrls = urlsTextarea.value.split('\n')
            .filter(url => url.trim() !== '')
            .map(url => url.trim());

        if (currentUrls.length === 0) {
            showError('No URLs to export. Please add at least one URL first.');
            return;
        }

        // Gather all settings
        const settings = {
            urls: currentUrls,
            longWait: parseInt(longWaitInput.value) || 5,
            shortWait: parseInt(shortWaitInput.value) || 10,
            preRefresh: parseFloat(preRefreshInput.value) || 2,
            timeBasedRules: timeBasedRules || [],
            exportDate: new Date().toISOString(),
            version: "1.2.0",
            extensionName: "Tab Refresher"
        };

        console.log('[Options] Exporting settings:', settings);

        // Create and download file
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        // Create filename with timestamp
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `tab-refresher-settings-${dateStr}.json`;

        // Download
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        showSuccess(`Settings exported successfully to ${filename}`);

    } catch (error) {
        console.error('[Options] Export error:', error);
        showError('Export failed: ' + error.message);
    }
}

// Handle file selection
function handleFileSelected(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('[Options] File selected:', file.name);
        importFromFile(file);
    }
}

// Handle import file button
function handleImportFile() {
    const file = fileInput.files[0];
    if (!file) {
        showError('Please select a file first');
        return;
    }
    importFromFile(file);
}

// Import from file
async function importFromFile(file) {
    try {
        console.log('[Options] Importing from file:', file.name);
        hideMessages();

        // Validate file
        if (!file.name.toLowerCase().endsWith('.json')) {
            showError('Please select a JSON file');
            return;
        }

        if (file.size > 1024 * 1024) {
            showError('File is too large. Maximum size is 1MB.');
            return;
        }

        // Read file
        const fileContent = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });

        await processImportedSettings(fileContent, file.name);

        // Clear file input
        fileInput.value = '';

    } catch (error) {
        console.error('[Options] File import error:', error);
        showError('Import failed: ' + error.message);
    }
}

// Handle import paste
async function handleImportPaste() {
    try {
        const content = jsonPaste.value.trim();
        if (!content) {
            showError('Please paste JSON content first');
            return;
        }

        await processImportedSettings(content, 'pasted content');
        jsonPaste.value = '';

    } catch (error) {
        console.error('[Options] Paste import error:', error);
        showError('Import failed: ' + error.message);
    }
}

// Process imported settings
async function processImportedSettings(content, source) {
    try {
        console.log('[Options] Processing import from:', source);
        hideMessages();

        // Parse JSON
        const settings = JSON.parse(content);
        console.log('[Options] Parsed settings:', settings);

        // Validate structure
        if (!settings.urls || !Array.isArray(settings.urls) || settings.urls.length === 0) {
            throw new Error('Invalid settings: missing or empty URLs');
        }

        // Validate URLs
        for (let url of settings.urls) {
            try {
                new URL(url);
            } catch (e) {
                throw new Error(`Invalid URL: ${url}`);
            }
        }

        // Process numeric settings
        const longWait = Math.max(1, Math.min(60, settings.longWait || 5));
        const shortWait = Math.max(1, Math.min(300, settings.shortWait || 10));
        const preRefresh = Math.max(0.5, Math.min(10, settings.preRefresh || 2));

        // Process time-based rules
        let importedTimeRules = [];
        if (settings.timeBasedRules && Array.isArray(settings.timeBasedRules)) {
            importedTimeRules = settings.timeBasedRules;

            // Validate rules
            for (let rule of importedTimeRules) {
                if (!rule.originalUrl || !rule.replacementUrl || !rule.startTime || !rule.endTime) {
                    throw new Error('Invalid time-based rule: missing required fields');
                }

                try {
                    new URL(rule.originalUrl);
                    new URL(rule.replacementUrl);
                } catch (e) {
                    throw new Error(`Invalid URL in time-based rule: ${rule.originalUrl} or ${rule.replacementUrl}`);
                }

                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(rule.startTime) || !timeRegex.test(rule.endTime)) {
                    throw new Error(`Invalid time format in rule: ${rule.startTime} or ${rule.endTime}`);
                }
            }
        }

        // Apply to UI
        urlsTextarea.value = settings.urls.join('\n');
        longWaitInput.value = longWait;
        shortWaitInput.value = shortWait;
        preRefreshInput.value = preRefresh;
        timeBasedRules = importedTimeRules;
        renderTimeRules();

        // Save to background immediately
        const finalSettings = {
            urls: settings.urls,
            longWait: longWait,
            shortWait: shortWait,
            preRefresh: preRefresh,
            timeBasedRules: importedTimeRules
        };

        const response = await browser.runtime.sendMessage({
            action: 'saveSettings',
            settings: finalSettings
        });

        if (response && response.success) {
            showSuccess(`✅ Import successful! Loaded ${settings.urls.length} URLs and ${importedTimeRules.length} time-based rules from ${source}`);
        } else {
            throw new Error(response.error || 'Failed to save imported settings');
        }

    } catch (error) {
        console.error('[Options] Import processing error:', error);
        if (error.name === 'SyntaxError') {
            showError('Invalid JSON format. Please check your JSON syntax.');
        } else {
            showError('Import failed: ' + error.message);
        }
    }
}

// Handle save
async function handleSave() {
    try {
        console.log('[Options] Saving all settings...');
        hideMessages();

        // Validate URLs
        const urls = urlsTextarea.value.split('\n')
            .filter(url => url.trim() !== '')
            .map(url => url.trim());

        if (urls.length === 0) {
            showError('Please enter at least one URL');
            return;
        }

        // Validate URLs
        for (let url of urls) {
            try {
                new URL(url);
            } catch (e) {
                showError(`Invalid URL: ${url}`);
                return;
            }
        }

        // Validate numeric inputs
        const longWait = parseInt(longWaitInput.value);
        const shortWait = parseInt(shortWaitInput.value);
        const preRefresh = parseFloat(preRefreshInput.value);

        if (longWait < 1 || longWait > 60) {
            showError('Long wait time must be between 1 and 60 minutes');
            return;
        }

        if (shortWait < 1 || shortWait > 300) {
            showError('Short wait time must be between 1 and 300 seconds');
            return;
        }

        if (preRefresh < 0.5 || preRefresh > 10) {
            showError('Pre-refresh delay must be between 0.5 and 10 seconds');
            return;
        }

        // Prepare settings
        const settings = {
            urls: urls,
            longWait: longWait,
            shortWait: shortWait,
            preRefresh: preRefresh,
            timeBasedRules: timeBasedRules
        };

        console.log('[Options] Saving settings:', settings);

        // Save via background
        const response = await browser.runtime.sendMessage({
            action: 'saveSettings',
            settings: settings
        });

        if (response && response.success) {
            showSuccess('✅ All settings saved successfully!');
        } else {
            throw new Error(response.error || 'Failed to save settings');
        }

    } catch (error) {
        console.error('[Options] Save error:', error);
        showError('Save failed: ' + error.message);
    }
}

// Handle reset
async function handleReset() {
    try {
        if (confirm('Reload settings from storage? Any unsaved changes will be lost.')) {
            await loadSettings();
        }
    } catch (error) {
        console.error('[Options] Reset error:', error);
        showError('Reset failed: ' + error.message);
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.classList.remove('hidden');
    errorAlert.classList.add('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        successAlert.classList.add('hidden');
    }, 5000);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('hidden');
    successAlert.classList.add('hidden');

    // Auto-hide after 8 seconds
    setTimeout(() => {
        errorAlert.classList.add('hidden');
    }, 8000);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideMessages() {
    successAlert.classList.add('hidden');
    errorAlert.classList.add('hidden');
}

function showRuleError(message) {
    ruleError.textContent = message;
    ruleError.classList.remove('hidden');
}

function hideRuleError() {
    ruleError.classList.add('hidden');
}

// Re-render rules every minute to update active status
setInterval(() => {
    if (timeBasedRules && timeBasedRules.length > 0) {
        renderTimeRules();
    }
}, 60000);

console.log('[Options] Options script loaded successfully');