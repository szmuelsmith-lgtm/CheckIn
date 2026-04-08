/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor native builds.
  // Only used when building with `npm run build:app`.
  // Regular `npm run dev` and `npm run build` (for web/Vercel) are unaffected.
  ...(process.env.BUILD_TARGET === 'app' ? { output: 'export' } : {}),
};

export default nextConfig;
