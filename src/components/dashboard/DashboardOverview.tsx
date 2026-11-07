import React from 'react';
import { 
  TrendingUp, 
  Flame, 
  Coins, 
  Landmark, 
  BarChart2, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { MacroDataPoint } from '../../types/data';
import { InteractiveMacroChart } from '../charts/InteractiveMacroChart';
import { calculateSeriesStats, rebaseSeries } from '../../services/analytics';

interface DashboardOverviewProps {
  data: MacroDataPoint[];
  isDarkMode: boolean;
  onSelectIndicator: (indicatorId: string) => void;
  onNavigateToTab: (tab: 'charts' | 'table' | 'analytics') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  isDarkMode,
  onSelectIndicator,
  onNavigateToTab,
}) => {
  // Slices for each of the 7 core sections
  const goldData = data.filter((d) => d.indicator === 'GOLD');
  const silverData = data.filter((d) => d.indicator === 'SILVER');
  const us10yData = data.filter((d) => d.indicator === 'US10Y');
  const us2yData = data.filter((d) => d.indicator === 'US2Y');
  const cpiData = data.filter((d) => d.indicator === 'CPI_YOY');
  const pceData = data.filter((d) => d.indicator === 'CORE_PCE');
  const fedFundsData = data.filter((d) => d.indicator === 'FED_FUNDS');
  const wtiData = data.filter((d) => d.indicator === 'WTI_CRUDE');
  const brentData = data.filter((d) => d.indicator === 'BRENT_CRUDE');
  const btcData = data.filter((d) => d.indicator === 'BTC_USD');
  const ethData = data.filter((d) => d.indicator === 'ETH_USD');
  const gdpData = data.filter((d) => d.indicator === 'REAL_GDP_GROWTH');
  const unempData = data.filter((d) => d.indicator === 'UNEMPLOYMENT_RATE');

  // Stats
  const goldStats = calculateSeriesStats(goldData);
  const us10yStats = calculateSeriesStats(us10yData);
  const cpiStats = calculateSeriesStats(cpiData);
  const fedStats = calculateSeriesStats(fedFundsData);
  const wtiStats = calculateSeriesStats(wtiData);
  const btcStats = calculateSeriesStats(btcData);
  const gdpStats = calculateSeriesStats(gdpData);

  const cardBg = isDarkMode ? 'bg-[#0E1528] border-slate-800' : 'bg-white border-slate-200';
  const subCardBg = isDarkMode ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200';

  const renderDelta = (delta?: number) => {
    if (delta === undefined) return null;
    const isPositive = delta >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${
          isPositive ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {Math.abs(delta)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
        isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-amber-400 shrink-0" />
          <span>
            <strong>Illustrative Seed Series Active:</strong> All seeded baseline data points are explicitly flagged as sample benchmarks. Custom datasets imported via CSV or entered manually are distinguished and stored in browser memory.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('table')}
            className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-semibold text-[11px] transition"
          >
            Manage Data in Spreadsheet
          </button>
        </div>
      </div>

      {/* Cross-Asset Quick Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* US 10Y */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">US 10Y Yield</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
            {us10yStats ? `${us10yStats.latestValue}%` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(us10yStats?.change1M)}</span>
            <span>{us10yStats?.latestDate}</span>
          </div>
        </div>

        {/* Gold */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">Gold (USD/oz)</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {goldStats ? `$${goldStats.latestValue.toLocaleString()}` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(goldStats?.change1M)}</span>
            <span>{goldStats?.latestDate}</span>
          </div>
        </div>

        {/* CPI */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">CPI YoY</div>
          <div className="text-lg font-bold font-mono text-red-400 mt-1">
            {cpiStats ? `${cpiStats.latestValue}%` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(cpiStats?.change1M)}</span>
            <span>{cpiStats?.latestDate}</span>
          </div>
        </div>

        {/* Fed Funds */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">Fed Funds EFFR</div>
          <div className="text-lg font-bold font-mono text-indigo-400 mt-1">
            {fedStats ? `${fedStats.latestValue}%` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(fedStats?.change1M)}</span>
            <span>{fedStats?.latestDate}</span>
          </div>
        </div>

        {/* WTI Crude */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">WTI Crude</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {wtiStats ? `$${wtiStats.latestValue.toFixed(2)}` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(wtiStats?.change1M)}</span>
            <span>{wtiStats?.latestDate}</span>
          </div>
        </div>

        {/* Bitcoin */}
        <div className={`p-3 rounded-xl border ${cardBg}`}>
          <div className="text-[10px] uppercase font-mono text-slate-400">Bitcoin / USD</div>
          <div className="text-lg font-bold font-mono text-orange-400 mt-1">
            {btcStats ? `$${btcStats.latestValue.toLocaleString()}` : '—'}
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>MoM: {renderDelta(btcStats?.change1M)}</span>
            <span>{btcStats?.latestDate}</span>
          </div>
        </div>
      </div>

      {/* Grid of 7 Comprehensive Financial Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: US Treasury Yields */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-600/20 text-cyan-400">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  US Treasury Yields (10Y vs 2Y)
                </h3>
                <p className="text-[10px] text-slate-400">Sovereign Curve &amp; Rate Policy Sensitivity · FRED</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('US10Y')}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...us10yData, ...us2yData]}
            chartType="line"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 2: Gold and Precious Metals */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-600/20 text-amber-400">
                <Coins size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Gold &amp; Precious Metals
                </h3>
                <p className="text-[10px] text-slate-400">Spot Benchmarks in USD/oz · World Gold Council &amp; LBMA</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('GOLD')}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...goldData, ...silverData]}
            chartType="line"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 3: Inflation */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400">
                <Flame size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Inflation &amp; Consumer Prices
                </h3>
                <p className="text-[10px] text-slate-400">Headline CPI YoY vs Core PCE Price Index · BLS / BEA</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('CPI_YOY')}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...cpiData, ...pceData]}
            chartType="bar"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 4: Federal Reserve Policy */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
                <Landmark size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Federal Reserve Monetary Policy
                </h3>
                <p className="text-[10px] text-slate-400">EFFR Stance vs Headline Inflation Spread · Federal Reserve</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('FED_FUNDS')}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...fedFundsData, ...cpiData]}
            chartType="line"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 5: Oil & Energy */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Oil &amp; Global Energy Markets
                </h3>
                <p className="text-[10px] text-slate-400">WTI Cushing vs Brent Petroleum Benchmarks ($/bbl) · EIA</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('WTI_CRUDE')}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...wtiData, ...brentData]}
            chartType="line"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 6: Cryptocurrency */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-600/20 text-orange-400">
                <Coins size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Digital Assets &amp; Crypto Markets
                </h3>
                <p className="text-[10px] text-slate-400">Bitcoin (BTC) &amp; Ethereum (ETH) Valuations · Spot Feeds</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('BTC_USD')}
              className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...btcData, ...ethData]}
            chartType="line"
            isDarkMode={isDarkMode}
            height="270px"
          />
        </div>

        {/* SECTION 7: Macroeconomic Indicators */}
        <div className={`p-4 rounded-xl border ${cardBg} space-y-3 lg:col-span-2`}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400">
                <BarChart2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Macroeconomic Fundamentals (Real GDP vs Unemployment Rate)
                </h3>
                <p className="text-[10px] text-slate-400">Output Growth vs Civilian Labor Force Metrics · BEA &amp; BLS</p>
              </div>
            </div>
            <button
              onClick={() => onSelectIndicator('REAL_GDP_GROWTH')}
              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium"
            >
              Analyze <ChevronRight size={13} />
            </button>
          </div>
          <InteractiveMacroChart
            data={[...gdpData, ...unempData]}
            chartType="bar"
            isDarkMode={isDarkMode}
            height="290px"
          />
        </div>
      </div>
    </div>
  );
};
