/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/app',
        destination: '/app/index.html',
      },
      {
        source: '/OptiFit-Labs/app/:path*',
        destination: '/app/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
