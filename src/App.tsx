import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Globe
} from 'lucide-react';
import { MacroDataPoint } from './types/data';
import { 
  loadStoredData, 
  saveStoredData, 
  resetToDefaultData, 
  getStorageStats,
  loadPreferences,
  savePreferences,
  StorageInfo
} from './services/storage';
import { Header } from './components/layout/Header';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ChartStudio } from './components/charts/ChartStudio';
import { EditableSpreadsheet } from './components/data-management/EditableSpreadsheet';
import { AnalyticsLab } from './components/analytics/AnalyticsLab';
import { EconomicDataSources } from './components/sources/EconomicDataSources';
import { CSVImportModal } from './components/modals/CSVImportModal';
import { StorageInfoModal } from './components/modals/StorageInfoModal';

export function App() {
  // Load data and preferences from persistent LocalStorage
  const [data, setData] = useState<MacroDataPoint[]>(() => loadStoredData());
  const [preferences, setPreferences] = useState(() => loadPreferences());
  const isDarkMode = preferences.isDarkMode;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'table' | 'analytics' | 'sources'>('dashboard');

  // Currently inspected indicator (for drill-down from dashboard)
  const [selectedIndicator, setSelectedIndicator] = useState<string>('US10Y');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Transient notification banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Storage diagnostics
  const [storageInfo, setStorageInfo] = useState<StorageInfo>(() => getStorageStats(data));

  // Sync data to localStorage automatically whenever changed
  useEffect(() => {
    const result = saveStoredData(data);
    setStorageInfo(getStorageStats(data));

    if (!result.success && result.error) {
      setNotification({ type: 'error', message: result.error });
    }
  }, [data]);

  // Sync dark mode preference and document theme
  const handleToggleTheme = () => {
    const nextTheme = !isDarkMode;
    setPreferences({ isDarkMode: nextTheme });
    savePreferences({ isDarkMode: nextTheme });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle data updates
  const handleDataChange = (updated: MacroDataPoint[]) => {
    setData(updated);
  };

  // Reset to initial factory illustrative dataset
  const handleResetData = () => {
    const defaultData = resetToDefaultData();
    setData(defaultData);
    setNotification({
      type: 'success',
      message: 'Reset complete: Restored default illustrative macroeconomic dataset.',
    });
  };

  // Handle imported CSV data confirm
  const handleImportConfirm = (points: MacroDataPoint[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setData(points);
      setNotification({
        type: 'success',
        message: `Replaced active dataset with ${points.length} imported observations.`,
      });
    } else {
      setData((prev) => [...points, ...prev]);
      setNotification({
        type: 'success',
        message: `Appended ${points.length} imported observations to active dataset.`,
      });
    }
    setActiveTab('table');
  };

  // Drilldown from Dashboard overview directly into Chart Studio
  const handleSelectIndicator = (ind: string) => {
    setSelectedIndicator(ind);
    setActiveTab('charts');
  };

  const themeClasses = isDarkMode ? 'bg-[#060A17] text-slate-100' : 'bg-slate-50 text-slate-900';
  const footerBg = isDarkMode ? 'border-slate-800/80 bg-[#070C18]' : 'border-slate-200 bg-white';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${themeClasses}`}>
      {/* 1. Header Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        storageInfo={storageInfo}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* 2. Dismissible Notification Toast */}
      {notification && (
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 pt-3">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              notification.type === 'success'
                ? isDarkMode
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : isDarkMode
                ? 'bg-red-950/70 border-red-800 text-red-200'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-red-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white font-mono text-sm px-1.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-[1700px] w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            data={data}
            isDarkMode={isDarkMode}
            onSelectIndicator={handleSelectIndicator}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'charts' && (
          <ChartStudio
            data={data}
            isDarkMode={isDarkMode}
            selectedIndicator={selectedIndicator}
            onIndicatorChange={setSelectedIndicator}
          />
        )}

        {activeTab === 'table' && (
          <EditableSpreadsheet
            data={data}
            onDataChange={handleDataChange}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsLab
            data={data}
            isDarkMode={isDarkMode}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'sources' && (
          <EconomicDataSources
            onImportPoints={(points, mode) => {
              handleImportConfirm(points, mode);
              setNotification({
                type: 'success',
                message: `Successfully ingested ${points.length} verified real observations from World Bank Open Data into the terminal dataset.`,
              });
            }}
            onNavigateToTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      {/* 4. Terminal Status Footer */}
      <footer className={`px-4 sm:px-6 py-2.5 border-t text-[11px] font-mono text-slate-400 flex flex-wrap justify-between items-center gap-3 ${footerBg}`}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Storage: Browser LocalStorage (Synchronized · {storageInfo.recordCount} records)
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:flex items-center gap-1">
            <Globe size={12} className="text-slate-500" />
            Providers Ready: FRED · World Bank · EIA · Crypto Feeds
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Storage Diagnostics &amp; Roadmap
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-amber-400/90 flex items-center gap-1">
            <ShieldCheck size={13} />
            Illustrative sample data explicitly labeled
          </span>
          <span className="text-slate-600">·</span>
          <span>Zero Private Keys Exposed</span>
        </div>
      </footer>

      {/* 5. Modals */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportConfirm={handleImportConfirm}
        isDarkMode={isDarkMode}
      />

      <StorageInfoModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        storageInfo={storageInfo}
        allData={data}
        onResetToDefaults={handleResetData}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
