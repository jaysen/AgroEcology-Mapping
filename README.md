# AgroEcology Maps - Quick Prototype

Interactive map for displaying agroecology projects using OpenStreetMap and Leaflet.

## Tech Stack
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Leaflet.js** - Open-source interactive maps
- **OpenStreetMap** - Non-GAFAM map tiles

## Quick Start

### 1. Enter your distrobox (if using one)
```bash
distrobox enter devbox
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment

### Deploy to GitHub Pages

```bash
# One-time setup: push to GitHub first
# Then deploy with:
GITHUB_PAGES=true npm run deploy
```

📖 **Full deployment guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

### 4. Build for production
```bash
npm run build
```

Output will be in the `dist/` folder.

### 5. Preview production build
```bash
npm run preview
```

## Current Features
- ✅ Interactive map with OpenStreetMap tiles
- ✅ 8 example agroecology projects across Southern Africa
- ✅ Clickable markers with detailed popups
- ✅ Project information including:
  - Location details
  - Type and practices
  - Crops and beneficiaries
  - Organization info
  - Status badges
- ✅ Responsive design
- ✅ TypeScript for type safety
- ✅ Projects counter

## Sample Data
Currently includes 8 hardcoded projects:
1. Philippi Horticultural Area Urban Farming Initiative (South Africa)
2. Eastern Cape Smallholder Agroforestry Network (South Africa)
3. Limpopo Regenerative Agriculture Hub (South Africa)
4. KwaZulu-Natal Community Seed Bank (South Africa)
5. Zambezi Valley Organic Cotton Project (Zambia)
6. Maputo Green Belt Initiative (Mozambique)
7. Mashonaland Permaculture Training Center (Zimbabwe)
8. Free State Climate-Smart Agriculture Pilot (South Africa)

## Next Steps
- [ ] Load data from external source (JSON/CSV/Google Sheets)
- [ ] Add filtering by project type, status, country
- [ ] Add search functionality
- [ ] Custom marker icons based on project type
- [ ] Cluster markers for better performance with many projects
- [ ] Make embeddable as widget
- [ ] Add data editing interface

## Project Structure
```
├── index.html          # Main HTML file
├── src/
│   ├── main.ts        # Application entry point
│   ├── types.ts       # TypeScript interfaces
│   ├── data.ts        # Hardcoded sample data
│   └── style.css      # Styling
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## Links
- PLAAS: https://plaas.org.za/
- Leaflet.js: https://leafletjs.com/
- OpenStreetMap: https://www.openstreetmap.org/
