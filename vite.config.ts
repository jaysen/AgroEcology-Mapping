import { defineConfig } from 'vite'

// For GitHub Pages: set base to '/your-repo-name/'
// For other deployments: use './' or '/'
const base = process.env.GITHUB_PAGES === 'true'
  ? '/AgroEcology-Mapping/'  
  : './'

export default defineConfig({
  base,
})
