console.log('[LinkMeld] Content script loaded');

// Function to find document URLs (PDFs, DOCs, etc.)
function findDocumentUrls() {
    // Embedded documents (PDFs)
    const pdfElements = document.querySelectorAll('iframe[src$=".pdf"], object[data$=".pdf"], embed[src$=".pdf"]');
    const embeddedPdfs = Array.from(pdfElements).map(el => ({
        url: el.src || el.data,
        type: 'pdf'
    })).filter(doc => doc.url);

    // Linked documents (PDFs, DOCs)
    const docLinks = document.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]');
    const linkedDocs = Array.from(docLinks).map(a => ({
        url: a.href,
        type: a.href.endsWith('.pdf') ? 'pdf' : 'doc'
    })).filter(doc => doc.url);

    // Combine and remove duplicates by URL
    const allDocs = [...embeddedPdfs, ...linkedDocs];
    const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.url, doc])).values());
    return uniqueDocs;
}

// Function to capture interactive elements (forms, buttons)
function captureInteractiveElements() {
    // Forms
    const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.action || '',
        method: form.method || 'GET',
        inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || '',
            value: input.value || ''
        }))
    }));

    // Buttons
    const buttons = Array.from(document.querySelectorAll('button')).map(button => ({
        text: button.textContent.trim(),
        type: button.type || 'button'
    }));

    return { forms, buttons };
}

// Function to capture all webpage content
function capturePageData() {
    let mainText = '';

    // --- Enhanced Main Text Extraction ---
    try {
        const article = new Readability(document).parse();
        if (article && article.textContent) {
            mainText = article.textContent;

            // Post-processing Readability.js output to remove common noisy patterns
            // This can include typical footer/header text, copyright notices, social media prompts
            mainText = mainText.replace(/Skip to content/gi, '');
            mainText = mainText.replace(/Home > Guides/gi, ''); // Specific to your example
            mainText = mainText.replace(/Last updated on\s*May 4, 2025/gi, ''); // Specific to your example
            mainText = mainText.replace(/Leave a Comment Cancel ReplyYour email address will not be published\. Required fields are marked \*Type here\.\.Name\*Email\*Website\s*Save my name, email, and website in this browser for the next time I comment\.\s*Δdocument\.getElementById\(\s*"ak_js_\d"\s*\)\.setAttribute\(\s*"value",\s*\( new Date\(\) \)\.getTime\(\) \);\s*/gi, ''); // Remove comment section
            mainText = mainText.replace(/Keep in mind that we may receive commissions when you click our links and make purchases\. However, this does not impact our reviews and comparisons\. We try our best to keep things fair and balanced, in order to help you make the best choice for you\./gi, ''); // Remove disclaimer
            mainText = mainText.replace(/Follow Us![\s\S]*?(?:Facebook|Twitter|Youtube)/gi, ''); // Remove social media follow section
            mainText = mainText.replace(/Copyright \d{4} © All rights Reserved\./gi, ''); // Remove copyright notice
            mainText = mainText.replace(/Home\s*About\s*Disclaimer\s*Contact/gi, ''); // Remove footer navigation links
            mainText = mainText.replace(/Search/gi, ''); // Remove common search text if it's in the main content from readability
            mainText = mainText.replace(/Add Your Heading Text Here[\s\S]*?Click here/gi, ''); // Remove the "Add Your Heading Text Here" block
            mainText = mainText.replace(/\b\d+\s*(LinkedIn|Future Learn|Books|Stanford|Coursera|Free Apps|Apps)\b[\s\S]*?(?:Updated|\d{4}|For Everyone)/gi, ''); // Remove related articles/posts
            mainText = mainText.replace(/CourseNerd Team/gi, ''); // Remove author name if present in main content

            // Clean up multiple newlines and spaces
            mainText = mainText.replace(/\n\s*\n/g, '\n'); // Replace multiple newlines with a single one
            mainText = mainText.replace(/\s{2,}/g, ' '); // Replace multiple spaces with a single space
            mainText = mainText.trim(); // Trim leading/trailing whitespace
        } else {
            console.warn('[LinkMeld] Readability.js returned no article or text content. Falling back to body text.');
            mainText = document.body.textContent || ''; // Fallback to body text
            mainText = mainText.trim();
        }
    } catch (e) {
        console.error('[LinkMeld] Readability.js failed:', e);
        mainText = document.body.textContent || ''; // Fallback
        mainText = mainText.trim();
    }
    // --- End Enhanced Main Text Extraction ---

    // Extract full DOM as HTML
    const fullDom = document.documentElement.outerHTML;

    // Extract image URLs
    const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({
            src: img.src,
            alt: img.alt || ''
        }))
        .filter(img => img.src && !img.src.startsWith('data:'));

    // Extract video URLs
    const videos = Array.from(document.querySelectorAll('video'))
        .map(video => ({
            src: video.src,
            duration: video.duration || null
        }))
        .filter(video => video.src);

    // Extract audio URLs
    const audios = Array.from(document.querySelectorAll('audio'))
        .map(audio => ({
            src: audio.src,
            duration: audio.duration || null
        }))
        .filter(audio => audio.src);

    // Extract all link URLs
    const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({
            href: a.href,
            text: a.textContent.trim()
        }))
        .filter(link => link.href);

    // Extract document URLs (PDFs, DOCs)
    const documents = findDocumentUrls();

    // Extract interactive elements
    const interactive = captureInteractiveElements();

    // Extract metadata
    const metadata = {
        title: document.title || 'Untitled',
        description: document.querySelector('meta[name="description"]')?.content || '',
        url: window.location.href,
        favicon: document.querySelector('link[rel*="icon"]')?.href || ''
    };

    // Package all captured data
    return {
        frameUrl: window.location.href,
        metadata: metadata,
        mainText: mainText,
        fullDom: fullDom,
        images: images,
        videos: videos,
        audios: audios,
        links: links,
        documents: documents,
        interactive: interactive,
        timestamp: new Date().toISOString()
    };
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPageContent') {
        console.log('[LinkMeld] Received getPageContent message');
        const capturedData = capturePageData();
        sendResponse(capturedData);
    }
});