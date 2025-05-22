let activeTabId = null;
let timerId = null;
let activeSince = null;


const TRACKING_DURATION = 30 * 1000; // 30 seconds


function startTracking(tabId, url) {
    clearTimeout(timerId);
    activeTabId = tabId;
    activeSince = Date.now();

    timerId = setTimeout(() => {
        console.log(`[LinkMeld] User stayed on tab for 30s: ${url}`);

        // send data to backedn 
        fetch('https://localhost:3000/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', \
            },
            body: JSON.stringify({
                url,
                timestamp: new Date().toISOString(),
            })
        });
    }, TRACKING_DURATION);
}


function handleTabChange(tabId) {
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab.url || !tab.active) return;
        startTracking(tabId, tab.url);
    });
}



// Detect tab switches
chrome.tabs.onActivated.addListener(({ tabId }) => {
    handleTabChange(tabId);
});


// Detect window focus switches
chrome.windows.onFocusedChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) return;
    chrome.tabs.query({ active: true, windowId }, (tabs) => {
        if (tabs.length === 0) return;
        handleTabChange(tabs[0].id);
    });
})


// Optional: Handle tab updates (like URL change in same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.status === 'complete') {
        startTracking(tabId, tab.url);
    }
});