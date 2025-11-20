import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If deploying to GitHub Pages with a repository name (not username.github.io),
  // uncomment and set the basePath to your repository name:
  // basePath: '/campus-thrive',
  // trailingSlash: true,
};

export default nextConfig;
