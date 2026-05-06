/**
 * AgroEcology Mapping — Sheet Sync
 *
 * Copies rows from the private "Data" sheet to the public "Public" sheet,
 * replacing precise Lat/Lng with fuzzed coordinates appended at the end.
 * All other columns pass through unchanged.
 *
 * Private → Public column changes:
 *   Lat, Lng  removed from their original position
 *   Fuzzed-Lat, Fuzzed-Lng  appended at end (1–2 km annulus displacement)
 *
 * Idempotent fuzzing: Fuzzed-Lat / Fuzzed-Lng are stored in the Data sheet
 * itself. On re-publish, existing fuzzed values are reused — a pin is never
 * moved once it has been fuzzed. New rows (no fuzzed value yet) get fuzzed
 * on first publish and written back to the Data sheet.
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

// Column names for fuzzed coordinates in the Data sheet (internal).
const FUZZED_LAT_HEADER = 'Fuzzed-Lat';
const FUZZED_LNG_HEADER = 'Fuzzed-Lng';

// Column names used in the Public sheet output.
const PUBLIC_LAT_HEADER = 'Public-Lat';
const PUBLIC_LNG_HEADER = 'Public-Lng';

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

  // Ensure Fuzzed-Lat / Fuzzed-Lng columns exist in the Data sheet, then fuzz
  // any rows that don't yet have values. Write-backs happen before building
  // the public rows so privateData reflects the final fuzzed state.
  ensureFuzzedColumnsInDataSheet_(privateSheet, privateData, headers, col);

  // Re-read after potential write-back so col indices and values are current.
  const freshData    = privateSheet.getDataRange().getValues();
  const freshHeaders = freshData[0];
  const freshCol     = colIndex_(freshHeaders);

  const publicRows = buildPublicRows_(freshData, freshHeaders, freshCol);

  writePublicSheet_(publicSheet, publicRows);

  alert_(`✓ Published ${publicRows.length - 1} record${publicRows.length !== 2 ? 's' : ''} to "${PUBLIC_SHEET_NAME}".`);
}

// ─── Data-sheet fuzzed columns ────────────────────────────────────────────────

/**
 * Ensures Fuzzed-Lat and Fuzzed-Lng columns exist in the Data sheet.
 * Adds them if missing, then fills any blank cells for rows that have valid
 * Lat/Lng. Rows that already have fuzzed values are left untouched.
 */
function ensureFuzzedColumnsInDataSheet_(sheet, data, headers, col) {
  let fuzzedLatCol = col[FUZZED_LAT_HEADER];
  let fuzzedLngCol = col[FUZZED_LNG_HEADER];

  // Add missing header columns at the end of the sheet.
  // Always append Fuzzed-Lat before Fuzzed-Lng so they land in order.
  const lastCol = headers.length;
  if (fuzzedLatCol === undefined) {
    fuzzedLatCol = lastCol;
    sheet.getRange(1, fuzzedLatCol + 1).setValue(FUZZED_LAT_HEADER);
  }
  if (fuzzedLngCol === undefined) {
    fuzzedLngCol = fuzzedLatCol + 1;
    sheet.getRange(1, fuzzedLngCol + 1).setValue(FUZZED_LNG_HEADER);
  }

  // Walk data rows and fill any that are missing fuzzed values.
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const alreadyLat = row[fuzzedLatCol];
    const alreadyLng = row[fuzzedLngCol];
    if (alreadyLat !== '' && alreadyLat !== null && alreadyLat !== undefined &&
        alreadyLng !== '' && alreadyLng !== null && alreadyLng !== undefined) continue;

    const lat = parseFloat(row[col['Lat']]);
    const lng = parseFloat(row[col['Lng']]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const { fuzzedLat, fuzzedLng } = fuzzCoords_(lat, lng);
    sheet.getRange(r + 1, fuzzedLatCol + 1).setValue(fuzzedLat);
    sheet.getRange(r + 1, fuzzedLngCol + 1).setValue(fuzzedLng);
  }
}

// ─── Row building ─────────────────────────────────────────────────────────────

/**
 * Builds the public rows from the (already-fuzzed) Data sheet.
 * Fuzzed-Lat / Fuzzed-Lng are read from the Data sheet and appended at the end.
 * True Lat / Lng are stripped.
 */
function buildPublicRows_(data, headers, col) {
  const passthroughCols = headers.reduce((acc, h, i) => {
    const name = String(h).trim();
    if (!COORD_HEADERS.has(name) && name !== FUZZED_LAT_HEADER && name !== FUZZED_LNG_HEADER) {
      acc.push(i);
    }
    return acc;
  }, []);

  const publicHeaders = [
    ...passthroughCols.map(i => headers[i]),
    PUBLIC_LAT_HEADER, PUBLIC_LNG_HEADER,
  ];

  const rows = [publicHeaders];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (row.every(cell => cell === '' || cell === null || cell === undefined)) continue;

    const passthrough = passthroughCols.map(i => row[i]);
    const fuzzedLat   = col[FUZZED_LAT_HEADER] !== undefined ? row[col[FUZZED_LAT_HEADER]] : '';
    const fuzzedLng   = col[FUZZED_LNG_HEADER] !== undefined ? row[col[FUZZED_LNG_HEADER]] : '';

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