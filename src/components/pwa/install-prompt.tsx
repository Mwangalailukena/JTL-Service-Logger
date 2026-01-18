"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if app is already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-50 flex items-center justify-between animate-in slide-in-from-bottom-5">
      <div className="flex flex-col">
        <span className="font-bold">Install App</span>
        <span className="text-xs text-slate-300">Add to home screen for offline access</span>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={16} />
          Install
        </button>
        <button onClick={() => setShowPrompt(false)} className="p-2 hover:bg-slate-800 rounded-lg">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
