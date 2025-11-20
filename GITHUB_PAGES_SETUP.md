# GitHub Pages Deployment Guide

This guide will help you deploy CampusThrive to GitHub Pages.

## Prerequisites

1. A GitHub repository (create one if you haven't already)
2. Git initialized in your project

## Setup Steps

### 1. Configure Base Path (if needed)

If your repository name is NOT your username (e.g., `username.github.io`), you need to set a basePath:

1. Open `next.config.ts`
2. Uncomment and update the `basePath` line:
   ```typescript
   basePath: '/your-repo-name',
   trailingSlash: true,
   ```

   For example, if your repo is `campus-thrive`:
   ```typescript
   basePath: '/campus-thrive',
   trailingSlash: true,
   ```

**Note:** If your repository is named `username.github.io`, you can skip this step (it will be deployed to the root).

### 2. Push to GitHub

```bash
git add .
git commit -m "Configure for GitHub Pages deployment"
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

(Replace `main` with `master` if that's your default branch)

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. Save the settings

### 4. Deploy

The GitHub Actions workflow will automatically:
- Build your Next.js app as a static site
- Deploy it to GitHub Pages

You can trigger it by:
- Pushing to `main` or `master` branch
- Going to **Actions** tab and clicking **Run workflow**

### 5. Access Your Site

After deployment completes (usually 1-2 minutes), your site will be available at:
- `https://your-username.github.io/your-repo-name/` (if you set basePath)
- `https://your-username.github.io/` (if repo is `username.github.io`)

## Troubleshooting

### Images not loading
- Make sure `images: { unoptimized: true }` is set in `next.config.ts` (already configured)

### 404 errors on routes
- Ensure `basePath` is correctly set in `next.config.ts`
- Make sure `trailingSlash: true` is enabled if using basePath

### Build fails
- Check the **Actions** tab in GitHub for error details
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (using Node 20 in workflow)

## Manual Deployment

If you want to test the build locally first:

```bash
npm run build
```

This will create an `out` folder with the static files. You can test it locally or manually upload to GitHub Pages.

## Updating Your Site

Simply push changes to your main branch, and GitHub Actions will automatically rebuild and redeploy your site.

