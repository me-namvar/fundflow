import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface EChartWrapperProps {
  option: echarts.EChartsOption;
  height?: string | number;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
}

export const EChartWrapper: React.FC<EChartWrapperProps> = ({
  option,
  height = '340px',
  className = '',
  onEvents,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Initialize or re-set options
  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(containerRef.current);

      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, handler]) => {
          chartInstanceRef.current?.on(eventName, handler);
        });
      }
    }

    const chart = chartInstanceRef.current;
    chart.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
    });
  }, [option, onEvents]);

  // Handle container resizing cleanly
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstanceRef.current?.resize();
    });

    resizeObserver.observe(containerRef.current);

    const handleWindowResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', minHeight: '200px' }}
      className={className}
    />
  );
};
