import L from 'leaflet';
import { projects } from './data';
import { AgroEcologyProject } from './types';
import './style.css';

// Fix for default marker icons in Leaflet with bundlers
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// Initialize the map centered on Southern Africa
const map = L.map('map').setView([-25.0, 25.0], 5);

// Add OpenStreetMap tiles (non-GAFAM)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
}).addTo(map);

// Function to create popup content
function createPopupContent(project: AgroEcologyProject): string {
  const statusBadge = `<span class="status-badge status-${project.status}">${project.status}</span>`;

  return `
    <div class="popup-content">
      <h3>${project.name}</h3>
      ${statusBadge}
      <div class="popup-section">
        <strong>Location:</strong> ${project.location.place}, ${project.location.region}, ${project.location.country}
      </div>
      <div class="popup-section">
        <strong>Type:</strong> ${project.type}
      </div>
      <div class="popup-section">
        <strong>Description:</strong>
        <p>${project.description}</p>
      </div>
      <div class="popup-section">
        <strong>Practices:</strong>
        <ul class="practices-list">
          ${project.practices.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
      <div class="popup-section">
        <strong>Key Crops:</strong> ${project.crops.join(', ')}
      </div>
      <div class="popup-stats">
        <div class="stat">
          <span class="stat-label">Established</span>
          <span class="stat-value">${project.established}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Size</span>
          <span class="stat-value">${project.size_hectares} ha</span>
        </div>
        <div class="stat">
          <span class="stat-label">Beneficiaries</span>
          <span class="stat-value">${project.beneficiaries}</span>
        </div>
      </div>
      <div class="popup-section">
        <strong>Organization:</strong> ${project.organization}
      </div>
      ${project.website ? `<div class="popup-section"><a href="${project.website}" target="_blank">Visit Website →</a></div>` : ''}
      ${project.contact ? `<div class="popup-section"><strong>Contact:</strong> ${project.contact}</div>` : ''}
    </div>
  `;
}

// Add markers for each project
projects.forEach(project => {
  const marker = L.marker([project.location.lat, project.location.lng])
    .addTo(map)
    .bindPopup(createPopupContent(project), {
      maxWidth: 400,
      className: 'custom-popup'
    });

  // Optional: Open popup on hover for better UX
  marker.on('mouseover', function(this: L.Marker) {
    this.openPopup();
  });
});

// Add a projects counter
const counter = document.createElement('div');
counter.className = 'projects-counter';
counter.innerHTML = `<strong>${projects.length}</strong> Projects Mapped`;
document.getElementById('app')?.appendChild(counter);

console.log(`Loaded ${projects.length} agroecology projects`);
