// Final Merged Content Script: Lnkd + LinkMeld
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false,
  run_at: "document_end"
}

console.log("[Lnkd] Content script loaded")

// Constants
const MAX_TEXT_LENGTH = 100000
const MIN_TEXT_LENGTH = 50
const MAX_DESCRIPTION_LENGTH = 500

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractPageData") {
    const start = performance.now()
    try {
      const isPdf = !!window.location.href.match(/\.pdf($|\?)/i)
      const content = extractMainContent(isPdf)
      const documents = findDocumentUrls(window.location.href)
      const metadata = extractMetadata(isPdf)
      const links = extractLinks()
      const images = extractImages()
      const headings = extractHeadings()
      const selectedText = window.getSelection()?.toString()?.trim() || ""

      const result = {
        success: true,
        url: window.location.href,
        title: metadata.title,
        description: metadata.description,
        favicon: metadata.favicon,
        siteName: metadata.siteName,
        publishedTime: metadata.publishedTime,
        author: metadata.author,
        keywords: metadata.keywords,
        viewport: metadata.viewport,
        language: document.documentElement.lang || "en",
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        selectedText: selectedText.substring(0, 2000),
        mainText: content.content,
        extractionMethod: content.method,
        links: links.slice(0, 100),
        images: images.slice(0, 50),
        headings: headings.slice(0, 20),
        documents,
        wordCount: countWords(content.content),
        readingTime: estimateReadingTime(content.content),
        metrics: {
          textLength: content.content.length,
          documentCount: documents.length,
          totalTime: performance.now() - start
        }
      }

      sendResponse(result)
    } catch (error) {
      console.error("[Lnkd] Extraction failed:", error)
      sendResponse({ success: false, error: error.message })
    }
  }
  return true
})

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim()
    .substring(0, MAX_TEXT_LENGTH)
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function estimateReadingTime(text: string): number {
  const wpm = 200
  return Math.ceil(countWords(text) / wpm)
}

function extractMainContent(isPdf: boolean) {
  if (isPdf) return { content: "", title: document.title, method: "pdf" }
  try {
    const article = new (window as any).Readability(document).parse()
    if (article?.textContent && article.textContent.length > MIN_TEXT_LENGTH) {
      return { content: cleanText(article.textContent), title: article.title, method: "readability" }
    }
  } catch {}

  const selectors = ["main", "article", "[role='main']", ".post-content", "#content"]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el) {
      const text = cleanText(el.textContent || "")
      if (text.length > MIN_TEXT_LENGTH) return { content: text, title: document.title, method: `selector:${sel}` }
    }
  }

  const bodyText = cleanText(document.body.textContent || "")
  return { content: bodyText, title: document.title, method: "body" }
}

function findDocumentUrls(pageUrl: string) {
  const urls = new Map<string, { url: string, type: string }>()

  if (pageUrl.match(/\.pdf($|\?)/i)) {
    urls.set(pageUrl.split('?')[0], { url: pageUrl, type: 'pdf' })
    return Array.from(urls.values())
  }

  const links = document.getElementsByTagName('a')
  for (let i = 0; i < links.length; i++) {
    const href = links[i].href
    if (!href) continue
    if (href.match(/\.pdf($|\?)/i)) urls.set(href.split('?')[0], { url: href, type: 'pdf' })
    if (href.match(/\.docx?($|\?)/i)) urls.set(href.split('?')[0], { url: href, type: 'doc' })
  }

  const embeds = document.querySelectorAll('iframe[src*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"]')
  for (const embed of embeds) {
    const src = embed.getAttribute("src") || embed.getAttribute("data")
    if (src) urls.set(src.split('?')[0], { url: src, type: 'pdf' })
  }

  return Array.from(urls.values())
}

function extractMetadata(isPdf: boolean) {
  const getMeta = (name: string) => {
    const el = document.querySelector(`meta[name='${name}'], meta[property='${name}']`)
    return el?.getAttribute("content") || ""
  }

  return {
    title: document.title || "Untitled",
    description: extractDescription(isPdf),
    url: window.location.href,
    favicon: document.querySelector("link[rel*='icon']")?.getAttribute("href") || "",
    siteName: getMeta("og:site_name"),
    publishedTime: getMeta("article:published_time"),
    author: getMeta("author"),
    keywords: getMeta("keywords"),
    viewport: document.querySelector("meta[name='viewport']")?.getAttribute("content") || ""
  }
}

function extractDescription(isPdf: boolean) {
  if (isPdf) return "PDF Document"
  const desc = document.querySelector("meta[name='description'], meta[property='og:description']")?.getAttribute("content") || ""
  if (desc) return cleanText(desc).substring(0, MAX_DESCRIPTION_LENGTH)
  const alt = document.querySelector("main, article, [role='main']")?.textContent || ""
  return cleanText(alt).substring(0, MAX_DESCRIPTION_LENGTH)
}

function extractLinks() {
  return Array.from(document.querySelectorAll("a[href]"))
    .map(link => ({
      text: cleanText(link.textContent || ""),
      href: (link as HTMLAnchorElement).href,
      title: link.getAttribute("title") || link.getAttribute("aria-label") || ""
    }))
    .filter(link => link.text && link.href && !link.href.startsWith("javascript:"))
}

function extractImages() {
  return Array.from(document.querySelectorAll("img[src]"))
    .map(img => ({
      src: (img as HTMLImageElement).src,
      alt: img.getAttribute("alt") || "",
      title: img.getAttribute("title") || ""
    }))
    .filter(img => img.src && !img.src.startsWith("data:"))
}

function extractHeadings() {
  return Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .map(h => ({
      level: parseInt(h.tagName.charAt(1)),
      text: cleanText(h.textContent || "")
    }))
    .filter(h => h.text.length > 0)
}

export {}
