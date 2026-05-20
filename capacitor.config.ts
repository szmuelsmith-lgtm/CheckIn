import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { Style as StatusBarStyle } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.athleteanchor.checkin.preview',
  appName: 'Check-In',
  webDir: 'out',
  // No server.url — the app loads from the bundled static files in webDir.
  // API calls use apiUrl() helper which prefixes with the production server for app builds.
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
