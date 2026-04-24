/**
 * AgroEcology Mapping — Sheet Sync
 *
 * Copies rows from the private "Data" sheet to the public "Public" sheet,
 * replacing precise Lat/Lng with fuzzed coordinates appended at the end.
 * All other columns pass through unchanged.
 *
 * Private → Public column changes:
 *   Lat, Lng  removed from their original position
 *   Lat, Lng  appended at end as fuzzed values (1–2 km annulus displacement)
 *
 * SETUP:
 *   1. Private data tab must be named "Data"  (see PRIVATE_SHEET_NAME)
 *   2. Create a blank tab named "Public"       (see PUBLIC_SHEET_NAME)
 *   3. Open the spreadsheet — onOpen adds the AgroEcology menu
 *   4. AgroEcology > Publish to Public Sheet
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIVATE_SHEET_NAME = 'Data';
const PUBLIC_SHEET_NAME  = 'Public';

const FUZZ_MIN_KM = 1.0;  // privacy floor: pin is always at least this far from true location
const FUZZ_MAX_KM = 2.0;  // privacy ceiling: maximum displacement

// These columns are stripped from passthrough and replaced by fuzzed versions at the end.
const COORD_HEADERS = new Set(['Lat', 'Lng']);

// ─── Fuzzing ──────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/**
 * Displaces a coordinate by a random offset within the annulus [FUZZ_MIN_KM, FUZZ_MAX_KM].
 * Both axes share the same r and theta so the displacement vector is coherent.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ fuzzedLat: number, fuzzedLng: number }}
 */
function fuzzCoords_(lat, lng) {
  const minSq = FUZZ_MIN_KM * FUZZ_MIN_KM;
  const maxSq = FUZZ_MAX_KM * FUZZ_MAX_KM;

  const r     = Math.sqrt(minSq + Math.random() * (maxSq - minSq));
  const theta = Math.random() * 2 * Math.PI;

  const kmToDeg  = r / EARTH_RADIUS_KM * (180 / Math.PI);
  const latRad   = lat * (Math.PI / 180);

  const deltaLat = kmToDeg * Math.cos(theta);
  const deltaLng = kmToDeg * Math.sin(theta) / Math.cos(latRad);

  let fuzzedLat = Math.max(-90, Math.min(90, lat + deltaLat));
  let fuzzedLng = lng + deltaLng;
  if (fuzzedLng >  180) fuzzedLng -= 360;
  if (fuzzedLng < -180) fuzzedLng += 360;

  return { fuzzedLat, fuzzedLng };
}

// ─── Publish ──────────────────────────────────────────────────────────────────

function publishToPublicSheet() {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const privateSheet = ss.getSheetByName(PRIVATE_SHEET_NAME);
  const publicSheet  = ss.getSheetByName(PUBLIC_SHEET_NAME);

  if (!privateSheet) return alert_(`Sheet "${PRIVATE_SHEET_NAME}" not found.`);
  if (!publicSheet)  return alert_(`Sheet "${PUBLIC_SHEET_NAME}" not found. Create the tab first.`);

  const privateData = privateSheet.getDataRange().getValues();
  if (privateData.length < 2) return alert_('No data rows found in the private sheet.');

  const headers = privateData[0];
  const col     = colIndex_(headers);

  if (col['Lat'] === undefined) return alert_(`Column "Lat" not found in "${PRIVATE_SHEET_NAME}".`);
  if (col['Lng'] === undefined) return alert_(`Column "Lng" not found in "${PRIVATE_SHEET_NAME}".`);

  const publicRows = buildPublicRows_(privateData, headers, col);

  writePublicSheet_(publicSheet, publicRows);

  alert_(`✓ Published ${publicRows.length - 1} record${publicRows.length !== 2 ? 's' : ''} to "${PUBLIC_SHEET_NAME}".`);
}

// ─── Row building ─────────────────────────────────────────────────────────────

function buildPublicRows_(privateData, headers, col) {
  const passthroughCols = headers.reduce((acc, h, i) => {
    if (!COORD_HEADERS.has(String(h).trim())) acc.push(i);
    return acc;
  }, []);

  const publicHeaders = [
    ...passthroughCols.map(i => headers[i]),
    'Lat', 'Lng',
  ];

  const rows = [publicHeaders];

  for (let r = 1; r < privateData.length; r++) {
    const row = privateData[r];
    if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const passthrough = passthroughCols.map(i => row[i]);
    const lat         = parseFloat(row[col['Lat']]);
    const lng         = parseFloat(row[col['Lng']]);

    if (isNaN(lat) || isNaN(lng)) {
      rows.push([...passthrough, '', '']);
      continue;
    }

    const { fuzzedLat, fuzzedLng } = fuzzCoords_(lat, lng);
    rows.push([...passthrough, fuzzedLat, fuzzedLng]);
  }

  return rows;
}

// ─── Sheet writing ────────────────────────────────────────────────────────────

function writePublicSheet_(sheet, rows) {
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  const headerRow = sheet.getRange(1, 1, 1, rows[0].length);
  headerRow.setFontWeight('bold');
  headerRow.setBackground('#e8f5e9');

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colIndex_(headers) {
  const index = {};
  headers.forEach((h, i) => { index[String(h).trim()] = i; });
  return index;
}

function alert_(msg) {
  SpreadsheetApp.getUi().alert(msg);
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AgroEcology')
    .addItem('Publish to Public Sheet', 'publishToPublicSheet')
    .addToUi();
}