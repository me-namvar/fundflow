import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  LineChart as LineChartIcon, 
  ScatterChart, 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { MacroDataPoint, Frequency, DataProvenance } from '../../types/data';
import { INDICATOR_METADATA } from '../../services/sampleData';
import { rebaseSeries, calculateReturns, calculateSeriesStats } from '../../services/analytics';
import { exportDatasetToCSV } from '../../services/csvValidator';
import { InteractiveMacroChart } from './InteractiveMacroChart';

interface ChartStudioProps {
  data: MacroDataPoint[];
  isDarkMode: boolean;
  selectedIndicator: string;
  onIndicatorChange: (ind: string) => void;
}

export const ChartStudio: React.FC<ChartStudioProps> = ({
  data,
  isDarkMode,
  selectedIndicator,
  onIndicatorChange,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'scatter'>('line');
  const [mathMode, setMathMode] = useState<'raw' | 'rebase' | 'returns'>('raw');
  const [multiSeries, setMultiSeries] = useState<string[]>([selectedIndicator || 'US10Y']);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');

  // Sync multiSeries when prop changes
  React.useEffect(() => {
    if (selectedIndicator && !multiSeries.includes(selectedIndicator)) {
      setMultiSeries([selectedIndicator]);
    }
  }, [selectedIndicator]);

  const allIndicators = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.indicator))).sort();
  }, [data]);

  // Quick range filters
  const handleQuickRange = (months: number) => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const handleResetRange = () => {
    setStartDate('');
    setEndDate('');
  };

  // Toggle multi-series indicator
  const handleToggleIndicator = (ind: string) => {
    if (multiSeries.includes(ind)) {
      if (multiSeries.length > 1) {
        setMultiSeries(multiSeries.filter((i) => i !== ind));
      }
    } else {
      setMultiSeries([...multiSeries, ind]);
    }
    onIndicatorChange(ind);
  };

  // Filtered observations
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!multiSeries.includes(item.indicator)) return false;
      if (frequencyFilter !== 'ALL' && item.frequency !== frequencyFilter) return false;
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      return true;
    });
  }, [data, multiSeries, frequencyFilter, startDate, endDate]);

  // Math processed observations
  const chartData = useMemo(() => {
    if (mathMode === 'rebase') {
      const grouped: Record<string, MacroDataPoint[]> = {};
      filteredData.forEach((d) => {
        if (!grouped[d.indicator]) grouped[d.indicator] = [];
        grouped[d.indicator].push(d);
      });
      return Object.values(grouped).flatMap((series) => rebaseSeries(series, 100));
    }
    if (mathMode === 'returns') {
      const grouped: Record<string, MacroDataPoint[]> = {};
      filteredData.forEach((d) => {
        if (!grouped[d.indicator]) grouped[d.indicator] = [];
        grouped[d.indicator].push(d);
      });
      return Object.values(grouped).flatMap((series) => calculateReturns(series));
    }
    return filteredData;
  }, [filteredData, mathMode]);

  // Summary stats for the first primary series
  const primaryStats = useMemo(() => {
    const primaryPoints = filteredData.filter((d) => d.indicator === multiSeries[0]);
    return calculateSeriesStats(primaryPoints);
  }, [filteredData, multiSeries]);

  const activeMeta = INDICATOR_METADATA[multiSeries[0]];

  // Check provenances in active dataset
  const activeProvenances = useMemo(() => {
    const set = new Set(filteredData.map((d) => d.provenance));
    return Array.from(set);
  }, [filteredData]);

  const cardBg = isDarkMode ? 'bg-[#0E1528] border-slate-800' : 'bg-white border-slate-200';
  const subBg = isDarkMode ? 'bg-[#0A0F1F] border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-4">
      {/* Primary Toolbar */}
      <div className={`p-4 rounded-xl border ${cardBg} space-y-3.5`}>
        {/* Row 1: Series Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Select Series:
            </span>
            {allIndicators.map((ind) => {
              const isSelected = multiSeries.includes(ind);
              return (
                <button
                  key={ind}
                  onClick={() => handleToggleIndicator(ind)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isDarkMode
                      ? 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                      : 'border border-slate-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {ind}
                </button>
              );
            })}
          </div>

          {/* Export button */}
          <button
            onClick={() => exportDatasetToCSV(chartData, `chart_${multiSeries.join('_')}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <Download size={13} /> Export Active Series ({filteredData.length})
          </button>
        </div>

        {/* Row 2: Chart Configuration & Math Filter Strip */}
        <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${subBg}`}>
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono text-[10px] uppercase mr-1">Type:</span>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 px-2.5 rounded text-xs font-medium flex items-center gap-1 transition ${
                chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon size={13} /> Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 px-2.5 rounded text-xs font-medium flex items-center gap-1 transition ${
                chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 size={13} /> Bar
            </button>
            <button
              onClick={() => setChartType('scatter')}
              className={`p-1.5 px-2.5 rounded text-xs font-medium flex items-center gap-1 transition ${
                chartType === 'scatter' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScatterChart size={13} /> Scatter
            </button>
          </div>

          {/* Math Engine Toggle */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono text-[10px] uppercase mr-1">Math:</span>
            <button
              onClick={() => setMathMode('raw')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                mathMode === 'raw'
                  ? 'bg-blue-600/30 border border-blue-500 text-blue-300 font-bold'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              Raw Levels
            </button>
            <button
              onClick={() => setMathMode('rebase')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                mathMode === 'rebase'
                  ? 'bg-blue-600/30 border border-blue-500 text-blue-300 font-bold'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              Base 100
            </button>
            <button
              onClick={() => setMathMode('returns')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                mathMode === 'returns'
                  ? 'bg-blue-600/30 border border-blue-500 text-blue-300 font-bold'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              MoM % Delta
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-2 py-1 rounded border font-mono text-xs ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
              }`}
            />
            <span className="text-slate-500">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-2 py-1 rounded border font-mono text-xs ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
              }`}
            />
            {(startDate || endDate) && (
              <button
                onClick={handleResetRange}
                className="text-[10px] text-blue-400 hover:text-blue-300 underline ml-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Frequency Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Freq:</span>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className={`px-2 py-1 rounded border text-xs ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
              }`}
            >
              <option value="ALL">All</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        {/* Provenance Label Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Data Provenance:</span>
            {activeProvenances.map((prov) => (
              <span
                key={prov}
                className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] uppercase border ${
                  prov === 'verified_real'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    : prov === 'sample_illustrative'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-blue-950/80 text-blue-300 border-blue-800'
                }`}
              >
                {prov === 'sample_illustrative'
                  ? 'Sample Data (Illustrative Only)'
                  : prov === 'verified_real'
                  ? 'Verified Real Data'
                  : 'User Imported Data'}
              </span>
            ))}
          </div>

          <div className="text-slate-400 font-mono text-[10px]">
            Dual-Axis Engine Active · Auto-Scales Differing Units
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <InteractiveMacroChart
          data={chartData}
          chartType={chartType}
          isDarkMode={isDarkMode}
          height="420px"
          title={multiSeries.length === 1 ? `${activeMeta?.name || multiSeries[0]} (${multiSeries[0]})` : undefined}
          subtitle={multiSeries.length === 1 ? `Source: ${activeMeta?.source || 'Imported'} · Frequency: ${activeMeta?.defaultFrequency || 'monthly'}` : undefined}
        />
      </div>

      {/* Quick Series Statistics Card */}
      {primaryStats && (
        <div className={`p-4 rounded-xl border ${cardBg}`}>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Key Descriptive Metrics: {activeMeta?.name || multiSeries[0]}
              </h4>
              <p className="text-[11px] text-slate-400">{activeMeta?.description || 'Statistical distribution for active series selection.'}</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Latest Observation: <strong>{primaryStats.latestDate}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Latest Value</div>
              <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                {primaryStats.latestValue.toLocaleString()} {activeMeta?.unit || ''}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Observations</div>
              <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                {primaryStats.count} pts
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Period Mean</div>
              <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                {primaryStats.mean.toLocaleString()}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Min Value</div>
              <div className="text-base font-bold font-mono text-red-400 mt-0.5">
                {primaryStats.minValue.toLocaleString()}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Max Value</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {primaryStats.maxValue.toLocaleString()}
              </div>
            </div>

            <div className={`p-2.5 rounded-lg border ${subBg}`}>
              <div className="text-[10px] text-slate-400 uppercase font-mono">MoM Change</div>
              <div className={`text-base font-bold font-mono mt-0.5 ${
                (primaryStats.change1M || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {primaryStats.change1M !== undefined ? `${primaryStats.change1M > 0 ? '+' : ''}${primaryStats.change1M}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
