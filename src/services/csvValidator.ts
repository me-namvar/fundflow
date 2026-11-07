import Papa from 'papaparse';
import { Frequency, MacroDataPoint, ValidationError } from '../types/data';

export const REQUIRED_COLUMNS = ['date', 'indicator', 'value', 'unit', 'source', 'frequency'];
export const VALID_FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];

export function isValidISODate(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100) return false;

  // Calendar days per month
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

export function cleanNumericValue(val: any): { numeric: number | null; raw: string } {
  if (val === null || val === undefined) return { numeric: null, raw: '' };
  const str = String(val).trim();
  if (str === '') return { numeric: null, raw: str };

  // Strip dollar signs, euro signs, commas, and percentage signs if user pasted them
  const cleaned = str.replace(/[$,€£%]/g, '').trim();
  const num = Number(cleaned);

  if (isNaN(num) || !isFinite(num)) {
    return { numeric: null, raw: str };
  }
  return { numeric: num, raw: str };
}

export interface ParseResult {
  validPoints: MacroDataPoint[];
  errors: ValidationError[];
  totalRowsProcessed: number;
}

export function parseAndValidateCSV(csvString: string): ParseResult {
  const parsed = Papa.parse<Record<string, any>>(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header: string) => header.trim().toLowerCase(),
  });

  const errors: ValidationError[] = [];
  const validPoints: MacroDataPoint[] = [];

  const headers = parsed.meta.fields || [];

  // Check required column headers
  const missingHeaders = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingHeaders.length > 0) {
    errors.push({
      row: 1,
      column: 'Header Row',
      message: `Missing required column(s): ${missingHeaders.join(', ')}. Found: [${headers.join(', ')}]. Required columns: [${REQUIRED_COLUMNS.join(', ')}].`,
      rawInput: headers.join(', '),
    });
    return {
      validPoints: [],
      errors,
      totalRowsProcessed: parsed.data.length,
    };
  }

  // Iterate rows
  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row
    let hasFatalError = false;

    // 1. Date check
    const rawDate = row['date'] !== undefined ? String(row['date']).trim() : '';
    if (!rawDate) {
      errors.push({
        row: rowNum,
        column: 'date',
        message: 'Date cannot be empty. Must follow YYYY-MM-DD format.',
        rawInput: rawDate,
      });
      hasFatalError = true;
    } else if (!isValidISODate(rawDate)) {
      errors.push({
        row: rowNum,
        column: 'date',
        message: `Invalid calendar date '${rawDate}'. Must be formatted as YYYY-MM-DD and represent a real calendar day.`,
        rawInput: rawDate,
      });
      hasFatalError = true;
    }

    // 2. Indicator check
    const rawIndicator = row['indicator'] !== undefined ? String(row['indicator']).trim().toUpperCase() : '';
    if (!rawIndicator) {
      errors.push({
        row: rowNum,
        column: 'indicator',
        message: 'Indicator code cannot be empty (e.g., GOLD, US10Y, CPI_YOY).',
        rawInput: rawIndicator,
      });
      hasFatalError = true;
    }

    // 3. Value check
    const { numeric, raw: rawVal } = cleanNumericValue(row['value']);
    if (numeric === null) {
      errors.push({
        row: rowNum,
        column: 'value',
        message: `Value '${rawVal}' is not a valid number. Numeric value is required.`,
        rawInput: rawVal,
      });
      hasFatalError = true;
    }

    // 4. Frequency check
    const rawFreq = row['frequency'] !== undefined ? String(row['frequency']).trim().toLowerCase() : 'monthly';
    const finalFreq: Frequency = VALID_FREQUENCIES.includes(rawFreq as Frequency)
      ? (rawFreq as Frequency)
      : 'monthly';

    if (!VALID_FREQUENCIES.includes(rawFreq as Frequency)) {
      errors.push({
        row: rowNum,
        column: 'frequency',
        message: `Unrecognized frequency '${rawFreq}'. Automatically normalized to 'monthly'. Allowed: ${VALID_FREQUENCIES.join(', ')}.`,
        rawInput: rawFreq,
      });
    }

    const unit = row['unit'] !== undefined ? String(row['unit']).trim() : 'Index';
    const source = row['source'] !== undefined ? String(row['source']).trim() : 'CSV Import';

    if (!hasFatalError && numeric !== null) {
      validPoints.push({
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: rawDate,
        indicator: rawIndicator,
        value: numeric,
        unit: unit || 'Index',
        source: source || 'CSV Import',
        frequency: finalFreq,
        lastUpdated: new Date().toISOString(),
        provenance: 'user_imported',
      });
    }
  });

  return {
    validPoints,
    errors,
    totalRowsProcessed: parsed.data.length,
  };
}

export function exportDatasetToCSV(data: MacroDataPoint[], filenamePrefix = 'macro_dataset'): void {
  const exportRows = data.map((d) => ({
    date: d.date,
    indicator: d.indicator,
    value: d.value,
    unit: d.unit,
    source: d.source,
    frequency: d.frequency,
    provenance: d.provenance,
    lastUpdated: d.lastUpdated,
  }));

  const csv = Papa.unparse(exportRows, {
    quotes: false,
    header: true,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSampleCSVTemplate(): void {
  const sampleData = [
    { date: '2024-01-01', indicator: 'US10Y', value: 3.99, unit: '%', source: 'FRED', frequency: 'monthly' },
    { date: '2024-02-01', indicator: 'US10Y', value: 4.25, unit: '%', source: 'FRED', frequency: 'monthly' },
    { date: '2024-03-01', indicator: 'US10Y', value: 4.20, unit: '%', source: 'FRED', frequency: 'monthly' },
    { date: '2024-01-01', indicator: 'GOLD', value: 2039.50, unit: 'USD/oz', source: 'World Gold Council', frequency: 'monthly' },
    { date: '2024-02-01', indicator: 'GOLD', value: 2044.30, unit: 'USD/oz', source: 'World Gold Council', frequency: 'monthly' },
    { date: '2024-03-01', indicator: 'GOLD', value: 2229.87, unit: 'USD/oz', source: 'World Gold Council', frequency: 'monthly' },
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'macro_template_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
