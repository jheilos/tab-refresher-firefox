// background.js - Enhanced Tab Refresher with Storage Management
// Handles tab cycling, storage operations, and message passing
console.log('[Background] Tab Refresher background script initializing...');

// Configuration - Will be loaded from storage
let TABS_TO_OPEN = [];
let TIME_BASED_RULES = [];

// Timing variables that can be updated via settings
let FIRST_TAB_WAIT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let TAB_SWITCH_DELAY = 10 * 1000; // 10 seconds in milliseconds
let PRE_REFRESH_DELAY = 2 * 1000; // 2 seconds before refresh

// State variables for cycle management
let managedTabs = [];
let currentTabIndex = 0;
let cycleTimeout = null;
let isRunning = false;
let nextCycleTime = null;
let countdownInterval = null;

// Default settings
const DEFAULT_SETTINGS = {
  urls: [],
  longWait: 5,
  shortWait: 10,
  preRefresh: 2,
  timeBasedRules: []
};

// ===== INITIALIZATION =====

// Load saved settings on startup
loadSettingsFromStorage().then(() => {
  console.log('[Background] Initialization complete');
}).catch(error => {
  console.error('[Background] Initialization error:', error);
});

// ===== STORAGE MANAGEMENT =====

/**
 * Load settings from browser storage
 */
async function loadSettingsFromStorage() {
  try {
    console.log('[Background] Loading settings from storage...');
    const result = await browser.storage.local.get(['urls', 'longWait', 'shortWait', 'preRefresh', 'timeBasedRules']);
    console.log('[Background] Raw storage result:', result);

    // Apply settings with defaults
    TABS_TO_OPEN = result.urls && Array.isArray(result.urls) ? result.urls : [];
    FIRST_TAB_WAIT_TIME = (typeof result.longWait === 'number' ? result.longWait : 5) * 60 * 1000;
    TAB_SWITCH_DELAY = (typeof result.shortWait === 'number' ? result.shortWait : 10) * 1000;
    PRE_REFRESH_DELAY = (typeof result.preRefresh === 'number' ? result.preRefresh : 2) * 1000;
    TIME_BASED_RULES = result.timeBasedRules && Array.isArray(result.timeBasedRules) ? result.timeBasedRules : [];

    console.log('[Background] Settings loaded:', {
      urls: TABS_TO_OPEN.length,
      longWait: FIRST_TAB_WAIT_TIME / 60000,
      shortWait: TAB_SWITCH_DELAY / 1000,
      preRefresh: PRE_REFRESH_DELAY / 1000,
      timeRules: TIME_BASED_RULES.length
    });

    return {
      urls: TABS_TO_OPEN,
      longWait: FIRST_TAB_WAIT_TIME / 60000,
      shortWait: TAB_SWITCH_DELAY / 1000,
      preRefresh: PRE_REFRESH_DELAY / 1000,
      timeBasedRules: TIME_BASED_RULES
    };
  } catch (error) {
    console.error('[Background] Error loading settings:', error);
    throw error;
  }
}

/**
 * Save settings to browser storage
 */
async function saveSettingsToStorage(settings) {
  try {
    console.log('[Background] Saving settings to storage:', settings);

    // Validate settings
    if (!settings.urls || !Array.isArray(settings.urls)) {
      throw new Error('Invalid URLs array');
    }

    // Save to storage
    await browser.storage.local.set({
      urls: settings.urls,
      longWait: settings.longWait,
      shortWait: settings.shortWait,
      preRefresh: settings.preRefresh,
      timeBasedRules: settings.timeBasedRules || []
    });

    // Update runtime variables
    TABS_TO_OPEN = settings.urls;
    FIRST_TAB_WAIT_TIME = settings.longWait * 60 * 1000;
    TAB_SWITCH_DELAY = settings.shortWait * 1000;
    PRE_REFRESH_DELAY = settings.preRefresh * 1000;
    TIME_BASED_RULES = settings.timeBasedRules || [];

    console.log('[Background] Settings saved and applied successfully');
    return true;
  } catch (error) {
    console.error('[Background] Error saving settings:', error);
    throw error;
  }
}

/**
 * Get current settings
 */
function getCurrentSettings() {
  return {
    urls: TABS_TO_OPEN,
    longWait: FIRST_TAB_WAIT_TIME / 60000,
    shortWait: TAB_SWITCH_DELAY / 1000,
    preRefresh: PRE_REFRESH_DELAY / 1000,
    timeBasedRules: TIME_BASED_RULES
  };
}

// ===== TEXT IMPORT PROCESSING =====

/**
 * Process and import settings from text/JSON
 */
async function processTextImport(text) {
  try {
    console.log('[Background] Processing text import, length:', text.length);

    // Parse JSON
    const importedSettings = JSON.parse(text);
    console.log('[Background] Parsed imported settings:', importedSettings);

    // Validate structure
    if (!importedSettings || typeof importedSettings !== 'object') {
      throw new Error('Invalid settings format');
    }

    if (!importedSettings.urls || !Array.isArray(importedSettings.urls) || importedSettings.urls.length === 0) {
      throw new Error('Missing or empty URLs');
    }

    // Validate URLs
    for (let url of importedSettings.urls) {
      try {
        new URL(url);
      } catch (e) {
        throw new Error(`Invalid URL: ${url}`);
      }
    }

    // Process numeric settings with validation
    const longWait = Math.max(1, Math.min(60, importedSettings.longWait || 5));
    const shortWait = Math.max(1, Math.min(300, importedSettings.shortWait || 10));
    const preRefresh = Math.max(0.5, Math.min(10, importedSettings.preRefresh || 2));

    // Process time-based rules
    let importedTimeRules = [];
    if (importedSettings.timeBasedRules && Array.isArray(importedSettings.timeBasedRules)) {
      importedTimeRules = importedSettings.timeBasedRules;

      // Validate time-based rules
      for (let rule of importedTimeRules) {
        if (!rule.originalUrl || !rule.replacementUrl || !rule.startTime || !rule.endTime) {
          throw new Error('Invalid time-based rule: missing required fields');
        }

        try {
          new URL(rule.originalUrl);
          new URL(rule.replacementUrl);
        } catch (e) {
          throw new Error(`Invalid URL in time-based rule`);
        }

        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(rule.startTime) || !timeRegex.test(rule.endTime)) {
          throw new Error(`Invalid time format in rule`);
        }
      }
    }

    // Create final settings object
    const finalSettings = {
      urls: importedSettings.urls,
      longWait: longWait,
      shortWait: shortWait,
      preRefresh: preRefresh,
      timeBasedRules: importedTimeRules
    };

    // Save settings
    await saveSettingsToStorage(finalSettings);

    const message = `${importedSettings.urls.length} URLs and ${importedTimeRules.length} time-based rules`;
    console.log('[Background] Text import successful:', message);

    return { success: true, message: message };

  } catch (error) {
    console.error('[Background] Text import error:', error);
    if (error.name === 'SyntaxError') {
      throw new Error('Invalid JSON format');
    } else {
      throw error;
    }
  }
}

// ===== MESSAGE HANDLING =====

// Enhanced message handler for popup and options communication
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request.action);

  // Handle messages asynchronously
  handleMessage(request, sender)
      .then(response => {
        console.log('[Background] Sending response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('[Background] Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      });

  return true; // Keep the message channel open for async response
});

/**
 * Handle incoming messages
 */
async function handleMessage(request, sender) {
  try {
    switch (request.action) {
      case 'getStatus':
        return { isRunning: isRunning };

      case 'getSettings':
        const settings = getCurrentSettings();
        return { success: true, settings: settings };

      case 'saveSettings':
        await saveSettingsToStorage(request.settings);
        return { success: true };

      case 'importFromText':
        const importResult = await processTextImport(request.text);
        return importResult;

      case 'start':
        const startResult = await startRefreshCycle();
        return startResult;

      case 'pause':
        stopRefreshCycle();
        return { success: true };

      case 'updateSettings':
        // Legacy support for old message format
        if (request.settings) {
          await saveSettingsToStorage(request.settings);
        }
        return { success: true };

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error) {
    console.error('[Background] Message handling error:', error);
    throw error;
  }
}

// ===== TIME-BASED URL LOGIC =====

/**
 * Check if current time is within a specified time range
 */
function isTimeInRange(startTime, endTime) {
  try {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const start = parseInt(startTime.replace(':', ''));
    const end = parseInt(endTime.replace(':', ''));

    // Handle overnight ranges (e.g., 15:00 to 00:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    } else {
      return currentTime >= start && currentTime < end;
    }
  } catch (error) {
    console.error('[Background] Error checking time range:', error);
    return false;
  }
}

/**
 * Get the appropriate URL based on time-based rules
 */
function getActiveUrl(originalUrl) {
  try {
    for (let rule of TIME_BASED_RULES) {
      if (rule.originalUrl === originalUrl) {
        if (isTimeInRange(rule.startTime, rule.endTime)) {
          console.log(`[Background] Time rule: ${originalUrl} -> ${rule.originalUrl} (ACTIVE)`);
          return rule.originalUrl;
        } else {
          console.log(`[Background] Time rule: ${originalUrl} -> ${rule.replacementUrl} (INACTIVE)`);
          return rule.replacementUrl;
        }
      }
    }
    return originalUrl; // No rule found, use original URL
  } catch (error) {
    console.error('[Background] Error applying time-based rules:', error);
    return originalUrl;
  }
}

/**
 * Get all active URLs with time-based rules applied
 */
function getActiveUrls() {
  try {
    return TABS_TO_OPEN.map(url => getActiveUrl(url));
  } catch (error) {
    console.error('[Background] Error getting active URLs:', error);
    return TABS_TO_OPEN;
  }
}

// ===== TAB CYCLING LOGIC =====

/**
 * Start the tab refresh cycle
 */
async function startRefreshCycle() {
  try {
    console.log('[Background] Starting refresh cycle...');
    console.log('[Background] URLs:', TABS_TO_OPEN);
    console.log('[Background] Time rules:', TIME_BASED_RULES);

    if (!TABS_TO_OPEN || TABS_TO_OPEN.length === 0) {
      const error = 'No URLs configured. Please add URLs in settings.';
      console.error('[Background]', error);
      showErrorNotification(error);
      return { success: false, error: error };
    }

    // Stop any existing cycle first
    if (isRunning) {
      stopRefreshCycle();
    }

    isRunning = true;

    // Close existing managed tabs if any
    for (let tabId of managedTabs) {
      try {
        await browser.tabs.remove(tabId);
      } catch (e) {
        console.warn('[Background] Could not close tab:', tabId, e.message);
      }
    }

    managedTabs = [];

    // Get active URLs (with time-based rules applied)
    const activeUrls = getActiveUrls();
    console.log('[Background] Active URLs after applying rules:', activeUrls);

    if (activeUrls.length === 0) {
      throw new Error('No valid URLs after applying time-based rules');
    }

    // Open all tabs with active URLs
    for (let url of activeUrls) {
      try {
        new URL(url); // Validate URL
        let tab = await browser.tabs.create({ url: url, active: false });
        managedTabs.push(tab.id);
        console.log(`[Background] Created tab ${tab.id} for URL: ${url}`);
      } catch (error) {
        console.error(`[Background] Failed to create tab for URL: ${url}`, error);
        showErrorNotification(`Failed to open URL: ${url}`);
      }
    }

    if (managedTabs.length === 0) {
      throw new Error('Failed to create any tabs');
    }

    // Switch to first tab
    currentTabIndex = 0;
    await browser.tabs.update(managedTabs[0], { active: true });
    console.log(`[Background] Started cycle with ${managedTabs.length} tabs`);

    // Show success notification
    browser.notifications.create({
      type: "basic",
      iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%234CAF50'/></svg>",
      title: "Tab Refresher Started",
      message: `Cycling through ${managedTabs.length} tabs. Starting ${FIRST_TAB_WAIT_TIME/60000}-minute wait.`
    }).catch(error => {
      console.error('[Background] Error showing start notification:', error);
    });

    // Update browser action title
    browser.browserAction.setTitle({
      title: "Tab Refresher (Running) - Click for controls"
    }).catch(error => {
      console.error('[Background] Error updating browser action title:', error);
    });

    // Start the cycle
    logNextCycle(FIRST_TAB_WAIT_TIME);
    scheduleCycle(FIRST_TAB_WAIT_TIME);

    return { success: true };

  } catch (error) {
    console.error('[Background] Error starting refresh cycle:', error);
    isRunning = false;
    const errorMsg = `Failed to start cycle: ${error.message}`;
    showErrorNotification(errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Log the next cycle action with timing information
 */
function logNextCycle(delay) {
  try {
    nextCycleTime = new Date(Date.now() + delay);
    const minutes = Math.floor(delay / 60000);
    const seconds = Math.floor((delay % 60000) / 1000);
    console.log(`[Background] Next action in ${minutes}m ${seconds}s at ${nextCycleTime.toLocaleTimeString()}`);

    // Clear any existing countdown interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    // Log countdown every 30 seconds for long waits
    if (delay > 60000) {
      let elapsed = 0;
      countdownInterval = setInterval(() => {
        elapsed += 30000;
        if (elapsed < delay && isRunning) {
          const remaining = delay - elapsed;
          const remMinutes = Math.floor(remaining / 60000);
          const remSeconds = Math.floor((remaining % 60000) / 1000);
          console.log(`[Background] Time remaining: ${remMinutes}m ${remSeconds}s`);
        } else {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      }, 30000);
    }
  } catch (error) {
    console.error('[Background] Error logging next cycle:', error);
  }
}

/**
 * Schedule the next cycle action
 */
function scheduleCycle(delay) {
  try {
    cycleTimeout = setTimeout(async () => {
      await performNextAction();
    }, Math.max(delay, 1000));
  } catch (error) {
    console.error('[Background] Error scheduling cycle:', error);
  }
}

/**
 * Perform the next action in the refresh cycle
 */
async function performNextAction() {
  if (!isRunning || !managedTabs || managedTabs.length === 0) {
    console.log('[Background] Cycle stopped or no tabs available');
    return;
  }

  try {
    // Validate current tab index
    if (currentTabIndex >= managedTabs.length) {
      currentTabIndex = 0;
    }

    // Switch to current tab
    await browser.tabs.update(managedTabs[currentTabIndex], { active: true });

    // Get expected URL (with time-based rules applied)
    const expectedUrl = getActiveUrl(TABS_TO_OPEN[currentTabIndex]);
    console.log(`[Background] Switched to tab ${currentTabIndex}: ${expectedUrl}`);

    // Wait before refresh
    console.log(`[Background] Waiting ${PRE_REFRESH_DELAY/1000} seconds before refresh...`);
    await new Promise(resolve => setTimeout(resolve, PRE_REFRESH_DELAY));

    // Check if URL needs to be updated
    let currentTab = await browser.tabs.get(managedTabs[currentTabIndex]);
    if (!currentTab.url.startsWith(expectedUrl)) {
      console.log(`[Background] Updating tab URL from ${currentTab.url} to ${expectedUrl}`);
      await browser.tabs.update(managedTabs[currentTabIndex], { url: expectedUrl });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Refresh current tab
    await browser.tabs.reload(managedTabs[currentTabIndex]);
    console.log(`[Background] Refreshed tab ${currentTabIndex}: ${expectedUrl}`);

    // Prepare for next tab
    currentTabIndex = (currentTabIndex + 1) % managedTabs.length;

    // Determine next delay
    let nextDelay;
    if (currentTabIndex === 0) {
      // Completed full cycle
      console.log(`[Background] Completed full cycle. Starting ${FIRST_TAB_WAIT_TIME/60000}-minute wait.`);
      await new Promise(resolve => setTimeout(resolve, TAB_SWITCH_DELAY));
      await browser.tabs.update(managedTabs[0], { active: true });
      nextDelay = FIRST_TAB_WAIT_TIME;
    } else {
      // Normal tab switch delay
      nextDelay = TAB_SWITCH_DELAY;
    }

    // Schedule next action
    logNextCycle(nextDelay);
    scheduleCycle(nextDelay);

  } catch (error) {
    console.error("[Background] Error in cycle:", error);
    // Try to recover
    if (isRunning && managedTabs.length > 0) {
      currentTabIndex = (currentTabIndex + 1) % managedTabs.length;
      logNextCycle(TAB_SWITCH_DELAY);
      scheduleCycle(TAB_SWITCH_DELAY);
    } else {
      stopRefreshCycle();
      showErrorNotification('Cycle stopped due to errors. Please restart manually.');
    }
  }
}

/**
 * Stop the refresh cycle and clean up
 */
function stopRefreshCycle() {
  try {
    isRunning = false;

    if (cycleTimeout) {
      clearTimeout(cycleTimeout);
      cycleTimeout = null;
    }

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }

    // Reset browser action title
    browser.browserAction.setTitle({
      title: "Tab Refresher - Click for controls"
    }).catch(error => {
      console.error('[Background] Error resetting browser action title:', error);
    });

    console.log("[Background] Stopped tab refresh cycle");

    // Send notification
    browser.notifications.create({
      type: "basic",
      iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23ff9800'/></svg>",
      title: "Tab Refresher Paused",
      message: "Tab refresh cycle has been paused."
    }).catch(error => {
      console.error('[Background] Error showing pause notification:', error);
    });
  } catch (error) {
    console.error('[Background] Error stopping refresh cycle:', error);
  }
}

/**
 * Show error notification to user
 */
function showErrorNotification(message) {
  browser.notifications.create({
    type: "basic",
    iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23f44336'/></svg>",
    title: "Tab Refresher Error",
    message: message
  }).catch(error => {
    console.error('[Background] Error showing notification:', error);
  });
}

// ===== TAB CLEANUP =====

// Clean up when tabs are closed manually
browser.tabs.onRemoved.addListener((tabId) => {
  try {
    let index = managedTabs.indexOf(tabId);
    if (index > -1) {
      console.log(`[Background] Managed tab ${tabId} was closed manually`);
      managedTabs.splice(index, 1);

      // Remove corresponding URL if valid index
      if (index < TABS_TO_OPEN.length) {
        TABS_TO_OPEN.splice(index, 1);
      }

      // Adjust current index if needed
      if (currentTabIndex >= managedTabs.length && managedTabs.length > 0) {
        currentTabIndex = 0;
      }

      // Stop if no tabs left
      if (managedTabs.length === 0) {
        console.log('[Background] No managed tabs remaining, stopping cycle');
        stopRefreshCycle();
      }
    }
  } catch (error) {
    console.error('[Background] Error handling tab removal:', error);
  }
});

console.log('[Background] Tab Refresher background script loaded successfully');