import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Table, 
  TrendingUp, 
  Activity, 
  Sun, 
  Moon, 
  Database, 
  Upload, 
  RotateCcw,
  Clock,
  Layers,
  LineChart,
  Globe
} from 'lucide-react';
import { StorageInfo } from '../../services/storage';

interface HeaderProps {
  activeTab: 'dashboard' | 'charts' | 'table' | 'analytics' | 'sources';
  onTabChange: (tab: 'dashboard' | 'charts' | 'table' | 'analytics' | 'sources') => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  storageInfo: StorageInfo;
  onOpenStorageModal: () => void;
  onOpenImportModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleTheme,
  storageInfo,
  onOpenStorageModal,
  onOpenImportModal,
  onResetData,
}) => {
  // Live UTC / Market clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const headerBg = isDarkMode ? 'border-slate-800 bg-[#0A0F1F]/95' : 'border-slate-200 bg-white/95';

  return (
    <header className={`px-4 sm:px-6 py-2.5 border-b ${headerBg} backdrop-blur sticky top-0 z-40 transition-colors`}>
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-mono font-extrabold text-xs px-2.5 py-1.5 rounded-lg shadow-sm tracking-wider flex items-center gap-1.5">
            <Activity size={14} />
            <span>MR // TERMINAL</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-slate-100 dark:text-slate-100">
                MacroResearch Terminal
              </h1>
              <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                PROTOTYPE V2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-mono">
              Fixed Income · Commodities · Inflation · Fed Policy · Crypto
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/70 text-xs">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp size={13} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onTabChange('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'charts'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChart size={13} />
            <span>Chart Studio</span>
          </button>

          <button
            onClick={() => onTabChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table size={13} />
            <span>Spreadsheet</span>
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Analytics Lab</span>
          </button>

          <button
            onClick={() => onTabChange('sources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'sources'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={13} />
            <span>Economic Data Sources</span>
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Market Clock */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/40">
            <Clock size={12} className="text-slate-500" />
            <span>{currentTime || 'UTC'}</span>
          </div>

          {/* Quick Import Button */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            title="Import CSV dataset"
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Storage Diagnostics Button */}
          <button
            onClick={onOpenStorageModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono transition"
            title="Inspect LocalStorage and Supabase Roadmap"
          >
            <Database size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">{(storageInfo.usedBytes / 1024).toFixed(0)}KB</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Reset seed button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all observations back to initial illustrative sample dataset?')) {
                onResetData();
              }
            }}
            className="p-1.5 rounded-lg border border-red-900/50 hover:bg-red-950/40 text-red-400 transition"
            title="Reset to factory sample records"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
