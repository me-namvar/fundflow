import { MacroDataPoint, DataProvenance } from '../types/data';

export interface WorldBankIndicatorDef {
  id: string; // World Bank Indicator ID
  shortCode: string; // Short indicator symbol for terminal
  name: string;
  unit: string;
  description: string;
}

export interface WorldBankCountryDef {
  code: string; // ISO 3166-1 alpha-3 code
  name: string;
  region: string;
}

export const WORLD_BANK_INDICATORS: WorldBankIndicatorDef[] = [
  {
    id: 'NY.GDP.MKTP.KD.ZG',
    shortCode: 'GDP_GROWTH',
    name: 'GDP growth (annual %)',
    unit: '%',
    description: 'Annual percentage growth rate of GDP at market prices based on constant local currency.',
  },
  {
    id: 'FP.CPI.TOTL.ZG',
    shortCode: 'CPI_INFLATION',
    name: 'Inflation, consumer prices (annual %)',
    unit: '%',
    description: 'Annual percentage change in the cost to the average consumer of acquiring a basket of goods and services.',
  },
  {
    id: 'SL.UEM.TOTL.ZS',
    shortCode: 'UNEMPLOYMENT',
    name: 'Unemployment, total (% of total labor force)',
    unit: '%',
    description: 'Share of the labor force that is without work but available and seeking employment (modeled ILO estimate).',
  },
];

export const WORLD_BANK_COUNTRIES: WorldBankCountryDef[] = [
  { code: 'USA', name: 'United States', region: 'North America' },
  { code: 'GBR', name: 'United Kingdom', region: 'Europe' },
  { code: 'DEU', name: 'Germany', region: 'Europe' },
  { code: 'JPN', name: 'Japan', region: 'East Asia' },
  { code: 'FRA', name: 'France', region: 'Europe' },
  { code: 'CAN', name: 'Canada', region: 'North America' },
  { code: 'CHN', name: 'China', region: 'East Asia' },
  { code: 'IND', name: 'India', region: 'South Asia' },
  { code: 'BRA', name: 'Brazil', region: 'Latin America' },
  { code: 'AUS', name: 'Australia', region: 'East Asia & Pacific' },
  { code: 'KOR', name: 'South Korea', region: 'East Asia' },
  { code: 'ITA', name: 'Italy', region: 'Europe' },
  { code: 'MEX', name: 'Mexico', region: 'Latin America' },
  { code: 'ZAF', name: 'South Africa', region: 'Sub-Saharan Africa' },
  { code: 'CHE', name: 'Switzerland', region: 'Europe' },
  { code: 'EUU', name: 'European Union', region: 'Europe' },
  { code: 'WLD', name: 'World (Global Aggregate)', region: 'Global' },
];

export interface WorldBankObservation {
  id: string;
  countryCode: string;
  countryName: string;
  indicatorCode: string;
  indicatorName: string;
  year: string;
  observationDate: string; // YYYY-01-01
  value: number | null;
  isMissing: boolean;
  unit: string;
  source: string;
  retrievedAt: string; // Exact ISO timestamp when observation was retrieved
  provenance: DataProvenance;
}

export interface WorldBankFetchResult {
  observations: WorldBankObservation[];
  totalReported: number;
  validCount: number;
  missingCount: number;
  retrievalTimestamp: string;
  meta: {
    page: number;
    pages: number;
    total: number;
    lastUpdated?: string;
  };
  apiUrl: string;
}

/**
 * Fetch observations from the official World Bank Open Data API
 * Does not require an API key and supports CORS
 */
export async function fetchWorldBankObservations(
  countryCode: string,
  indicatorCode: string,
  startYear = 1990,
  endYear = 2025
): Promise<WorldBankFetchResult> {
  const cleanCountry = countryCode.trim().toUpperCase();
  const cleanIndicator = indicatorCode.trim();
  const dateParam = `${startYear}:${endYear}`;
  const apiUrl = `https://api.worldbank.org/v2/country/${cleanCountry}/indicator/${cleanIndicator}?format=json&per_page=100&date=${dateParam}`;

  const retrievalTimestamp = new Date().toISOString();

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (netErr: any) {
    throw new Error(
      `Network connection to World Bank Open Data API failed: ${netErr.message || 'Check your internet connection.'}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `World Bank API responded with HTTP status ${response.status} (${response.statusText}). Endpoint: ${apiUrl}`
    );
  }

  let json: any;
  try {
    json = await response.json();
  } catch (parseErr) {
    throw new Error('Failed to parse World Bank API response as valid JSON.');
  }

  // Check for World Bank API error payload format: [{"message": [{"id": "...", "value": "..."}]}]
  if (Array.isArray(json) && json.length > 0 && json[0]?.message) {
    const errorDetails = json[0].message
      .map((m: any) => m.value || m.key || JSON.stringify(m))
      .join('; ');
    throw new Error(`World Bank API error: ${errorDetails}`);
  }

  if (!Array.isArray(json) || json.length < 2) {
    throw new Error(
      `Unexpected response structure from World Bank API. Expected [metadata, observations], received: ${JSON.stringify(
        json
      ).slice(0, 200)}`
    );
  }

  const metaData = json[0] || {};
  const rawObservations = Array.isArray(json[1]) ? json[1] : [];

  const matchedIndicator = WORLD_BANK_INDICATORS.find((i) => i.id === cleanIndicator);
  const matchedCountry = WORLD_BANK_COUNTRIES.find((c) => c.code === cleanCountry);

  const observations: WorldBankObservation[] = rawObservations.map((raw: any, index: number) => {
    const isValNull = raw.value === null || raw.value === undefined;
    const numVal = !isValNull ? Number(raw.value) : null;
    const year = String(raw.date || '');

    return {
      id: `wb-obs-${cleanCountry}-${cleanIndicator}-${year}-${index}`,
      countryCode: raw.countryiso3code || cleanCountry,
      countryName: raw.country?.value || matchedCountry?.name || cleanCountry,
      indicatorCode: raw.indicator?.id || cleanIndicator,
      indicatorName: raw.indicator?.value || matchedIndicator?.name || cleanIndicator,
      year,
      observationDate: `${year}-01-01`,
      value: numVal !== null && !isNaN(numVal) ? Number(numVal.toFixed(4)) : null,
      isMissing: isValNull || numVal === null || isNaN(numVal),
      unit: raw.unit || '%',
      source: 'World Bank Open Data',
      retrievedAt: retrievalTimestamp,
      provenance: 'verified_real',
    };
  });

  // Sort chronologically (oldest to newest)
  observations.sort((a, b) => (a.year < b.year ? -1 : 1));

  const validObservations = observations.filter((o) => !o.isMissing && o.value !== null);
  const missingObservations = observations.filter((o) => o.isMissing);

  return {
    observations,
    totalReported: observations.length,
    validCount: validObservations.length,
    missingCount: missingObservations.length,
    retrievalTimestamp,
    meta: {
      page: metaData.page || 1,
      pages: metaData.pages || 1,
      total: metaData.total || observations.length,
      lastUpdated: metaData.lastupdated,
    },
    apiUrl,
  };
}

/**
 * Converts retrieved World Bank observations into MacroDataPoints for integration
 * into the main dashboard, chart studio, spreadsheet, and analytics lab.
 * STRICT: Only imports non-null, valid observations. Missing values are never fabricated!
 */
export function convertWorldBankToMacroDataPoints(
  observations: WorldBankObservation[],
  indicatorAlias?: string
): MacroDataPoint[] {
  // Filter out any missing observations
  const validOnly = observations.filter((obs) => !obs.isMissing && obs.value !== null);

  return validOnly.map((obs) => {
    const matchedInd = WORLD_BANK_INDICATORS.find((i) => i.id === obs.indicatorCode);
    const short = matchedInd?.shortCode || obs.indicatorCode.replace(/\./g, '_');
    const finalIndicator = indicatorAlias?.trim().toUpperCase() || `${obs.countryCode}_${short}`;

    return {
      id: `wb-${obs.countryCode}-${obs.indicatorCode}-${obs.year}`,
      date: obs.observationDate,
      indicator: finalIndicator,
      value: obs.value!,
      unit: obs.unit || '%',
      source: `World Bank (${obs.countryCode})`,
      frequency: 'annual',
      lastUpdated: obs.retrievedAt,
      provenance: 'verified_real',
      notes: `Official World Bank Series: ${obs.indicatorName} [${obs.indicatorCode}] for ${obs.countryName}. Year: ${obs.year}. Retrieved: ${obs.retrievedAt}`,
    };
  });
}
