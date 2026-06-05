import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAppSelector } from '../store/hooks';
import { formatCurrency, formatNumber } from '../utils/formatters';

/* ------------------------------------------------------------------ */
/*  Types (matching backend API responses)                            */
/* ------------------------------------------------------------------ */

interface SecurityBrief {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  current_price: number | null;
}

interface PortfolioItem {
  id: number;
  portfolio_id: number;
  security_id: number;
  security?: SecurityBrief;
  quantity: number;
  avg_buy_price: number;
  current_value: number | null;
  profit_loss: number | null;
  profit_loss_percent: number | null;
}

interface PortfolioData {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  total_value: number | null;
  cash_balance: number | null;
  items: PortfolioItem[];
  created_at: string;
  updated_at: string;
}

interface PortfolioSummary {
  total_value: number;
  cash_balance: number;
  invested: number;
  allocation_by_sector: SectorAllocation[];
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
}

interface HoldingAllocation {
  security_id: number;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number | null;
  current_value: number;
  cost_basis: number;
  profit_loss: number;
  profit_loss_percent: number | null;
  allocation_percent: number;
}

interface PerformanceData {
  portfolio_id: number;
  from: string;
  to: string;
  start_value: number;
  end_value: number;
  absolute_return: number;
  percentage_return: number;
  holdings: PerformanceHolding[];
}

interface PerformanceHolding {
  security_id: number;
  symbol: string;
  name: string;
  quantity: number;
  start_price: number;
  end_price: number;
  start_value: number;
  end_value: number;
  absolute_return: number;
  percentage_return: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const SECTOR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-lime-500',
  'bg-violet-500',
];

function getSectorColor(index: number): string {
  return SECTOR_COLORS[index % SECTOR_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

/* ---------- Create Portfolio Modal ---------- */

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

function CreatePortfolioModal({ open, onClose, onSubmit }: CreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* Reset form when modal opens */
  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Create Portfolio</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Portfolio Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Long-Term Growth"
              required
              maxLength={255}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this portfolio"
              rows={3}
              maxLength={5000}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-600 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Portfolio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <div className="h-5 w-32 bg-gray-800 rounded" />
            <div className="h-8 w-28 bg-gray-800 rounded" />
            <div className="h-4 w-20 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

const PortfolioPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  /* ---------- state ---------- */
  const [portfolios, setPortfolios] = useState<PortfolioData[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioData | null>(null);
  const [holdings, setHoldings] = useState<HoldingAllocation[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  /* Performance date range (default: last 30 days) */
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [perfFrom, setPerfFrom] = useState(thirtyDaysAgo.toISOString().slice(0, 10));
  const [perfTo, setPerfTo] = useState(today.toISOString().slice(0, 10));

  /* ---------- fetch portfolios ---------- */
  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/portfolios');
      // Backend wraps in { status, message, data: { data: [...] } }
      const raw = res.data?.data;
      const list: PortfolioData[] = raw?.data ?? (Array.isArray(raw) ? raw : []);
      setPortfolios(list);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to load portfolios');
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  /* ---------- fetch portfolio detail + summary + allocation + performance ---------- */
  const fetchPortfolioDetail = useCallback(
    async (id: number) => {
      setDetailLoading(true);
      setError(null);
      try {
        /* Detail (with items) */
        const detailRes = await api.get(`/portfolios/${id}`);
        const portfolio: PortfolioData = detailRes.data?.data;
        setSelectedPortfolio(portfolio);

        /* Summary */
        const summaryRes = await api.get(`/portfolios/${id}/summary`);
        setSummary(summaryRes.data?.data ?? null);

        /* Allocation (detailed holdings) */
        const allocRes = await api.get(`/portfolios/${id}/allocation`);
        const allocList: HoldingAllocation[] = allocRes.data?.data ?? [];
        setHoldings(allocList);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e.response?.data?.message ?? e.message ?? 'Failed to load portfolio details');
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  /* ---------- fetch performance ---------- */
  const fetchPerformance = useCallback(
    async (id: number, from: string, to: string) => {
      try {
        const res = await api.get(`/portfolios/${id}/performance`, {
          params: { from, to },
        });
        setPerformance(res.data?.data ?? null);
      } catch {
        // Non-blocking: performance fetch failure doesn't break the page
        setPerformance(null);
      }
    },
    [],
  );

  /* When a portfolio is selected, load detail + summary + holdings */
  useEffect(() => {
    if (!selectedPortfolio) return;
    fetchPortfolioDetail(selectedPortfolio.id);
  }, [selectedPortfolio?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Fetch performance when date range changes and portfolio is selected */
  useEffect(() => {
    if (!selectedPortfolio) return;
    fetchPerformance(selectedPortfolio.id, perfFrom, perfTo);
  }, [selectedPortfolio, perfFrom, perfTo, fetchPerformance]);

  /* ---------- create portfolio ---------- */
  const handleCreatePortfolio = async (name: string, description: string) => {
    try {
      await api.post('/portfolios', { name, description });
      await fetchPortfolios();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message ?? e.message ?? 'Failed to create portfolio');
    }
  };

  /* ---------- delete portfolio ---------- */
  const handleDeletePortfolio = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/portfolios/${id}`);
      if (selectedPortfolio?.id === id) {
        setSelectedPortfolio(null);
      }
      await fetchPortfolios();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to delete portfolio');
    }
  };

  /* ---------- select / back ---------- */
  const handleSelectPortfolio = (p: PortfolioData) => {
    setSelectedPortfolio(p);
    setPerfFrom(thirtyDaysAgo.toISOString().slice(0, 10));
    setPerfTo(today.toISOString().slice(0, 10));
  };

  const handleBack = () => {
    setSelectedPortfolio(null);
    setSummary(null);
    setHoldings([]);
    setPerformance(null);
    setError(null);
  };

  /* ---------- clear error after timeout ---------- */
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ---------- compute holdings count for each portfolio ---------- */
  const getHoldingsCount = (p: PortfolioData): number => {
    return p.items?.length ?? 0;
  };

  /* ================================================================== */
  /*  RENDER: Loading State                                              */
  /* ================================================================== */
  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ================================================================== */
  /*  RENDER: Portfolio List (no portfolio selected)                     */
  /* ================================================================== */
  if (!selectedPortfolio) {
    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Portfolios</h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your investment portfolios, {user?.name ?? 'User'}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-blue-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Portfolio
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 rounded-lg border text-sm font-medium bg-red-500/10 border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Portfolio cards */}
        {portfolios.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-700 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No portfolios yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first portfolio to start tracking your investments.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Portfolio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolios.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectPortfolio(p)}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-gray-600 hover:bg-gray-800/80 transition-all"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePortfolio(p.id);
                    }}
                    className="ml-2 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete portfolio"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Card stats */}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-xl font-bold text-white">
                      {p.total_value != null ? formatCurrency(p.total_value, 'USD') : '--'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Cash Balance</p>
                      <p className="font-medium text-gray-300">
                        {p.cash_balance != null ? formatCurrency(p.cash_balance, 'USD') : '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Holdings</p>
                      <p className="font-medium text-gray-300">{getHoldingsCount(p)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create modal */}
        <CreatePortfolioModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePortfolio}
        />
      </div>
    );
  }

  /* ================================================================== */
  /*  RENDER: Portfolio Detail                                           */
  /* ================================================================== */

  const totalPnL = summary != null ? summary.total_value - summary.invested : null;
  const totalPnLPct = summary != null && summary.invested > 0
    ? ((summary.total_value - summary.invested) / summary.invested) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* ---- Back button + header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Back to portfolios"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedPortfolio.name}</h1>
            {selectedPortfolio.description && (
              <p className="text-sm text-gray-400 mt-0.5">{selectedPortfolio.description}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-800 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-lg border text-sm font-medium bg-red-500/10 border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* ---- Summary cards ---- */}
      {detailLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
              <div className="h-4 w-20 bg-gray-800 rounded mb-3" />
              <div className="h-7 w-32 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Value */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</p>
            <p className="text-2xl font-bold text-white mt-1">
              {summary != null ? formatCurrency(summary.total_value, 'USD') : '--'}
            </p>
          </div>

          {/* Cash Balance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Balance</p>
            <p className="text-2xl font-bold text-white mt-1">
              {summary != null ? formatCurrency(summary.cash_balance, 'USD') : '--'}
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total P&L</p>
            <div className={`text-2xl font-bold mt-1 ${totalPnL != null && totalPnL >= 0 ? 'text-green-400' : totalPnL != null && totalPnL < 0 ? 'text-red-400' : 'text-white'}`}>
              {totalPnL != null ? (
                <>{totalPnL >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalPnL), 'USD')}</>
              ) : (
                '--'
              )}
            </div>
          </div>

          {/* P&L % */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">P&L %</p>
            <div className={`text-2xl font-bold mt-1 ${totalPnLPct != null && totalPnLPct >= 0 ? 'text-green-400' : totalPnLPct != null && totalPnLPct < 0 ? 'text-red-400' : 'text-white'}`}>
              {totalPnLPct != null ? (
                <>{totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%</>
              ) : (
                '--'
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Holdings table ---- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Holdings</h2>

        {detailLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-gray-800 rounded" />
            <div className="h-8 bg-gray-800 rounded" />
            <div className="h-8 bg-gray-800 rounded" />
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">No holdings in this portfolio yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Symbol</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Quantity</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Avg Buy Price</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Current Price</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Current Value</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">P&L</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">P&L %</th>
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.security_id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="font-semibold text-white">{h.symbol}</span>
                        <span className="text-xs text-gray-500 ml-2">{h.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right text-gray-300 font-mono">
                      {formatNumber(h.quantity, 4)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-gray-300 font-mono">
                      ${h.avg_buy_price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {h.current_price != null ? (
                        <span className="text-gray-300">${h.current_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right text-white font-mono font-medium">
                      ${formatNumber(h.current_value, 2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className={h.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {h.profit_loss >= 0 ? '+' : ''}${formatNumber(Math.abs(h.profit_loss), 2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {h.profit_loss_percent != null ? (
                        <span className={h.profit_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {h.profit_loss_percent >= 0 ? '+' : ''}{h.profit_loss_percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right text-gray-300 font-mono">
                      {h.allocation_percent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---- Asset Allocation (sector bar) ---- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Asset Allocation by Sector</h2>

        {detailLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-800 rounded w-3/4" />
          </div>
        ) : summary?.allocation_by_sector && summary.allocation_by_sector.length > 0 ? (
          <div className="space-y-4">
            {/* Stacked color bar */}
            <div className="w-full h-6 rounded-full overflow-hidden flex bg-gray-800">
              {summary.allocation_by_sector.map((s, i) => (
                <div
                  key={s.sector}
                  className={`${getSectorColor(i)} transition-all duration-500`}
                  style={{ width: `${Math.max(s.percentage, 1)}%` }}
                  title={`${s.sector}: ${s.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {summary.allocation_by_sector.map((s, i) => (
                <div key={s.sector} className="flex items-center gap-3 text-sm">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${getSectorColor(i)}`} />
                  <span className="text-gray-400 flex-1 truncate">{s.sector}</span>
                  <span className="text-white font-medium">{s.percentage.toFixed(1)}%</span>
                  <span className="text-gray-500 text-xs">{formatCurrency(s.value, 'USD')}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No allocation data available.</p>
        )}
      </div>

      {/* ---- Performance ---- */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Performance</h2>

          {/* Date range selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">From</label>
              <input
                type="date"
                value={perfFrom}
                onChange={(e) => setPerfFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">To</label>
              <input
                type="date"
                value={perfTo}
                onChange={(e) => setPerfTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Performance summary numbers */}
        {performance ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Start Value</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(performance.start_value, 'USD')}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">End Value</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(performance.end_value, 'USD')}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Return</p>
              <p className={`text-lg font-semibold ${performance.absolute_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {performance.absolute_return >= 0 ? '+' : ''}
                {formatCurrency(performance.absolute_return, 'USD')}
                <span className="text-sm ml-1">
                  ({performance.percentage_return >= 0 ? '+' : ''}
                  {performance.percentage_return.toFixed(2)}%)
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-5">Loading performance data...</p>
        )}

        {/* Placeholder chart */}
        <div className="h-64 bg-gray-800/30 rounded-lg border border-gray-700/50 flex items-center justify-center relative overflow-hidden">
          {/* Decorative chart line */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path
              d="M0,160 C30,150 50,130 80,135 C110,140 130,90 170,95 C210,100 240,50 280,55 C320,60 350,35 400,40 L400,200 L0,200 Z"
              fill="url(#perfGradient)"
            />
            <path
              d="M0,160 C30,150 50,130 80,135 C110,140 130,90 170,95 C210,100 240,50 280,55 C320,60 350,35 400,40"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Center label */}
          {performance ? (
            <div className="text-center relative">
              <p className="text-sm font-medium text-gray-400">Portfolio Performance</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(perfFrom)} - {formatDate(perfTo)}
              </p>
              {performance.holdings.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Based on {performance.holdings.length} holding{performance.holdings.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center relative">
              <p className="text-sm font-medium text-gray-400">Portfolio Performance Chart</p>
              <p className="text-xs text-gray-500 mt-1">Select a date range above</p>
            </div>
          )}
        </div>

        {/* Performance per holding table */}
        {performance && performance.holdings.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Performance by Holding</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Symbol</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Start Price</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">End Price</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Return</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.holdings.map((h) => (
                    <tr key={h.security_id} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-white">{h.symbol}</span>
                        <span className="text-xs text-gray-500 ml-2">{h.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-300 font-mono">
                        ${h.start_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-300 font-mono">
                        ${h.end_price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={h.absolute_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {h.absolute_return >= 0 ? '+' : ''}${formatNumber(Math.abs(h.absolute_return), 2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className={h.percentage_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {h.percentage_return >= 0 ? '+' : ''}{h.percentage_return.toFixed(2)}%
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
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Date formatting helper for display                                 */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default PortfolioPage;
