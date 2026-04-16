import L from 'leaflet';
import { PointCategory, POINT_CATEGORIES } from './types';

// Create a category marker icon using SVG DivIcon (no CDN dependencies)
export function createCategoryIcon(category: PointCategory): L.DivIcon {
  const { color, textColor, symbol } = POINT_CATEGORIES[category];
  const size = 36;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
      <polygon points="${size / 2 - 6},${size - 2} ${size / 2 + 6},${size - 2} ${size / 2},${size + 6}"
               fill="${color}" stroke="white" stroke-width="1.5"/>
      ${symbol ? `<text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="16"
            font-weight="bold" fill="${textColor}">${symbol}</text>` : ''}
    </svg>`.trim();

  return L.divIcon({
    html: svg,
    className: `category-marker category-${category.toLowerCase()}`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

// Pre-created icons for each category.
// LH (Lighthouse) is the old spreadsheet code for what is now SI (Star Initiative).
// create-data-from-csv.js normalises LH → SI at import time, but the LH entry
// here acts as a runtime safety net for any data that bypassed the pipeline.
export const categoryIcons: Record<PointCategory, L.DivIcon> = {
  LS:  createCategoryIcon('LS'),
  CC:  createCategoryIcon('CC'),
  AEH: createCategoryIcon('AEH'),
  SI:  createCategoryIcon('SI'),
  LH:  createCategoryIcon('SI'),  // alias: old name → same icon as SI
};
