// Set to true when the imported dataset already has fuzzed coordinates.
// false = fuzz at runtime and show dev origin overlay.
const DATA_PRE_FUZZED = true;
import { projects } from './data/data-fuzzed';
// import { projects } from './data/data-original'; --- IGNORE ---



import L from 'leaflet';
import { AgroEcologyProject, PointCategory, POINT_CATEGORIES } from './types';
import { fuzzLocation } from './fuzzLocation';

import { version } from '../package.json';
import './style.css';

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

// Create a category marker icon using SVG DivIcon (no CDN dependencies)
function createCategoryIcon(category: PointCategory): L.DivIcon {
  const { code, color, textColor, symbol } = POINT_CATEGORIES[category];
  const size = 36;
  const label = symbol ?? code;
  const fontSize = symbol ? '16' : code.length > 2 ? '9' : '11';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      <polygon points="${size / 2 - 6},${size - 2} ${size / 2 + 6},${size - 2} ${size / 2},${size + 6}"
               fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="${fontSize}"
            font-weight="bold" fill="${textColor}">${label}</text>
    </svg>`.trim();

  return L.divIcon({
    html: svg,
    className: `category-marker category-${category.toLowerCase()}`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

// Pre-create icons for each category
const categoryIcons: Record<PointCategory, L.DivIcon> = {
  LS:  createCategoryIcon('LS'),
  CC:  createCategoryIcon('CC'),
  AEH: createCategoryIcon('AEH'),
  SI:  createCategoryIcon('SI'),
};

// Build popup content
function createPopupContent(project: AgroEcologyProject): string {
  const cat = POINT_CATEGORIES[project.category];
  const categoryBadge = `<span class="category-badge" style="background:${cat.color};color:${cat.textColor}">${cat.code} — ${cat.label}</span>`;


  const trainingTypeLabel: Record<string, string> = {
    S: 'Short (<7 days)',
    I: 'Intermediate (1 wk–6 mo)',
    L: 'Long (>6 mo)',
  };
  const trainingTypeDisplay = project.trainingType
    ? project.trainingType.split(' ').map(t => trainingTypeLabel[t] ?? t).join(', ')
    : '—';

  const attributes: [string, boolean, string?][] = [
    ['High on-farm diversity',          project.highOnFarmDiversity,          'Combination of high crop diversity and 60% or more intercropped'],
    ['Mixed farming',                   project.mixedFarming,                 'All of poultry, animals, crops and trees'],
    ['Seed bank (individual)',          project.seedBankIndividual],
    ['Seed bank (collective)',          project.seedBankCollective],
    ['Organised seed exchange',         project.organisedSeedExchange],
    ['Integrated landscape management', project.integratedLandscapeManagement, 'Combination of on-farm natural spaces and involvement in community landscape management'],
  ];

  const activeAttributes = attributes.filter(([, v]) => v).map(([label, , desc]) =>
    desc ? `${label}<span class="attr-info" data-tooltip="${desc}">ℹ</span>` : label
  );

  const services = [
    ['Input supply',           project.gsInputSupply],
    ['Mentorship/tech support', project.gsMentorshipTechSupport],
    ['Marketing services',     project.gsMarketingServices],
  ] as [string, boolean][];

  const activeServices = services.filter(([, v]) => v).map(([label]) => label);

  return `
    <div class="popup-content">
      <h3>${project.name}</h3>
      ${categoryBadge}
      <div class="popup-section">
        <strong>Location:</strong> ${project.nearestTown}, ${project.district}, ${project.province}
      </div>
      <div class="popup-section">
        <strong>Contact:</strong> ${project.contact}
        ${project.phone ? `<br>${project.phone}` : ''}
        ${project.email ? `<br><a href="mailto:${project.email}">${project.email}</a>` : ''}
      </div>
      <div class="popup-section popup-section--inline">
        <strong>Year started:</strong> ${project.yearStarted}
      </div>
      ${activeAttributes.length ? `
      <div class="popup-section">
        <strong>Attributes:</strong>
        <ul class="practices-list">
          ${activeAttributes.map(a => `<li class="attr-item">${a}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${project.onSiteTraining ? `
      <div class="popup-section popup-section--inline">
        <strong>On-site training:</strong> Yes
      </div>` : ''}
      ${project.structuredTrainingProgrammes ? `
      <div class="popup-section">
        <strong>Structured training:</strong> ${trainingTypeDisplay}
        ${project.trainingAccreditation ? ' · Accredited' : ''}
      </div>` : ''}
      ${activeServices.length ? `
      <div class="popup-section">
        <strong>Goods &amp; Services:</strong> ${activeServices.join(', ')}
      </div>` : ''}
    </div>
  `;
}

// ?debug=ids — stamp each pin with its ID for verification
const DEBUG_IDS = new URLSearchParams(window.location.search).get('debug') === 'ids';

// Add markers
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

    const displayLocation = DATA_PRE_FUZZED
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
    if (!DATA_PRE_FUZZED && import.meta.env.DEV) {
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

// Legend
const Legend = L.Control.extend({
  onAdd() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h4>
        Types of Initiatives
        <button class="legend-toggle" aria-label="Collapse legend">▾</button>
      </h4>
      <div class="legend-body">
        ${Object.values(POINT_CATEGORIES).map(cat => `
          <div class="legend-item">
            <span class="legend-dot" style="background:${cat.color}"></span>
            <span><strong>${cat.symbol ?? cat.code}</strong> ${cat.label}</span>
          </div>`).join('')}
      </div>
    `;
    const btn = div.querySelector<HTMLButtonElement>('.legend-toggle')!;
    const body = div.querySelector<HTMLDivElement>('.legend-body')!;
    L.DomEvent.on(btn, 'click', () => {
      const collapsed = body.classList.toggle('legend-collapsed');
      btn.textContent = collapsed ? '▸' : '▾';
      btn.setAttribute('aria-label', collapsed ? 'Expand legend' : 'Collapse legend');
    });
    return div;
  },
});
new Legend({ position: 'bottomleft' }).addTo(map);

// Inject project count into footer
const footerEl = document.querySelector('footer p');
if (footerEl) {
  footerEl.innerHTML += ` | <strong>${projects.length}</strong> projects mapped`;
}

// Version footer
const footer = document.createElement('div');
footer.className = 'app-version';
footer.textContent = `v${version}`;
document.getElementById('app')?.appendChild(footer);

console.log(`[agromap] Loaded ${projects.length} projects, rendered ${markersAdded}${skipped.length ? `, skipped ${skipped.length}` : ''}`);

// Attribute info icon — show tooltip on click/tap (for mobile)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const wasActive = target.classList.contains('attr-info--active');
  document.querySelectorAll('.attr-info--active').forEach(el => el.classList.remove('attr-info--active'));
  if (target.classList.contains('attr-info') && !wasActive) {
    target.classList.add('attr-info--active');
    e.stopPropagation();
  }
});;
