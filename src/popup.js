document.getElementById('captureBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
  
      if (!activeTab || !activeTab.id) return;
  
      chrome.tabs.sendMessage(activeTab.id, { action: 'getPageContent' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          document.getElementById('status').textContent = 'Failed to get content.';
          return;
        }
  
        const payload = {
          url: activeTab.url,
          timestamp: new Date().toISOString(),
          text: response.text,
          html: response.html
        };
  
        fetch('http://localhost:3001/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(() => {
            document.getElementById('status').textContent = 'Captured and sent!';
          })
          .catch(() => {
            document.getElementById('status').textContent = 'Failed to send to backend.';
          });
      });
    });
  });
  