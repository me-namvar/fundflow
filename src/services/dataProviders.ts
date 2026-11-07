import { MacroDataPoint } from '../types/data';

export interface DataProviderMeta {
  id: string;
  name: string;
  agency: string;
  categoryCoverage: string[];
  requiresApiKey: boolean;
  serverProxyEndpoint: string;
  docsUrl: string;
  status: 'adapter_ready' | 'proxy_required';
  description: string;
}

export interface IMacroDataProvider {
  readonly meta: DataProviderMeta;
  fetchSeries(seriesCode: string, startDate?: string, endDate?: string): Promise<MacroDataPoint[]>;
}

export const DATA_PROVIDERS_REGISTRY: DataProviderMeta[] = [
  {
    id: 'fred',
    name: 'Federal Reserve Economic Data (FRED)',
    agency: 'Federal Reserve Bank of St. Louis',
    categoryCoverage: ['US Treasury Yields', 'Fed Funds', 'Inflation (CPI/PCE)', 'GDP', 'Labor'],
    requiresApiKey: true,
    serverProxyEndpoint: '/api/macro/fred',
    docsUrl: 'https://fred.stlouisfed.org/docs/api/fred/',
    status: 'adapter_ready',
    description: 'Premier repository of 800,000+ US and international economic time series. Integration prepared via server-side proxy route.',
  },
  {
    id: 'world_bank',
    name: 'World Bank Open Data',
    agency: 'The World Bank Group',
    categoryCoverage: ['Global GDP', 'Sovereign Debt', 'Inflation', 'Trade Balances'],
    requiresApiKey: false,
    serverProxyEndpoint: '/api/macro/world-bank',
    docsUrl: 'https://datahelpdesk.worldbank.org/knowledgebase/topics/125535-developer-information',
    status: 'adapter_ready',
    description: 'Free public REST API covering global development indicators across 200+ countries with no API key requirement.',
  },
  {
    id: 'eia',
    name: 'U.S. Energy Information Administration (EIA)',
    agency: 'U.S. Department of Energy',
    categoryCoverage: ['WTI Crude', 'Brent Crude', 'Natural Gas', 'Refinery Capacity', 'Electricity'],
    requiresApiKey: true,
    serverProxyEndpoint: '/api/macro/eia',
    docsUrl: 'https://www.eia.gov/opendata/',
    status: 'adapter_ready',
    description: 'Authoritative official energy statistics, petroleum balances, and benchmark oil spot prices.',
  },
  {
    id: 'crypto_public',
    name: 'Public Digital Asset Feeds',
    agency: 'CoinGecko / CoinMarketCap Proxy',
    categoryCoverage: ['Bitcoin', 'Ethereum', 'Total Crypto Market Cap', 'Stablecoin Liquidity'],
    requiresApiKey: false,
    serverProxyEndpoint: '/api/macro/crypto',
    docsUrl: 'https://www.coingecko.com/api/documentation',
    status: 'adapter_ready',
    description: 'Aggregated real-time and historical pricing for major cryptographic assets and decentralized networks.',
  },
];

/**
 * Server Proxy Architecture Blueprint:
 * Client triggers requests to /api/macro/* -> Backend attaches securely stored env var API keys
 * and queries upstream providers without leaking credentials into browser network panels.
 */
export class ClientSafeProxyAdapter implements IMacroDataProvider {
  constructor(public readonly meta: DataProviderMeta) {}

  async fetchSeries(seriesCode: string, startDate?: string, endDate?: string): Promise<MacroDataPoint[]> {
    const params = new URLSearchParams({
      series: seriesCode,
      ...(startDate ? { start: startDate } : {}),
      ...(endDate ? { end: endDate } : {}),
    });

    try {
      const response = await fetch(`${this.meta.serverProxyEndpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(
          `Provider ${this.meta.name} responded with status ${response.status}. Proxy route not active in offline prototype.`
        );
      }
      return await response.json();
    } catch (err: any) {
      console.warn(`[${this.meta.id}] Provider proxy fetch notice:`, err.message);
      throw err;
    }
  }
}
