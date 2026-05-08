import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { Style as StatusBarStyle } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.athleteanchor.checkin',
  appName: 'Check-In',
  webDir: 'out',
  server: {
    // Production: load the live Vercel deployment so server-side API routes work.
    // For local dev, swap this for url: 'http://localhost:3000' + cleartext: true.
    url: 'https://check-in-gilt.vercel.app',
    allowNavigation: ['check-in-gilt.vercel.app', 'doeycpheigjihvfvupid.supabase.co'],
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F8FAFC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: StatusBarStyle.Light,
      backgroundColor: '#F8FAFC',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
