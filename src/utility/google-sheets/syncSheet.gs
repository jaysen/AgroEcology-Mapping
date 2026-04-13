/**
 * AgroEcology Mapping — Sheet Sync
 *
 * Reads from the private "Data" sheet, fuzzes coordinates,
 * and writes a sanitised public version to the "Public" sheet.
 *
 * Private columns (source):
 *   Name, Category, Contact, Phone, Email, Province, District,
 *   NearestTown, Lat, Lng, YearStarted, HighOnFarmDiversity,
 *   MixedFarming, SeedBankIndividual, SeedBankCollective,
 *   OrganisedSeedExchange, IntegratedLandscapeManagement,
 *   OnSiteTraining, StructuredTrainingProgrammes, TrainingType,
 *   TrainingAccreditation, GSInputSupply, GSMentorshipTechSupport,
 *   GSMarketingServices
 *
 * Public columns (output):
 *   Name, Category, Contact, Phone, Email, Province, District, NearestTown,
 *   YearStarted, HighOnFarmDiversity,
 *   MixedFarming, SeedBankIndividual, SeedBankCollective,
 *   OrganisedSeedExchange, IntegratedLandscapeManagement,
 *   OnSiteTraining, StructuredTrainingProgrammes, TrainingType,
 *   TrainingAccreditation, GSInputSupply, GSMentorshipTechSupport,
 *   GSMarketingServices, Lat, Lng
 *
 * Precise Lat/Lng are excluded; output Lat/Lng are fuzzed coordinates.
 *
 * SETUP:
 *   1. Rename your private data tab to "Data" (or update PRIVATE_SHEET_NAME below).
 *   2. Create a blank tab named "Public" (or update PUBLIC_SHEET_NAME below).
 *   3. Run installMenu() once — or just open the spreadsheet, the onOpen trigger
 *      will add the "AgroEcology" menu automatically.
 *   4. Use AgroEcology > Publish to Public Sheet to sync.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const PRIVATE_SHEET_NAME = 'Data';
const PUBLIC_SHEET_NAME  = 'Public';

const FUZZ_MIN_KM = 1.0;  // hard privacy floor — pin always at least this far from real location
const FUZZ_MAX_KM = 2.0;  // maximum displacement in km

// Columns to EXCLUDE from the public sheet (matched by header name).
// Lat and Lng are excluded here — they are replaced by fuzzed versions at the end.
const PRIVATE_ONLY_HEADERS = new Set(['Lat', 'Lng']);

// ─── Fuzzing ─────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Compute a coherent fuzz displacement vector.
 * Both lat and lng deltas share the same r and theta.
 *
 * @param {number} lat - Original latitude in degrees
 * @param {number} lng - Original longitude in degrees
 * @returns {{ fuzzedLat: number, fuzzedLng: number }}
 */
function fuzzCoords_(lat, lng) {
  const minSq = FUZZ_MIN_KM * FUZZ_MIN_KM;
  const maxSq = FUZZ_MAX_KM * FUZZ_MAX_KM;

  const r     = Math.sqrt(minSq + Math.random() * (maxSq - minSq));
  const theta = Math.random() * 2 * Math.PI;

  const latRad   = lat * (Math.PI / 180);
  const kmToDeg  = r / EARTH_RADIUS_KM * (180 / Math.PI);

  const deltaLat = kmToDeg * Math.cos(theta);
  const deltaLng = kmToDeg * Math.sin(theta) / Math.cos(latRad);

  let fuzzedLat = lat + deltaLat;
  let fuzzedLng = lng + deltaLng;

  fuzzedLat = Math.max(-90,  Math.min(90,  fuzzedLat));
  if (fuzzedLng >  180) fuzzedLng -= 360;
  if (fuzzedLng < -180) fuzzedLng += 360;

  return { fuzzedLat, fuzzedLng };
}

// ─── Core sync ───────────────────────────────────────────────────────────────

/**
 * Main publish function. Reads all data rows from the private sheet,
 * fuzzes coordinates, strips private columns, and overwrites the public sheet.
 */
function publishToPublicSheet() {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const privateSheet = ss.getSheetByName(PRIVATE_SHEET_NAME);
  const publicSheet  = ss.getSheetByName(PUBLIC_SHEET_NAME);

  if (!privateSheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${PRIVATE_SHEET_NAME}" not found. Check PRIVATE_SHEET_NAME in the script config.`);
    return;
  }
  if (!publicSheet) {
    SpreadsheetApp.getUi().alert(`Sheet "${PUBLIC_SHEET_NAME}" not found. Create a tab named "${PUBLIC_SHEET_NAME}" first, or check PUBLIC_SHEET_NAME in the script config.`);
    return;
  }

  const privateData = privateSheet.getDataRange().getValues();
  if (privateData.length < 2) {
    SpreadsheetApp.getUi().alert('No data rows found in the private sheet.');
    return;
  }

  const privateHeaders = privateData[0];

  // Resolve column indices from header names — robust to column reordering
  const col = buildColIndex_(privateHeaders);

  // Validate that required columns exist
  const required = ['Lat', 'Lng'];
  for (const name of required) {
    if (col[name] === undefined) {
      SpreadsheetApp.getUi().alert(`Required column "${name}" not found in "${PRIVATE_SHEET_NAME}" headers.`);
      return;
    }
  }

  // Build public headers: private headers minus private-only columns,
  // with Lat/Lng replaced by fuzzed versions under the same names.
  const publicHeaders = [];
  const colMapping    = []; // maps public col index → { sourceCol, type }

  for (let i = 0; i < privateHeaders.length; i++) {
    const h = String(privateHeaders[i]).trim();
    if (PRIVATE_ONLY_HEADERS.has(h)) continue;

    publicHeaders.push(h);
    colMapping.push({ sourceCol: i, type: 'passthrough' });
  }

  // Append Lat/Lng at the end as fuzzed values
  publicHeaders.push('Lat');
  colMapping.push({ sourceCol: col['Lat'], type: 'fuzzedLat' });
  publicHeaders.push('Lng');
  colMapping.push({ sourceCol: col['Lng'], type: 'fuzzedLng' });

  // Build public rows
  const publicRows = [publicHeaders];

  for (let r = 1; r < privateData.length; r++) {
    const privateRow = privateData[r];

    // Skip entirely empty rows
    if (privateRow.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const lat = parseFloat(privateRow[col['Lat']]);
    const lng = parseFloat(privateRow[col['Lng']]);

    if (isNaN(lat) || isNaN(lng)) {
      // Row has no valid coordinates — include in public sheet but leave fuzzed cols blank
      const publicRow = colMapping.map(m => {
        if (m.type === 'fuzzedLat' || m.type === 'fuzzedLng') return '';
        return privateRow[m.sourceCol];
      });
      publicRows.push(publicRow);
      continue;
    }

    const { fuzzedLat, fuzzedLng } = fuzzCoords_(lat, lng);

    const publicRow = colMapping.map(m => {
      if (m.type === 'fuzzedLat') return fuzzedLat;
      if (m.type === 'fuzzedLng') return fuzzedLng;
      return privateRow[m.sourceCol];
    });

    publicRows.push(publicRow);
  }

  // Overwrite public sheet
  publicSheet.clearContents();
  publicSheet.getRange(1, 1, publicRows.length, publicRows[0].length).setValues(publicRows);

  // Style the header row
  const headerRange = publicSheet.getRange(1, 1, 1, publicRows[0].length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#e8f5e9');  // light green — on-brand for agroecology

  // Freeze header row
  publicSheet.setFrozenRows(1);

  // Auto-resize columns for readability
  publicSheet.autoResizeColumns(1, publicRows[0].length);

  const rowCount = publicRows.length - 1;
  SpreadsheetApp.getUi().alert(`✓ Published ${rowCount} record${rowCount !== 1 ? 's' : ''} to "${PUBLIC_SHEET_NAME}".`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a name→index map from a header row array.
 * @param {string[]} headers
 * @returns {Object.<string, number>}
 */
function buildColIndex_(headers) {
  const index = {};
  headers.forEach((h, i) => { index[String(h).trim()] = i; });
  return index;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

/**
 * Adds the AgroEcology menu. Runs automatically when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AgroEcology')
    .addItem('Publish to Public Sheet', 'publishToPublicSheet')
    .addToUi();
}