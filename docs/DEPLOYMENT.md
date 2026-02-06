# Deployment Guide - GitHub Pages

Quick guide to deploy this project to GitHub Pages.

## Prerequisites

1. GitHub repository created
2. Code pushed to GitHub
3. Node.js and npm installed in your distrobox

## One-Time Setup

### 1. Update Repository Name in vite.config.ts

If your GitHub repository is **not** named "AgroEcologyMaps", update [vite.config.ts](vite.config.ts#L6):

```typescript
const base = process.env.GITHUB_PAGES === 'true'
  ? '/AgroEcology-Mapping/'  // ← Change this to match your GitHub repo name
  : './'
```

### 2. Push to GitHub

```bash
# If you haven't already:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Deploying

### Option 1: Deploy Script (Recommended)

```bash
# Enter distrobox
distrobox enter devbox

# Install dependencies (first time only)
npm install

# Deploy to GitHub Pages
GITHUB_PAGES=true npm run deploy
```

This will:
1. Build the project (`npm run build`)
2. Create/update the `gh-pages` branch
3. Push the `dist/` folder to GitHub Pages

### Option 2: Manual Deployment

```bash
# Build the project
GITHUB_PAGES=true npm run build

# Deploy dist folder
npx gh-pages -d dist
```

## Enable GitHub Pages on Repository

After first deployment:

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

Your site will be available at:
```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## Troubleshooting

### Assets not loading (404 errors)

Make sure the `base` path in [vite.config.ts](vite.config.ts) matches your repository name exactly:

```typescript
// Correct
base: '/AgroEcologyMaps/'

// Wrong
base: '/agroecologymaps/'  // Case matters!
base: '/AgroEcologyMaps'   // Missing trailing slash
```

### Permission denied during deploy

```bash
# Make sure you're authenticated with GitHub
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

### Deploy script fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Updating the Site

After making changes:

```bash
# Commit your changes
git add .
git commit -m "Update content"
git push

# Redeploy
GITHUB_PAGES=true npm run deploy
```

Changes will be live in 1-2 minutes.

## Alternative: GitHub Actions (Auto-Deploy)

Want automatic deployment on every push to `main`? Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          GITHUB_PAGES: true

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Then every `git push` will auto-deploy!
