import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/formatters';
import type { Transaction, PaginatedResponse } from '../types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_BADGES: Record<string, string> = {
  buy: 'bg-green-500/20 text-green-400 border-green-500/30',
  sell: 'bg-red-500/20 text-red-400 border-red-500/30',
  dividend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deposit: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  withdrawal: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const TYPE_LABELS: Record<string, string> = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
};

const TYPE_OPTIONS = ['All', 'Buy', 'Sell', 'Dividend', 'Deposit', 'Withdrawal'] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TransactionsPage = () => {
  /* ---------- filter state ---------- */
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [symbolSearch, setSymbolSearch] = useState('');

  /* ---------- data state ---------- */
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  /* ---------- ui state ---------- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  /* ---------- fetch transactions ---------- */
  const fetchTransactions = useCallback(
    async (currentPage: number = 1) => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number | undefined> = {
          page: currentPage,
        };
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;
        if (typeFilter !== 'All') params.type = typeFilter.toLowerCase();
        if (symbolSearch.trim()) params.symbol = symbolSearch.trim().toUpperCase();

        const response = await api.get('/transactions', { params });
        const respData = response.data;

        /* Handle various API response shapes */
        let paginated: PaginatedResponse<Transaction> | undefined;

        if (respData?.data && typeof respData.data === 'object' && 'data' in respData.data) {
          // Nested: { success: true, data: { data: [...], current_page: ..., ... } }
          paginated = respData.data as PaginatedResponse<Transaction>;
        } else if (respData && 'data' in respData && Array.isArray(respData.data)) {
          // Flat: { data: [...], current_page: ..., last_page: ..., total: ... }
          paginated = respData as PaginatedResponse<Transaction>;
        } else if (Array.isArray(respData)) {
          // Plain array fallback
          paginated = {
            data: respData,
            current_page: currentPage,
            last_page: 1,
            per_page: respData.length,
            total: respData.length,
            from: null,
            to: null,
          };
        } else if (Array.isArray(respData?.data)) {
          paginated = {
            data: respData.data,
            current_page: respData.current_page ?? currentPage,
            last_page: respData.last_page ?? 1,
            per_page: respData.per_page ?? respData.data.length,
            total: respData.total ?? respData.data.length,
            from: respData.from ?? null,
            to: respData.to ?? null,
          };
        }

        if (paginated) {
          setTransactions(paginated.data ?? []);
          setPage(paginated.current_page ?? 1);
          setLastPage(paginated.last_page ?? 1);
          setTotal(paginated.total ?? 0);
          setFrom(paginated.from ?? null);
          setTo(paginated.to ?? null);
        } else {
          setTransactions([]);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load transactions.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [dateFrom, dateTo, typeFilter, symbolSearch],
  );

  /* Auto-fetch when filters change */
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  /* ---------- export ---------- */
  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(format);
    try {
      const response = await api.get(`/transactions/export/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `transactions.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Export failed. Please try again.';
      setError(message);
    } finally {
      setExporting(null);
    }
  };

  /* ---------- derived summary ---------- */
  const totalBuy = transactions
    .filter((t) => t.type === 'buy')
    .reduce((sum, t) => sum + t.total, 0);

  const totalSell = transactions
    .filter((t) => t.type === 'sell')
    .reduce((sum, t) => sum + t.total, 0);

  const totalFees = transactions.reduce(
    (sum, t) => sum + (t.fee ?? 0),
    0,
  );

  const netPL = totalSell - totalBuy;

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions History</h1>
        <p className="text-sm text-gray-400 mt-1">
          View and filter your transaction history across all portfolios.
        </p>
      </div>

      {/* ---- Summary cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Buy */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 font-medium">Total Buy</p>
          <p className="text-2xl font-bold text-green-400 mt-1 font-mono">
            {formatVND(totalBuy)}
          </p>
        </div>

        {/* Total Sell */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 font-medium">Total Sell</p>
          <p className="text-2xl font-bold text-red-400 mt-1 font-mono">
            {formatVND(totalSell)}
          </p>
        </div>

        {/* Net P&L */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 font-medium">Net P&amp;L</p>
          <p
            className={`text-2xl font-bold mt-1 font-mono ${
              netPL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {netPL >= 0 ? '+' : ''}
            {formatVND(netPL)}
          </p>
        </div>

        {/* Total Fees */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm text-gray-400 font-medium">Total Fees</p>
          <p className="text-2xl font-bold text-gray-300 mt-1 font-mono">
            {formatVND(totalFees)}
          </p>
        </div>
      </div>

      {/* ---- Filters bar ---- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Date from */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-400 font-medium mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Date to */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-400 font-medium mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Type filter */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-gray-400 font-medium mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition-colors"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol search */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-gray-400 font-medium mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbolSearch}
              onChange={(e) => setSymbolSearch(e.target.value)}
              placeholder="Search symbol..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {exporting === 'excel' ? (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {exporting === 'pdf' ? (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              )}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ---- Loading state ---- */}
      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {[
                    'Date',
                    'Symbol',
                    'Type',
                    'Side',
                    'Quantity',
                    'Price',
                    'Total',
                    'Fee',
                    'Net Amount',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800/50 last:border-0"
                  >
                    {Array.from({ length: 9 }).map((_, j) => (
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
      )}

      {/* ---- Error state ---- */}
      {error && !loading && (
        <div className="bg-gray-900 border border-red-800/50 rounded-xl p-8 text-center">
          <svg
            className="w-12 h-12 text-red-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-red-300 mt-4 font-medium">
            Failed to load transactions
          </p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={() => fetchTransactions(page)}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!loading && !error && transactions.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <svg
            className="w-12 h-12 text-gray-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-400 mt-4 font-medium">
            No transactions found
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {symbolSearch || typeFilter !== 'All' || dateFrom || dateTo
              ? 'No transactions match your filter criteria. Try adjusting the filters.'
              : 'No transactions have been recorded yet.'}
          </p>
        </div>
      )}

      {/* ---- Transactions table ---- */}
      {!loading && transactions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Side
                  </th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="text-right py-3.5 px-4 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Net Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-800/30 transition-colors duration-150"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-300 whitespace-nowrap text-xs">
                      {formatDateTime(tx.executed_at ?? tx.created_at)}
                    </td>

                    {/* Symbol */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white">
                        {tx.symbol ?? '--'}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          TYPE_BADGES[tx.type] ??
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        }`}
                      >
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>

                    {/* Side */}
                    <td className="py-3.5 px-4">
                      {tx.type === 'buy' || tx.type === 'sell' ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            tx.type === 'buy'
                              ? 'text-green-400 bg-green-500/10'
                              : 'text-red-400 bg-red-500/10'
                          }`}
                        >
                          {tx.type === 'buy' ? 'BUY' : 'SELL'}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">--</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-right text-gray-300 font-mono">
                      {tx.quantity != null
                        ? formatNumber(tx.quantity)
                        : '--'}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right text-gray-300 font-mono">
                      {tx.price != null ? formatVND(tx.price) : '--'}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right text-gray-300 font-mono">
                      {formatVND(tx.total)}
                    </td>

                    {/* Fee */}
                    <td className="py-3.5 px-4 text-right text-gray-400 font-mono">
                      {tx.fee != null ? formatVND(tx.fee) : '--'}
                    </td>

                    {/* Net Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-mono font-medium ${
                          tx.net_total >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {formatVND(tx.net_total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---- Pagination ---- */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              {from != null && to != null
                ? `Showing ${from} to ${to} of ${total} transactions`
                : `Total: ${total} transactions`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchTransactions(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const startPage = Math.max(1, page - 2);
                const pageNum = startPage + i;
                if (pageNum > lastPage) return null;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => fetchTransactions(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => fetchTransactions(page + 1)}
                disabled={page >= lastPage}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
