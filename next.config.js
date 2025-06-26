/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google user content (profile pictures)
    ],
  },
  // Any other Next.js configurations you need
};

module.exports = nextConfig;
