import { MacroDataPoint } from '../types/data';
import { INITIAL_DATA } from './sampleData';

const STORAGE_KEY = 'macroresearch_terminal_data_v1';
const PREFS_KEY = 'macroresearch_terminal_prefs_v1';

export interface StorageInfo {
  usedBytes: number;
  totalQuotaBytes: number;
  percentageUsed: number;
  recordCount: number;
  isCustomized: boolean;
}

export function loadStoredData(): MacroDataPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_DATA;
  } catch (err) {
    console.warn('LocalStorage read failed, using default illustrative dataset:', err);
    return INITIAL_DATA;
  }
}

export function saveStoredData(data: MacroDataPoint[]): { success: boolean; error?: string } {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: any) {
    console.error('LocalStorage write failed:', err);
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      return {
        success: false,
        error: 'Browser LocalStorage quota exceeded (~5MB). Please export your dataset to CSV or delete older observations.',
      };
    }
    return {
      success: false,
      error: err.message || 'Unable to persist changes to LocalStorage.',
    };
  }
}

export function resetToDefaultData(): MacroDataPoint[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  } catch (err) {
    console.error('Failed to reset localStorage:', err);
  }
  return INITIAL_DATA;
}

export function getStorageStats(data: MacroDataPoint[]): StorageInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const bytes = new Blob([raw]).size;
    const quota = 5 * 1024 * 1024; // 5 MB typical browser quota
    return {
      usedBytes: bytes,
      totalQuotaBytes: quota,
      percentageUsed: Number(((bytes / quota) * 100).toFixed(2)),
      recordCount: data.length,
      isCustomized: raw !== JSON.stringify(INITIAL_DATA),
    };
  } catch {
    return {
      usedBytes: 0,
      totalQuotaBytes: 5 * 1024 * 1024,
      percentageUsed: 0,
      recordCount: data.length,
      isCustomized: false,
    };
  }
}

export function loadPreferences(): { isDarkMode: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { isDarkMode: true };
}

export function savePreferences(prefs: { isDarkMode: boolean }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}
