import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle, FileText, Download, X } from 'lucide-react';
import { parseAndValidateCSV, downloadSampleCSVTemplate, ParseResult } from '../../services/csvValidator';
import { MacroDataPoint } from '../../types/data';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirm: (points: MacroDataPoint[], mode: 'append' | 'replace') => void;
  isDarkMode: boolean;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportConfirm,
  isDarkMode,
}) => {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseAndValidateCSV(content);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (!parseResult || parseResult.validPoints.length === 0) return;
    onImportConfirm(parseResult.validPoints, importMode);
    onClose();
  };

  const modalBg = isDarkMode ? 'bg-[#0E1528] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden ${modalBg}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-[#0A0F1F]' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">CSV Dataset Import Engine</h3>
              <p className="text-[11px] text-slate-400">Validates schema, date formats, and numeric types</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template helper callout */}
          <div className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDarkMode ? 'bg-blue-950/30 border-blue-800/60 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400 shrink-0" />
              <span>
                Required columns: <code className="font-mono font-semibold">date, indicator, value, unit, source, frequency</code>
              </span>
            </div>
            <button
              onClick={downloadSampleCSVTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition"
            >
              <Download size={13} /> Download Template CSV
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-600/10'
                : isDarkMode
                ? 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileInputChange}
            />
            <Upload size={32} className="mx-auto mb-2 text-slate-400" />
            <p className="text-xs font-semibold">
              {fileName ? `Loaded: ${fileName}` : 'Click to select CSV file, or drag and drop here'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Accepts standard comma-separated text files (.csv)</p>
          </div>

          {/* Parse validation summary */}
          {parseResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Validation Breakdown:</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {parseResult.totalRowsProcessed} rows examined
                </span>
              </div>

              {/* Success metrics */}
              <div className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                parseResult.validPoints.length > 0
                  ? isDarkMode
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-800/40 border-slate-700 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <span>Valid observations ready for ingestion:</span>
                </div>
                <span className="font-mono font-bold text-sm">{parseResult.validPoints.length}</span>
              </div>

              {/* Error list */}
              {parseResult.errors.length > 0 && (
                <div className={`p-3 rounded-lg border ${
                  isDarkMode ? 'bg-red-950/40 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-red-400">
                    <AlertTriangle size={15} />
                    <span>Encountered {parseResult.errors.length} validation errors:</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                    {parseResult.errors.map((err, i) => (
                      <div key={i} className="bg-red-950/60 p-1.5 rounded border border-red-900/60">
                        <span className="text-red-400 font-bold">
                          {err.row > 0 ? `Row ${err.row}` : 'Header'} [{err.column}]:
                        </span>{' '}
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion Mode Choice */}
              {parseResult.validPoints.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                    Import Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        importMode === 'append'
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-semibold'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium">Append to Dataset</div>
                      <div className="text-[10px] text-slate-400">Merge with existing observations</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        importMode === 'replace'
                          ? 'border-amber-500 bg-amber-600/20 text-amber-300 font-semibold'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-medium text-amber-400">Replace Dataset</div>
                      <div className="text-[10px] text-slate-400">Overwrite current records entirely</div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${isDarkMode ? 'border-slate-800 bg-[#0A0F1F]' : 'border-slate-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parseResult || parseResult.validPoints.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs shadow-md transition"
          >
            <CheckCircle size={15} /> Confirm &amp; Import ({parseResult?.validPoints.length || 0})
          </button>
        </div>
      </div>
    </div>
  );
};
