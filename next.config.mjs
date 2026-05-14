/** @type {import('next').NextConfig} */
const isAppBuild = process.env.BUILD_TARGET === 'app';

const nextConfig = {
  // Static export for Capacitor native builds.
  // Only used when building with `npm run build:app`.
  // Regular `npm run dev` and `npm run build` (for web/Vercel) are unaffected.
  ...(isAppBuild ? { output: 'export' } : {}),

  // Expose the API base URL to the client bundle.
  // In app builds, API calls go to the production server.
  // In web/dev builds, empty string → relative URLs work as normal.
  env: {
    NEXT_PUBLIC_API_BASE: isAppBuild ? 'https://check-in-gilt.vercel.app' : '',
  },

  // CORS headers so the Capacitor WebView (capacitor://localhost) can call API routes.
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',      value: 'capacitor://localhost' },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers',     value: 'Content-Type, Authorization, X-Client-Info, apikey' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
