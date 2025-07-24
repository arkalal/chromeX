/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure images for remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google user content (profile pictures)
      },
    ],
  },
  // Add allowedDevOrigins at the root level to support ngrok for local development
  allowedDevOrigins: ['localhost', '*.ngrok-free.app', '*.ngrok.io'],
  // Configure experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  // Log webhook events properly
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
