import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import api from '../services/api';
import { formatDate, formatCompactNumber } from '../utils/formatters';
import {
  Cog6ToothIcon,
  UsersIcon,
  ChartBarIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Tab = 'users' | 'securities' | 'settings' | 'theme';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role?: string;
  roles?: { name: string }[] | string[];
  created_at: string;
  updated_at: string;
}

interface AdminSecurity {
  id: number;
  symbol: string;
  name: string;
  type: string;
  market_cap?: number | null;
  current_price?: number;
  is_active?: boolean;
  [key: string]: unknown;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface SecurityStats {
  total: number;
  stocks: number;
  etfs: number;
  bonds: number;
  totalMarketCap: number;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS = ['admin', 'broker', 'investor'] as const;

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/40 text-green-400 border-green-700',
  inactive: 'bg-yellow-900/40 text-yellow-400 border-yellow-700',
  banned: 'bg-red-900/40 text-red-400 border-red-700',
};

const TABS: { key: Tab; label: string; icon: typeof UsersIcon }[] = [
  { key: 'users', label: 'User Management', icon: UsersIcon },
  { key: 'securities', label: 'Securities Management', icon: ChartBarIcon },
  { key: 'settings', label: 'System Settings', icon: Cog6ToothIcon },
  { key: 'theme', label: 'Theme Settings', icon: PaintBrushIcon },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function extractUserRole(user: AdminUser): string {
  if (user.role) return user.role;
  if (user.roles) {
    if (Array.isArray(user.roles)) {
      if (user.roles.length === 0) return 'investor';
      const first = user.roles[0];
      if (typeof first === 'string') return first;
      if (typeof first === 'object' && first !== null && 'name' in first) {
        return (first as { name: string }).name;
      }
    }
    if (typeof user.roles === 'string') return user.roles;
  }
  return 'investor';
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '********';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

function calcStats(securities: AdminSecurity[]): SecurityStats {
  let stocks = 0;
  let etfs = 0;
  let bonds = 0;
  let totalMarketCap = 0;

  for (const s of securities) {
    const t = (s.type ?? '').toLowerCase();
    if (t === 'stock') stocks++;
    else if (t === 'etf') etfs++;
    else if (t === 'bond') bonds++;

    if (s.market_cap != null) {
      totalMarketCap += Number(s.market_cap);
    }
  }

  return {
    total: securities.length,
    stocks,
    etfs,
    bonds,
    totalMarketCap,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // ── Redirect non-admin users ──────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Tab state ─────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('users');

  // ── User Management state ─────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);

  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);

  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'investor',
    status: 'active',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Securities Management state ───────────────────────────────────
  const [securities, setSecurities] = useState<AdminSecurity[]>([]);
  const [securitiesLoading, setSecuritiesLoading] = useState(true);
  const [securitiesError, setSecuritiesError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastSyncTime = localStorage.getItem('last_sync_time');

  // ── System Settings state ─────────────────────────────────────────
  const [finnhubKey, setFinnhubKey] = useState(() => localStorage.getItem('finnhub_api_key') ?? '');
  const [alphaKey, setAlphaKey] = useState(() => localStorage.getItem('alpha_vantage_api_key') ?? '');
  const [showFinnhub, setShowFinnhub] = useState(false);
  const [showAlpha, setShowAlpha] = useState(false);
  const [marketStatus, setMarketStatus] = useState(() => localStorage.getItem('market_status') ?? 'closed');
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('maintenance_mode') === 'true');

  // ── Theme settings ────────────────────────────────────────────────
  const themeCtx = useTheme();

  // ── Data fetching: Users ──────────────────────────────────────────
  const fetchUsers = useCallback(async (search?: string) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const params: Record<string, string | number> = { per_page: 15, page };
      if (search) params.search = search;
      const response = await api.get('/users', { params });
      const body = response.data;
      const paginated = body.data as {
        data: AdminUser[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
      };
      setUsers(paginated.data ?? []);
      setPagination({
        current_page: paginated.current_page,
        last_page: paginated.last_page,
        per_page: paginated.per_page,
        total: paginated.total,
        from: paginated.from,
        to: paginated.to,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to load users.';
      setUsersError(msg);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers(searchTerm);
  }, [fetchUsers, searchTerm]);

  // ── Data fetching: Securities ─────────────────────────────────────
  const fetchSecurities = useCallback(async () => {
    setSecuritiesLoading(true);
    setSecuritiesError(null);
    try {
      const response = await api.get('/securities', { params: { per_page: 200 } });
      const body = response.data;
      const data = body.data as { data?: AdminSecurity[] };
      const list = data?.data ?? [];
      setSecurities(list);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to load securities.';
      setSecuritiesError(msg);
      setSecurities([]);
    } finally {
      setSecuritiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'securities') {
      fetchSecurities();
    }
  }, [activeTab, fetchSecurities]);

  // ── Handlers: Role update ─────────────────────────────────────────
  const handleRoleChange = async (userId: number, newRole: string) => {
    setUpdatingRoleId(userId);
    setRoleUpdateError(null);
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update role.';
      setRoleUpdateError(msg);
      setTimeout(() => setRoleUpdateError(null), 3000);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  // ── Handlers: Delete user ─────────────────────────────────────────
  const confirmDelete = (target: AdminUser) => {
    setDeleteTarget(target);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const userId = deleteTarget.id;
    setDeletingUserId(userId);
    setDeleteError(null);
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to delete user.';
      setDeleteError(msg);
    } finally {
      setDeletingUserId(null);
    }
  };

  // ── Handlers: Create user ─────────────────────────────────────────
  const handleCreateInputChange = (field: keyof CreateUserPayload, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!createForm.name.trim()) errors.name = 'Name is required.';
    if (!createForm.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = 'Invalid email format.';
    }
    if (!createForm.password) errors.password = 'Password is required.';
    else if (createForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (createForm.password !== createForm.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const response = await api.post('/users', createForm);
      const body = response.data;
      const newUser = (body.data?.user ?? body.data) as AdminUser | undefined;
      if (newUser) {
        setUsers((prev) => [newUser, ...prev]);
      } else {
        // If the response doesn't include the user, refetch the list.
        fetchUsers(searchTerm);
      }
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'investor',
        status: 'active',
      });
      setFieldErrors({});
    } catch (err: unknown) {
      const e = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };
      const msg = e?.response?.data?.message ?? 'Failed to create user.';
      setCreateError(msg);
      // Populate field errors from server validation
      const serverErrors = e?.response?.data?.errors;
      if (serverErrors) {
        const mapped: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(serverErrors)) {
          mapped[key] = msgs[0];
        }
        setFieldErrors((prev) => ({ ...prev, ...mapped }));
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Handlers: Sync market data ────────────────────────────────────
  const handleSyncMarketData = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setSyncError(null);
    try {
      await api.post('/sync/market-data');
      const now = new Date().toISOString();
      localStorage.setItem('last_sync_time', now);
      setSyncMessage('Market data synchronized successfully.');
      // Refresh securities after sync
      fetchSecurities();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Sync request failed. The sync endpoint may not be configured on the server.';
      setSyncError(msg);
    } finally {
      setSyncing(false);
    }
  };

  // ── Handlers: Settings ────────────────────────────────────────────
  const handleFinnhubKeyBlur = () => {
    localStorage.setItem('finnhub_api_key', finnhubKey);
  };

  const handleAlphaKeyBlur = () => {
    localStorage.setItem('alpha_vantage_api_key', alphaKey);
  };

  const toggleMarketStatus = () => {
    const next = marketStatus === 'open' ? 'closed' : 'open';
    setMarketStatus(next);
    localStorage.setItem('market_status', next);
  };

  const toggleMaintenanceMode = () => {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    localStorage.setItem('maintenance_mode', String(next));
  };

  /* ------------------------------------------------------------------ */
  /*  Guard: not authenticated or not admin                              */
  /* ------------------------------------------------------------------ */

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return null; // useEffect will navigate away
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Tab buttons                                                */
  /* ------------------------------------------------------------------ */

  const renderTabs = () => (
    <div className="flex border-b border-gray-700">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active
                ? 'text-blue-400 border-blue-500'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: User Management tab                                        */
  /* ------------------------------------------------------------------ */

  const renderUsersTab = () => (
    <div className="space-y-4">
      {/* Toolbar: search + create */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchTerm(searchInput);
                setPage(1);
              }
            }}
            className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setSearchTerm(searchInput);
            setPage(1);
          }}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setFieldErrors({});
            setCreateForm({
              name: '',
              email: '',
              password: '',
              password_confirmation: '',
              role: 'investor',
              status: 'active',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors ml-auto"
        >
          <PlusIcon className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Error banner */}
      {roleUpdateError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
          <XCircleIcon className="w-4 h-4 shrink-0" />
          {roleUpdateError}
        </div>
      )}

      {/* Users table */}
      {usersLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : usersError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <XCircleIcon className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-red-300 text-sm mb-3">{usersError}</p>
          <button
            type="button"
            onClick={() => fetchUsers(searchTerm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UsersIcon className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No users found.</p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
                setPage(1);
              }}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Created At</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="bg-gray-900/50 hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-300">{u.id}</td>
                  <td className="py-3 px-4 font-medium text-white">{u.name}</td>
                  <td className="py-3 px-4 text-gray-300">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={extractUserRole(u)}
                      disabled={updatingRoleId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    {updatingRoleId === u.id && (
                      <span className="ml-2 text-xs text-blue-400">Saving...</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        STATUS_STYLES[u.status] ?? 'bg-gray-800 text-gray-400 border-gray-600'
                      }`}
                    >
                      {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {u.created_at ? formatDate(u.created_at) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => confirmDelete(u)}
                      disabled={deletingUserId === u.id}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      {deletingUserId === u.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400 pt-2">
          <span>
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total} users
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-2">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              type="button"
              disabled={page >= pagination.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────── */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                <p className="text-sm text-gray-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to delete user{' '}
              <span className="font-medium text-white">{deleteTarget.name}</span> (
              <span className="text-gray-400">{deleteTarget.email}</span>)?
            </p>

            {deleteError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300 mb-4">
                <XCircleIcon className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                  setDeleteError(null);
                }}
                disabled={deletingUserId !== null}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deletingUserId !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingUserId !== null && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                )}
                {deletingUserId !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create user modal ─────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Create User</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => handleCreateInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Full name"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => handleCreateInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="user@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => handleCreateInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.password ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Min. 8 characters"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={createForm.password_confirmation}
                  onChange={(e) => handleCreateInputChange('password_confirmation', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.password_confirmation ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Repeat password"
                />
                {fieldErrors.password_confirmation && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.password_confirmation}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => handleCreateInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => handleCreateInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {/* Create error */}
              {createError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
                  <XCircleIcon className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {createLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  {createLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Securities Management tab                                  */
  /* ------------------------------------------------------------------ */

  const renderSecuritiesTab = () => {
    const stats = calcStats(securities);

    const statCards = [
      { label: 'Total Securities', value: stats.total, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800' },
      { label: 'Stocks', value: stats.stocks, color: 'text-green-400', bg: 'bg-green-900/20 border-green-800' },
      { label: 'ETFs', value: stats.etfs, color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800' },
      { label: 'Bonds', value: stats.bonds, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800' },
      {
        label: 'Total Market Cap',
        value: stats.totalMarketCap > 0 ? `$${formatCompactNumber(stats.totalMarketCap)}` : 'N/A',
        color: 'text-cyan-400',
        bg: 'bg-cyan-900/20 border-cyan-800',
      },
    ];

    return (
      <div className="space-y-6">
        {/* Stats grid */}
        {securitiesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : securitiesError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <XCircleIcon className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-300 text-sm mb-3">{securitiesError}</p>
            <button
              type="button"
              onClick={fetchSecurities}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-xl border p-5 ${card.bg}`}
              >
                <p className="text-sm text-gray-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Sync section */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-2">Market Data Sync</h3>
          <p className="text-sm text-gray-400 mb-4">
            Pull the latest market data from external providers and update all security prices.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="button"
              onClick={handleSyncMarketData}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Market Data'}
            </button>

            {lastSyncTime && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
                Last sync: {formatDate(lastSyncTime)}{' '}
                {new Date(lastSyncTime).toLocaleTimeString()}
              </div>
            )}
          </div>

          {syncMessage && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-green-900/40 border border-green-700 rounded-lg text-sm text-green-300">
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              {syncMessage}
            </div>
          )}

          {syncError && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-sm text-red-300">
              <XCircleIcon className="w-4 h-4 shrink-0" />
              {syncError}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Render: System Settings tab                                        */
  /* ------------------------------------------------------------------ */

  const renderSettingsTab = () => (
    <div className="space-y-6 max-w-2xl">
      {/* API Keys */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">API Keys</h3>

        <div className="space-y-4">
          {/* Finnhub */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Finnhub API Key</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showFinnhub ? 'text' : 'password'}
                  value={finnhubKey}
                  onChange={(e) => setFinnhubKey(e.target.value)}
                  onBlur={handleFinnhubKeyBlur}
                  placeholder="Enter Finnhub API key"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowFinnhub(!showFinnhub)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  {showFinnhub ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-xs text-gray-500 min-w-[80px] text-right">
                {finnhubKey ? maskKey(finnhubKey) : 'Not set'}
              </span>
            </div>
          </div>

          {/* Alpha Vantage */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Alpha Vantage API Key</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showAlpha ? 'text' : 'password'}
                  value={alphaKey}
                  onChange={(e) => setAlphaKey(e.target.value)}
                  onBlur={handleAlphaKeyBlur}
                  placeholder="Enter Alpha Vantage API key"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAlpha(!showAlpha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
                >
                  {showAlpha ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-xs text-gray-500 min-w-[80px] text-right">
                {alphaKey ? maskKey(alphaKey) : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          API keys are stored locally in your browser. They are not sent to the server unless used by backend services.
        </p>
      </div>

      {/* Market Status */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Market Status</h3>
            <p className="text-sm text-gray-400 mt-1">
              {marketStatus === 'open'
                ? 'Markets are currently open for trading.'
                : 'Markets are currently closed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMarketStatus}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
              marketStatus === 'open' ? 'bg-green-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                marketStatus === 'open' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              marketStatus === 'open' ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          <span className={`text-sm font-medium ${marketStatus === 'open' ? 'text-green-400' : 'text-gray-400'}`}>
            {marketStatus === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Maintenance Mode</h3>
            <p className="text-sm text-gray-400 mt-1">
              {maintenanceMode
                ? 'The system is in maintenance mode. User access may be restricted.'
                : 'System is operating normally.'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMaintenanceMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
              maintenanceMode ? 'bg-amber-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                maintenanceMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {maintenanceMode ? (
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircleIcon className="w-4 h-4 text-green-400" />
          )}
          <span
            className={`text-sm font-medium ${maintenanceMode ? 'text-amber-400' : 'text-green-400'}`}
          >
            {maintenanceMode ? 'Maintenance Active' : 'Normal Operation'}
          </span>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Theme Settings tab                                         */
  /* ------------------------------------------------------------------ */

  const renderThemeTab = () => {
    const {
      primaryColor,
      bgColor,
      cardBgColor,
      textColor,
      accentColor,
      sidebarWidth,
      fontSize,
      roundedCorners,
      animations,
      updateTheme,
      resetTheme,
    } = themeCtx;

    const sidebarWidthIndex = sidebarWidth === 'narrow' ? 0 : sidebarWidth === 'wide' ? 2 : 1;
    const fontSizeIndex = fontSize === 'small' ? 0 : fontSize === 'large' ? 2 : 1;
    const widthValues: Array<'narrow' | 'medium' | 'wide'> = ['narrow', 'medium', 'wide'];
    const fontSizeValues: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

    const ColorField = ({
      label,
      value,
      onChange,
    }: {
      label: string;
      value: string;
      onChange: (v: string) => void;
    }) => (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-14 rounded cursor-pointer border border-gray-600 bg-transparent p-0.5"
          />
          <span className="text-xs text-gray-400 font-mono">{value}</span>
        </div>
      </div>
    );

    return (
      <div className="space-y-6 max-w-2xl">
        {/* Color Scheme */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Color Scheme</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ColorField label="Primary Color" value={primaryColor} onChange={(v) => updateTheme({ primaryColor: v })} />
            <ColorField label="Background Color" value={bgColor} onChange={(v) => updateTheme({ bgColor: v })} />
            <ColorField label="Card Background" value={cardBgColor} onChange={(v) => updateTheme({ cardBgColor: v })} />
            <ColorField label="Text Color" value={textColor} onChange={(v) => updateTheme({ textColor: v })} />
            <ColorField label="Accent Color" value={accentColor} onChange={(v) => updateTheme({ accentColor: v })} />
          </div>
        </div>

        {/* Layout */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Layout</h3>
          <div className="space-y-5">
            {/* Sidebar width */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sidebar Width
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-12 shrink-0">Narrow</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={sidebarWidthIndex}
                  onChange={(e) =>
                    updateTheme({ sidebarWidth: widthValues[Number(e.target.value)] })
                  }
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-gray-500 w-12 shrink-0 text-right">Wide</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 capitalize">Current: {sidebarWidth}</p>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-12 shrink-0">Small</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={fontSizeIndex}
                  onChange={(e) =>
                    updateTheme({ fontSize: fontSizeValues[Number(e.target.value)] })
                  }
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xs text-gray-500 w-12 shrink-0 text-right">Large</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 capitalize">Current: {fontSize}</p>
            </div>

            {/* Rounded corners */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Rounded Corners</label>
                <p className="text-xs text-gray-500">Use rounded corners for UI elements</p>
              </div>
              <button
                type="button"
                onClick={() => updateTheme({ roundedCorners: !roundedCorners })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                  roundedCorners ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    roundedCorners ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Animations</label>
                <p className="text-xs text-gray-500">Enable transitions and animations</p>
              </div>
              <button
                type="button"
                onClick={() => updateTheme({ animations: !animations })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                  animations ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    animations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-2">Reset Settings</h3>
          <p className="text-sm text-gray-400 mb-4">
            Restore all theme settings to their default values.
          </p>
          <button
            type="button"
            onClick={resetTheme}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Main render                                                        */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6 text-white">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage users, securities, and system settings.
        </p>
      </div>

      {/* Tabs */}
      {renderTabs()}

      {/* Tab content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'securities' && renderSecuritiesTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'theme' && renderThemeTab()}
    </div>
  );
};

export default AdminPage;
