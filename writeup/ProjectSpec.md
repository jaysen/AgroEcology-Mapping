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
- **Total data fields**: ~80 fields per case study
- **Display on map**: Subset of fields (to be determined)
- Pin click triggers popup/modal with case study information
- Popup should display relevant data fields in organized, readable format

### 3. Data Structure
- 103 total cases
- Each case contains approximately 80 data fields
- Fields likely include:
  - Geographic information (coordinates, location name, region)
  - Project/case study details
  - Agricultural practices
  - Environmental metrics
  - Social/economic indicators
  - Contact information
  - Dates and timelines

### 4. Deployment Options
The application must support **both** deployment scenarios:

#### Option A: Embedded Widget
- Embeddable in existing websites
- iframe or JavaScript embed code
- Minimal styling conflicts with host sites
- Configurable dimensions

#### Option B: Standalone Website
- Fully functional independent web application
- Custom domain capability
- Full-featured interface

### 5. Data Management
**Current Phase**: Static data import
**Future Phase**: Non-technical user editing

#### Future Data Editing Requirements:
- Non-technical team members can update case data
- Spreadsheet-based editing (CSV, Excel, or Google Sheets)
- Possible integration with Google Sheets API
- Data validation and error handling
- Version control/audit trail considerations

### 6. Technology Preferences

#### Client Preferences:
- **Preferred**: Non-GAFAM (Google, Apple, Facebook, Amazon, Microsoft) services
- **Acceptable for Prototype**: GAFAM services can be used

#### Considerations for Non-GAFAM Stack:
- OpenStreetMap (OSM) for mapping (instead of Google Maps)
- Leaflet.js or MapLibre GL JS for map rendering
- Self-hosted or open-source alternatives for data storage
- Non-Google authentication if needed

#### Acceptable for Prototype:
- Google Sheets API for data management
- Google Maps API (if needed)
- Standard cloud hosting (GCP, AWS, Azure)

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

3. **Google Maps API** (Prototype fallback)
   - Well-documented
   - Easy integration
   - Familiar interface

### Data Storage Options
1. **Static JSON/GeoJSON** (Prototype)
   - Simple file-based storage
   - Version controlled
   - Easy to deploy

2. **Google Sheets + API** (Prototype with future editing)
   - Non-technical editing via familiar spreadsheet interface
   - API for reading data
   - Real-time updates possible

3. **Self-hosted Database** (Production)
   - PostgreSQL with PostGIS extension
   - MongoDB with geospatial support
   - Full control over data

### Frontend Framework Options
- React + Leaflet
- Vue.js + Leaflet
- Vanilla JavaScript (lightweight)
- Svelte (modern, performant)

## Project Phases

### Phase 1: Prototype/MVP
- [x] Project specification
- [ ] Design data schema
- [ ] Choose map technology
- [ ] Implement basic map with pins
- [ ] Create popup/info display
- [ ] Import initial 103 cases
- [ ] Standalone website deployment
- [ ] Basic styling and UX

### Phase 2: Embeddable Version
- [ ] Create embeddable widget version
- [ ] Test embedding in various websites
- [ ] Documentation for embedding

### Phase 3: Data Management
- [ ] Design data editing workflow
- [ ] Implement spreadsheet integration (likely Google Sheets)
- [ ] User authentication/permissions
- [ ] Data validation
- [ ] Update pipeline from sheets to map

### Phase 4: Production & Refinement
- [ ] Migrate to non-GAFAM stack (if required)
- [ ] Performance optimization
- [ ] Advanced filtering/search features
- [ ] Analytics integration
- [ ] Documentation and training

## Open Questions
1. Which specific data fields should be displayed in the map popup?
2. Are there categories/tags for filtering pins?
3. Should pins have different colors/icons based on categories?
4. What is the expected traffic/load?
5. Who will be the editors in Phase 3?
6. What existing websites will host the embedded version?
7. Are there any existing brand guidelines or design requirements?
8. Budget constraints for hosting and third-party services?

## Success Criteria
- All 103 cases displayed correctly on map
- Pins clickable with accurate data display
- Works on desktop and mobile browsers
- Can be embedded in at least 2 existing websites
- Page load time < 3 seconds
- Non-technical users can update data via spreadsheet

## Timeline
*To be determined based on resource availability and priorities*

## Stakeholders
*To be defined*

## Budget
*To be defined*
