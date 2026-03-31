# AgroEcology Maps - Project Specification

## Project Overview

Interactive map application for displaying and managing agroecology case studies with detailed data points.

## Core Requirements

### 1. Interactive Map Interface

- Display interactive map with custom pins/markers
- 103 case studies to be represented as pins on the map
- Pin locations based on geographic coordinates
- Responsive design for various screen sizes

### 2. Data Display

- **Total data fields**: ~25 fields per case study in spreadsheet
- **Display on map**: 14 fields - subset of full data
- Pin click triggers popup/modal with case study information
- Pins to have different icons dependant on Point Categories. Icons to be described in legend
- Popup should display relevant data fields in organized, readable format
- Popup to use field icons, that will be described in legend.
- Pins must not be geo-precise
  - We don't want people to be able to find the sometimes private farms running the project without contacting the project first.
  - Coordinate fuzzing with configurable obfuscation radius (default ±3 km)
  - Precise addresses are never stored or displayed
  - Edge cases handled: boundary coordinates, clustering behaviour

### 3. Data Structure

- ~102 total cases (source: `Map data FINAL 10Mar26.xlsx`)
- 23 fields per case in the spreadsheet; subset displayed on map

**Fields:**

| # | Field | Notes |
| --- | --- | --- |
| 3 | Name of initiative or homestead | |
| — | Type of initiative | Pin category (see below) |
| 4 | Name of contact | |
| 4a | Telephone number | Private — do not display publicly |
| 4b | Email address | Private — do not display publicly |
| 5 | Province | |
| 6 | District | |
| 7 | Name of nearest town | |
| 8 | Geolocation latitude | Obfuscated ±3 km before display |
| 8 | Geolocation longitude | Obfuscated ±3 km before display |
| 9 | Year initiative started | |
| — | High on-farm diversity | Y/blank |
| — | Mixed farming | Y/blank |
| — | Seed bank (individual) | Y/blank |
| — | Seed bank (collective) | Y/blank |
| 36 | Organised seed exchange on site? | Yes/blank |
| — | Integrated landscape management | Y/blank |
| 56 | Offers on-site training? | Yes/blank |
| 57 | Structured training programmes / internships? | Yes/blank |
| 58 | Training type | S=short (<7 days), I=intermediate (1 wk–6 mo), L=long (>6 mo) |
| 59 | Training accreditation? | Yes/blank |
| — | G&S: Input supply | Y/blank |
| — | G&S: Mentorship / tech support | Y/blank |
| — | G&S: Marketing services | Y/blank |

**Four categories of points** — displayed differently, described in legend:

| Code | Label |
| --- | --- |
| LS | Learning site |
| CC | Community agroecology centre |
| AEH | Agroecology hub |
| LH | Lighthouse |

### 4. Deployment Options

The application must support the following deployment scenarios:

#### Web component that can be embedded in other websites

- Embeddable in existing websites
  - The first website will be client WordPress
- iframe or JavaScript embed code
- Minimal styling conflicts with host sites
- Configurable dimensions
- Responsive
- CSS custom property theming system (colours, fonts, spacing tokens)
- Embed wrapper with responsive layout
- *Excludes* per-container white-labelling
- *Theming work requires client to provide a style brief, brand guide, or Figma reference before work begins*

### 5. Data Management

#### Data Editing Requirements

- Non-technical team members can update case data
- Spreadsheet-based editing (CSV, Excel, or Google Sheets)
- Integration with Google Sheets API:
  - Service account auth
  - Sheets API read pipeline
  - Data validation & schema normalisation
  - Error states for missing/renamed columns
  - *Excludes write-back or real-time sync*
  - *Excludes file-based dataset ingestion (separate scope item)*
- Data validation and error handling
- **Google Sheets caveat:** If column headers or sheet layout are restructured post-handover, re-integration falls outside post-implementation support scope and will be quoted separately

### 6. Technology Preferences

#### Client Preferences

- **Preferred**: Non-GAFAM (Google, Apple, Facebook, Amazon, Microsoft) services
- **Acceptable Use**: Google Spreadsheet can be used for Data/Integration

## Technical Considerations

### Map Technology Options

1. **OpenStreetMap + Leaflet.js** (Non-GAFAM)
   - Open source
   - Highly customizable
   - Large community support
   - Free tile servers available

2. **MapLibre GL JS** (Non-GAFAM)
   - Open source fork of Mapbox GL JS
   - Modern, performant
   - Vector tiles support

3. **Google Maps API** (fallback)
   - Well-documented
   - Easy integration
   - Familiar interface

### Data Storage Options

1. **Google Sheets + API**
   - Non-technical editing via familiar spreadsheet interface
   - API for reading data
   - Near Real-time updates if possible

2. **Static JSON/GeoJSON/CSV** (Fallback)
   - Simple file-based storage
   - Version controlled
   - Easy to deploy

### Frontend Framework Options

- Vanilla JavaScript (lightweight)
- React + Leaflet
- Vue.js + Leaflet
- Svelte (modern, performant)
- Others?

## Project Phases

### Phase 1: Research & Proof of Concept - COMPLETE

- [x] Project specification
- [x] Research, proof of concept development & initial meetings

### Phase 2: Base Mapping Component

- [ ] Tile layer setup
- [ ] Custom markers, basic symbols and legends
- [ ] Basic clustering
- [ ] Basic popups
- [ ] Drawing tools
- [ ] Offline mode
- *Excludes advanced popups (separate scope)*

### Phase 3: Data Integration

- [ ] File-based dataset ingestion, data normalisation, error handling
- [ ] Google Sheets integration (service account auth, read pipeline, validation, schema normalisation)
- [ ] Design data schema

### Phase 4: Embed, Theming & Obfuscation

- [ ] Map location obfuscation (coordinate fuzzing, ±3 km default radius, edge-case testing)
- [ ] Define query-string config param spec (initial centre, zoom, country filter, etc.) — *must be done before embed build config*
- [ ] Add `vite.config.embed.ts` second build target:
  - Self-contained bundle with no external font/icon CDN dependencies
  - Query-string configuration params (reads via `URLSearchParams`)
  - CSS scoped under wrapper class (e.g. `.agromap-embed`) to prevent host-site style leakage
  - Leaflet CSS inlined to avoid cross-origin stylesheet issues
- [ ] Generate `embed.html` entry point (no header/footer chrome)
- [ ] Embed wrapper with CSS custom property theming system (colours, fonts, spacing tokens)
- [ ] Responsive layout
- [ ] Handle CORS for data fetching when embedded on third-party domains
  - Static files on GitHub Pages require correct `Access-Control-Allow-Origin` headers
  - Google Sheets API calls will need a proxy or server-side fetch if CORS blocked
- [ ] Write embed documentation with copy-paste `<iframe>` snippet examples
- [ ] Test embedding in at least two environments (WordPress + plain HTML)
  - *Blocked on: client providing a WordPress test instance*
- *Theming blocked on: client providing style brief, brand guide, or Figma reference*

### Phase 5: QA, Testing & Deployment

- [ ] Cross-browser testing & QA
- [ ] Integration smoke tests
- [ ] Obfuscation verification
- [ ] Import initial 103 cases
- [ ] Standalone website deployment
- *Excludes automated test suite*
- [ ] Production Hardening
- [ ] Performance audit — page load time target < 3 seconds on 3G mobile

### Phase 6 (Optional): UX Enhancements

> Out of initial scope. Can be quoted separately if needed.

- [ ] Marker clustering (collapse dense pins at low zoom levels)
- [ ] Filtering by point category (LS / CC / AEH / LH) and by province
- [ ] Filtering by attributes (offers training, seed bank, etc.)
- [ ] Keyword search across initiative names and locations
- [ ] Filter/search UI panel with clear-all control
- [ ] URL state persistence (filter state reflected in query string for shareable links)
- [ ] Advanced popups with full field display and icons

### Phase 7: Post-implementation Support (30 days)

- [ ] Bug fixes within 30 days of delivery or agreement
- *Excludes new features, content updates, or Google Sheets schema changes made by client post-handover*

## Open Questions

1. Which specific data fields should be displayed in the map popup?
2. What is the expected traffic/load?
3. Brand guidelines or design requirements will be communicated
