// background.js
// Configuration - Will be loaded from storage
let TABS_TO_OPEN = [];
let TIME_BASED_RULES = []; // New: Array of time-based URL swap rules

// Timing variables that can be updated
let FIRST_TAB_WAIT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
let TAB_SWITCH_DELAY = 10 * 1000; // 10 seconds in milliseconds
let PRE_REFRESH_DELAY = 2 * 1000; // 2 seconds before refresh

// State variables
let managedTabs = [];
let currentTabIndex = 0;
let cycleTimeout = null;
let isRunning = false;
let nextCycleTime = null;
let countdownInterval = null;

// Load saved settings on startup
browser.storage.local.get(['urls', 'longWait', 'shortWait', 'preRefresh', 'timeBasedRules']).then(result => {
  if (result.urls) TABS_TO_OPEN = result.urls;
  if (result.longWait) FIRST_TAB_WAIT_TIME = result.longWait * 60 * 1000;
  if (result.shortWait) TAB_SWITCH_DELAY = result.shortWait * 1000;
  if (result.preRefresh) PRE_REFRESH_DELAY = result.preRefresh * 1000;
  if (result.timeBasedRules) TIME_BASED_RULES = result.timeBasedRules;
});

// Function to check if current time is within a time range
function isTimeInRange(startTime, endTime) {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format

  // Convert time strings (HH:MM) to numbers (HHMM)
  const start = parseInt(startTime.replace(':', ''));
  const end = parseInt(endTime.replace(':', ''));

  // Handle overnight ranges (e.g., 15:00 to 00:00)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  } else {
    return currentTime >= start && currentTime < end;
  }
}

// Function to get the appropriate URL based on time-based rules
function getActiveUrl(originalUrl) {
  for (let rule of TIME_BASED_RULES) {
    if (rule.originalUrl === originalUrl) {
      if (isTimeInRange(rule.startTime, rule.endTime)) {
        console.log(`[Tab Refresher] Time-based rule applied: ${originalUrl} -> ${rule.originalUrl} (${rule.startTime}-${rule.endTime})`);
        return rule.originalUrl; // Use original URL during active time
      } else {
        console.log(`[Tab Refresher] Time-based rule applied: ${originalUrl} -> ${rule.replacementUrl} (outside ${rule.startTime}-${rule.endTime})`);
        return rule.replacementUrl; // Use replacement URL outside active time
      }
    }
  }
  return originalUrl; // No rule found, use original URL
}

// Function to get all active URLs (applying time-based rules)
function getActiveUrls() {
  return TABS_TO_OPEN.map(url => getActiveUrl(url));
}

// Message handler for popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    sendResponse({ isRunning: isRunning });
  } else if (request.action === 'start') {
    // Load URLs and rules from storage before starting
    browser.storage.local.get(['urls', 'timeBasedRules']).then(result => {
      if (result.urls && result.urls.length > 0) {
        TABS_TO_OPEN = result.urls;
        if (result.timeBasedRules) TIME_BASED_RULES = result.timeBasedRules;
        startRefreshCycle();
      } else {
        console.error('[Tab Refresher] No URLs configured');
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'pause') {
    stopRefreshCycle();
    sendResponse({ success: true });
  } else if (request.action === 'updateSettings') {
    if (request.settings.urls) TABS_TO_OPEN = request.settings.urls;
    if (request.settings.timeBasedRules) TIME_BASED_RULES = request.settings.timeBasedRules;
    FIRST_TAB_WAIT_TIME = request.settings.longWait * 60 * 1000;
    TAB_SWITCH_DELAY = request.settings.shortWait * 1000;
    PRE_REFRESH_DELAY = request.settings.preRefresh * 1000;
    console.log('[Tab Refresher] Settings updated');
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

async function startRefreshCycle() {
  if (TABS_TO_OPEN.length === 0) {
    console.error('[Tab Refresher] No URLs configured. Please add URLs in the popup.');
    browser.notifications.create({
      type: "basic",
      iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23f44336'/></svg>",
      title: "Tab Refresher Error",
      message: "No URLs configured. Please add URLs in the popup."
    });
    return;
  }

  console.log("Starting/Restarting tab refresh cycle...");

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
      // Tab might already be closed
    }
  }

  managedTabs = [];

  // Get active URLs (with time-based rules applied)
  const activeUrls = getActiveUrls();

  // Open all tabs with active URLs
  for (let url of activeUrls) {
    let tab = await browser.tabs.create({ url: url, active: false });
    managedTabs.push(tab.id);
  }

  // Switch to first tab
  currentTabIndex = 0;
  await browser.tabs.update(managedTabs[0], { active: true });
  console.log(`[Tab Refresher] Started cycle with ${activeUrls.length} tabs`);

  // Show notification
  browser.notifications.create({
    type: "basic",
    iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%234CAF50'/></svg>",
    title: "Tab Refresher Started",
    message: `Cycling through ${activeUrls.length} tabs. Starting ${FIRST_TAB_WAIT_TIME/60000}-minute wait.`
  });

  // Update browser action title
  browser.browserAction.setTitle({ title: "Tab Refresher (Running) - Click for controls" });

  // Start the cycle
  logNextCycle(FIRST_TAB_WAIT_TIME);
  scheduleCycle(FIRST_TAB_WAIT_TIME);
}

function logNextCycle(delay) {
  nextCycleTime = new Date(Date.now() + delay);
  const minutes = Math.floor(delay / 60000);
  const seconds = Math.floor((delay % 60000) / 1000);
  console.log(`[Tab Refresher] Next action in ${minutes}m ${seconds}s at ${nextCycleTime.toLocaleTimeString()}`);

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
        console.log(`[Tab Refresher] Time remaining: ${remMinutes}m ${remSeconds}s`);
      } else {
        clearInterval(countdownInterval);
      }
    }, 30000);
  }
}

function scheduleCycle(delay) {
  cycleTimeout = setTimeout(async () => {
    await performNextAction();
  }, delay);
}

async function performNextAction() {
  if (!isRunning || managedTabs.length === 0) return;

  try {
    // First, switch to the current tab
    await browser.tabs.update(managedTabs[currentTabIndex], { active: true });

    // Get the expected URL (with time-based rules applied)
    const expectedUrl = getActiveUrl(TABS_TO_OPEN[currentTabIndex]);

    console.log(`[Tab Refresher] Switched to tab ${currentTabIndex}: ${expectedUrl}`);

    // Wait before refresh to let tab fully load and become visible
    console.log(`[Tab Refresher] Waiting ${PRE_REFRESH_DELAY/1000} seconds before refresh...`);
    await new Promise(resolve => setTimeout(resolve, PRE_REFRESH_DELAY));

    // Get current tab info to check for redirects or if URL needs to be updated
    let currentTab = await browser.tabs.get(managedTabs[currentTabIndex]);

    // Check if the current URL matches what it should be (accounting for time-based rules)
    if (!currentTab.url.startsWith(expectedUrl)) {
      console.log(`[Tab Refresher] Tab ${currentTabIndex} needs URL update from ${currentTab.url} to ${expectedUrl}`);
      // Navigate to the expected URL (which may be different due to time-based rules)
      await browser.tabs.update(managedTabs[currentTabIndex], { url: expectedUrl });
      // Wait a bit for navigation
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Refresh current tab
    await browser.tabs.reload(managedTabs[currentTabIndex]);
    console.log(`[Tab Refresher] Refreshed tab ${currentTabIndex}: ${expectedUrl}`);

    // Prepare for next tab
    currentTabIndex = (currentTabIndex + 1) % managedTabs.length;

    // Determine next delay
    let nextDelay;
    if (currentTabIndex === 0) {
      // Completed a full cycle, switch back to first tab before long wait
      console.log(`[Tab Refresher] Completed full cycle. Switching to first tab for long wait.`);
      await new Promise(resolve => setTimeout(resolve, TAB_SWITCH_DELAY));
      await browser.tabs.update(managedTabs[0], { active: true });
      console.log(`[Tab Refresher] Back at first tab. Starting ${FIRST_TAB_WAIT_TIME/60000}-minute wait before next cycle.`);
      nextDelay = FIRST_TAB_WAIT_TIME;
      // Log when the next cycle will start
      logNextCycle(nextDelay);
      scheduleCycle(nextDelay);
    } else {
      // Normal tab switch delay
      nextDelay = TAB_SWITCH_DELAY;
      // Log and schedule next action
      logNextCycle(nextDelay);
      scheduleCycle(nextDelay);
    }

  } catch (error) {
    console.error("[Tab Refresher] Error in cycle:", error);
    // Try to recover by continuing the cycle
    if (isRunning) {
      currentTabIndex = (currentTabIndex + 1) % managedTabs.length;
      logNextCycle(TAB_SWITCH_DELAY);
      scheduleCycle(TAB_SWITCH_DELAY);
    }
  }
}

function stopRefreshCycle() {
  isRunning = false;
  if (cycleTimeout) {
    clearTimeout(cycleTimeout);
    cycleTimeout = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  browser.browserAction.setTitle({ title: "Tab Refresher - Click for controls" });
  console.log("[Tab Refresher] Stopped tab refresh cycle");

  // Send notification
  browser.notifications.create({
    type: "basic",
    iconUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23ff9800'/></svg>",
    title: "Tab Refresher Paused",
    message: "Tab refresh cycle has been paused."
  });
}

// Clean up when tabs are closed manually
browser.tabs.onRemoved.addListener((tabId) => {
  let index = managedTabs.indexOf(tabId);
  if (index > -1) {
    managedTabs.splice(index, 1);

    // Remove the corresponding URL from TABS_TO_OPEN
    if (index < TABS_TO_OPEN.length) {
      TABS_TO_OPEN.splice(index, 1);
    }

    // Adjust current index if needed
    if (currentTabIndex >= managedTabs.length && managedTabs.length > 0) {
      currentTabIndex = 0;
    }

    // Stop if no tabs left
    if (managedTabs.length === 0) {
      stopRefreshCycle();
    }
  }
});