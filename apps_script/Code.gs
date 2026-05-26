const SHEET_NAME = 'responses';
const HEADERS = [
  'timestamp',
  'type',
  'evaluatorId',
  'evaluatorKey',
  'questionId',
  'sampleTitle',
  'candidateId',
  'candidateLabel',
  'model',
  'metricId',
  'metricLabel',
  'score'
];

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const hasAllHeaders = HEADERS.every((header, index) => current[index] === header);
    if (!hasAllHeaders) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
  return sheet;
}

function safeJson_(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function rowToObject_(row) {
  const obj = {};
  HEADERS.forEach((header, index) => {
    obj[header] = row[index];
  });
  if (obj.timestamp instanceof Date) {
    obj.timestamp = obj.timestamp.toISOString();
  }
  return obj;
}

function doPost(e) {
  try {
    const sheet = getOrCreateSheet_();
    const data = safeJson_(e.parameter.payload || '{}', {});
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    sheet.appendRow([
      timestamp,
      data.type || 'score',
      data.evaluatorId || '',
      data.evaluatorKey || '',
      data.questionId || '',
      data.sampleTitle || '',
      data.candidateId || '',
      data.candidateLabel || '',
      data.model || '',
      data.metricId || '',
      data.metricLabel || '',
      data.score === undefined ? '' : data.score,
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const callback = e.parameter.callback || '';
  try {
    const sheet = getOrCreateSheet_();
    const lastRow = sheet.getLastRow();
    const rows = lastRow <= 1
      ? []
      : sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues().map(rowToObject_);

    const payload = JSON.stringify({ ok: true, rows });
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${payload});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const payload = JSON.stringify({ ok: false, error: String(error), rows: [] });
    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${payload});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
