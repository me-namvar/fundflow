import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import { EChartWrapper } from './EChartWrapper';
import { MacroDataPoint } from '../../types/data';
import { INDICATOR_METADATA } from '../../services/sampleData';

interface InteractiveMacroChartProps {
  data: MacroDataPoint[];
  chartType: 'line' | 'bar' | 'scatter';
  isDarkMode: boolean;
  title?: string;
  subtitle?: string;
  height?: string | number;
  showToolbox?: boolean;
}

export const InteractiveMacroChart: React.FC<InteractiveMacroChartProps> = ({
  data,
  chartType,
  isDarkMode,
  title,
  subtitle,
  height = '380px',
  showToolbox = true,
}) => {
  const chartOption = useMemo<echarts.EChartsOption>(() => {
    const textColor = isDarkMode ? '#94A3B8' : '#475569';
    const titleColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const gridColor = isDarkMode ? '#1E293B' : '#E2E8F0';

    if (!data || data.length === 0) {
      return {
        backgroundColor: 'transparent',
        title: {
          text: 'No Observations Available',
          subtext: 'Try selecting a different indicator, adjusting the date filter, or importing data.',
          left: 'center',
          top: 'center',
          textStyle: { color: textColor, fontSize: 13, fontWeight: 500 },
          subtextStyle: { color: isDarkMode ? '#64748B' : '#94A3B8', fontSize: 11 },
        },
      };
    }

    // 1. Unique dates sorted chronologically
    const allDates = Array.from(new Set(data.map((d) => d.date))).sort((a, b) => (a < b ? -1 : 1));

    // 2. Group data by indicator
    const indicatorList = Array.from(new Set(data.map((d) => d.indicator)));
    const indicatorMap: Record<string, Record<string, { value: number; provenance: string; unit: string; source: string }>> = {};
    const unitMap: Record<string, string> = {};

    data.forEach((pt) => {
      if (!indicatorMap[pt.indicator]) {
        indicatorMap[pt.indicator] = {};
        unitMap[pt.indicator] = pt.unit;
      }
      indicatorMap[pt.indicator][pt.date] = {
        value: pt.value,
        provenance: pt.provenance,
        unit: pt.unit,
        source: pt.source,
      };
    });

    // 3. Dual Y-Axis handling:
    // If multiple units exist (e.g. '%' vs 'USD/oz'), allocate first unit to Axis 0, second to Axis 1
    const distinctUnits = Array.from(new Set(Object.values(unitMap)));
    const hasDualAxis = distinctUnits.length > 1;

    // Palette designed for readability and contrast
    const colorPalette = [
      '#38BDF8', // Cyan / Light Blue
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#EC4899', // Pink
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Teal
      '#EF4444', // Red
    ];

    const series: echarts.SeriesOption[] = indicatorList.map((ind, idx) => {
      const meta = INDICATOR_METADATA[ind];
      const seriesUnit = unitMap[ind] || '';
      const unitIndex = distinctUnits.indexOf(seriesUnit);
      const yAxisIndex = hasDualAxis && unitIndex > 0 ? 1 : 0;
      const color = colorPalette[idx % colorPalette.length];

      const points = allDates.map((date) => {
        const item = indicatorMap[ind]?.[date];
        return item !== undefined ? item.value : null;
      });

      return {
        name: meta?.name || ind,
        type: chartType,
        yAxisIndex,
        data: points,
        itemStyle: { color },
        smooth: chartType === 'line',
        showSymbol: chartType === 'scatter' || allDates.length <= 15,
        symbolSize: chartType === 'scatter' ? 8 : 4,
        barMaxWidth: 28,
        emphasis: {
          focus: 'series',
        },
      };
    });

    const yAxes: echarts.YAXisComponentOption[] = [
      {
        type: 'value',
        name: distinctUnits[0] ? `(${distinctUnits[0]})` : '',
        nameTextStyle: { color: textColor, fontSize: 10, align: 'left', padding: [0, 0, 4, 0] },
        position: 'left',
        splitLine: {
          show: true,
          lineStyle: { color: gridColor, type: 'dashed' },
        },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: (v: number) => {
            if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
            return `${v}`;
          },
        },
        scale: true,
      },
    ];

    if (hasDualAxis) {
      yAxes.push({
        type: 'value',
        name: distinctUnits[1] ? `(${distinctUnits[1]})` : '',
        nameTextStyle: { color: textColor, fontSize: 10, align: 'right', padding: [0, 0, 4, 0] },
        position: 'right',
        splitLine: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 10,
          formatter: (v: number) => {
            if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
            return `${v}`;
          },
        },
        scale: true,
      });
    }

    return {
      backgroundColor: 'transparent',
      animation: false, // Instant response for financial terminals
      title: title
        ? {
            text: title,
            subtext: subtitle,
            textStyle: { color: titleColor, fontSize: 13, fontWeight: 700 },
            subtextStyle: { color: textColor, fontSize: 10 },
            left: 0,
            top: 0,
          }
        : undefined,
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
        borderColor: isDarkMode ? '#334155' : '#CBD5E1',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: isDarkMode ? '#F8FAFC' : '#0F172A', fontSize: 11 },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: textColor, type: 'dashed' },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const date = params[0].axisValue;
          let html = `<div style="font-weight:700;margin-bottom:6px;border-bottom:1px solid ${
            isDarkMode ? '#334155' : '#E2E8F0'
          };padding-bottom:4px;font-family:monospace;font-size:11px;">📅 ${date}</div>`;

          params.forEach((p) => {
            if (p.value !== null && p.value !== undefined) {
              const indName = p.seriesName;
              const formattedVal = Number(p.value).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              });

              html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:3px;">
                <span style="display:flex;align-items:center;gap:6px;">
                  ${p.marker}
                  <span style="font-weight:500;">${indName}</span>
                </span>
                <span style="font-family:monospace;font-weight:700;color:${
                  isDarkMode ? '#38BDF8' : '#0284C7'
                };">${formattedVal}</span>
              </div>`;
            }
          });
          return html;
        },
      },
      legend: {
        top: title ? 22 : 0,
        right: showToolbox ? 80 : 0,
        textStyle: { color: textColor, fontSize: 10 },
        type: 'scroll',
        itemWidth: 14,
        itemHeight: 10,
      },
      toolbox: showToolbox
        ? {
            feature: {
              dataZoom: { yAxisIndex: 'none', title: { zoom: 'Box Zoom', back: 'Reset Zoom' } },
              restore: { title: 'Restore View' },
              saveAsImage: { title: 'Export PNG Image', pixelRatio: 2 },
            },
            iconStyle: {
              borderColor: textColor,
            },
            right: 10,
            top: 0,
          }
        : undefined,
      grid: {
        left: '2%',
        right: hasDualAxis ? '3%' : '2%',
        bottom: '14%',
        top: title ? 55 : 35,
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          bottom: 2,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
          fillerColor: isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.15)',
          handleStyle: { color: '#38BDF8' },
          textStyle: { color: textColor, fontSize: 9 },
        },
      ],
      xAxis: {
        type: 'category',
        data: allDates,
        axisLine: { lineStyle: { color: gridColor } },
        axisLabel: { color: textColor, fontSize: 10 },
      },
      yAxis: yAxes,
      series,
    };
  }, [data, chartType, isDarkMode, title, subtitle, showToolbox]);

  return <EChartWrapper option={chartOption} height={height} />;
};
