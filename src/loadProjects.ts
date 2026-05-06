/**
 * loadProjects.ts
 *
 * Runtime CSV loader — fetches a CSV from any URL, parses it with PapaParse,
 * validates each row, and returns typed AgroEcologyProject[].
 *
 * Supports both data source options:
 *  - Option 1: Google Sheets published-as-CSV URL (set VITE_DATA_URL)
 *  - Option 2: Static CSV served alongside the app (e.g. /data.csv in public/)
 *
 * Column name mapping:
 *   Edit COLUMN_NAMES below to match the actual header row in your CSV/sheet.
 *   Matching is case-insensitive, so "NearestTown" matches "nearesttown" etc.
 */

import Papa from 'papaparse';
import { AgroEcologyProject, PointCategory } from './types';

// ── Category mapping ──────────────────────────────────────────────────────────
// Maps raw CSV category codes → internal PointCategory codes.
// Add entries here when the spreadsheet renames or adds a category.
const CATEGORY_MAP: Record<string, PointCategory> = {
  'LS':  'LS',
  'CC':  'CC',
  'AEH': 'AEH',
  'LH':  'SI',  // Lighthouse → Star initiative (renamed in source)
  'SI':  'SI',
};

// ── Column name mapping ───────────────────────────────────────────────────────
// Right-hand values must match the header row in the CSV (case-insensitive).
// Update these if the spreadsheet headers change.
// Phone and Email are optional — absent columns are silently ignored.
const COLUMN_NAMES = {
  name:                          'Name',
  category:                      'Category',
  contact:                       'Contact',
  phone:                         'Phone',
  email:                         'Email',
  province:                      'Province',
  district:                      'District',
  nearestTown:                   'NearestTown',
  lat:                           'Lat',
  lng:                           'Lng',
  yearStarted:                   'YearStarted',
  highOnFarmDiversity:           'HighOnFarmDiversity',
  mixedFarming:                  'MixedFarming',
  seedBankIndividual:            'SeedBankIndividual',
  seedBankCollective:            'SeedBankCollective',
  organisedSeedExchange:         'OrganisedSeedExchange',
  integratedLandscapeManagement: 'IntegratedLandscapeManagement',
  onSiteTraining:                'OnSiteTraining',
  structuredTrainingProgrammes:  'StructuredTrainingProgrammes',
  trainingType:                  'TrainingType',
  trainingAccreditation:         'TrainingAccreditation',
  gsInputSupply:                 'GSInputSupply',
  gsMentorshipTechSupport:       'GSMentorshipTechSupport',
  gsMarketingServices:           'GSMarketingServices',
} as const;

type ColKey = keyof typeof COLUMN_NAMES;

// Rows missing any of these fields are skipped entirely.
const REQUIRED_COLS: ColKey[] = ['name', 'category', 'lat', 'lng'];

// Lowercase lookup map — used to match against PapaParse's normalised headers.
const COL = Object.fromEntries(
  Object.entries(COLUMN_NAMES).map(([k, v]) => [k, v.toLowerCase()])
) as Record<ColKey, string>;

// ── Public types ──────────────────────────────────────────────────────────────

export interface LoadOptions {
  /**
   * Number of rows to skip immediately after the header row.
   * Use skipRows: 1 if the CSV has two header rows (e.g. the original
   * Map-data export, which has a primary and secondary header row).
   * Default: 0.
   */
  skipRows?: number;
}

export interface LoadResult {
  projects: AgroEcologyProject[];
  /** Number of data rows that were skipped due to validation errors. */
  skippedRows: number;
  /** Human-readable list of warnings/errors encountered during parsing. */
  parseErrors: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isYes(v: string | undefined): boolean {
  return /^y(es)?$/i.test((v ?? '').trim());
}

// ── Main loader ───────────────────────────────────────────────────────────────

/**
 * Fetches a CSV from `url`, parses it into AgroEcologyProject[], and returns
 * the result with a log of any validation issues.
 *
 * All errors are also printed to the browser console so developers can
 * diagnose data problems without inspecting the return value.
 */
export async function loadProjectsFromCsv(url: string, options: LoadOptions = {}): Promise<LoadResult> {
  const parseErrors: string[] = [];
  const log   = (msg: string) => console.log(`[agromap] ${msg}`);
  const warn  = (msg: string) => { console.warn(`[agromap] ${msg}`);  parseErrors.push(msg); };
  const error = (msg: string) => { console.error(`[agromap] ${msg}`); parseErrors.push(msg); };

  log(`Loading data from data sheet at URL: ${url}`);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      error(`Fetch failed — HTTP ${res.status} ${res.statusText} (${url})`);
      return { projects: [], skippedRows: 0, parseErrors };
    }
    text = await res.text();
    log(`Received ${(text.length / 1024).toFixed(1)} KB`);
  } catch (err) {
    error(`Network error fetching ${url}: ${String(err)}`);
    return { projects: [], skippedRows: 0, parseErrors };
  }

  // ── Strip extra header rows ───────────────────────────────────────────────
  // Some exports (e.g. the original Map-data ODS/XLSX export) have two header
  // rows. Pass skipRows: 1 to drop the second header before parsing.
  if (options.skipRows && options.skipRows > 0) {
    const lines = text.split('\n');
    text = [lines[0], ...lines.slice(1 + options.skipRows)].join('\n');
    log(`Skipped ${options.skipRows} extra header row(s)`);
  }

  // ── Parse with PapaParse ──────────────────────────────────────────────────
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    // Normalise headers to lowercase for case-insensitive matching
    transformHeader: h => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    result.errors.forEach(e =>
      warn(`PapaParse: ${e.message}${e.row !== undefined ? ` (row ${e.row + 2})` : ''}`)
    );
  }

  const rows = result.data;
  if (rows.length === 0) {
    error('CSV appears empty — no data rows found after the header');
    return { projects: [], skippedRows: 0, parseErrors };
  }

  const detectedHeaders = result.meta.fields ?? [];
  //log(`Columns detected: [${detectedHeaders.join(', ')}]`);
  log(`${rows.length} data row(s) found`);

  // ── Validate column presence ──────────────────────────────────────────────
  const missingRequired = REQUIRED_COLS.filter(k => !detectedHeaders.includes(COL[k]));
  if (missingRequired.length > 0) {
    error(
      `Missing required column(s): ${missingRequired.map(k => COLUMN_NAMES[k]).join(', ')}` +
      ` — headers found: [${detectedHeaders.join(', ')}]`
    );
    return { projects: [], skippedRows: rows.length, parseErrors };
  }

  const missingOptional = (Object.keys(COLUMN_NAMES) as ColKey[]).filter(
    k => !REQUIRED_COLS.includes(k) && !detectedHeaders.includes(COL[k])
  );
  if (missingOptional.length > 0) {
    console.info(
      `[agromap] Optional columns not found (will be blank/false):`,
      missingOptional.map(k => COLUMN_NAMES[k])
    );
  }

  // ── Parse data rows ───────────────────────────────────────────────────────
  const projects: AgroEcologyProject[] = [];
  let skippedRows = 0;

  rows.forEach((row, i) => {
    const rowNum = i + 2; // 1-based + 1 for header = spreadsheet row number
    const get = (key: ColKey): string => (row[COL[key]] ?? '').trim();

    // ── Required: coordinates ───────────────────────────────────────────────
    const lat = parseFloat(get('lat'));
    const lng = parseFloat(get('lng'));
    if (isNaN(lat) || isNaN(lng)) {
      warn(`Row ${rowNum}: invalid coordinates (lat="${get('lat')}", lng="${get('lng')}") — skipped`);
      skippedRows++;
      return;
    }

    // ── Required: name ──────────────────────────────────────────────────────
    const name = get('name');
    if (!name) {
      warn(`Row ${rowNum}: empty name — skipped`);
      skippedRows++;
      return;
    }

    // ── Category with fallback ──────────────────────────────────────────────
    const rawCat = get('category').toUpperCase();
    const category: PointCategory = CATEGORY_MAP[rawCat] ?? 'LS';
    if (!CATEGORY_MAP[rawCat]) {
      warn(`Row ${rowNum} ("${name}"): unknown category "${rawCat}" — defaulting to LS`);
    }

    const yearRaw = parseInt(get('yearStarted'), 10);
    const phone = get('phone') || undefined;
    const email = get('email') || undefined;

    projects.push({
      id: projects.length + 1,
      name,
      category,
      contact:                       get('contact'),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      province:                      get('province'),
      district:                      get('district'),
      nearestTown:                   get('nearestTown'),
      location:                      { lat, lng },
      yearStarted:                   isNaN(yearRaw) ? 0 : yearRaw,
      highOnFarmDiversity:           isYes(get('highOnFarmDiversity')),
      mixedFarming:                  isYes(get('mixedFarming')),
      seedBankIndividual:            isYes(get('seedBankIndividual')),
      seedBankCollective:            isYes(get('seedBankCollective')),
      organisedSeedExchange:         isYes(get('organisedSeedExchange')),
      integratedLandscapeManagement: isYes(get('integratedLandscapeManagement')),
      onSiteTraining:                isYes(get('onSiteTraining')),
      structuredTrainingProgrammes:  isYes(get('structuredTrainingProgrammes')),
      trainingType:                  get('trainingType'),
      trainingAccreditation:         isYes(get('trainingAccreditation')),
      gsInputSupply:                 isYes(get('gsInputSupply')),
      gsMentorshipTechSupport:       isYes(get('gsMentorshipTechSupport')),
      gsMarketingServices:           isYes(get('gsMarketingServices')),
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  log(`Parsed ${projects.length} projects (${skippedRows} row(s) skipped)`);
  if (parseErrors.length > 0) {
    console.group(`[agromap] ${parseErrors.length} warning(s) during parse:`);
    parseErrors.forEach(e => console.warn(e));
    console.groupEnd();
  }

  return { projects, skippedRows, parseErrors };
}
