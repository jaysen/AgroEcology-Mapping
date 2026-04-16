import L from 'leaflet';
import { POINT_CATEGORIES } from './types';

export function addLegend(map: L.Map): void {
  const Legend = L.Control.extend({
    onAdd() {
      const div = L.DomUtil.create('div', 'map-legend');
      div.innerHTML = `
        <h4>
          Types of Initiatives
          <button class="legend-toggle" aria-label="Collapse legend">▾</button>
        </h4>
        <div class="legend-body">
          ${(Object.entries(POINT_CATEGORIES) as [string, typeof POINT_CATEGORIES[keyof typeof POINT_CATEGORIES]][])
            .filter(([key]) => key !== 'LH')  // LH is an alias for SI — exclude the duplicate entry
            .map(([, cat]) => `
              <div class="legend-item">
                <span class="legend-dot" style="background:${cat.color}"></span>
                <span>${cat.symbol ? `<strong>${cat.symbol}</strong> ` : ''}${cat.label}<span class="attr-info attr-info--wide" data-tooltip="${cat.description}">i</span></span>
              </div>`).join('')}
        </div>
      `;
      const btn = div.querySelector<HTMLButtonElement>('.legend-toggle')!;
      const body = div.querySelector<HTMLDivElement>('.legend-body')!;
      L.DomEvent.on(btn, 'click', () => {
        const collapsed = body.classList.toggle('legend-collapsed');
        div.classList.toggle('legend-is-collapsed', collapsed);
        btn.textContent = collapsed ? '▸' : '▾';
        btn.setAttribute('aria-label', collapsed ? 'Expand legend' : 'Collapse legend');
      });
      return div;
    },
  });
  new Legend({ position: 'bottomleft' }).addTo(map);
}
