import { useState, useEffect } from "react"
import { toast, Toaster } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { FiArrowRight, FiSave, FiExternalLink, FiCommand } from "react-icons/fi"
import "tailwindcss/tailwind.css"
import "./style.css"
// import "sonner/dist/sonner.min.css"

const Popup = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [toastId, setToastId] = useState<string | number | null>(null)

  const handleCapture = async () => {
    setIsLoading(true)
    setIsPressed(false)
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error("No active tab found")

      // Clear any existing toast before showing new one
      if (toastId) toast.dismiss(toastId)

      const newToastId = toast.loading("", {
        position: "top-center",
        style: {
          background: "rgba(28, 28, 30, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(72, 72, 74, 0.6)",
          color: "#f5f5f7",
          borderRadius: "14px",
          padding: "14px 18px",
          fontSize: "14px",
          fontWeight: "500"
        },
        icon: (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="plasmo-w-5 plasmo-h-5 plasmo-border-2 plasmo-border-[#636366] plasmo-border-t-transparent plasmo-rounded-full"
          />
        )
      })
      setToastId(newToastId)

      const response = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { action: "extractPageData" }, resolve)
      })

      if (!response?.success) throw new Error("Could not extract content")
        
      const res = await fetch("http://localhost:3000/api/v1/captures/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      })


      if (res.status === 409){
        const errorText = await res.text()
        console.log("Ressponse is:", res);
        toast.error("Content already exists", {
          id: newToastId,
          position: "top-center",
          style: {
            background: "rgba(28, 28, 30, 0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 69, 58, 0.3)",
            color: "#f5f5f7",
            borderRadius: "14px",
            padding: "14px 18px",
            fontSize: "14px"
          },
          icon: (
            <motion.div
              animate={{ x: [0, -3, 3, -3, 0] }}
              transition={{ duration: 0.4 }}
              className="plasmo-text-red-500"
            >
              ⚠️
            </motion.div>
          )
        })
        return
      }

      if (!res.ok) {
        const errorText = await res.text()
        if (res.status === 401) {
          window.open("http://localhost:5173/login", "_blank")
          throw new Error("Please authenticate first")
        }
        throw new Error(errorText || "Failed to save content")
      }

      toast.success("Saved to your knowledge base", {
        id: newToastId,
        position: "top-center",
        style: {
          background: "rgba(28, 28, 30, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(48, 209, 88, 0.3)",
          color: "#f5f5f7",
          borderRadius: "14px",
          padding: "14px 18px",
          fontSize: "14px"
        },
        icon: (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, type: "spring" }}
            className="plasmo-text-green-500 plasmo-text-lg"
          >
            ✓
          </motion.div>
        )
      })
    } catch (err: any) {
      console.error("Capture error:", err)

      toast.error(err.message, {
        position: "top-center",
        style: {
          background: "rgba(28, 28, 30, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 69, 58, 0.3)",
          color: "#f5f5f7",
          borderRadius: "14px",
          padding: "14px 18px",
          fontSize: "14px"
        },
        icon: (
          <motion.div
            animate={{ x: [0, -3, 3, -3, 0] }}
            transition={{ duration: 0.4 }}
            className="plasmo-text-red-500"
          >
            ⚠️
          </motion.div>
        )
      })
    } finally {
      if (toastId) {
        toast.dismiss(toastId)
        setToastId(null)  
      }
      setIsLoading(false)
      setIsPressed(false)  
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className="plasmo-w-[360px] plasmo-bg-[#1c1c1e]/90 plasmo-backdrop-blur-xl plasmo-text-white plasmo-border plasmo-border-[#2c2c2e]/50 plasmo-shadow-2xl plasmo-overflow-hidden plasmo-font-sans"
      style={{
        background: "radial-gradient(circle at 20% 30%, rgba(40, 40, 42, 0.8) 0%, rgba(28, 28, 30, 0.9) 100%)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
      }}
    >
      {/* Header with ultra-thin border */}
      <div className="plasmo-p-6 plasmo-border-b plasmo-border-[#2c2c2e]/30">
        <div className="plasmo-flex plasmo-items-center plasmo-space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="plasmo-w-11 plasmo-h-11 plasmo-bg-gradient-to-br plasmo-from-[#0071e3] plasmo-to-[#2997ff] plasmo-rounded-xl plasmo-flex plasmo-items-center plasmo-justify-center plasmo-shadow-inner plasmo-relative plasmo-overflow-hidden"
          >
            <div className="plasmo-absolute plasmo-inset-0 plasmo-bg-white/10 plasmo-opacity-0 hover:plasmo-opacity-100 plasmo-transition-opacity" />
            <FiArrowRight className="plasmo-w-5 plasmo-h-5 plasmo-text-white plasmo-opacity-90" />
          </motion.div>
          <div>
            <h1 className="plasmo-text-[26px] plasmo-font-medium plasmo-tracking-tight plasmo-bg-clip-text plasmo-text-transparent plasmo-bg-gradient-to-r plasmo-from-white plasmo-to-[#a1a1a6]">
              Lnkd
            </h1>
            <p className="plasmo-text-[#a1a1a6] plasmo-text-[13px] plasmo-mt-1 plasmo-tracking-wide plasmo-font-light">
              Capture with intention
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="plasmo-p-6 plasmo-space-y-4">
        {/* Primary action button */}
        <motion.button
          onClick={handleCapture}
          disabled={isLoading}
          whileHover={!isLoading ? { scale: 1.01 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          className={`plasmo-w-full plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-3 plasmo-py-4 plasmo-rounded-[14px] plasmo-transition-all plasmo-duration-300 plasmo-relative plasmo-overflow-hidden ${
            isLoading
              ? "plasmo-bg-[#0071e3]/70 plasmo-cursor-not-allowed" 
              : "plasmo-bg-gradient-to-b plasmo-from-[#0071e3] plasmo-to-[#0051ba] hover:plasmo-from-[#2997ff] hover:plasmo-to-[#0071e3] plasmo-shadow-lg"
          }`}
        >
          <AnimatePresence>
            {isPressed && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="plasmo-absolute plasmo-inset-0 plasmo-bg-white"
              />
            )}
          </AnimatePresence>

          {/* Subtle glow effect */}
          <motion.div 
            className="plasmo-absolute plasmo-inset-0 plasmo-bg-[#0071e3]/10 plasmo-opacity-0 group-hover:plasmo-opacity-100 plasmo-transition-opacity plasmo-duration-300"
            animate={{
              background: ["rgba(0, 113, 227, 0.1)", "rgba(41, 151, 255, 0.2)", "rgba(0, 113, 227, 0.1)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="plasmo-w-5 plasmo-h-5 plasmo-border-2 plasmo-border-white plasmo-border-t-transparent plasmo-rounded-full"
              />
              <span className="plasmo-font-medium plasmo-text-white/90">
                Processing...
              </span>
            </>
          ) : (
            <>
              <FiSave className="plasmo-w-5 plasmo-h-5 plasmo-text-white/90 plasmo-transition-transform group-hover:plasmo-scale-110" />
              <span className="plasmo-font-medium plasmo-text-white/90">
                Capture This Page
              </span>
            </>
          )}
        </motion.button>

        {/* Secondary action */}
        <motion.button
          onClick={() => window.open("http://localhost:5173/in", "_blank")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="plasmo-w-full plasmo-py-3 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-gap-2 plasmo-text-sm plasmo-bg-[#2c2c2e]/60 hover:plasmo-bg-[#3a3a3c]/60 plasmo-rounded-[12px] plasmo-border plasmo-border-[#3a3a3c]/30 plasmo-transition-all plasmo-backdrop-blur-md"
        >
          <span className="plasmo-text-[#f5f5f7] plasmo-font-medium">View Library</span>
          <FiExternalLink className="plasmo-w-4 plasmo-h-4 plasmo-text-[#a1a1a6] plasmo-transition-transform group-hover:plasmo-translate-x-0.5" />
        </motion.button>

        {/* Keyboard shortcut hint */}
        <div className="plasmo-text-center plasmo-text-xs plasmo-text-[#a1a1a6]/80 plasmo-pt-1 plasmo-font-light plasmo-tracking-wide">
          Press{" "}
          <kbd className="plasmo-inline-flex plasmo-items-center plasmo-justify-center plasmo-px-2.5 plasmo-py-1 plasmo-bg-[#2c2c2e] plasmo-rounded-[8px] plasmo-font-medium plasmo-mx-1.5 plasmo-border plasmo-border-[#3a3a3c]/50 plasmo-shadow-sm plasmo-text-[13px]">
            <FiCommand className="plasmo-w-3 plasmo-h-3 plasmo-mr-1.5 plasmo-text-[#a1a1a6]" />
            <span className="plasmo-text-[#f5f5f7]">S</span>
          </kbd>{" "}
          for quick capture
        </div>
      </div>

      {/* Footer */}
      <div className="plasmo-px-6 plasmo-py-4 plasmo-border-t plasmo-border-[#2c2c2e]/30 plasmo-text-[#636366] plasmo-text-[11px] plasmo-text-center plasmo-tracking-wider plasmo-font-light">
        Designed with  in California
      </div>

      {/* Toaster component */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(28, 28, 30, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: '#f5f5f7',
            border: '1px solid rgba(72, 72, 74, 0.6)',
            borderRadius: '14px',
            padding: '14px 18px',
            fontSize: '14px'
          },
          className: 'plasmo-z-[9999]'
        }}
      />
    </motion.div>
  )
}

export default Popup