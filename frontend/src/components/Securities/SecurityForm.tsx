import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createSecurity, updateSecurity } from '../../services/securitiesService';
import type { CreateSecurityPayload } from '../../services/securitiesService';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SecurityFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** When non-null the form switches to edit mode */
  editingSecurity?: {
    id: number;
    symbol: string;
    name: string;
    exchange: string;
    type?: string;
    sector?: string;
    industry?: string;
    /** The listing response uses `price`; the form uses `current_price` */
    price?: number;
    current_price?: number;
    market_cap?: number;
    eps?: number;
    pe_ratio?: number;
    dividend_yield?: number;
  } | null;
}

type FieldErrors = Record<string, string>;

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SECURITY_TYPES = [
  { value: 'stock', label: 'Stock' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Bond' },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SecurityForm = ({ isOpen, onClose, onSuccess, editingSecurity }: SecurityFormProps) => {
  const isEditMode = !!editingSecurity;

  /* ---- individual field state (strings for form inputs) ---- */

  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [exchange, setExchange] = useState('');
  const [type, setType] = useState('stock');
  const [sector, setSector] = useState('');
  const [industry, setIndustry] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [eps, setEps] = useState('');
  const [peRatio, setPeRatio] = useState('');
  const [dividendYield, setDividendYield] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ------ initialise / reset on open or editingSecurity change ------ */

  useEffect(() => {
    if (editingSecurity) {
      setSymbol(editingSecurity.symbol || '');
      setName(editingSecurity.name || '');
      setExchange(editingSecurity.exchange || '');
      setType(editingSecurity.type || 'stock');
      setSector(editingSecurity.sector || '');
      setIndustry(editingSecurity.industry || '');
      /** Map either `current_price` or `price` (listing response) */
      const p = editingSecurity.current_price ?? editingSecurity.price;
      setCurrentPrice(p != null ? String(p) : '');
      setMarketCap(editingSecurity.market_cap != null ? String(editingSecurity.market_cap) : '');
      setEps(editingSecurity.eps != null ? String(editingSecurity.eps) : '');
      setPeRatio(editingSecurity.pe_ratio != null ? String(editingSecurity.pe_ratio) : '');
      setDividendYield(editingSecurity.dividend_yield != null ? String(editingSecurity.dividend_yield) : '');
    } else {
      /* reset for create mode */
      setSymbol('');
      setName('');
      setExchange('');
      setType('stock');
      setSector('');
      setIndustry('');
      setCurrentPrice('');
      setMarketCap('');
      setEps('');
      setPeRatio('');
      setDividendYield('');
    }
    setErrors({});
    setSubmitError(null);
  }, [editingSecurity, isOpen]);

  /* ------ validation ------ */

  const validate = (): boolean => {
    const next: FieldErrors = {};

    if (!symbol.trim()) next.symbol = 'Symbol is required';
    else if (symbol.trim().length > 10) next.symbol = 'Symbol must be 10 characters or less';

    if (!name.trim()) next.name = 'Name is required';

    if (!exchange.trim()) next.exchange = 'Exchange is required';

    if (!currentPrice.trim()) {
      next.current_price = 'Current price is required';
    } else {
      const n = Number(currentPrice);
      if (isNaN(n) || n <= 0) next.current_price = 'Price must be a positive number';
    }

    if (marketCap.trim()) {
      const n = Number(marketCap);
      if (isNaN(n) || n < 0) next.market_cap = 'Market cap must be a non-negative number';
    }

    if (eps.trim() && isNaN(Number(eps))) next.eps = 'EPS must be a valid number';

    if (peRatio.trim()) {
      const n = Number(peRatio);
      if (isNaN(n) || n < 0) next.pe_ratio = 'P/E ratio must be a non-negative number';
    }

    if (dividendYield.trim()) {
      const n = Number(dividendYield);
      if (isNaN(n) || n < 0) next.dividend_yield = 'Dividend yield must be a non-negative number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ------ submit ------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateSecurityPayload = {
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        exchange: exchange.trim().toUpperCase(),
        type,
        sector: sector.trim() || undefined,
        industry: industry.trim() || undefined,
        current_price: Number(currentPrice),
        market_cap: marketCap.trim() ? Number(marketCap) : undefined,
        eps: eps.trim() ? Number(eps) : undefined,
        pe_ratio: peRatio.trim() ? Number(peRatio) : undefined,
        dividend_yield: dividendYield.trim() ? Number(dividendYield) : undefined,
      };

      if (isEditMode && editingSecurity) {
        await updateSecurity(editingSecurity.id, payload);
      } else {
        await createSecurity(payload);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        message?: string;
      };
      const msg =
        apiErr.response?.data?.message ??
        apiErr.message ??
        'An unexpected error occurred';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  /* ------ render ------ */

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex">
        <div className="w-full bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col">
          {/* ---- Header ---- */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
            <h2 className="text-lg font-semibold text-white">
              {isEditMode ? 'Edit Security' : 'Add Security'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* ---- Form ---- */}
          <form
            id="security-form"
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Symbol <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. AAPL"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                    errors.symbol ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.symbol && (
                  <p className="mt-1 text-xs text-red-400">{errors.symbol}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apple Inc."
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>

              {/* Exchange + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Exchange <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value)}
                    placeholder="e.g. NASDAQ"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                      errors.exchange ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.exchange && (
                    <p className="mt-1 text-xs text-red-400">{errors.exchange}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  >
                    {SECURITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sector + Industry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sector</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g. Technology"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Consumer Electronics"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              {/* Current Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Price <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                    errors.current_price ? 'border-red-500' : 'border-gray-700'
                  }`}
                />
                {errors.current_price && (
                  <p className="mt-1 text-xs text-red-400">{errors.current_price}</p>
                )}
              </div>

              {/* Market Cap, EPS, P/E, Dividend Yield */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Market Cap
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={marketCap}
                    onChange={(e) => setMarketCap(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                      errors.market_cap ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.market_cap && (
                    <p className="mt-1 text-xs text-red-400">{errors.market_cap}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">EPS</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eps}
                    onChange={(e) => setEps(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                      errors.eps ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.eps && <p className="mt-1 text-xs text-red-400">{errors.eps}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    P/E Ratio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={peRatio}
                    onChange={(e) => setPeRatio(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                      errors.pe_ratio ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.pe_ratio && (
                    <p className="mt-1 text-xs text-red-400">{errors.pe_ratio}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Dividend Yield (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dividendYield}
                    onChange={(e) => setDividendYield(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${
                      errors.dividend_yield ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {errors.dividend_yield && (
                    <p className="mt-1 text-xs text-red-400">{errors.dividend_yield}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Footer ---- */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isEditMode ? 'Save Changes' : 'Add Security'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SecurityForm;
