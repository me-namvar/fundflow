import { MacroDataPoint, CorrelationResult, SeriesStats } from '../types/data';

/**
 * Rebase a time series to a baseline of 100 on the first date or specified date
 */
export function rebaseSeries(data: MacroDataPoint[], baseValue = 100): MacroDataPoint[] {
  if (data.length === 0) return [];
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : 1));
  const initialValue = sorted[0].value;
  if (initialValue === 0) return sorted;

  return sorted.map((pt) => ({
    ...pt,
    value: Number(((pt.value / Math.abs(initialValue)) * baseValue).toFixed(2)),
    unit: `Index (${sorted[0].date}=100)`,
  }));
}

/**
 * Calculate period-over-period percentage return / delta
 */
export function calculateReturns(data: MacroDataPoint[]): MacroDataPoint[] {
  if (data.length === 0) return [];
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : 1));

  return sorted.map((pt, i) => {
    if (i === 0) {
      return { ...pt, value: 0, unit: '% Delta' };
    }
    const prev = sorted[i - 1].value;
    const delta = prev !== 0 ? ((pt.value - prev) / Math.abs(prev)) * 100 : 0;
    return {
      ...pt,
      value: Number(delta.toFixed(2)),
      unit: '% Delta',
    };
  });
}

/**
 * Calculate rolling Pearson correlation coefficient between two series
 */
export function calculateRollingCorrelation(
  seriesA: MacroDataPoint[],
  seriesB: MacroDataPoint[],
  windowSize = 6
): CorrelationResult[] {
  if (seriesA.length === 0 || seriesB.length === 0) return [];

  // Align dates
  const mapB = new Map(seriesB.map((d) => [d.date, d.value]));
  const aligned: { date: string; a: number; b: number }[] = [];

  seriesA.forEach((ptA) => {
    if (mapB.has(ptA.date)) {
      aligned.push({ date: ptA.date, a: ptA.value, b: mapB.get(ptA.date)! });
    }
  });

  aligned.sort((x, y) => (x.date < y.date ? -1 : 1));

  if (aligned.length < windowSize) {
    // If fewer points than windowSize, calculate overall sample correlation if >= 2 points
    if (aligned.length >= 2) {
      const overall = computePearson(aligned.map((item) => item.a), aligned.map((item) => item.b));
      return aligned.map((item) => ({
        date: item.date,
        correlation: overall,
        seriesAValue: item.a,
        seriesBValue: item.b,
      }));
    }
    return [];
  }

  const results: CorrelationResult[] = [];

  for (let i = windowSize; i <= aligned.length; i++) {
    const windowSlice = aligned.slice(i - windowSize, i);
    const xs = windowSlice.map((d) => d.a);
    const ys = windowSlice.map((d) => d.b);
    const corr = computePearson(xs, ys);

    results.push({
      date: aligned[i - 1].date,
      correlation: corr,
      seriesAValue: aligned[i - 1].a,
      seriesBValue: aligned[i - 1].b,
    });
  }

  return results;
}

function computePearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Number((num / den).toFixed(4));
}

/**
 * Compute key descriptive financial stats for a series
 */
export function calculateSeriesStats(data: MacroDataPoint[]): SeriesStats | null {
  if (data.length === 0) return null;
  const sorted = [...data].sort((a, b) => (a.date < b.date ? -1 : 1));
  const values = sorted.map((d) => d.value);

  const count = values.length;
  const latestPoint = sorted[sorted.length - 1];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = Number((sum / count).toFixed(2));

  let change1M: number | undefined;
  if (count >= 2) {
    const prev = sorted[sorted.length - 2].value;
    change1M = prev !== 0 ? Number((((latestPoint.value - prev) / Math.abs(prev)) * 100).toFixed(2)) : 0;
  }

  let change1Y: number | undefined;
  if (count >= 12) {
    const prev12 = sorted[sorted.length - 12].value;
    change1Y = prev12 !== 0 ? Number((((latestPoint.value - prev12) / Math.abs(prev12)) * 100).toFixed(2)) : 0;
  }

  return {
    count,
    latestValue: latestPoint.value,
    latestDate: latestPoint.date,
    minValue,
    maxValue,
    mean,
    change1M,
    change1Y,
  };
}
