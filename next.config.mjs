/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Accommodate multi-page base64 document uploads (up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // Ensure Tauri frontendDist compatibility
  output: process.env.TAURI_BUILD === "true" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
