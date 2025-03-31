const BLOCK_RULE_ID_BASE = 3000; // Unique base ID for per-tab rules
let activeDevTabs = new Set(); // Track tabs with "dev" mode enabled
let focusedTab = null; // Store the currently focused tab

async function updateBlockingRules() {
    // Remove all existing rules
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    let removeRuleIds = Array.from(rules).map(rule => rule.id);
    if (removeRuleIds.length) {
        await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds});
        console.log(`Removed ${removeRuleIds.length} rules`);
    }

    // Re-add rules only if the tab is focused
    let addRules = focusedTab && activeDevTabs.has(focusedTab) ? [{
        id: BLOCK_RULE_ID_BASE + focusedTab,
        priority: 1,
        action: {type: "block"},
        condition: {urlFilter: "https://www.getback.ch/*"}
    }] : [];

    if (addRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({addRules});
        console.log(`Blocking enabled for tab ${focusedTab}`, addRules);
    } else {
        const rules = await chrome.declarativeNetRequest.getDynamicRules();
        console.log(`Blocking disabled (no active dev tabs in focus). Rules currently active: ${rules.length}`);
    }
}

// Listen for settings changes (enable/disable dev mode for a tab)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === "settings.set" && request.data.key === "dev") {
        let tabId = request.data.tabId;
        console.log(`Changed dev value for tab ${tabId}: ${request.data.value}`);
        if (request.data.value) {
            activeDevTabs.add(tabId);
        } else {
            activeDevTabs.delete(tabId);
        }
        updateBlockingRules();
    }
});

// Listen for tab focus changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    focusedTab = activeInfo.tabId;
    updateBlockingRules();
});

// Listen for tab updates (e.g., when the user refreshes a page)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId === focusedTab && changeInfo.status === "complete") {
        updateBlockingRules();
    }
});

// Remove rule when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    activeDevTabs.delete(tabId);
    updateBlockingRules();

    chrome.storage.local.get("settings", function (result) {
        let settings = result.settings || {};
        if (settings[tabId]) {
            delete settings[tabId];
            chrome.storage.local.set({settings}, () => {
                console.log(`Settings cleared for tab ${tabId}`);
            });
        }
    });
});

async function execInPage(code) {
    const [tab] = await chrome.tabs.query({currentWindow: true, active: true});
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: (code) => {
            const el = document.createElement('script');
            el.textContent = code;
            document.documentElement.appendChild(el);
            el.remove();
        },
        args: [code],
        world: 'MAIN' // Injects into the page context, bypassing CSP
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === "fetch-script") {
        console.log("Fetching script:", request.scriptUrl);

        fetch(request.scriptUrl)
            .then(response => response.text())
            .then(scriptContent => {
                execInPage(scriptContent); // Inject script into the main page context
                sendResponse({success: true});
            })
            .catch(error => {
                console.error("Failed to fetch script:", error);
                sendResponse({success: false, error: error.message});
            });

        return true; // Keep message channel open for async response
    }

    chrome.storage.local.get("settings", (result) => {
        let settings = result.settings || {};

        if (request.cmd === "settings.get") {
            let tabId = request.data?.tabId || sender.tab?.id;
            console.log('tabId', tabId);
            sendResponse(settings[tabId] || {}); // Return settings only for the requested tabId
        }

        if (request.cmd === "settings.set") {
            let tabId = request.data.tabId;
            if (!settings[tabId]) {
                settings[tabId] = {};
            }
            settings[tabId][request.data.key] = request.data.value;
            chrome.storage.local.set({settings: settings}, () => {
                sendResponse({success: true});
            });
        }
    });
    return true; // Keep message channel open for async response
});