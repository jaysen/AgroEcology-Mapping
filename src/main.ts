import L from 'leaflet';
import { projects } from './data';
import { AgroEcologyProject, PointCategory, POINT_CATEGORIES } from './types';
import './style.css';

// Fix for default marker icons in Leaflet with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Initialize the map centered on Southern Africa
const map = L.map('map').setView([-25.0, 25.0], 5);

// Add OpenStreetMap tiles (non-GAFAM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// Create a category marker icon using SVG DivIcon (no CDN dependencies)
function createCategoryIcon(category: PointCategory): L.DivIcon {
  const { code, color, textColor } = POINT_CATEGORIES[category];
  const size = 36;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      <polygon points="${size / 2 - 6},${size - 2} ${size / 2 + 6},${size - 2} ${size / 2},${size + 6}"
               fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="${code.length > 2 ? '9' : '11'}"
            font-weight="bold" fill="${textColor}">${code}</text>
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
  LH:  createCategoryIcon('LH'),
};

// Build popup content
function createPopupContent(project: AgroEcologyProject): string {
  const cat = POINT_CATEGORIES[project.category];
  const categoryBadge = `<span class="category-badge" style="background:${cat.color};color:${cat.textColor}">${cat.code} — ${cat.label}</span>`;

  const yesNo = (val: boolean) => val ? 'Yes' : '—';

  const trainingTypeLabel: Record<string, string> = {
    S: 'Short (<7 days)',
    I: 'Intermediate (1 wk–6 mo)',
    L: 'Long (>6 mo)',
  };
  const trainingTypeDisplay = project.trainingType
    ? project.trainingType.split(' ').map(t => trainingTypeLabel[t] ?? t).join(', ')
    : '—';

  const attributes = [
    ['High on-farm diversity',          project.highOnFarmDiversity],
    ['Mixed farming',                   project.mixedFarming],
    ['Seed bank (individual)',          project.seedBankIndividual],
    ['Seed bank (collective)',          project.seedBankCollective],
    ['Organised seed exchange',         project.organisedSeedExchange],
    ['Integrated landscape management', project.integratedLandscapeManagement],
  ] as [string, boolean][];

  const activeAttributes = attributes.filter(([, v]) => v).map(([label]) => label);

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
      </div>
      <div class="popup-section">
        <strong>Year started:</strong> ${project.yearStarted}
      </div>
      ${activeAttributes.length ? `
      <div class="popup-section">
        <strong>Attributes:</strong>
        <ul class="practices-list">
          ${activeAttributes.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>` : ''}
      <div class="popup-section">
        <strong>On-site training:</strong> ${yesNo(project.onSiteTraining)}
      </div>
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

// Add markers
projects.forEach(project => {
  const marker = L.marker([project.location.lat, project.location.lng], {
    icon: categoryIcons[project.category],
  })
    .addTo(map)
    .bindPopup(createPopupContent(project), {
      maxWidth: 400,
      className: 'custom-popup',
    });

  marker.on('click', function(this: L.Marker) {
    this.openPopup();
  });
});

// Legend
const Legend = L.Control.extend({
  onAdd() {
    const div = L.DomUtil.create('div', 'map-legend');
    div.innerHTML = `
      <h4>Point Categories</h4>
      ${Object.values(POINT_CATEGORIES).map(cat => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${cat.color}"></span>
          <span><strong>${cat.code}</strong> ${cat.label}</span>
        </div>`).join('')}
    `;
    return div;
  },
});
new Legend({ position: 'bottomleft' }).addTo(map);

// Projects counter
const counter = document.createElement('div');
counter.className = 'projects-counter';
counter.innerHTML = `<strong>${projects.length}</strong> Projects Mapped`;
document.getElementById('app')?.appendChild(counter);

console.log(`Loaded ${projects.length} agroecology projects`);
