"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isiOS);

    if (isiOS) {
      // Show iOS instructions after a delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4">
      <div className="bg-emerald-900 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-900/30 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-800 rounded-xl shrink-0">
            {isIOS ? (
              <Smartphone className="h-5 w-5 text-emerald-300" />
            ) : (
              <Download className="h-5 w-5 text-emerald-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Check-In</p>
            {isIOS ? (
              <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
                Tap the <span className="inline-flex items-center px-1 py-0.5 bg-emerald-800 rounded text-[10px] font-mono">Share</span> button below, then <strong>&ldquo;Add to Home Screen&rdquo;</strong> for the full app experience.
              </p>
            ) : (
              <p className="text-xs text-emerald-200 mt-1">
                Add Check-In to your home screen for quick, app-like access.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-emerald-400 hover:text-white rounded-lg shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && deferredPrompt && (
          <Button
            onClick={handleInstall}
            className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-sm h-9"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        )}
      </div>
    </div>
  );
}
