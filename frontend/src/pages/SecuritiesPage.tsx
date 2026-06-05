import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSecurities, deleteSecurity } from '../services/securitiesService';
import SecurityForm from '../components/Securities/SecurityForm';
import { useAppSelector } from '../store/hooks';
import type { Security } from '../types';
import { formatCompactNumber, formatPercent } from '../utils/formatters';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Local type augmentation                                            */
/* ------------------------------------------------------------------ */

/** Extended security type that includes optional fields the listing API
 *  may return (type discriminator, fundamental metrics, etc.). */
interface SecurityRow extends Security {
  type?: string;
  pe_ratio?: number;
  eps?: number;
  dividend_yield?: number;
}

type FilterKind = 'all' | 'stock' | 'etf' | 'bond';

/* ------------------------------------------------------------------ */
/*  Filter config                                                      */
/* ------------------------------------------------------------------ */

const FILTERS: { kind: FilterKind; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'stock', label: 'Stocks' },
  { kind: 'etf', label: 'ETFs' },
  { kind: 'bond', label: 'Bonds' },
];

/* ------------------------------------------------------------------ */
/*  Loading spinner                                                    */
/* ------------------------------------------------------------------ */

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-4 border-gray-700" />
      <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
    <span className="ml-4 text-sm text-gray-400">Loading securities...</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

const ErrorBlock = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
      <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-red-400 text-sm font-medium mb-1">Failed to load securities</p>
    <p className="text-gray-500 text-xs mb-4 max-w-md text-center">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
    >
      Try Again
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mb-4">
      <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <p className="text-gray-400 text-sm font-medium">
      {hasFilters ? 'No securities match your filters' : 'No securities available'}
    </p>
    <p className="text-gray-600 text-xs mt-1">
      {hasFilters ? 'Try adjusting your search or filter criteria' : 'Check back later for new listings'}
    </p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Helper for colouring change values                                 */
/* ------------------------------------------------------------------ */

const changeTextClass = (value: number | null | undefined): string => {
  if (value == null) return 'text-gray-400';
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
};

const changeBgClass = (value: number | null | undefined): string => {
  if (value == null) return 'bg-gray-800 text-gray-400';
  if (value > 0) return 'bg-green-900/30 text-green-400';
  if (value < 0) return 'bg-red-900/30 text-red-400';
  return 'bg-gray-800 text-gray-400';
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SecuritiesPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const [securities, setSecurities] = useState<SecurityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterKind>('all');

  /* ---- form / delete modal state ---- */

  const [showForm, setShowForm] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<SecurityRow | null>(null);
  const [deletingSecurity, setDeletingSecurity] = useState<SecurityRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ------ data fetching ------ */

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSecurities({ per_page: 100 });
      const items = (response as any).data?.data ?? (response as any).data ?? [];
      setSecurities(items as SecurityRow[]);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        apiErr.response?.data?.message ??
          apiErr.message ??
          'An unexpected error occurred',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ------ form handlers ------ */

  const openAddForm = () => {
    setEditingSecurity(null);
    setShowForm(true);
  };

  const openEditForm = (security: SecurityRow) => {
    setEditingSecurity(security);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSecurity(null);
  };

  const handleFormSuccess = () => {
    fetchData();
  };

  /* ------ delete handler ------ */

  const handleDeleteConfirm = async () => {
    if (!deletingSecurity) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteSecurity(deletingSecurity.id);
      setDeletingSecurity(null);
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setDeleteError(
        apiErr.response?.data?.message ??
          apiErr.message ??
          'Failed to delete security',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ------ filtering ------ */

  const filteredSecurities = useMemo(() => {
    let result = securities;

    if (filterType !== 'all') {
      result = result.filter((s) => s.type?.toLowerCase() === filterType);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query),
      );
    }

    return result;
  }, [securities, searchQuery, filterType]);

  const hasActiveFilters = searchQuery.trim().length > 0 || filterType !== 'all';

  /* ------ render ------ */

  return (
    <div className="space-y-6">
      {/* -- Page header -- */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Securities</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse all listed securities on the market
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/20 shrink-0"
          >
            <PlusIcon className="w-4 h-4" />
            Add Security
          </button>
        )}
      </div>

      {/* -- Search + Filters -- */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by symbol or name..."
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.kind}
              type="button"
              onClick={() => setFilterType(f.kind)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === f.kind
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* -- Content area -- */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBlock message={error} onRetry={fetchData} />
      ) : filteredSecurities.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} />
      ) : (
        <>
          {/* Result count */}
          <p className="text-xs text-gray-500">
            Showing {filteredSecurities.length}{' '}
            {filteredSecurities.length === 1 ? 'security' : 'securities'}
            {filterType !== 'all' ? ` (${filterType}s)` : ''}
          </p>

          {/* Table wrapper for horizontal scroll on small screens */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <Th>Symbol</Th>
                    <Th>Name</Th>
                    <Th className="text-right">Price</Th>
                    <Th className="text-right">Change%</Th>
                    <Th className="text-right">Market Cap</Th>
                    <Th className="text-right">P/E</Th>
                    <Th className="text-right">EPS</Th>
                    <Th className="text-right">Div. Yield</Th>
                    <Th className="text-right">Volume</Th>
                    {isAdmin && <Th className="text-right">Actions</Th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSecurities.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-gray-800/60 hover:bg-gray-800/40 transition-colors last:border-b-0"
                    >
                      {/* Symbol */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/securities/${s.symbol}`}
                          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          {s.symbol}
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">
                        {s.name}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right text-white font-medium tabular-nums whitespace-nowrap">
                        {Number(s.current_price).toFixed(2)}
                      </td>

                      {/* Change % */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium tabular-nums ${changeBgClass(s.change_percent)}`}
                        >
                          {s.change_percent != null ? formatPercent(s.change_percent) : '--'}
                        </span>
                      </td>

                      {/* Market Cap */}
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                        {s.market_cap != null
                          ? formatCompactNumber(s.market_cap)
                          : '--'}
                      </td>

                      {/* P/E */}
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                        {s.pe_ratio != null ? Number(s.pe_ratio).toFixed(2) : '--'}
                      </td>

                      {/* EPS */}
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                        {s.eps != null ? Number(s.eps).toFixed(2) : '--'}
                      </td>

                      {/* Dividend Yield */}
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                        {s.dividend_yield != null ? `${Number(s.dividend_yield).toFixed(2)}%` : '--'}
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-3 text-right text-gray-300 tabular-nums whitespace-nowrap">
                        {formatCompactNumber(s.volume)}
                      </td>

                      {/* Actions (admin only) */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
                              aria-label={`Edit ${s.symbol}`}
                              title="Edit security"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSecurity(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                              aria-label={`Delete ${s.symbol}`}
                              title="Delete security"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ---- Security Form (add / edit) ---- */}
      <SecurityForm
        isOpen={showForm}
        onClose={closeForm}
        onSuccess={handleFormSuccess}
        editingSecurity={editingSecurity}
      />

      {/* ---- Delete Confirmation Modal ---- */}
      {deletingSecurity !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!deleteLoading) {
                setDeletingSecurity(null);
                setDeleteError(null);
              }
            }}
          />

          {/* Dialog */}
          <div className="relative bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Security</h3>
                <p className="text-sm text-gray-400">
                  {deletingSecurity.symbol} &mdash; {deletingSecurity.name}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete this security? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingSecurity(null);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Table head helper                                                  */
/* ------------------------------------------------------------------ */

const Th = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

export default SecuritiesPage;
