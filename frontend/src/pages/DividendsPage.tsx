import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Dividend, PaginatedResponse } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  stock: 'Stock Dividend',
};

const TYPE_CLASSES: Record<string, string> = {
  cash: 'bg-green-900/60 text-green-300 border-green-700/50',
  stock: 'bg-blue-900/60 text-blue-300 border-blue-700/50',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DividendsPage = () => {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  /* ------ fetch dividends ------ */
  const fetchDividends = useCallback(async (symbol?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number | undefined> = {};
      if (symbol && symbol.trim()) {
        params.symbol = symbol.trim().toUpperCase();
      }

      const { data: resp } = await api.get('/dividends', {
        params,
      });

      const items = resp?.data?.data ?? resp?.data ?? [];
      setDividends(Array.isArray(items) ? items : []);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dividend data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ------ initial load ------ */
  useEffect(() => {
    fetchDividends();
  }, [fetchDividends]);

  /* ------ search handler ------ */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    fetchDividends(searchInput.trim() || undefined);
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchQuery('');
    fetchDividends();
  };

  /* ------ loading skeleton ------ */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dividends</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track dividend payments and upcoming ex-dates
          </p>
        </div>

        {/* Search skeleton */}
        <div className="h-10 bg-gray-800 rounded-lg w-full max-w-md animate-pulse" />

        {/* Table skeleton */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  {['Symbol', 'Ex-Date', 'Payment Date', 'Amount Per Share', 'Type'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3.5 px-4 text-gray-400 font-medium"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-700/30 last:border-0"
                  >
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ------ error state ------ */
  if (error && dividends.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dividends</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track dividend payments and upcoming ex-dates
          </p>
        </div>

        <div className="bg-gray-800/80 border border-red-800/50 rounded-xl p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-300 mt-4 font-medium">Failed to load dividend data</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={() => fetchDividends(searchQuery || undefined)}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ------ main content ------ */
  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dividends</h1>
        <p className="text-sm text-gray-400 mt-1">
          Track dividend payments and upcoming ex-dates
        </p>
      </div>

      {/* ---- Search bar ---- */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by symbol..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700/60 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          Search
        </button>

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Clear
          </button>
        )}

        {searchQuery && (
          <span className="text-sm text-gray-400">
            Showing results for: <span className="text-blue-400 font-medium">{searchQuery}</span>
          </span>
        )}
      </form>

      {/* ---- Empty state ---- */}
      {!loading && dividends.length === 0 && (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-8 text-center">
          <CurrencyDollarIcon className="w-12 h-12 text-gray-500 mx-auto" />
          <p className="text-gray-400 mt-4 font-medium">No dividends found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery
              ? `No dividend records match "${searchQuery}". Try a different symbol.`
              : 'No dividend records are currently available.'}
          </p>
        </div>
      )}

      {/* ---- Dividends table ---- */}
      {dividends.length > 0 && (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium">Symbol</th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium">Ex-Date</th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium">Payment Date</th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium">
                    Amount Per Share
                  </th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {dividends.map((div) => (
                  <tr
                    key={div.id}
                    className="hover:bg-gray-700/30 transition-colors duration-150"
                  >
                    {/* Symbol */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">{div.security?.symbol ?? div.symbol}</span>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
                        {div.security?.name ?? ''}
                      </p>
                    </td>

                    {/* Ex-Date */}
                    <td className="py-3.5 px-4 text-gray-300 whitespace-nowrap">
                      {formatDate(div.ex_date)}
                    </td>

                    {/* Payment Date */}
                    <td className="py-3.5 px-4 text-gray-300 whitespace-nowrap">
                      {formatDate(div.payment_date)}
                    </td>

                    {/* Amount Per Share */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-medium text-green-400">
                        {formatCurrency(div.amount_per_share, 'VND')}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          TYPE_CLASSES[div.dividend_type] ?? TYPE_CLASSES.cash
                        }`}
                      >
                        {TYPE_LABELS[div.dividend_type] ?? div.dividend_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DividendsPage;
