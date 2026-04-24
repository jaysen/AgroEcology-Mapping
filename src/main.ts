import L from 'leaflet';
// import { projects } from './data/data-fuzzed';
import { loadProjectsFromCsv } from './loadProjects';
import { createPopupContent } from './popup';
import { addLegend } from './legend';
import { fuzzLocation } from './fuzzLocation';
import { categoryIcons } from './icons';
import { AgroEcologyProject } from './types';

import { version } from '../package.json';
import './style.css';

// Whether the imported dataset already has fuzzed coordinates.
// Must stay in sync with the import above:
//   data-fuzzed → true  (coordinates pre-fuzzed by fuzz-data.js)
//   data-actual → false (coordinates fuzzed at runtime; shows dev origin overlay)
const DATA_PRE_FUZZED = true;

// Fix for default marker icons in Leaflet with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Initialize the map centered on South Africa
const map = L.map('map').setView([-29.0, 25.0], 6);

// Add OpenStreetMap tiles (non-GAFAM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// ?debug=ids — stamp each pin with its ID for verification
const DEBUG_IDS = new URLSearchParams(window.location.search).get('debug') === 'ids';

/**
 * Render markers for a loaded project list onto the map.
 *
 * preFuzzed: true  → coordinates are already obfuscated (runtime CSV/Sheets load)
 * preFuzzed: false → apply fuzz at render time + show dev origin overlay
 */
function initMarkers(projects: AgroEcologyProject[], preFuzzed: boolean): void {
  let markersAdded = 0;
  const skipped: number[] = [];

  projects.forEach(project => {
    try {
      const icon = categoryIcons[project.category];
      if (!icon) {
        console.warn(`[agromap] Skipping id ${project.id}: unknown category "${project.category}"`);
        skipped.push(project.id);
        return;
      }

      const displayLocation = preFuzzed
        ? project.location
        : fuzzLocation(project.location, { seed: `agromap:${project.id}` });

      const marker = L.marker([displayLocation.lat, displayLocation.lng], { icon })
        .addTo(map)
        .bindPopup(createPopupContent(project), {
          maxWidth: 400,
          className: 'custom-popup',
        });

      marker.on('click', function(this: L.Marker) {
        this.openPopup();
      });

      if (DEBUG_IDS) {
        marker.bindTooltip(`#${project.id} ${project.name}`, { permanent: true, className: 'debug-id-label', direction: 'top' });
      }

      markersAdded++;

      // FUZZ DEBUG — only when data is not pre-fuzzed and running in dev.
      if (!preFuzzed && import.meta.env.DEV) {
        const origin = project.location;
        L.circleMarker([origin.lat, origin.lng], {
          radius: 5,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(map).bindTooltip(`ORIGIN: ${project.name}`);
        L.polyline([[origin.lat, origin.lng], [displayLocation.lat, displayLocation.lng]], {
          color: '#ef4444',
          weight: 1.5,
          dashArray: '4 4',
          opacity: 0.7,
        }).addTo(map);
      }
    } catch (err) {
      console.error(`[agromap] Failed to render id ${project.id} (${project.name}):`, err);
      skipped.push(project.id);
    }
  });

  if (skipped.length > 0) {
    console.warn(`[agromap] ${skipped.length} project(s) not rendered: ids ${skipped.join(', ')}`);
  }

  // Inject project count into footer
  const footerEl = document.querySelector('footer p');
  if (footerEl) {
    footerEl.innerHTML += ` | <strong>${projects.length}</strong> projects mapped`;
  }

  console.log(`[agromap] Loaded ${projects.length} projects, rendered ${markersAdded}${skipped.length ? `, skipped ${skipped.length}` : ''}`);
}

addLegend(map);

// Version footer
const footer = document.createElement('div');
footer.className = 'app-version';
footer.textContent = `v${version}`;
document.getElementById('app')?.appendChild(footer);

// Attribute info icon — show tooltip on click/tap (for mobile)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const wasActive = target.classList.contains('attr-info--active');
  document.querySelectorAll('.attr-info--active').forEach(el => el.classList.remove('attr-info--active'));
  if (target.classList.contains('attr-info') && !wasActive) {
    target.classList.add('attr-info--active');
    e.stopPropagation();
  }
});

// ── Data loading ──────────────────────────────────────────────────────────────
// VITE_DATA_URL can be:
//   - A Google Sheets "publish to web" CSV URL  (Option 1)
//   - A path to a static CSV served with the app (Option 2, e.g. /data.csv)
// When unset, falls back to the bundled static dataset.
const DATA_URL = import.meta.env.VITE_DATA_URL as string | undefined;

if (DATA_URL) {
  // Runtime fetch — coordinates in the CSV are expected to be pre-fuzzed
  // (either by Google Apps Script on the sheet, or stripped to public fields only)
  loadProjectsFromCsv(DATA_URL).then(({ projects, skippedRows, parseErrors }) => {
    if (projects.length === 0) {
      console.error('[agromap] No projects loaded — check VITE_DATA_URL and CSV format');
      if (parseErrors.length) console.error('[agromap] Parse errors:', parseErrors);
      return;
    }
    if (skippedRows > 0) {
      console.warn(`[agromap] ${skippedRows} row(s) skipped during load`);
    }
    initMarkers(projects, /* preFuzzed */ true);
  });
} else {
  // Bundled static fallback — import at build time
  import('./data/data-fuzzed').then(({ projects }) => {
    console.log('[agromap] Using bundled static dataset (VITE_DATA_URL not set)');
    initMarkers(projects, /* preFuzzed */ true);
  });
}
