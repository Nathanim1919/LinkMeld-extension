console.log('[LinkMeld] Popup script loaded');

document.getElementById('captureBtn').addEventListener('click', () => {
    console.log('[LinkMeld] Capture button clicked');
    const statusElement = document.getElementById('status');
    statusElement.textContent = 'Capturing...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('[LinkMeld] Active tab:', tabs[0]);
        const activeTab = tabs[0];

        if (!activeTab || !activeTab.id) {
            console.log('[LinkMeld] No active tab found');
            statusElement.textContent = 'No active tab found.';
            return;
        }

        // Inject content script if needed
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content.js']
        }).then(() => {
            console.log('[LinkMeld] Content script injected');

            // Send message to content script
            chrome.tabs.sendMessage(activeTab.id, { action: 'getPageContent' }, (response) => {
                console.log('[LinkMeld] Message response:', response);

                if (chrome.runtime.lastError) {
                    const error = chrome.runtime.lastError;
                    console.error('[LinkMeld] Runtime error:', error.message);
                    statusElement.textContent = `Error: ${error.message}. Please refresh the page and try again.`;
                    return;
                }

                if (!response) {
                    console.log('[LinkMeld] No response received');
                    statusElement.textContent = 'No response from page. Please refresh and try again.';
                    return;
                }

                console.log('[LinkMeld] Processing response data');
                const payload = {
                    url: activeTab.url,
                    timestamp: new Date().toISOString(),
                    metadata: response.metadata,
                    mainText: response.mainText,
                    fullDom: response.fullDom,
                    images: response.images,
                    videos: response.videos,
                    audios: response.audios,
                    links: response.links,
                    documents: response.documents,
                    interactive: response.interactive
                };

                console.log('[LinkMeld] Sending to backend:', payload);
                fetch('http://localhost:3000/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                    .then(() => {
                        console.log('[LinkMeld] Backend save successful');
                        statusElement.textContent = 'Captured and sent!';
                    })
                    .catch((error) => {
                        console.error('[LinkMeld] Fetch error:', error.message);
                        statusElement.textContent = 'Failed to send to backend. Please check if the server is running.';
                    });
            });
        }).catch((error) => {
            console.error('[LinkMeld] Script injection error:', error.message);
            statusElement.textContent = `Cannot access this page: ${error.message}`;
        });
    });
});