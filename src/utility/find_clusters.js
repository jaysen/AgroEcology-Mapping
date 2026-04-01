#!/usr/bin/env node
/**
 * find_clusters.js
 *
 * Reads the master CSV export and prints groups of entries whose coordinates
 * fall within a configurable radius of each other. Useful for identifying
 * tightly clustered pins to test the fuzzing behaviour.
 *
 * Usage:
 *   node utility_scripts/find_clusters.js [radiusDeg] [minGroupSize]
 *
 * Defaults:
 *   radiusDeg    = 0.1  (~11 km)
 *   minGroupSize = 3
 *
 * The CSV path is hardcoded to the private data file (gitignored).
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(
  __dirname,
  '../data/private/Map-data-20260331.csv'
);

const radiusDeg   = parseFloat(process.argv[2]) || 0.1;
const minGroup    = parseInt(process.argv[3], 10) || 3;

// ── Parse CSV ──────────────────────────────────────────────────────────────
// The header spans two lines (a quoted field contains a newline).
// Data starts at line index 2.
const text  = fs.readFileSync(CSV_PATH, 'utf8').replace(/\r/g, '');
const lines = text.split('\n');

const rows = [];
for (let i = 2; i < lines.length; i++) {
  const cols = lines[i].split(',');
  if (cols.length < 10) continue;
  const lat  = parseFloat(cols[8]);
  const lng  = parseFloat(cols[9]);
  if (isNaN(lat) || isNaN(lng)) continue;
  rows.push({
    lat,
    lng,
    name: cols[0].trim(),
    cat:  cols[1].trim(),
    prov: cols[5].trim(),
    dist: cols[6].trim(),
    town: cols[7].trim(),
  });
}

console.log(`Loaded ${rows.length} entries from CSV`);
console.log(`Clustering within ${radiusDeg}° (~${Math.round(radiusDeg * 111)} km), min group size ${minGroup}\n`);

// ── Find clusters ──────────────────────────────────────────────────────────
const clusters = [];
for (let i = 0; i < rows.length; i++) {
  const group = [i];
  for (let j = i + 1; j < rows.length; j++) {
    if (
      Math.abs(rows[i].lat - rows[j].lat) < radiusDeg &&
      Math.abs(rows[i].lng - rows[j].lng) < radiusDeg
    ) {
      group.push(j);
    }
  }
  if (group.length >= minGroup) clusters.push(group);
}

// Deduplicate (many overlapping groups share members)
clusters.sort((a, b) => b.length - a.length);
const seen = new Set();
const unique = [];
for (const g of clusters) {
  const key = g.slice().sort((a, b) => a - b).join('-');
  if (!seen.has(key)) { seen.add(key); unique.push(g); }
}

if (unique.length === 0) {
  console.log('No clusters found.');
  process.exit(0);
}

// ── Print results ──────────────────────────────────────────────────────────
unique.forEach((g, n) => {
  console.log(`=== Cluster ${n + 1} of ${unique.length} — ${g.length} entries ===`);
  g.forEach(i => {
    const r = rows[i];
    console.log(`  [${r.cat}] ${r.lat}, ${r.lng}  ${r.prov} / ${r.town}  |  ${r.name}`);
  });
  console.log();
});
