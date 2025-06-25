// Chrome Extension - Popup Script
console.log("[LinkMeld] Popup script loaded");

// Constants
const RESTRICTED_PREFIXES = [
  "chrome://",
  "about:",
  "chrome-extension://",
  "https://chrome.google.com/"
];
const CAPTURE_TIMEOUT_MS = 5000;
const API_ENDPOINT = "http://localhost:3000/api/v1/captures/save";

// DOM Elements
const statusElement = document.getElementById("status");
const captureBtn = document.getElementById("captureBtn");

// State
let isCapturing = false;

// Initialize
function init() {
  setupEventListeners();
  updateUI();
}

function setupEventListeners() {
  captureBtn.addEventListener("click", handleCaptureClick);
}

function updateUI() {
  captureBtn.disabled = isCapturing;
  captureBtn.textContent = isCapturing ? "Capturing..." : "Capture Now";
}

// Main capture handler
async function handleCaptureClick() {
  if (isCapturing) return;
  
  try {
    isCapturing = true;
    updateUI();
    setStatus("Preparing capture...", "info");

    const activeTab = await getActiveTab();
    validateTab(activeTab);

    await injectContentScript(activeTab.id);
    const response = await capturePageContent(activeTab.id);
    await sendToBackend(response, activeTab.url);

    setStatus(
      response.documents?.length ? "Link captured!" : "Content captured!",
      "success"
    );
  } catch (error) {
    console.error("[LinkMeld] Capture error:", error);
    setStatus(error.message, "error");
  } finally {
    isCapturing = false;
    updateUI();
  }
}

// Helper functions
async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("[LinkMeld] Active tab:", tabs[0]);

  if (!tabs.length || !tabs[0].id || !tabs[0].url) {
    throw new Error("No active tab found");
  }

  return tabs[0];
}

function validateTab(tab) {
  if (RESTRICTED_PREFIXES.some(prefix => tab.url.startsWith(prefix))) {
    throw new Error("Cannot capture restricted pages (e.g., chrome://, Chrome Web Store)");
  }
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    console.log("[LinkMeld] Content script injected");
  } catch (error) {
    throw new Error(`Cannot access this page: ${error.message}`);
  }
}

function capturePageContent(tabId) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Capture timed out. Please try again."));
    }, CAPTURE_TIMEOUT_MS);

    chrome.tabs.sendMessage(
      tabId,
      { action: "getPageContent" },
      (response) => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response) {
          reject(new Error("No response from page. Please refresh and try again."));
          return;
        }

        if (!response.success) {
          reject(new Error(response.error || "Capture failed"));
          return;
        }

        console.log("[LinkMeld] Capture response:", response);
        resolve(response);
      }
    );
  });
}

async function sendToBackend(response, url) {
  const payload = {
    url,
    timestamp: new Date().toISOString(),
    mainText: response.mainText,
    metadata: response.metadata,
    documents: response.documents,
    metrics: response.metrics
  };

  console.log("[LinkMeld] Sending to backend:", payload);

  try {
    const result = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });

    if (!result.ok) {
      throw new Error(`Server error: ${result.status}`);
    }

    console.log("[LinkMeld] Backend save successful");
  } catch (error) {
    throw new Error(`Failed to save: ${error.message}`);
  }
}

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.style.color = type === "error" ? "#ef4444" : 
                            type === "success" ? "#10b981" : 
                            "#6b7280";
}

// Initialize the popup
init();