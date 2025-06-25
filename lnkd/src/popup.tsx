import { useState } from "react"
import { toast } from "sonner"

import "tailwindcss/tailwind.css" // Ensure Tailwind CSS is imported
import "./style.css" // Custom styles if needed

const Popup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState<"page" | "selection">("page")

  const handleCapture = () => {
    setIsLoading(true)
    setTimeout(() => {
      toast.success("✨ Page saved successfully!")
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="plasmo-w-[300px] p-4 plasmo-bg-white plasmo-shadow-lg plasmo-overflow-hidden plasmo-border plasmo-border-gray-200">
      {/* Header with gradient */}
      <div className="plasmo-bg-gradient-to-r plasmo-from-blue-900 plasmo-to-blue-600 plasmo-p-2 plasmo-text-white">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
          <div className="plasmo-flex plasmo-items-center plasmo-space-x-3">
            <div className="plasmo-w-10 plasmo-h-10 plasmo-rounded-lg plasmo-bg-white/20 plasmo-flex plasmo-items-center plasmo-justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <h1 className="plasmo-text-xl plasmo-font-bold">Lnkd</h1>
          </div>
          <button
            onClick={() => window.open("https://app.lnkd.com", "_blank")}
            className="plasmo-text-sm plasmo-bg-white/20 hover:plasmo-bg-white/30 plasmo-px-3 plasmo-py-1 plasmo-rounded-lg plasmo-transition-colors">
            View all
          </button>
        </div>
        <p className="plasmo-text-sm plasmo-opacity-90 plasmo-mt-1">
          Capture web content in one click
        </p>
      </div>

      {/* Main content */}
      <div className="plasmo-p-2 plasmo-w-full">
        {/* Tab selector */}
        {/* <div className="plasmo-flex plasmo-mb-5 plasmo-bg-gray-100 plasmo-p-1 plasmo-rounded-lg">
          <button
            onClick={() => setCurrentTab("page")}
            className={`plasmo-flex-1 plasmo-py-2.5 plasmo-text-sm plasmo-font-medium plasmo-rounded-md plasmo-transition-colors ${
              currentTab === "page"
                ? "plasmo-bg-white plasmo-shadow-sm plasmo-text-blue-600"
                : "plasmo-text-gray-600 hover:plasmo-text-gray-800"
            }`}
          >
            Full Page
          </button>
          <button
            onClick={() => setCurrentTab("selection")}
            className={`plasmo-flex-1 plasmo-py-2.5 plasmo-text-sm plasmo-font-medium plasmo-rounded-md plasmo-transition-colors ${
              currentTab === "selection"
                ? "plasmo-bg-white plasmo-shadow-sm plasmo-text-blue-600"
                : "plasmo-text-gray-600 hover:plasmo-text-gray-800"
            }`}
          >
            Selection
          </button>
        </div> */}

        {/* Preview card */}
        {/* <div className="plasmo-mb-5 plasmo-border plasmo-border-gray-200 plasmo-rounded-xl plasmo-overflow-hidden plasmo-w-full">
          <div className="plasmo-h-36 plasmo-bg-gradient-to-br plasmo-from-gray-50 plasmo-to-gray-100 plasmo-flex plasmo-items-center plasmo-justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="plasmo-text-gray-400"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="plasmo-p-4 plasmo-w-full">
            <h3 className="plasmo-font-semibold plasmo-text-gray-800 plasmo-line-clamp-1">
              Current page title will appear here in a clear, readable format
            </h3>
            <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-mt-2 plasmo-line-clamp-2">
              A preview of the page content will be displayed in this section when available,
              showing enough context to identify what you're saving...
            </p>
          </div>
        </div> */}

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={isLoading}
          className={`plasmo-w-full plasmo-py-3 plasmo-rounded-xl plasmo-flex plasmo-items-center plasmo-justify-center plasmo-space-x-0 ${
            isLoading
              ? "plasmo-bg-blue-400 plasmo-cursor-not-allowed"
              : "plasmo-bg-blue-800 hover:plasmo-bg-blue-700 plasmo-shadow-md"
          } plasmo-text-white plasmo-font-medium plasmo-transition-all`}>
          {isLoading ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="plasmo-animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span className="plasmo-min-w-[120px]">Capture Now</span>
            </>
          )}
        </button>

        {/* Keyboard shortcut */}
        <div className="plasmo-text-center plasmo-mt-4 plasmo-text-sm plasmo-text-gray-500">
          Press{" "}
          <kbd className="plasmo-px-2 plasmo-py-1 plasmo-bg-gray-100 plasmo-rounded-lg plasmo-font-medium plasmo-mx-1">
            ⌘
          </kbd>{" "}
          +{" "}
          <kbd className="plasmo-px-2 plasmo-py-1 plasmo-bg-gray-100 plasmo-rounded-lg plasmo-font-medium plasmo-mx-1">
            S
          </kbd>{" "}
          to quick save
        </div>
      </div>
    </div>
  )
}

export default Popup
