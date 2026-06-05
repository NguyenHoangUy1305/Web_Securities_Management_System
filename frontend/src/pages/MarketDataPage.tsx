import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import type { Security, OHLC } from '../types';
import { formatCurrency, formatCompactNumber } from '../utils/formatters';
import CandlestickChart from '../components/Charts/CandlestickChart';

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const MarketDataPage = () => {
  /* ---- State ---- */
  const [securities, setSecurities] = useState<Security[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<OHLC[]>([]);
  const [securitiesLoading, setSecuritiesLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Fetch securities list ---- */
  useEffect(() => {
    let cancelled = false;

    const fetchSecurities = async () => {
      try {
        setSecuritiesLoading(true);
        const response = await api.get('/securities');
        if (!cancelled) {
          const items = response.data?.data?.data ?? response.data?.data ?? [];
          setSecurities(Array.isArray(items) ? items : []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? 'Failed to load securities');
        }
      } finally {
        if (!cancelled) setSecuritiesLoading(false);
      }
    };

    fetchSecurities();
    return () => { cancelled = true; };
  }, []);

  /* ---- Fetch OHLC data when a security is selected ---- */
  useEffect(() => {
    if (selectedId === null) {
      setOhlcData([]);
      return;
    }

    let cancelled = false;

    const fetchOhlc = async () => {
      try {
        setChartLoading(true);
        setError(null);
        const now = new Date();
        const to = now.toISOString().split('T')[0];
        const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const response = await api.get(`/market-data/${selectedId}/ohlc`, { params: { from, to } });
        if (!cancelled) {
          const items = response.data?.data?.data ?? response.data?.data ?? [];
          setOhlcData(Array.isArray(items) ? items : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? 'Failed to load market data');
          setOhlcData([]);
        }
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    fetchOhlc();
    return () => { cancelled = true; };
  }, [selectedId]);

  /* ---- Derived data ---- */
  const latest = ohlcData.length > 0 ? ohlcData[ohlcData.length - 1] : null;

  const selectedSecurity = useMemo(
    () => securities.find((s) => s.id === selectedId) ?? null,
    [securities, selectedId],
  );

  /* ---- Candlestick chart data (converted to lightweight-charts format) ---- */
  const candlestickData = useMemo(() => {
    const rawData = ohlcData.map((d: any) => {
      const tsStr = (d.timestamp ?? d.time) as string;
      const datePart = typeof tsStr === 'string' ? tsStr.split('T')[0] : new Date(tsStr).toISOString().split('T')[0];
      return {
        time: datePart,
        open: Number(d.open),
        high: Number(d.high),
        low: Number(d.low),
        close: Number(d.close),
        volume: Number(d.volume) || 0,
        _ms: new Date(tsStr).getTime(),
      };
    });

    // Lightweight charts strictly requires data to be sorted ascending by time
    rawData.sort((a, b) => a._ms - b._ms);

    // Lightweight charts strictly requires time to be unique
    const unique: any[] = [];
    for (const item of rawData) {
      if (unique.length === 0 || unique[unique.length - 1].time !== item.time) {
        unique.push({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        });
      }
    }

    return unique;
  }, [ohlcData]);

  /* Period-over-period change */
  const priceChange =
    ohlcData.length >= 2 ? Number(latest!.close) - Number(ohlcData[ohlcData.length - 2].close) : 0;
  const priceChangePercent =
    ohlcData.length >= 2 && Number(ohlcData[ohlcData.length - 2].close) !== 0
      ? (priceChange / Number(ohlcData[ohlcData.length - 2].close)) * 100
      : 0;

  /* Aggregate stats */
  const dayHigh = ohlcData.length > 0 ? Math.max(...ohlcData.map((d) => Number(d.high))) : 0;
  const dayLow = ohlcData.length > 0 ? Math.min(...ohlcData.map((d) => Number(d.low))) : 0;
  const totalVolume =
    ohlcData.length > 0
      ? ohlcData.reduce((sum, d) => sum + (Number(d.volume) || 0), 0)
      : 0;

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Market Data</h1>
        <p className="text-sm text-gray-400 mt-1">
          View historical price data for any security
        </p>
      </div>

      {/* Security selector */}
      <div className="mb-6">
        <label
          htmlFor="security-select"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Select Security
        </label>

        {securitiesLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading securities...</span>
          </div>
        ) : securities.length === 0 ? (
          <p className="text-sm text-gray-500">No securities available.</p>
        ) : (
          <select
            id="security-select"
            value={selectedId ?? ''}
            onChange={(e) =>
              setSelectedId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full max-w-md px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="">-- Select a security --</option>
            {securities.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.symbol} &mdash; {sec.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Info cards: shown only when a security is selected */}
      {selectedId && !chartLoading && ohlcData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Latest Price */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400 mb-1">Latest Price</p>
            <p className="text-2xl font-bold">
              {formatCurrency(latest!.close, 'USD')}
            </p>
            <p
              className={`text-sm mt-1 ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}
              {priceChangePercent.toFixed(2)}%)
            </p>
          </div>

          {/* Day High */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400 mb-1">High</p>
            <p className="text-2xl font-bold">
              {formatCurrency(dayHigh, 'USD')}
            </p>
          </div>

          {/* Day Low */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400 mb-1">Low</p>
            <p className="text-2xl font-bold">
              {formatCurrency(dayLow, 'USD')}
            </p>
          </div>

          {/* Volume */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400 mb-1">Volume</p>
            <p className="text-2xl font-bold">
              {formatCompactNumber(totalVolume)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-base font-semibold mb-4">
          {selectedSecurity
            ? `${selectedSecurity.symbol} — Price History`
            : 'Price Chart'}
        </h3>

        {chartLoading ? (
          <div className="flex items-center justify-center" style={{ height: 400 }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading chart data...</p>
            </div>
          </div>
        ) : !selectedId ? (
          <div
            className="flex items-center justify-center text-gray-500"
            style={{ height: 400 }}
          >
            Select a security to view its price chart
          </div>
        ) : ohlcData.length === 0 ? (
          <div
            className="flex items-center justify-center text-gray-500"
            style={{ height: 400 }}
          >
            No market data available for this security
          </div>
        ) : (
          <CandlestickChart data={candlestickData} height={400} />
        )}
      </div>
    </div>
  );
};

export default MarketDataPage;
