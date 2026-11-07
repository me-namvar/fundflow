export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export type DataProvenance = 'sample_illustrative' | 'verified_real' | 'user_imported';

export type MacroCategory =
  | 'precious_metals'
  | 'treasury_yields'
  | 'inflation'
  | 'fed_policy'
  | 'energy'
  | 'crypto'
  | 'macroeconomic';

export interface MacroDataPoint {
  id: string;
  date: string; // ISO YYYY-MM-DD
  indicator: string; // e.g., 'GOLD', 'US10Y', 'CPI_YOY'
  value: number;
  unit: string; // e.g., 'USD/oz', '%', 'USD/bbl'
  source: string; // e.g., 'FRED', 'BLS', 'EIA', 'CoinGecko'
  frequency: Frequency;
  lastUpdated: string;
  provenance: DataProvenance;
  notes?: string;
}

export interface IndicatorMeta {
  id: string;
  name: string;
  category: MacroCategory;
  unit: string;
  defaultFrequency: Frequency;
  defaultChartType: 'line' | 'bar' | 'scatter';
  source: string;
  description: string;
  suggestedAxisGroup?: 'percentage' | 'currency_high' | 'currency_med' | 'index';
}

export interface FilterState {
  searchQuery: string;
  selectedIndicator: string; // 'ALL' or specific indicator ID
  category: string; // 'ALL' or MacroCategory
  startDate: string;
  endDate: string;
  frequency: string; // 'ALL' or Frequency
  provenance: string; // 'ALL' or DataProvenance
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  rawInput: string;
}

export interface CorrelationResult {
  date: string;
  correlation: number;
  seriesAValue: number;
  seriesBValue: number;
}

export interface SeriesStats {
  count: number;
  latestValue: number;
  latestDate: string;
  minValue: number;
  maxValue: number;
  mean: number;
  change1M?: number;
  change1Y?: number;
}
