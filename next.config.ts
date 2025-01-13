/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'https://not.fiddle.is/auth/:path*' // Proxy to your backend
      }
    ]
  }
}

export default nextConfig;
