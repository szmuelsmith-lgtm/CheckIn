"use client";

import { useEffect } from "react";

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initNative = async () => {
      // Only run inside a Capacitor native app (iOS / Android)
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      const platform = Capacitor.getPlatform();

      // Status bar
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#F8FAFC" });
        await StatusBar.show();
      } catch {
        // StatusBar not available on this platform
      }

      // Keyboard — body resize so the layout pushes up
      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        Keyboard.addListener("keyboardWillShow", () => {
          document.body.classList.add("keyboard-open");
        });
        Keyboard.addListener("keyboardWillHide", () => {
          document.body.classList.remove("keyboard-open");
        });
      } catch {
        // Keyboard not available on this platform
      }

      // Splash screen — hide after short delay so first paint is visible
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        // SplashScreen not available on this platform
      }

      // Android — enable edge-to-edge
      if (platform === "android") {
        try {
          const { StatusBar } = await import("@capacitor/status-bar");
          await StatusBar.setOverlaysWebView({ overlay: false });
        } catch {
          // ignore
        }
      }
    };

    initNative();
  }, []);

  return <>{children}</>;
}
