import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athleteanchor.checkin',
  appName: 'Check-In',
  webDir: 'out',
  server: {
    // In development, point to your local Next.js server for live reload
    // Comment this out for production builds
    // url: 'http://localhost:3000',
    // cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
