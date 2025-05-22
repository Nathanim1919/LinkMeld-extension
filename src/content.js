// Listen for message from background.js
chrome.runtime.onMessage.addListener((request, ender, sendResponse) => {
    if (request.action === 'getPageContent') {
        const textContent = document.body.innerHTML || '';
        const htmlContent = document.documentElement.outerHTML || '';

        sendResponse({
            text: textContent.slice(0, 5000),
            html: htmlContent.slice(0, 5000)
        });
    }

    // Return true to indicate that the response will be sent asynchronously
    return true;
});


