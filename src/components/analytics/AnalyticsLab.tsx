import React, { useState, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  Percent, 
  GitCompare, 
  Sliders, 
  ExternalLink, 
  Database, 
  Server, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { MacroDataPoint } from '../../types/data';
import { 
  rebaseSeries, 
  calculateReturns, 
  calculateRollingCorrelation,
  calculateSeriesStats 
} from '../../services/analytics';
import { DATA_PROVIDERS_REGISTRY } from '../../services/dataProviders';
import { INDICATOR_METADATA } from '../../services/sampleData';
import { InteractiveMacroChart } from '../charts/InteractiveMacroChart';
import { EChartWrapper } from '../charts/EChartWrapper';

interface AnalyticsLabProps {
  data: MacroDataPoint[];
  isDarkMode: boolean;
}

export const AnalyticsLab: React.FC<AnalyticsLabProps> = ({ data, isDarkMode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rebase' | 'returns' | 'correlation' | 'providers'>('rebase');

  // Indicators available in active dataset
  const availableIndicators = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.indicator))).sort();
  }, [data]);

  // Rebase / Normalized Comparison state
  const [rebaseSelected, setRebaseSelected] = useState<string[]>(['GOLD', 'WTI_CRUDE', 'BTC_USD']);

  // Returns state
  const [returnSelected, setReturnSelected] = useState<string>('GOLD');

  // Correlation state
  const [corrSeriesA, setCorrSeriesA] = useState<string>('GOLD');
  const [corrSeriesB, setCorrSeriesB] = useState<string>('US10Y');
  const [rollingWindow, setRollingWindow] = useState<number>(6);

  // 1. Rebase transformed data
  const rebaseChartData = useMemo(() => {
    const selectedPoints = data.filter((d) => rebaseSelected.includes(d.indicator));
    const grouped: Record<string, MacroDataPoint[]> = {};
    selectedPoints.forEach((pt) => {
      if (!grouped[pt.indicator]) grouped[pt.indicator] = [];
      grouped[pt.indicator].push(pt);
    });

    return Object.values(grouped).flatMap((series) => rebaseSeries(series, 100));
  }, [data, rebaseSelected]);

  // 2. Returns transformed data
  const returnsChartData = useMemo(() => {
    const seriesPoints = data.filter((d) => d.indicator === returnSelected);
    return calculateReturns(seriesPoints);
  }, [data, returnSelected]);

  // 3. Correlation calculation
  const correlationResults = useMemo(() => {
    const seriesA = data.filter((d) => d.indicator === corrSeriesA);
    const seriesB = data.filter((d) => d.indicator === corrSeriesB);
    return calculateRollingCorrelation(seriesA, seriesB, rollingWindow);
  }, [data, corrSeriesA, corrSeriesB, rollingWindow]);

  // Correlation Stats
  const corrStats = useMemo(() => {
    if (correlationResults.length === 0) return null;
    const vals = correlationResults.map((r) => r.correlation);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      latest: vals[vals.length - 1],
      min: Math.min(...vals),
      max: Math.max(...vals),
      mean: Number(mean.toFixed(4)),
    };
  }, [correlationResults]);

  // Correlation chart option
  const correlationChartOption = useMemo<echarts.EChartsOption>(() => {
    const textColor = isDarkMode ? '#94A3B8' : '#475569';
    const gridColor = isDarkMode ? '#1E293B' : '#E2E8F0';

    const dates = correlationResults.map((r) => r.date);
    const corrs = correlationResults.map((r) => r.correlation);

    return {
      backgroundColor: 'transparent',
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
        borderColor: isDarkMode ? '#334155' : '#CBD5E1',
        textStyle: { color: isDarkMode ? '#F8FAFC' : '#0F172A', fontSize: 11 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const p = params[0];
          return `<div style="font-family:monospace;font-size:11px;">
            <b>Date:</b> ${p.axisValue}<br/>
            <b>${corrSeriesA} ⟷ ${corrSeriesB}:</b> <span style="color:#38BDF8;font-weight:bold;">${p.value}</span>
          </div>`;
        },
      },
      grid: { left: '3%', right: '3%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textColor, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        min: -1,
        max: 1,
        splitLine: { lineStyle: { color: gridColor, type: 'dashed' } },
        axisLabel: { color: textColor, fontSize: 10 },
      },
      series: [
        {
          name: 'Rolling Correlation',
          type: 'line',
          data: corrs,
          smooth: true,
          itemStyle: { color: '#38BDF8' },
          areaStyle: {
            color: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)',
          },
          markLine: {
            symbol: 'none',
            data: [{ yAxis: 0, lineStyle: { color: '#EF4444', type: 'dashed' } }],
          },
        },
      ],
    };
  }, [correlationResults, isDarkMode, corrSeriesA, corrSeriesB]);

  const toggleRebaseIndicator = (ind: string) => {
    if (rebaseSelected.includes(ind)) {
      if (rebaseSelected.length > 1) {
        setRebaseSelected(rebaseSelected.filter((i) => i !== ind));
      }
    } else {
      setRebaseSelected([...rebaseSelected, ind]);
    }
  };

  const cardBg = isDarkMode ? 'bg-[#0E1528] border-slate-800' : 'bg-white border-slate-200';
  const subBg = isDarkMode ? 'bg-[#0A0F1F] border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-5">
      {/* Analytics Sub-nav */}
      <div className={`p-1.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${subBg}`}>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveSubTab('rebase')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'rebase' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} /> Normalized Base 100
          </button>
          <button
            onClick={() => setActiveSubTab('returns')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'returns' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Percent size={13} /> Period-over-Period Delta (%)
          </button>
          <button
            onClick={() => setActiveSubTab('correlation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'correlation' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare size={13} /> Rolling Correlation Engine
          </button>
          <button
            onClick={() => setActiveSubTab('providers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeSubTab === 'providers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server size={13} /> Modular Data Providers
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono pr-2">
          Math Engine: Pearson Correlation · Zero Rebase Indexing
        </div>
      </div>

      {/* TAB 1: REBASE / NORMALIZED 100 */}
      {activeSubTab === 'rebase' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  Cross-Asset Relative Performance (Normalized Base = 100)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rescales diverse asset classes (Gold, Crude, Bitcoin, Yields) to an identical baseline of 100 on their first observation date.
                </p>
              </div>

              {/* Indicator Selector Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 uppercase font-mono mr-1">Series:</span>
                {availableIndicators.map((ind) => {
                  const isSelected = rebaseSelected.includes(ind);
                  return (
                    <button
                      key={ind}
                      onClick={() => toggleRebaseIndicator(ind)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {ind}
                    </button>
                  );
                })}
              </div>
            </div>

            <InteractiveMacroChart
              data={rebaseChartData}
              chartType="line"
              isDarkMode={isDarkMode}
              height="360px"
            />
          </div>
        </div>
      )}

      {/* TAB 2: RETURNS / % DELTA */}
      {activeSubTab === 'returns' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  Period-over-Period Returns (% Change)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Calculates relative percentage delta: <code className="font-mono text-blue-400">((V_t - V_t-1) / |V_t-1|) * 100</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 uppercase font-mono">Select Indicator:</span>
                <select
                  value={returnSelected}
                  onChange={(e) => setReturnSelected(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                  }`}
                >
                  {availableIndicators.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind} ({INDICATOR_METADATA[ind]?.name || ind})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <InteractiveMacroChart
              data={returnsChartData}
              chartType="bar"
              isDarkMode={isDarkMode}
              height="360px"
            />
          </div>
        </div>
      )}

      {/* TAB 3: ROLLING CORRELATION */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  Rolling Pearson Correlation Engine
                </h3>
                <p className="text-[11px] text-slate-400">
                  Computes Pearson correlation coefficient <code className="font-mono text-blue-400">r ∈ [-1.0, +1.0]</code> across a moving time window.
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Series A:</span>
                  <select
                    value={corrSeriesA}
                    onChange={(e) => setCorrSeriesA(e.target.value)}
                    className={`px-2 py-1 rounded border font-mono ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                    }`}
                  >
                    {availableIndicators.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-500">⟷</span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Series B:</span>
                  <select
                    value={corrSeriesB}
                    onChange={(e) => setCorrSeriesB(e.target.value)}
                    className={`px-2 py-1 rounded border font-mono ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                    }`}
                  >
                    {availableIndicators.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">Window:</span>
                  <select
                    value={rollingWindow}
                    onChange={(e) => setRollingWindow(Number(e.target.value))}
                    className={`px-2 py-1 rounded border font-mono ${
                      isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value={3}>3 Periods</option>
                    <option value={6}>6 Periods</option>
                    <option value={12}>12 Periods</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            {corrStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className={`p-2.5 rounded-lg border ${subBg}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Current Correlation</div>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">{corrStats.latest}</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${subBg}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Mean Correlation</div>
                  <div className="text-base font-bold font-mono text-slate-200 mt-0.5">{corrStats.mean}</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${subBg}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Max Correlation</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{corrStats.max}</div>
                </div>
                <div className={`p-2.5 rounded-lg border ${subBg}`}>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Min Correlation</div>
                  <div className="text-base font-bold font-mono text-red-400 mt-0.5">{corrStats.min}</div>
                </div>
              </div>
            )}

            <EChartWrapper option={correlationChartOption} height="320px" />
          </div>
        </div>
      )}

      {/* TAB 4: MODULAR DATA PROVIDERS ARCHITECTURE */}
      {activeSubTab === 'providers' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Server size={16} className="text-blue-400" />
                Modular Data Provider Architecture &amp; Security Boundary
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prepared server-proxy architecture for authoritative macroeconomic feeds. Private API keys (e.g., FRED or EIA) must never be embedded in client-side code bundles; requests route through backend endpoints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DATA_PROVIDERS_REGISTRY.map((provider) => (
                <div key={provider.id} className={`p-4 rounded-xl border ${subBg} space-y-2.5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{provider.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{provider.agency}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      Adapter Ready
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{provider.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coverage:</span>
                      <span className="text-slate-300">{provider.categoryCoverage.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Auth Requirement:</span>
                      <span className={provider.requiresApiKey ? 'text-amber-400' : 'text-emerald-400'}>
                        {provider.requiresApiKey ? 'Server Secret Env Key' : 'Public Open Access'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proxy Target:</span>
                      <code className="text-blue-400">{provider.serverProxyEndpoint}</code>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Developer Documentation <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
