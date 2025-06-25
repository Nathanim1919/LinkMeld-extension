// Content Script
console.log('[LinkMeld] Content script loaded');

// Configuration
const MAX_TEXT_LENGTH = 100000;
const MIN_TEXT_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;

// Optimized document URL finder
function findDocumentUrls(pageUrl) {
  const urls = new Map();

  // If the page itself is a PDF, include it as a document
  if (pageUrl.match(/\.pdf($|\?)/i)) {
    urls.set(pageUrl.split('?')[0], { url: pageUrl, type: 'pdf' });
    return Array.from(urls.values());
  }

  // Check <a> tags
  const links = document.getElementsByTagName('a');
  for (let i = 0; i < links.length; i++) {
    const href = links[i].href;
    if (!href) continue;
    if (href.match(/\.pdf($|\?)/i)) {
      urls.set(href.split('?')[0], { url: href, type: 'pdf' });
    } else if (href.match(/\.docx?($|\?)/i)) {
      urls.set(href.split('?')[0], { url: href, type: 'doc' });
    }
  }

  // Check embedded PDFs
  const embeds = document.querySelectorAll('iframe[src*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"]');
  for (const embed of embeds) {
    const src = embed.src || embed.data;
    if (src) {
      urls.set(src.split('?')[0], { url: src, type: 'pdf' });
    }
  }

  return Array.from(urls.values());
}

// Efficient text cleaner
function cleanText(text) {
  if (!text) return '';
  const noisePatterns = [
    /(Home|About|Contact|Disclaimer)[\s>|»]/gi,
    /Skip to content/gi,
    /Main navigation/gi,
    /Last updated on .+/gi,
    /Published on .+/gi,
    /Leave a Comment.*?type here\.\./gis,
    /Follow (us|me) on .*/gi,
    /Copyright ©.*?All rights reserved/gi,
    /Terms of Service|Privacy Policy/gi,
    /document\.getElementById\(.*?\);/gi,
    /window\.location\.href.*?;/gi,
    /\s*\n\s*\n\s*/g,
    /[ \t]{2,}/g,
  ];
  let cleaned = text;
  for (const pattern of noisePatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  if (cleaned.length > MAX_TEXT_LENGTH) {
    console.warn(`[LinkMeld] Content too long (${cleaned.length} chars), truncating`);
    cleaned = cleaned.substring(0, MAX_TEXT_LENGTH);
  }
  return cleaned;
}

// Main content extractor
function extractMainContent(isPdf) {
  if (isPdf) {
    return {
      content: '',
      title: document.title || 'Untitled PDF',
      method: 'pdf',
    };
  }
  try {
    const article = new Readability(document).parse();
    if (article?.textContent) {
      const cleaned = cleanText(article.textContent);
      if (cleaned.length >= MIN_TEXT_LENGTH) {
        return {
          content: cleaned,
          title: article.title,
          byline: article.byline,
          excerpt: article.excerpt,
          method: 'readability',
        };
      }
    }
  } catch (e) {
    console.error('[LinkMeld] Readability error:', e);
  }
  const contentSelectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '#content', '#main-content'];
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = cleanText(el.textContent);
      if (text.length >= MIN_TEXT_LENGTH) {
        return {
          content: text,
          title: document.title,
          method: `selector:${selector}`,
        };
      }
    }
  }
  const bodyText = cleanText(document.body.textContent);
  if (bodyText.length >= MIN_TEXT_LENGTH) {
    return {
      content: bodyText,
      title: document.title,
      method: 'body',
    };
  }
  return {
    content: '',
    title: document.title,
    method: 'empty',
  };
}

// Description extractor
function extractDescription(isPdf) {
  if (isPdf) {
    return 'PDF document'; // Placeholder for direct PDFs
  }
  const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]')?.content || '';
  if (metaDesc) {
    const cleaned = cleanText(metaDesc);
    return cleaned.length > MAX_DESCRIPTION_LENGTH ? cleaned.substring(0, MAX_DESCRIPTION_LENGTH) : cleaned;
  }
  const mainContent = document.querySelector('article, main, [role="main"]')?.textContent || '';
  if (mainContent) {
    const cleaned = cleanText(mainContent);
    return cleaned.length > MAX_DESCRIPTION_LENGTH ? cleaned.substring(0, MAX_DESCRIPTION_LENGTH) : cleaned;
  }
  return '';
}

// Lightweight metadata extractor
function extractMetadata(isPdf) {
  const desc = extractDescription(isPdf);
  if (isPdf) {
    return {
      title: document.title || 'Untitled PDF',
      description: desc,
      url: window.location.href,
      favicon: '',
      siteName: '',
      publishedTime: '',
      author: '',
      keywords: '',
      viewport: '',
    };
  }
  const getMetaContent = (name) => {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return el?.content || '';
  };
  return {
    title: document.title || 'Untitled',
    description: desc,
    url: window.location.href,
    favicon: document.querySelector('link[rel*="icon"]')?.href || '',
    siteName: getMetaContent('og:site_name'),
    publishedTime: getMetaContent('article:published_time'),
    author: getMetaContent('author'),
    keywords: getMetaContent('keywords'),
    viewport: document.querySelector('meta[name="viewport"]')?.content || '',
  };
}

// Performance monitoring
function withPerformanceTracking(fn, metricName) {
  return (...args) => {
    const start = performance.now();
    try {
      const result = fn(...args);
      const duration = performance.now() - start;
      if (duration > 100) {
        console.log(`[LinkMeld] ${metricName} took ${duration.toFixed(1)}ms`);
      }
      return {
        ...result,
        _metrics: {
          ...(result._metrics || {}),
          [metricName]: duration,
        },
      };
    } catch (error) {
      console.error(`[LinkMeld] Error in ${metricName}:`, error);
      throw error;
    }
  };
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    const startTime = performance.now();
    try {
      const isPdf = window.location.href.match(/\.pdf($|\?)/i);
      const content = withPerformanceTracking(extractMainContent, 'contentExtraction')(isPdf);
      const documents = withPerformanceTracking(findDocumentUrls, 'documentExtraction')(window.location.href);
      const metadata = withPerformanceTracking(extractMetadata, 'metadataExtraction')(isPdf);
      const response = {
        success: true,
        mainText: content.content,
        metadata: {
          ...metadata,
          title: content.title || metadata.title,
          extractionMethod: content.method,
        },
        documents,
        metrics: {
          ...(content._metrics || {}),
          ...(documents._metrics || {}),
          ...(metadata._metrics || {}),
          totalTime: performance.now() - startTime,
          textLength: content.content.length,
          documentCount: documents.length,
        },
      };
      sendResponse(response);
    } catch (error) {
      console.error('[LinkMeld] Content extraction failed:', error);
      sendResponse({
        success: false,
        error: error.message,
        url: window.location.href,
      });
    }
  }
  return true;
});

console.log('[LinkMeld] Content script initialized');