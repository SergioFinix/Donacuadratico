/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Fix Axios "t is not a function" error in Vercel built minified files
  transpilePackages: ['@human.tech/passport-embed'],
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019cef1c-5dfa-49c9-bc27-3b34a370aac4',
        permanent: false,
      },
    ]
  },
};

module.exports = nextConfig;
