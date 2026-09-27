/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // The dev-only corner badge sits on top of the phone tab bar.
  devIndicators: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
