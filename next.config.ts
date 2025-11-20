import type { NextConfig } from "next";

// Get repository name from environment or default to 'campus-thrive'
// For GitHub Pages, if your repo is username.github.io, set this to ''
// Otherwise, set it to your repository name (e.g., '/campus-thrive')
const repoName = process.env.GITHUB_REPOSITORY 
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}` 
  : (process.env.NEXT_PUBLIC_BASE_PATH || '/campus-thrive');

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages deployment - set basePath to repository name
  basePath: process.env.NODE_ENV === 'production' ? repoName : '',
  trailingSlash: true,
};

export default nextConfig;
