import React from 'react';
import { Database, ShieldAlert, Cpu, Check, Download, RotateCcw, X, HardDrive } from 'lucide-react';
import { StorageInfo } from '../../services/storage';
import { MacroDataPoint } from '../../types/data';

interface StorageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageInfo: StorageInfo;
  allData: MacroDataPoint[];
  onResetToDefaults: () => void;
  isDarkMode: boolean;
}

export const StorageInfoModal: React.FC<StorageInfoModalProps> = ({
  isOpen,
  onClose,
  storageInfo,
  allData,
  onResetToDefaults,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `macro_terminal_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const modalBg = isDarkMode ? 'bg-[#0E1528] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const cardBg = isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden ${modalBg}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-[#0A0F1F]' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">Storage Engine &amp; Persistence Architecture</h3>
              <p className="text-[11px] text-slate-400">Client Sandbox Diagnostic &amp; Future Backend Blueprint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Storage Meter */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-emerald-400" />
                <span className="font-semibold text-slate-200">Browser LocalStorage Allocation</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">
                {(storageInfo.usedBytes / 1024).toFixed(1)} KB / 5,120 KB ({storageInfo.percentageUsed}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(storageInfo.percentageUsed, 1)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
              <span>Records tracked: <strong>{storageInfo.recordCount}</strong></span>
              <span>Origin state: {storageInfo.isCustomized ? 'Customized (Active User Data)' : 'Factory Seed'}</span>
            </div>
          </div>

          {/* Current Architecture & Limitations */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-amber-400" />
              Prototype Architecture &amp; Inherent Limitations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="font-semibold mb-1">1. ~5MB Hard Browser Limit</div>
                <p className="text-[11px] text-slate-400">
                  Standard Web Storage is restricted to 5MB per domain. Fine for monthly/quarterly macro series (up to ~30,000 observations), but unsuitable for tick-level data.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="font-semibold mb-1">2. Device &amp; Browser Isolation</div>
                <p className="text-[11px] text-slate-400">
                  Observations added here stay exclusively inside this browser profile. They are not visible across other machines or browsers.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="font-semibold mb-1">3. Cache Purge Vulnerability</div>
                <p className="text-[11px] text-slate-400">
                  Clearing browser cache or running inside private/incognito windows will wipe custom datasets. Always export regular CSV/JSON backups.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="font-semibold mb-1">4. No Concurrent Multi-User Locks</div>
                <p className="text-[11px] text-slate-400">
                  Does not offer multi-analyst transactional locks or real-time distributed collaboration.
                </p>
              </div>
            </div>
          </div>

          {/* Migration Path to Supabase / PostgreSQL */}
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Cpu size={14} className="text-blue-400" />
              Prepared Migration Path to Supabase / PostgreSQL
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              The data model in this application is already fully normalized to transition to PostgreSQL without schema modifications:
            </p>
            <div className="bg-slate-950 p-2.5 rounded font-mono text-[10px] text-slate-300 overflow-x-auto border border-slate-800">
              CREATE TABLE macro_series (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                date DATE NOT NULL,
                indicator VARCHAR(32) NOT NULL,
                value NUMERIC(18, 4) NOT NULL,
                unit VARCHAR(32) NOT NULL,
                source VARCHAR(64) NOT NULL,
                frequency VARCHAR(16) NOT NULL,
                provenance VARCHAR(32) NOT NULL,
                last_updated TIMESTAMPTZ DEFAULT NOW()
              );
              CREATE INDEX idx_macro_series_ind_date ON macro_series(indicator, date);
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Check size={13} /> Row-Level Security (RLS) Ready
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Check size={13} /> Supabase Edge Functions Compatible
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Check size={13} /> Multi-Gigabyte Scale
              </span>
            </div>
          </div>

          {/* Backup & Maintenance Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 font-medium transition"
              >
                <Download size={13} /> Download JSON Backup
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Reset all observations back to initial illustrative sample dataset?')) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/60 hover:bg-red-950/40 text-red-300 font-medium transition"
            >
              <RotateCcw size={13} /> Factory Reset LocalStorage
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${isDarkMode ? 'border-slate-800 bg-[#0A0F1F]' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
