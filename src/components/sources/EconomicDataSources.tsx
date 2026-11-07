import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Database,
  ArrowRight,
  Sliders,
  Check,
  Eye,
  BarChart3
} from 'lucide-react';
import { 
  WORLD_BANK_INDICATORS, 
  WORLD_BANK_COUNTRIES, 
  WorldBankObservation, 
  WorldBankFetchResult, 
  fetchWorldBankObservations, 
  convertWorldBankToMacroDataPoints,
  WorldBankIndicatorDef
} from '../../services/worldBank';
import { MacroDataPoint } from '../../types/data';
import { InteractiveMacroChart } from '../charts/InteractiveMacroChart';

interface EconomicDataSourcesProps {
  onImportPoints: (points: MacroDataPoint[], mode: 'append' | 'replace') => void;
  onNavigateToTab: (tab: 'dashboard' | 'charts' | 'table' | 'analytics') => void;
  isDarkMode: boolean;
}

export const EconomicDataSources: React.FC<EconomicDataSourcesProps> = ({
  onImportPoints,
  onNavigateToTab,
  isDarkMode,
}) => {
  // Query controls
  const [selectedCountry, setSelectedCountry] = useState<string>('USA');
  const [customCountry, setCustomCountry] = useState<string>('');
  const [useCustomCountry, setUseCustomCountry] = useState<boolean>(false);

  const [selectedIndicator, setSelectedIndicator] = useState<string>(WORLD_BANK_INDICATORS[0].id);
  const [customIndicator, setCustomIndicator] = useState<string>('');
  const [useCustomIndicator, setUseCustomIndicator] = useState<boolean>(false);

  const [startYear, setStartYear] = useState<number>(2000);
  const [endYear, setEndYear] = useState<number>(2025);

  // Suggested terminal indicator symbol
  const [indicatorAlias, setIndicatorAlias] = useState<string>('USA_GDP_GROWTH');

  // Fetch status
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchResult, setFetchResult] = useState<WorldBankFetchResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Table selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Show only valid rows toggle
  const [hideMissing, setHideMissing] = useState<boolean>(false);

  // Auto-update indicator alias when country or indicator changes
  const activeCountryCode = useCustomCountry ? customCountry.trim().toUpperCase() : selectedCountry;
  const activeIndicatorCode = useCustomIndicator ? customIndicator.trim() : selectedIndicator;

  useEffect(() => {
    const matchedInd = WORLD_BANK_INDICATORS.find((i) => i.id === activeIndicatorCode);
    const short = matchedInd ? matchedInd.shortCode : activeIndicatorCode.replace(/\./g, '_').slice(0, 14);
    if (activeCountryCode) {
      setIndicatorAlias(`${activeCountryCode}_${short}`);
    }
  }, [activeCountryCode, activeIndicatorCode]);

  // Execute World Bank API Request
  const handleFetchData = async () => {
    if (!activeCountryCode) {
      setFetchError('Please select or specify a valid country ISO code (e.g. USA, GBR, DEU).');
      return;
    }
    if (!activeIndicatorCode) {
      setFetchError('Please select or specify a valid World Bank indicator code.');
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchWorldBankObservations(
        activeCountryCode,
        activeIndicatorCode,
        startYear,
        endYear
      );
      setFetchResult(result);
      // Select all non-missing rows by default
      const validIds = new Set(result.observations.filter((o) => !o.isMissing).map((o) => o.id));
      setSelectedRowIds(validIds);
    } catch (err: any) {
      setFetchError(err.message || 'An error occurred while fetching from World Bank API.');
      setFetchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount for initial demonstration (USA GDP Growth)
  useEffect(() => {
    handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered rows for the results table
  const displayedObservations = useMemo(() => {
    if (!fetchResult) return [];
    if (hideMissing) {
      return fetchResult.observations.filter((o) => !o.isMissing);
    }
    return fetchResult.observations;
  }, [fetchResult, hideMissing]);

  // Convert fetched observations to preview chart MacroDataPoints
  const previewChartData = useMemo(() => {
    if (!fetchResult) return [];
    return convertWorldBankToMacroDataPoints(fetchResult.observations, indicatorAlias);
  }, [fetchResult, indicatorAlias]);

  // Import handlers
  const handleImportAllValid = () => {
    if (!fetchResult) return;
    const macroPoints = convertWorldBankToMacroDataPoints(fetchResult.observations, indicatorAlias);
    if (macroPoints.length === 0) {
      alert('No valid observations to import (all points in range are missing).');
      return;
    }
    onImportPoints(macroPoints, 'append');
  };

  const handleImportSelected = () => {
    if (!fetchResult) return;
    const selectedObs = fetchResult.observations.filter(
      (o) => selectedRowIds.has(o.id) && !o.isMissing && o.value !== null
    );
    if (selectedObs.length === 0) {
      alert('Please select at least one valid observation to import.');
      return;
    }
    const macroPoints = convertWorldBankToMacroDataPoints(selectedObs, indicatorAlias);
    onImportPoints(macroPoints, 'append');
  };

  // Row selection toggle
  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const handleSelectAllRows = (checked: boolean) => {
    if (checked && fetchResult) {
      const validIds = new Set(fetchResult.observations.filter((o) => !o.isMissing).map((o) => o.id));
      setSelectedRowIds(validIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const activeMeta = WORLD_BANK_INDICATORS.find((i) => i.id === activeIndicatorCode);
  const matchedCountryObj = WORLD_BANK_COUNTRIES.find((c) => c.code === activeCountryCode);

  const cardBg = isDarkMode ? 'bg-[#0E1528] border-slate-800' : 'bg-white border-slate-200';
  const subBg = isDarkMode ? 'bg-[#0A0F1F] border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      {/* 1. Header Information Banner */}
      <div className={`p-4 rounded-xl border ${cardBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Globe size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                  Economic Data Sources · World Bank Open Data
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  OFFICIAL REST API · NO KEY REQUIRED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Query official macroeconomic time series directly from The World Bank Group. Validated observations can be ingested directly into your active analytics dataset.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-mono text-slate-300 transition"
            >
              <span>API Docs</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Query Configuration Console */}
      <div className={`p-5 rounded-xl border ${cardBg} space-y-4`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Query Parameters &amp; Series Selection
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Endpoint: <code className="text-blue-400">api.worldbank.org/v2/country/...</code>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Country Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-400">
              1. Country / Sovereign:
            </label>
            {!useCustomCountry ? (
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              >
                {WORLD_BANK_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code}) - {c.region}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="ISO-3 code (e.g. USA, GBR, JPN)"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value.toUpperCase())}
                maxLength={3}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs uppercase ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              />
            )}
            <div className="flex justify-between items-center text-[10px]">
              <button
                type="button"
                onClick={() => setUseCustomCountry(!useCustomCountry)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {useCustomCountry ? '← Select from Curated List' : 'Enter Custom ISO-3 Code'}
              </button>
            </div>
          </div>

          {/* Indicator Selection */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="block text-[11px] font-mono uppercase text-slate-400">
              2. Economic Indicator:
            </label>
            {!useCustomIndicator ? (
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-medium ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              >
                {WORLD_BANK_INDICATORS.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.name} [{ind.id}]
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="World Bank indicator code (e.g. NY.GDP.MKTP.KD.ZG)"
                value={customIndicator}
                onChange={(e) => setCustomIndicator(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border font-mono text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              />
            )}
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-400">
                {activeMeta?.description || 'Select an indicator or specify a custom code'}
              </span>
              <button
                type="button"
                onClick={() => setUseCustomIndicator(!useCustomIndicator)}
                className="text-blue-400 hover:text-blue-300 underline shrink-0 ml-2"
              >
                {useCustomIndicator ? '← Back to Core 3' : 'Custom Indicator'}
              </button>
            </div>
          </div>

          {/* Year Range */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-400">
              3. Observation Year Range:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1960}
                max={2030}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
                className={`w-1/2 px-2.5 py-2 rounded-lg border font-mono text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              />
              <span className="text-slate-500 font-mono">→</span>
              <input
                type="number"
                min={1960}
                max={2030}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
                className={`w-1/2 px-2.5 py-2 rounded-lg border font-mono text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
                }`}
              />
            </div>
            <div className="text-[10px] text-slate-400">Annual observations</div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Terminal Symbol Alias:</span>
            <input
              type="text"
              value={indicatorAlias}
              onChange={(e) => setIndicatorAlias(e.target.value.toUpperCase())}
              className={`px-2.5 py-1 rounded border font-mono font-bold text-xs ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-white border-slate-300 text-blue-600'
              }`}
            />
            <span className="text-[10px] text-slate-400">
              (Indicator code used when importing into the chart studio and spreadsheet)
            </span>
          </div>

          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Querying World Bank API...' : 'Fetch Official Observations'}</span>
          </button>
        </div>
      </div>

      {/* 3. Error Banner */}
      {fetchError && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isDarkMode ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-bold">World Bank API Error Encountered:</div>
            <p className="font-mono text-[11px] leading-relaxed">{fetchError}</p>
            <p className="text-[11px] text-slate-400">
              Note: Requirement 9 enforced — failed API responses are reported directly without substituting fabricated sample data.
            </p>
          </div>
        </div>
      )}

      {/* 4. Results & Interactive Preview */}
      {fetchResult && (
        <div className="space-y-5">
          {/* Diagnostic Metadata Strip */}
          <div className={`p-4 rounded-xl border ${subBg} flex flex-wrap items-center justify-between gap-4 text-xs font-mono`}>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-slate-500 text-[10px] block">COUNTRY:</span>
                <span className="font-bold text-slate-200">
                  {matchedCountryObj?.name || activeCountryCode} ({activeCountryCode})
                </span>
              </div>
              <div className="border-l border-slate-700/60 pl-4">
                <span className="text-slate-500 text-[10px] block">INDICATOR:</span>
                <span className="font-bold text-blue-400">
                  {activeMeta?.name || activeIndicatorCode} [{activeIndicatorCode}]
                </span>
              </div>
              <div className="border-l border-slate-700/60 pl-4">
                <span className="text-slate-500 text-[10px] block">RETRIEVAL TIMESTAMP:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(fetchResult.retrievalTimestamp).toUTCString()}
                </span>
              </div>
              <div className="border-l border-slate-700/60 pl-4">
                <span className="text-slate-500 text-[10px] block">OBSERVATION COUNT:</span>
                <span className="font-bold text-slate-200">
                  {fetchResult.validCount} valid · {fetchResult.missingCount} missing
                </span>
              </div>
            </div>

            {/* Ingestion CTAs */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportSelected}
                disabled={selectedRowIds.size === 0}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-blue-500 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-semibold text-xs transition disabled:opacity-40"
              >
                <Download size={13} /> Import Selected ({selectedRowIds.size})
              </button>

              <button
                onClick={handleImportAllValid}
                disabled={fetchResult.validCount === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
              >
                <CheckCircle size={14} /> Import All Valid ({fetchResult.validCount})
              </button>
            </div>
          </div>

          {/* Real-time Interactive Chart Preview */}
          {previewChartData.length > 0 && (
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live API Response Preview Chart: {indicatorAlias}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={13} /> Verified Official World Bank Series
                </span>
              </div>

              <InteractiveMacroChart
                data={previewChartData}
                chartType="line"
                isDarkMode={isDarkMode}
                height="320px"
                title={`${matchedCountryObj?.name || activeCountryCode} - ${activeMeta?.name || activeIndicatorCode}`}
                subtitle={`Source: World Bank Open Data · Retrieved: ${new Date(fetchResult.retrievalTimestamp).toLocaleString()}`}
              />
            </div>
          )}

          {/* Observations Table */}
          <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Retrieved Observation Vector
                </h4>
                <p className="text-[11px] text-slate-400">
                  Observation Date represents the historical measurement period. Retrieval Timestamp logs when the HTTP fetch was made.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={hideMissing}
                    onChange={(e) => setHideMissing(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600"
                  />
                  <span>Hide Missing Years ({fetchResult.missingCount})</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[460px] border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className={`sticky top-0 z-10 font-mono uppercase tracking-wider text-[11px] ${
                  isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <tr>
                    <th className="p-2 border-b border-slate-800 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          displayedObservations.filter((o) => !o.isMissing).length > 0 &&
                          selectedRowIds.size === displayedObservations.filter((o) => !o.isMissing).length
                        }
                        onChange={(e) => handleSelectAllRows(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-2.5 border-b border-slate-800">Observation Year</th>
                    <th className="p-2.5 border-b border-slate-800">Observation Date</th>
                    <th className="p-2.5 border-b border-slate-800 text-right">Reported Value</th>
                    <th className="p-2.5 border-b border-slate-800">Unit</th>
                    <th className="p-2.5 border-b border-slate-800">Country</th>
                    <th className="p-2.5 border-b border-slate-800">Indicator</th>
                    <th className="p-2.5 border-b border-slate-800">Data Source</th>
                    <th className="p-2.5 border-b border-slate-800">API Retrieval Timestamp</th>
                    <th className="p-2.5 border-b border-slate-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedObservations.map((obs) => {
                    const isSelected = selectedRowIds.has(obs.id);
                    return (
                      <tr
                        key={obs.id}
                        className={`border-b transition font-mono ${
                          obs.isMissing
                            ? isDarkMode
                              ? 'bg-slate-950/40 text-slate-600 border-slate-900'
                              : 'bg-slate-100/50 text-slate-400 border-slate-200'
                            : isSelected
                            ? isDarkMode
                              ? 'bg-blue-950/30 border-blue-900/60 text-slate-100'
                              : 'bg-blue-50/80 border-blue-200 text-slate-900'
                            : isDarkMode
                            ? 'border-slate-800/80 hover:bg-slate-800/30 text-slate-200'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            disabled={obs.isMissing}
                            checked={isSelected}
                            onChange={() => handleToggleRow(obs.id)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-0 disabled:opacity-30"
                          />
                        </td>

                        {/* Year */}
                        <td className="p-2.5 font-bold text-slate-200">{obs.year}</td>

                        {/* Observation Date */}
                        <td className="p-2.5 text-slate-400">{obs.observationDate}</td>

                        {/* Value */}
                        <td className="p-2.5 text-right font-bold">
                          {obs.isMissing ? (
                            <span className="text-slate-500 italic font-normal text-[11px]">
                              Missing / Not Reported
                            </span>
                          ) : (
                            <span className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'}>
                              {obs.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                          )}
                        </td>

                        {/* Unit */}
                        <td className="p-2.5 text-slate-400">{obs.unit}</td>

                        {/* Country */}
                        <td className="p-2.5 text-slate-300 font-sans">
                          {obs.countryName} [{obs.countryCode}]
                        </td>

                        {/* Indicator */}
                        <td className="p-2.5 text-slate-400 font-sans truncate max-w-[200px]" title={obs.indicatorName}>
                          {obs.indicatorName}
                        </td>

                        {/* Source */}
                        <td className="p-2.5 text-slate-400 font-sans">{obs.source}</td>

                        {/* Retrieval Timestamp */}
                        <td className="p-2.5 text-slate-400 text-[10px]">
                          {new Date(obs.retrievedAt).toLocaleDateString()} {new Date(obs.retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>

                        {/* Status */}
                        <td className="p-2.5">
                          {obs.isMissing ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                              NULL
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                              VERIFIED REAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 font-mono">
              <span>
                Observations listed: <strong>{displayedObservations.length}</strong> ({fetchResult.validCount} valid for ingestion)
              </span>
              <span>
                API Source: Official World Bank API v2 · License: Creative Commons Attribution 4.0 (CC BY 4.0)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
