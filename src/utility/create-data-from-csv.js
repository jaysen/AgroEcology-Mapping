#!/usr/bin/env node
/**
 * createDataFromCsv.js
 *
 * Reads the master CSV export and writes a typed TypeScript data file
 * (AgroEcologyProject[]) ready for use in the app.
 *
 * Usage:
 *   node src/utility/createDataFromCsv.js
 *
 * If the output file already exists, appends -1, -2, … until a free name is found.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Category code mapping ─────────────────────────────────────────────────────
// Maps raw CSV codes → internal PointCategory codes used by the app (types.ts).
// Update here when the source spreadsheet renames a category code.
// Unknown codes fall back to 'LS'.
//
// LH (Lighthouse) was the original spreadsheet label for what is now called
// SI (Star Initiative). The spreadsheet may still emit 'LH' for older rows or
// if not all editors have adopted the new name. This mapping ensures the app
// always receives the canonical 'SI' code regardless of which name appears in
// the CSV. The 'LH' key in POINT_CATEGORIES / categoryIcons in the app is a
// matching safety net for data that bypasses this pipeline.
const CATEGORY_MAP = {
  'LS':  'LS',
  'CC':  'CC',
  'AEH': 'AEH',
  'LH':  'SI',   // legacy name — Lighthouse was renamed to Star Initiative
  'SI':  'SI',
};

// ── File paths ────────────────────────────────────────────────────────────────
const INPUT_CSV     = path.resolve(__dirname, '../../data/private/Map-data-20260331.csv');
const OUTPUT_TS_BASE = path.resolve(__dirname, '../data/private/data-20260331.ts');

// ── Resolve a non-colliding output path ───────────────────────────────────────
function resolveOutputPath(basePath) {
  if (!fs.existsSync(basePath)) return basePath;
  const ext  = path.extname(basePath);
  const stem = basePath.slice(0, -ext.length);
  let n = 1;
  while (true) {
    const candidate = `${stem}-${n}${ext}`;
    if (!fs.existsSync(candidate)) return candidate;
    n++;
  }
}

const OUTPUT_TS = resolveOutputPath(OUTPUT_TS_BASE);

// ── CSV helpers ───────────────────────────────────────────────────────────────

/**
 * Minimal CSV row splitter. Handles quoted fields (including fields that
 * contain commas). Does NOT handle embedded newlines within quoted fields.
 */
function splitCsvRow(line) {
  const cols = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }  // escaped quote
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

const yesTrue = v => /^y(es)?$/i.test(v.trim());

// ── Parse ─────────────────────────────────────────────────────────────────────
const text  = fs.readFileSync(INPUT_CSV, 'utf8').replace(/\r/g, '');
const lines = text.split('\n');

// Header spans two lines (row 0 + row 1) — data starts at line index 2
const projects = [];
let id = 1;

for (let i = 2; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const c = splitCsvRow(line);
  if (c.length < 10) continue;

  const lat = parseFloat(c[8]);
  const lng = parseFloat(c[9]);
  if (isNaN(lat) || isNaN(lng)) continue;

  const rawCat = c[1].trim();
  const category = CATEGORY_MAP[rawCat] ?? 'LS';

  const yearRaw = parseInt(c[10], 10);

  projects.push({
    id,
    name:                        c[0].trim(),
    category,
    contact:                     c[2].trim(),
    phone:                       c[3].trim() || undefined,
    email:                       c[4].trim() || undefined,
    province:                    c[5].trim(),
    district:                    c[6].trim(),
    nearestTown:                 c[7].trim(),
    location:                    { lat, lng },
    yearStarted:                 isNaN(yearRaw) ? 0 : yearRaw,
    highOnFarmDiversity:         yesTrue(c[11] ?? ''),
    mixedFarming:                yesTrue(c[12] ?? ''),
    seedBankIndividual:          yesTrue(c[13] ?? ''),
    seedBankCollective:          yesTrue(c[14] ?? ''),
    organisedSeedExchange:       yesTrue(c[15] ?? ''),
    integratedLandscapeManagement: yesTrue(c[16] ?? ''),
    onSiteTraining:              yesTrue(c[17] ?? ''),
    structuredTrainingProgrammes: yesTrue(c[18] ?? ''),
    trainingType:                (c[19] ?? '').trim(),
    trainingAccreditation:       yesTrue(c[20] ?? ''),
    gsInputSupply:               yesTrue(c[21] ?? ''),
    gsMentorshipTechSupport:     yesTrue(c[22] ?? ''),
    gsMarketingServices:         yesTrue(c[23] ?? ''),
  });
  id++;
}

// ── Serialise to TypeScript ───────────────────────────────────────────────────
function tsVal(v) {
  if (v === undefined) return 'undefined';
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'object' && 'lat' in v) return `{ lat: ${v.lat}, lng: ${v.lng} }`;
  return JSON.stringify(v);
}

function projectToTs(p) {
  const lines = [
    `  {`,
    `    id: ${p.id},`,
    `    name: ${tsVal(p.name)},`,
    `    category: ${tsVal(p.category)},`,
    `    contact: ${tsVal(p.contact)},`,
    p.phone !== undefined ? `    phone: ${tsVal(p.phone)},` : null,
    p.email !== undefined ? `    email: ${tsVal(p.email)},` : null,
    `    province: ${tsVal(p.province)},`,
    `    district: ${tsVal(p.district)},`,
    `    nearestTown: ${tsVal(p.nearestTown)},`,
    `    location: ${tsVal(p.location)},`,
    `    yearStarted: ${tsVal(p.yearStarted)},`,
    `    highOnFarmDiversity: ${tsVal(p.highOnFarmDiversity)},`,
    `    mixedFarming: ${tsVal(p.mixedFarming)},`,
    `    seedBankIndividual: ${tsVal(p.seedBankIndividual)},`,
    `    seedBankCollective: ${tsVal(p.seedBankCollective)},`,
    `    organisedSeedExchange: ${tsVal(p.organisedSeedExchange)},`,
    `    integratedLandscapeManagement: ${tsVal(p.integratedLandscapeManagement)},`,
    `    onSiteTraining: ${tsVal(p.onSiteTraining)},`,
    `    structuredTrainingProgrammes: ${tsVal(p.structuredTrainingProgrammes)},`,
    `    trainingType: ${tsVal(p.trainingType)},`,
    `    trainingAccreditation: ${tsVal(p.trainingAccreditation)},`,
    `    gsInputSupply: ${tsVal(p.gsInputSupply)},`,
    `    gsMentorshipTechSupport: ${tsVal(p.gsMentorshipTechSupport)},`,
    `    gsMarketingServices: ${tsVal(p.gsMarketingServices)},`,
    `  }`,
  ].filter(l => l !== null).join('\n');
  return lines;
}

const tsSource = [
  `import { AgroEcologyProject } from '../../types';`,
  ``,
  `// Auto-generated by src/utility/createDataFromCsv.js`,
  `// Source: ${path.relative(path.dirname(OUTPUT_TS), INPUT_CSV)}`,
  `// Date:   ${new Date().toISOString()}`,
  ``,
  `export const projects: AgroEcologyProject[] = [`,
  projects.map(projectToTs).join(',\n'),
  `];`,
  ``,
].join('\n');

fs.writeFileSync(OUTPUT_TS, tsSource, 'utf8');

console.log(`Parsed  ${projects.length} entries from CSV`);
console.log(`Written → ${OUTPUT_TS}`);
