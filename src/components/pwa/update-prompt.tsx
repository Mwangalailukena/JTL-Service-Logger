"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function UpdatePrompt() {
  const [showReload, setShowReload] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Check if SW is supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 1. Listen for new workers waiting
      // We can use the workbox-window library or native events. 
      // Since next-pwa registers SW automatically, we hook into the registration.
      
      // Note: @ducanh2912/next-pwa might register it. 
      // We can inspect navigator.serviceWorker.getRegistration()
      
      const updateHandler = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // If there's a worker waiting, show prompt
        if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setShowReload(true);
        }

        // Listen for future updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowReload(true);
              }
            });
          }
        });
      };

      updateHandler();

      // Poll for updates every hour
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => reg?.update());
      }, 60 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
    setShowReload(false);
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center space-x-4 animate-in slide-in-from-top-5">
      <span className="text-sm font-medium">New version available</span>
      <button 
        onClick={reloadPage}
        className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase hover:bg-blue-50 flex items-center gap-1"
      >
        <RefreshCw size={12} />
        Update
      </button>
    </div>
  );
}
