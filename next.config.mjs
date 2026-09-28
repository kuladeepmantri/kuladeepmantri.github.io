/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // The dev-only corner badge sits on top of the phone tab bar.
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  // One build ID per commit. Scheduled rebuilds that only refresh live data
  // keep it, so a tab left open across a deploy keeps navigating in place.
  generateBuildId: async () => process.env.GITHUB_SHA ?? null,
}

export default nextConfig
