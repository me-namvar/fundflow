import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  AlertCircle,
  Copy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MacroDataPoint, Frequency, DataProvenance } from '../../types/data';
import { exportDatasetToCSV, isValidISODate, VALID_FREQUENCIES } from '../../services/csvValidator';

interface EditableSpreadsheetProps {
  data: MacroDataPoint[];
  onDataChange: (data: MacroDataPoint[]) => void;
  onOpenImportModal: () => void;
  isDarkMode: boolean;
}

type SortField = 'date' | 'indicator' | 'value' | 'unit' | 'source' | 'frequency' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

export const EditableSpreadsheet: React.FC<EditableSpreadsheetProps> = ({
  data,
  onDataChange,
  onOpenImportModal,
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [indicatorFilter, setIndicatorFilter] = useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [provenanceFilter, setProvenanceFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selected row IDs for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline cell validation errors map: id_field -> error message
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});

  // Distinct indicators for fast dropdown filter
  const allIndicators = useMemo(() => {
    return Array.from(new Set(data.map((d) => d.indicator))).sort();
  }, [data]);

  // Filtering
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (indicatorFilter !== 'ALL' && row.indicator !== indicatorFilter) return false;
      if (frequencyFilter !== 'ALL' && row.frequency !== frequencyFilter) return false;
      if (provenanceFilter !== 'ALL' && row.provenance !== provenanceFilter) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matches =
          row.indicator.toLowerCase().includes(query) ||
          row.source.toLowerCase().includes(query) ||
          row.date.includes(query) ||
          row.unit.toLowerCase().includes(query) ||
          String(row.value).includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [data, indicatorFilter, frequencyFilter, provenanceFilter, searchQuery]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'value') {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Inline Cell Editing
  const handleCellEdit = (id: string, field: keyof MacroDataPoint, rawValue: string) => {
    const errorKey = `${id}_${field}`;
    const nextErrors = { ...cellErrors };
    delete nextErrors[errorKey];

    let processedVal: any = rawValue;

    if (field === 'value') {
      const cleaned = rawValue.replace(/[$,]/g, '').trim();
      const num = Number(cleaned);
      if (rawValue.trim() === '' || isNaN(num) || !isFinite(num)) {
        nextErrors[errorKey] = 'Invalid number';
      }
      processedVal = isNaN(num) ? 0 : num;
    }

    if (field === 'date') {
      if (!isValidISODate(rawValue.trim())) {
        nextErrors[errorKey] = 'Use YYYY-MM-DD';
      }
    }

    if (field === 'indicator') {
      processedVal = rawValue.trim().toUpperCase();
      if (!processedVal) {
        nextErrors[errorKey] = 'Indicator required';
      }
    }

    setCellErrors(nextErrors);

    const updated = data.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [field]: processedVal,
          lastUpdated: new Date().toISOString(),
        };
      }
      return item;
    });

    onDataChange(updated);
  };

  // Add new row
  const handleAddRow = () => {
    const newEntry: MacroDataPoint = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      indicator: indicatorFilter !== 'ALL' ? indicatorFilter : 'US10Y',
      value: 4.25,
      unit: '%',
      source: 'Analyst Manual Input',
      frequency: 'monthly',
      lastUpdated: new Date().toISOString(),
      provenance: 'user_imported',
    };
    onDataChange([newEntry, ...data]);
    setCurrentPage(1);
  };

  // Duplicate a row
  const handleDuplicateRow = (row: MacroDataPoint) => {
    const copy: MacroDataPoint = {
      ...row,
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      lastUpdated: new Date().toISOString(),
      provenance: 'user_imported',
    };
    onDataChange([copy, ...data]);
  };

  // Delete single row
  const handleDeleteRow = (id: string) => {
    onDataChange(data.filter((item) => item.id !== id));
    if (selectedIds.has(id)) {
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
    }
  };

  // Delete selected batch
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected observations?`)) {
      onDataChange(data.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
    }
  };

  // Batch toggle
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedData.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Export currently filtered / selected dataset
  const handleExportFiltered = () => {
    if (filteredData.length === 0) {
      alert('Current filter matches 0 records. Nothing to export.');
      return;
    }
    const filename = indicatorFilter !== 'ALL' ? `macro_${indicatorFilter.toLowerCase()}` : 'macro_filtered_dataset';
    exportDatasetToCSV(filteredData, filename);
  };

  const renderProvenancePill = (prov: DataProvenance) => {
    switch (prov) {
      case 'verified_real':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            VERIFIED REAL
          </span>
        );
      case 'sample_illustrative':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-800">
            SAMPLE DATA
          </span>
        );
      case 'user_imported':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800">
            USER IMPORT
          </span>
        );
    }
  };

  const border = isDarkMode ? 'border-slate-800' : 'border-slate-200';
  const cardBg = isDarkMode ? 'bg-[#0E1528]' : 'bg-white';
  const inputStyle = `w-full bg-transparent px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded text-xs transition ${
    isDarkMode ? 'text-slate-200' : 'text-slate-800'
  }`;

  return (
    <div className={`p-4 rounded-xl border ${border} ${cardBg} shadow-sm space-y-4`}>
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left primary actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus size={14} /> Add Observation
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            <Upload size={14} /> Import CSV
          </button>

          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition"
            title="Download CSV containing only the active filtered observations"
          >
            <Download size={14} /> Export Filtered CSV ({filteredData.length})
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-xs font-medium transition"
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Right Search Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search date, indicator, source..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className={`p-3 rounded-lg border flex flex-wrap items-center gap-3 text-xs ${
        isDarkMode ? 'bg-[#0A0F1F] border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          <Filter size={13} /> Filters:
        </div>

        {/* Indicator Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Indicator:</span>
          <select
            value={indicatorFilter}
            onChange={(e) => {
              setIndicatorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded border text-xs ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
            }`}
          >
            <option value="ALL">All Indicators ({data.length})</option>
            {allIndicators.map((ind) => (
              <option key={ind} value={ind}>
                {ind} ({data.filter((d) => d.indicator === ind).length})
              </option>
            ))}
          </select>
        </div>

        {/* Frequency Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Freq:</span>
          <select
            value={frequencyFilter}
            onChange={(e) => {
              setFrequencyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded border text-xs ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
            }`}
          >
            <option value="ALL">All Frequencies</option>
            {VALID_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Provenance Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">Type:</span>
          <select
            value={provenanceFilter}
            onChange={(e) => {
              setProvenanceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded border text-xs ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
            }`}
          >
            <option value="ALL">All Provenances</option>
            <option value="sample_illustrative">Sample Illustrative Only</option>
            <option value="verified_real">Verified Real Only</option>
            <option value="user_imported">User Imported Only</option>
          </select>
        </div>

        {/* Reset filter button */}
        {(indicatorFilter !== 'ALL' || frequencyFilter !== 'ALL' || provenanceFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setIndicatorFilter('ALL');
              setFrequencyFilter('ALL');
              setProvenanceFilter('ALL');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="text-blue-400 hover:text-blue-300 underline text-[11px]"
          >
            Clear Filters
          </button>
        )}

        <div className="ml-auto text-[11px] text-slate-400 font-mono">
          Showing <strong>{sortedData.length}</strong> of <strong>{data.length}</strong> observations
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="overflow-x-auto max-h-[580px] border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className={`sticky top-0 z-20 font-mono uppercase tracking-wider text-[11px] ${
            isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
          }`}>
            <tr>
              <th className="p-2 border-b border-slate-800 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
              </th>
              
              {/* Date */}
              <th
                onClick={() => handleSort('date')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Date (YYYY-MM-DD)</span>
                  {sortField === 'date' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Indicator */}
              <th
                onClick={() => handleSort('indicator')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Indicator</span>
                  {sortField === 'indicator' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Value */}
              <th
                onClick={() => handleSort('value')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Value</span>
                  {sortField === 'value' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Unit */}
              <th
                onClick={() => handleSort('unit')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Unit</span>
                  {sortField === 'unit' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Source */}
              <th
                onClick={() => handleSort('source')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Source</span>
                  {sortField === 'source' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Frequency */}
              <th
                onClick={() => handleSort('frequency')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Frequency</span>
                  {sortField === 'frequency' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              {/* Provenance */}
              <th className="p-2.5 border-b border-slate-800">Provenance</th>

              {/* Last Updated */}
              <th
                onClick={() => handleSort('lastUpdated')}
                className="p-2.5 border-b border-slate-800 cursor-pointer select-none hover:text-blue-400"
              >
                <div className="flex items-center gap-1">
                  <span>Last Updated</span>
                  {sortField === 'lastUpdated' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>

              <th className="p-2.5 border-b border-slate-800 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                  No records match the active criteria. Add an observation or adjust filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const dateError = cellErrors[`${row.id}_date`];
                const valError = cellErrors[`${row.id}_value`];
                const isSelected = selectedIds.has(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`border-b transition ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-blue-950/40 border-blue-900/60'
                          : 'bg-blue-50/80 border-blue-200'
                        : isDarkMode
                        ? 'border-slate-800/80 hover:bg-slate-800/40'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(row.id)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                    </td>

                    {/* Date */}
                    <td className="p-1 font-mono">
                      <input
                        type="date"
                        className={`${inputStyle} ${dateError ? 'border border-red-500 bg-red-950/20' : ''}`}
                        value={row.date}
                        onChange={(e) => handleCellEdit(row.id, 'date', e.target.value)}
                      />
                      {dateError && (
                        <div className="flex items-center gap-1 text-[9px] text-red-400 px-1 mt-0.5">
                          <AlertCircle size={10} /> {dateError}
                        </div>
                      )}
                    </td>

                    {/* Indicator */}
                    <td className="p-1 font-mono font-semibold">
                      <input
                        type="text"
                        className={inputStyle}
                        value={row.indicator}
                        onChange={(e) => handleCellEdit(row.id, 'indicator', e.target.value)}
                      />
                    </td>

                    {/* Value */}
                    <td className="p-1 font-mono">
                      <input
                        type="number"
                        step="any"
                        className={`${inputStyle} text-right font-bold ${
                          valError ? 'border border-red-500 bg-red-950/20' : ''
                        }`}
                        value={row.value}
                        onChange={(e) => handleCellEdit(row.id, 'value', e.target.value)}
                      />
                      {valError && (
                        <div className="flex items-center gap-1 text-[9px] text-red-400 px-1 mt-0.5 justify-end">
                          <AlertCircle size={10} /> {valError}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="p-1">
                      <input
                        type="text"
                        className={inputStyle}
                        value={row.unit}
                        onChange={(e) => handleCellEdit(row.id, 'unit', e.target.value)}
                      />
                    </td>

                    {/* Source */}
                    <td className="p-1">
                      <input
                        type="text"
                        className={inputStyle}
                        value={row.source}
                        onChange={(e) => handleCellEdit(row.id, 'source', e.target.value)}
                      />
                    </td>

                    {/* Frequency */}
                    <td className="p-1">
                      <select
                        className={inputStyle}
                        value={row.frequency}
                        onChange={(e) => handleCellEdit(row.id, 'frequency', e.target.value as Frequency)}
                      >
                        <option value="daily">daily</option>
                        <option value="weekly">weekly</option>
                        <option value="monthly">monthly</option>
                        <option value="quarterly">quarterly</option>
                        <option value="annual">annual</option>
                      </select>
                    </td>

                    {/* Provenance */}
                    <td className="p-2 whitespace-nowrap">
                      {renderProvenancePill(row.provenance)}
                    </td>

                    {/* Last Updated */}
                    <td className="p-2 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(row.lastUpdated).toLocaleDateString()} {new Date(row.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Actions */}
                    <td className="p-1 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDuplicateRow(row)}
                          className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition"
                          title="Duplicate row"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition"
                          title="Delete row"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Pagination & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={`px-2 py-1 rounded border text-xs ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300'
            }`}
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 3 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded text-xs font-mono transition ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white font-bold'
                    : 'border border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
