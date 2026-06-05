import { useRef, useEffect } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface CandlestickChartDatum {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickChartProps {
  data: CandlestickChartDatum[];
  width?: number;
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Theme constants                                                     */
/* ------------------------------------------------------------------ */

const DARK_THEME = {
  background: 'transparent' as const,
  textColor: '#9ca3af',
  gridColor: '#1f2937',
  upColor: '#22c55e',
  downColor: '#ef4444',
  borderVisible: false,
  legendTextColor: '#ffffff',
  volumeUpColor: 'rgba(34, 197, 94, 0.4)',
  volumeDownColor: 'rgba(239, 68, 68, 0.4)',
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CandlestickChart = ({ data, width, height = 400 }: CandlestickChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    /* ---- Create chart instance ---- */
    const chart = createChart(containerRef.current, {
      width: width ?? containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: DARK_THEME.background },
        textColor: DARK_THEME.textColor,
      },
      grid: {
        vertLines: { color: DARK_THEME.gridColor },
        horzLines: { color: DARK_THEME.gridColor },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderVisible: DARK_THEME.borderVisible,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: DARK_THEME.borderVisible,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    /* ---- Candlestick series ---- */
    const candleSeries = chart.addCandlestickSeries({
      upColor: DARK_THEME.upColor,
      downColor: DARK_THEME.downColor,
      borderDownColor: DARK_THEME.downColor,
      borderUpColor: DARK_THEME.upColor,
      wickDownColor: DARK_THEME.downColor,
      wickUpColor: DARK_THEME.upColor,
    });

    const candleData = data.map((d) => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(candleData);

    /* ---- Volume histogram series ---- */
    const hasVolume = data.some((d) => d.volume !== undefined && d.volume > 0);

    if (hasVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const volumeData = data.map((d) => {
        const isUp = d.close >= d.open;
        return {
          time: d.time as any,
          value: d.volume ?? 0,
          color: isUp ? DARK_THEME.volumeUpColor : DARK_THEME.volumeDownColor,
        };
      });

      volumeSeries.setData(volumeData);
    }

    /* ---- Fit content to view ---- */
    chart.timeScale().fitContent();

    /* ---- ResizeObserver for responsive width ---- */
    const container = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth } = entry.contentRect;
        chart.applyOptions({ width: newWidth });
      }
    });
    observer.observe(container);

    /* ---- Cleanup ---- */
    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]); // intentionally exclude `width` so ResizeObserver drives it

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height,
      }}
    />
  );
};

export default CandlestickChart;
