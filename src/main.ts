import L from 'leaflet';
import { loadProjectsFromCsv } from './loadProjects';
import { createPopupContent } from './popup';
import { addLegend } from './legend';
import { fuzzLocation } from './fuzzLocation';
import { categoryIcons } from './icons';
import { AgroEcologyProject } from './types';
import './style.css';
import { version } from '../package.json';

console.log(`[agromap] Version: ${version}`);

// Coordinates in data.csv are pre-fuzzed — do not re-fuzz at runtime.
const DATA_PRE_FUZZED = true;

// Fix for default marker icons in Leaflet with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Initialize the map centered on South Africa
const map = L.map('map', { attributionControl: false }).setView([-29.0, 25.0], 6);
L.control.attribution({ prefix: false }).addTo(map);

// Add OpenStreetMap tiles (non-GAFAM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

// ?debug=ids — stamp each pin with its ID for verification
const DEBUG_IDS = new URLSearchParams(window.location.search).get('debug') === 'ids';
const DEBUG_NAMES = new URLSearchParams(window.location.search).get('debug') === 'names';
const DEBUG_FULL = new URLSearchParams(window.location.search).get('debug') === 'full';

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

      // DEBUG LABELS
      // Show project ID and/or name as a permanent tooltip for debugging purposes, based on URL param.
      if (DEBUG_IDS) {
        marker.bindTooltip(`#${project.id}`, { permanent: true, className: 'debug-label', direction: 'top' });
      }
      if (DEBUG_NAMES) {
        marker.bindTooltip(`${project.name}`, { permanent: true, className: 'debug-label', direction: 'top' });
      }
      if (DEBUG_FULL) {
        marker.bindTooltip(`#${project.id} ${project.name}`, { permanent: true, className: 'debug-label', direction: 'top' });
      }

      // DEBUG by project:
      // if (project.name.toLowerCase().includes('mvume')) {
      //   console.log(`[agromap] Debug: project with "mvume" in name: name ${project.name}, location "${project.location.lat} | ${project.location.lng}"`);
      // }
      
      markersAdded++;

      // FUZZ DEBUG — only when data is not pre-fuzzed and running in dev
      // Shows the original location and a line to the fuzzed display location, to verify that fuzzing is working and that the offset is reasonable
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

  console.log(`[agromap] Loaded ${projects.length} projects, rendered ${markersAdded}${skipped.length ? `, skipped ${skipped.length}` : ''}`);
}

addLegend(map);


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
// Resolution order:
//   1. window.AGROMAP_CONFIG.dataUrl  — runtime config.js (dist hand-off / embed)
//   2. import.meta.env.VITE_DATA_URL  — build-time env var (CI / GitHub Pages)
//   3. bundled static dataset          — fallback
const DATA_URL: string | undefined =
  (window as any).AGROMAP_CONFIG?.dataUrl ||
  (import.meta.env.VITE_DATA_URL as string | undefined);

if (!DATA_URL) {
  console.error('[agromap] No data source configured — set dataUrl in config.js or VITE_DATA_URL at build time');
} else {
  loadProjectsFromCsv(DATA_URL).then(({ projects, skippedRows, parseErrors }) => {
    if (projects.length === 0) {
      console.error('[agromap] No projects loaded — check data URL and CSV format');
      if (parseErrors.length) console.error('[agromap] Parse errors:', parseErrors);
      return;
    }
    if (skippedRows > 0) {
      console.warn(`[agromap] ${skippedRows} row(s) skipped during load`);
    }
    initMarkers(projects, DATA_PRE_FUZZED);
  });
}
