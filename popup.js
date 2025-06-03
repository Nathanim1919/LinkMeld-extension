console.log('[LinkMeld] Popup script loaded');

document.getElementById('captureBtn').addEventListener('click', () => {
  console.log('[LinkMeld] Capture button clicked');
  const statusElement = document.getElementById('status');
  statusElement.textContent = 'Capturing...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('[LinkMeld] Active tab:', tabs[0]);
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.id || !activeTab.url) {
      console.log('[LinkMeld] No active tab or URL found');
      statusElement.textContent = 'No active tab found.';
      return;
    }

    const restrictedPrefixes = ['chrome://', 'about:', 'chrome-extension://', 'https://chrome.google.com/'];
    if (restrictedPrefixes.some(prefix => activeTab.url.startsWith(prefix))) {
      console.log('[LinkMeld] Restricted page:', activeTab.url);
      statusElement.textContent = 'Cannot capture restricted pages (e.g., chrome://, Chrome Web Store).';
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js'],
    }).then(() => {
      console.log('[LinkMeld] Content script injected');
      setTimeout(() => {
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
          if (!response.success) {
            console.log('[LinkMeld] Capture failed:', response.error);
            statusElement.textContent = `Capture failed: ${response.error}`;
            return;
          }
          console.log('[LinkMeld] Processing response data');
          const payload = {
            url: activeTab.url,
            timestamp: new Date().toISOString(),
            mainText: response.mainText,
            metadata: response.metadata,
            documents: response.documents,
            metrics: response.metrics,
          };
          console.log('[LinkMeld] Sending to backend:', payload);
          fetch('http://localhost:3000/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
            .then(() => {
              console.log('[LinkMeld] Backend save successful');
              statusElement.textContent = response.documents.length ? 'Link captured!' : 'Content captured!';
            })
            .catch((error) => {
              console.error('[LinkMeld] Fetch error:', error.message);
              statusElement.textContent = 'Failed to save. Check if server is running.';
            });
        });
      }, 100);
    }).catch((error) => {
      console.error('[LinkMeld] Script injection error:', error.message);
      statusElement.textContent = `Cannot access this page: ${error.message}`;
    });
  });
});