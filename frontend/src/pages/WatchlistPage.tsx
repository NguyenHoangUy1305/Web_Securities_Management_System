import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BellIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Local Types                                                        */
/* ------------------------------------------------------------------ */

interface WatchlistItemRow {
  id: number;
  watchlist_id: number;
  security_id: number;
  symbol: string;
  name: string;
  current_price: number | null;
  alert_price_above: number | null;
  alert_price_below: number | null;
  alert_enabled: boolean;
}

interface WatchlistSummary {
  id: number;
  name: string;
  description?: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/* ---------- Create Watchlist Modal ---------- */

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

function CreateWatchlistModal({ open, onClose, onSubmit }: CreateModalProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Create Watchlist</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Watchlist Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tech Stocks"
              required
              maxLength={255}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
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
                'Create Watchlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Add Symbol Modal ---------- */

interface AddSymbolModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (securityId: number, symbol: string) => Promise<void>;
}

interface SearchResultItem {
  id: number;
  symbol: string;
  name: string;
  exchange?: string;
}

function AddSymbolModal({ open, onClose, onAdd }: AddSymbolModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [successSymbol, setSuccessSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setLoading(false);
      setAddingId(null);
      setSuccessSymbol(null);
      setError(null);
    }
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setError(null);
    setSuccessSymbol(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/securities/search', {
          params: { q: trimmed },
        });
        const raw = res.data?.data ?? res.data ?? [];
        const list: SearchResultItem[] = Array.isArray(raw) ? raw : raw.data ?? [];
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleAdd = async (securityId: number, symbol: string) => {
    setAddingId(securityId);
    setError(null);
    setSuccessSymbol(null);
    try {
      await onAdd(securityId, symbol);
      setSuccessSymbol(symbol);
      setResults((prev) => prev.filter((r) => r.id !== securityId));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to add symbol');
    } finally {
      setAddingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Add Symbol</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by symbol or name..."
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
          />
        </div>

        {/* Error feedback */}
        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg border text-sm font-medium bg-red-500/10 border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {/* Success feedback */}
        {successSymbol && (
          <div className="mb-4 px-3 py-2 rounded-lg border text-sm font-medium bg-green-500/10 border-green-500/30 text-green-400">
            <CheckIcon className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            {successSymbol} added to watchlist.
          </div>
        )}

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : query.trim().length > 0 && results.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">No securities found for &quot;{query.trim()}&quot;.</p>
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAdd(item.id, item.symbol)}
                disabled={addingId === item.id}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white">{item.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.name}</span>
                  {item.exchange && (
                    <span className="text-xs text-gray-600 ml-2">{item.exchange}</span>
                  )}
                </div>
                {addingId === item.id ? (
                  <svg className="animate-spin h-4 w-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <PlusIcon className="w-4 h-4 text-gray-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {!loading && results.length > 0 && (
          <p className="text-xs text-gray-600 mt-3 text-center">{results.length} result{results.length !== 1 ? 's' : ''} found</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Loading Skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="h-5 w-24 bg-gray-800 rounded" />
          <div className="h-10 bg-gray-800 rounded" />
          <div className="h-10 bg-gray-800 rounded" />
          <div className="h-10 bg-gray-800 rounded" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-64 bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
            <div className="h-8 bg-gray-800 rounded mb-2" />
            <div className="h-8 bg-gray-800 rounded mb-2" />
            <div className="h-8 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const WatchlistPage = () => {
  /* ---------- state ---------- */
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [items, setItems] = useState<WatchlistItemRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [savingAlerts, setSavingAlerts] = useState<Record<number, boolean>>({});

  /* ---------- fetch watchlists ---------- */
  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/watchlists');
      const raw = res.data?.data;
      const list: WatchlistSummary[] = Array.isArray(raw) ? raw : raw?.data ?? [];
      setWatchlists(list);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to load watchlists');
      setWatchlists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  /* ---------- fetch watchlist items ---------- */
  const fetchWatchlistItems = useCallback(async (id: number) => {
    setItemsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/watchlists/${id}`);
      const watchlistData = res.data?.data ?? res.data;
      const rawItems = watchlistData?.items ?? [];

      const mapped: WatchlistItemRow[] = rawItems.map((item: Record<string, unknown>) => ({
        id: item.id as number,
        watchlist_id: item.watchlist_id as number,
        security_id: item.security_id as number,
        symbol: item.symbol as string,
        name: item.name as string,
        current_price: (item.current_price as number | null) ?? (item.price as number | null) ?? null,
        alert_price_above: (item.alert_price_above as number | null) ?? null,
        alert_price_below: (item.alert_price_below as number | null) ?? null,
        alert_enabled: (item.alert_enabled as boolean) ?? false,
      }));

      setItems(mapped);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to load watchlist items');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  /* When a watchlist is selected, load its items */
  useEffect(() => {
    if (selectedId == null) return;
    fetchWatchlistItems(selectedId);
  }, [selectedId, fetchWatchlistItems]);

  /* ---------- create watchlist ---------- */
  const handleCreateWatchlist = async (name: string) => {
    try {
      const res = await api.post('/watchlists', { name });
      await fetchWatchlists();
      const created = res.data?.data ?? res.data;
      if (created?.id) {
        setSelectedId(created.id);
        setSelectedName(created.name ?? name);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message ?? e.message ?? 'Failed to create watchlist');
    }
  };

  /* ---------- delete watchlist ---------- */
  const handleDeleteWatchlist = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this watchlist? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/watchlists/${id}`);
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedName(null);
        setItems([]);
      }
      await fetchWatchlists();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to delete watchlist');
    }
  };

  /* ---------- add security to watchlist ---------- */
  const handleAddSecurity = async (securityId: number, _symbol: string) => {
    if (selectedId == null) return;
    try {
      await api.post(`/watchlists/${selectedId}/add-security`, {
        security_id: securityId,
      });
      await fetchWatchlistItems(selectedId);
      await fetchWatchlists();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message ?? e.message ?? 'Failed to add security');
    }
  };

  /* ---------- remove security from watchlist ---------- */
  const handleRemoveSecurity = async (securityId: number) => {
    if (selectedId == null) return;
    if (!window.confirm('Are you sure you want to remove this security from the watchlist?')) {
      return;
    }
    try {
      await api.delete(`/watchlists/${selectedId}/remove-security/${securityId}`);
      await fetchWatchlistItems(selectedId);
      await fetchWatchlists();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to remove security');
    }
  };

  /* ---------- update alert ---------- */
  const handleUpdateAlert = async (
    itemId: number,
    field: 'alert_price_above' | 'alert_price_below' | 'alert_enabled',
    value: number | boolean | null,
  ) => {
    /* Optimistic update */
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    );

    setSavingAlerts((prev) => ({ ...prev, [itemId]: true }));
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      /* Build payload with the updated field merged */
      const payload = {
        alert_price_above: field === 'alert_price_above' ? value : item.alert_price_above,
        alert_price_below: field === 'alert_price_below' ? value : item.alert_price_below,
        alert_enabled: field === 'alert_enabled' ? value : item.alert_enabled,
      };

      await api.put(`/watchlist-items/${itemId}/alert`, payload);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Failed to update alert');
      /* Revert on failure by re-fetching */
      if (selectedId != null) {
        await fetchWatchlistItems(selectedId);
      }
    } finally {
      setSavingAlerts((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  /* ---------- select watchlist ---------- */
  const handleSelectWatchlist = (wl: WatchlistSummary) => {
    setSelectedId(wl.id);
    setSelectedName(wl.name);
    setItems([]);
  };

  /* ---------- clear error after timeout ---------- */
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ---------- format helpers ---------- */
  const formatPrice = (value: number | null): string => {
    if (value == null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /* ================================================================== */
  /*  RENDER: Loading State                                              */
  /* ================================================================== */

  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ================================================================== */
  /*  RENDER: Main Content                                               */
  /* ================================================================== */

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your favorite securities and set price alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-blue-600/20"
        >
          <PlusIcon className="w-4 h-4" />
          Create Watchlist
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-3 rounded-lg border text-sm font-medium bg-red-500/10 border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================== */}
        {/*  LEFT: Watchlist List                                          */}
        {/* ============================================================== */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              My Watchlists
            </h2>
          </div>

          <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
            {watchlists.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500 mb-3">No watchlists yet.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Create your first
                </button>
              </div>
            ) : (
              watchlists.map((wl) => (
                <div
                  key={wl.id}
                  className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    selectedId === wl.id
                      ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-800/50 border-l-2 border-l-transparent'
                  }`}
                  onClick={() => handleSelectWatchlist(wl)}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        selectedId === wl.id ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {wl.name}
                    </p>
                    {wl.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{wl.description}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">
                      {wl.item_count ?? 0} item{(wl.item_count ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWatchlist(wl.id);
                    }}
                    className="ml-2 p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete watchlist"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT: Items + Alerts                                         */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {selectedId == null ? (
            /* ---------- No selection placeholder ---------- */
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <BellIcon className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-1">No watchlist selected</h3>
              <p className="text-sm text-gray-500">
                Select a watchlist from the left to view its securities and set price alerts.
              </p>
            </div>
          ) : (
            <>
              {/* ---- Items Table ---- */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{selectedName}</h2>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Symbol
                  </button>
                </div>

                {itemsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-8 bg-gray-800 rounded" />
                    <div className="h-8 bg-gray-800 rounded" />
                    <div className="h-8 bg-gray-800 rounded" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-gray-500 text-sm mb-3">No securities in this watchlist yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add your first symbol
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Symbol</th>
                          <th className="text-left py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Name</th>
                          <th className="text-right py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Current Price</th>
                          <th className="text-right py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Alert Above</th>
                          <th className="text-right py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Alert Below</th>
                          <th className="text-center py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Alerts On</th>
                          <th className="text-center py-3 px-2 text-gray-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                          >
                            {/* Symbol */}
                            <td className="py-3 px-2">
                              <span className="font-semibold text-white">{item.symbol}</span>
                            </td>

                            {/* Name */}
                            <td className="py-3 px-2">
                              <span className="text-gray-400 text-xs truncate block max-w-[140px]">
                                {item.name}
                              </span>
                            </td>

                            {/* Current Price */}
                            <td className="py-3 px-2 text-right font-mono text-gray-300">
                              {formatPrice(item.current_price)}
                            </td>

                            {/* Alert Above */}
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="--"
                                  value={item.alert_price_above ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    setItems((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id ? { ...i, alert_price_above: val } : i,
                                      ),
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handleUpdateAlert(item.id, 'alert_price_above', val);
                                  }}
                                  className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                                />
                              </div>
                            </td>

                            {/* Alert Below */}
                            <td className="py-3 px-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="--"
                                  value={item.alert_price_below ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    setItems((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id ? { ...i, alert_price_below: val } : i,
                                      ),
                                    );
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handleUpdateAlert(item.id, 'alert_price_below', val);
                                  }}
                                  className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600"
                                />
                              </div>
                            </td>

                            {/* Alerts On toggle */}
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateAlert(item.id, 'alert_enabled', !item.alert_enabled)
                                  }
                                  disabled={savingAlerts[item.id]}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                    item.alert_enabled ? 'bg-blue-600' : 'bg-gray-700'
                                  }`}
                                  role="switch"
                                  aria-checked={item.alert_enabled}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      item.alert_enabled ? 'translate-x-4' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                                {savingAlerts[item.id] && (
                                  <svg className="animate-spin h-3 w-3 text-blue-400" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSecurity(item.security_id)}
                                className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Remove security"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ---- Price Alerts Summary ---- */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BellIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-white">Price Alerts</h2>
                  <span className="text-xs text-gray-500 ml-1">
                    ({items.filter((i) => i.alert_enabled).length} active)
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">Add securities to this watchlist to configure price alerts.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                          item.alert_enabled
                            ? 'bg-gray-800/50 border border-gray-700/50'
                            : 'bg-gray-800/20 border border-gray-800/30'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-white">{item.symbol}</span>
                          <span className="text-xs text-gray-500 ml-2">{item.name}</span>
                          <div className="flex items-center gap-4 mt-1">
                            {item.alert_price_above != null && (
                              <span className="text-xs text-gray-400">
                                Above:{' '}
                                <span className="text-green-400 font-mono">
                                  {formatPrice(item.alert_price_above)}
                                </span>
                              </span>
                            )}
                            {item.alert_price_below != null && (
                              <span className="text-xs text-gray-400">
                                Below:{' '}
                                <span className="text-red-400 font-mono">
                                  {formatPrice(item.alert_price_below)}
                                </span>
                              </span>
                            )}
                            {item.alert_price_above == null && item.alert_price_below == null && (
                              <span className="text-xs text-gray-600 italic">No alerts configured</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.alert_enabled
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-gray-700/50 text-gray-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.alert_enabled ? 'bg-green-400' : 'bg-gray-600'
                              }`}
                            />
                            {item.alert_enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateWatchlistModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateWatchlist}
      />

      {selectedId != null && (
        <AddSymbolModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSecurity}
        />
      )}
    </div>
  );
};

export default WatchlistPage;
