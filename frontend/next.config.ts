/* * @type {import('next').NextConfig} */
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        // Whitelist your new production Strapi media domain
        protocol: 'https',
        hostname: 'api.2cscomplexes.com',
        pathname: '/uploads/**',
      },
      {
        // Strapi local dev server (Keep this for local computer testing)
        protocol: 'http',
        hostname: 'localhost',
        port: '1338',
        pathname: '/uploads/**',
      },
      {
        // Your old Strapi Cloud fallback pattern (Keep it just in case, but optional)
        protocol: 'https',
        hostname: 'diplomatic-splendor-66cebff67a.media.strapiapp.com',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig
