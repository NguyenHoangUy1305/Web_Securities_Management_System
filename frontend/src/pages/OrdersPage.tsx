import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAppSelector } from '../store/hooks';
import { formatDateTime } from '../utils/formatters';
import type { Security } from '../types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type OrderSide = 'buy' | 'sell';
type OrderKind = 'market' | 'limit' | 'stop';

interface OrderItem {
  id: number;
  symbol: string;
  side: OrderSide;
  type: string;
  quantity: number;
  price: number | null;
  filled_quantity: number;
  total: number;
  status: string;
  created_at: string;
}

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookData {
  symbol: string;
  price: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

interface PortfolioBrief {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data generators                                               */
/* ------------------------------------------------------------------ */

function generateMockOrderBook(symbol: string, basePrice: number): OrderBookData {
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  for (let i = 1; i <= 6; i++) {
    const bidPrice = basePrice - i * 0.1;
    const askPrice = basePrice + i * 0.1;
    const bidQty = Math.round(Math.random() * 5000 + 500);
    const askQty = Math.round(Math.random() * 5000 + 500);
    bids.push({ price: parseFloat(bidPrice.toFixed(2)), quantity: bidQty, total: parseFloat((bidPrice * bidQty).toFixed(2)) });
    asks.push({ price: parseFloat(askPrice.toFixed(2)), quantity: askQty, total: parseFloat((askPrice * askQty).toFixed(2)) });
  }

  // Sort bids descending, asks ascending
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  return { symbol, price: basePrice, bids, asks };
}

function generateMockOrders(): OrderItem[] {
  const statuses = ['pending', 'filled', 'cancelled', 'partially_filled', 'rejected'];
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];
  const sides: OrderSide[] = ['buy', 'sell'];
  const orders: OrderItem[] = [];

  for (let i = 1; i <= 8; i++) {
    const side = sides[Math.floor(Math.random() * 2)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const qty = Math.round(Math.random() * 200 + 10);
    const price = parseFloat((Math.random() * 500 + 50).toFixed(2));
    orders.push({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      side,
      type: Math.random() > 0.5 ? 'market' : 'limit',
      quantity: qty,
      price: Math.random() > 0.3 ? price : null,
      filled_quantity: status === 'filled' ? qty : status === 'partially_filled' ? Math.round(qty / 2) : 0,
      total: price * qty,
      status,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return orders;
}

const MOCK_SECURITIES: Security[] = [
  { id: 1, symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.30, change_percent: 1.31, exchange: 'NASDAQ', currency: 'USD', volume: 52300000, updated_at: new Date().toISOString() },
  { id: 2, symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.20, change: 1.50, change_percent: 1.07, exchange: 'NASDAQ', currency: 'USD', volume: 18200000, updated_at: new Date().toISOString() },
  { id: 3, symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.90, change: -2.10, change_percent: -0.55, exchange: 'NASDAQ', currency: 'USD', volume: 19800000, updated_at: new Date().toISOString() },
  { id: 4, symbol: 'TSLA', name: 'Tesla Inc.', price: 245.60, change: 8.70, change_percent: 3.67, exchange: 'NASDAQ', currency: 'USD', volume: 87600000, updated_at: new Date().toISOString() },
  { id: 5, symbol: 'AMZN', name: 'Amazon.com Inc.', price: 152.30, change: 0.80, change_percent: 0.53, exchange: 'NASDAQ', currency: 'USD', volume: 31200000, updated_at: new Date().toISOString() },
  { id: 6, symbol: 'NVDA', name: 'NVIDIA Corp.', price: 485.20, change: 15.20, change_percent: 3.23, exchange: 'NASDAQ', currency: 'USD', volume: 245000000, updated_at: new Date().toISOString() },
  { id: 7, symbol: 'META', name: 'Meta Platforms Inc.', price: 358.40, change: 5.60, change_percent: 1.59, exchange: 'NASDAQ', currency: 'USD', volume: 16500000, updated_at: new Date().toISOString() },
  { id: 8, symbol: 'VNM', name: 'Vinhomes JSC', price: 38500, change: 500, change_percent: 1.32, exchange: 'HOSE', currency: 'VND', volume: 5200000, updated_at: new Date().toISOString() },
];

/* ------------------------------------------------------------------ */
/*  Status badge helper                                                */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    filled: 'bg-green-500/20 text-green-400 border-green-500/30',
    partially_filled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labelMap: Record<string, string> = {
    pending: 'Pending',
    open: 'Open',
    filled: 'Filled',
    partially_filled: 'Partial',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        colorMap[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const OrdersPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  /* ---------- form state ---------- */
  const [securities, setSecurities] = useState<Security[]>([]);
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioBrief[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderKind, setOrderKind] = useState<OrderKind>('market');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);

  /* ---------- data state ---------- */
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);

  /* ---------- ui state ---------- */
  const [submitting, setSubmitting] = useState(false);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  /* ---------- derived ---------- */
  const isPriceDisabled = orderKind === 'market';
  const total = isPriceDisabled || !price ? null : parseFloat(price) * quantity;

  /* ---------- fetch securities ---------- */
  useEffect(() => {
    setLoadingSecurities(true);
    api
      .get('/securities')
      .then((res) => {
        const raw = res.data?.data;
        const list: Security[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        setSecurities(list);
        if (list.length > 0) {
          setSelectedSecurity(list[0]);
        }
      })
      .catch(() => {
        setSecurities(MOCK_SECURITIES);
        setSelectedSecurity(MOCK_SECURITIES[0]);
      })
      .finally(() => setLoadingSecurities(false));
  }, []);

  /* ---------- fetch portfolios ---------- */
  useEffect(() => {
    api
      .get('/portfolios')
      .then((res) => {
        const raw = res.data?.data;
        const list: PortfolioBrief[] = (Array.isArray(raw) ? raw : raw?.data ?? []).map(
          (p: { id: number; name: string }) => ({ id: p.id, name: p.name }),
        );
        setPortfolios(list);
        if (list.length > 0) {
          setSelectedPortfolioId(list[0].id);
        }
      })
      .catch(() => {
        const fallback = [{ id: 1, name: 'Default Portfolio' }];
        setPortfolios(fallback);
        setSelectedPortfolioId(1);
      });
  }, []);

  /* ---------- fetch orders ---------- */
  const fetchOrders = useCallback(() => {
    setLoadingOrders(true);
    api
      .get('/orders')
      .then((res) => {
        const raw = res.data?.data;
        const list: OrderItem[] = Array.isArray(raw) ? raw : raw?.data ?? [];
        setOrders(list);
      })
      .catch(() => {
        setOrders(generateMockOrders());
      })
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ---------- update order book when security changes ---------- */
  useEffect(() => {
    if (!selectedSecurity) {
      setOrderBook(null);
      return;
    }

    const sym = selectedSecurity.symbol;
    const basePrice = selectedSecurity.price;

    api
      .get(`/securities/${selectedSecurity.id}/order-book`)
      .then((res) => {
        const data = res.data?.data;
        if (data?.bids && data?.asks) {
          setOrderBook({
            symbol: sym,
            price: basePrice,
            bids: data.bids,
            asks: data.asks,
          });
        } else {
          setOrderBook(generateMockOrderBook(sym, basePrice));
        }
      })
      .catch(() => {
        setOrderBook(generateMockOrderBook(sym, basePrice));
      });
  }, [selectedSecurity]);

  /* ---------- price auto-fill when not market ---------- */
  useEffect(() => {
    if (!isPriceDisabled && selectedSecurity && !price) {
      setPrice(selectedSecurity.price.toString());
    }
  }, [isPriceDisabled, selectedSecurity, price]);

  /* ---------- security select handler ---------- */
  const handleSecurityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sym = e.target.value;
    const found = securities.find((s) => s.symbol === sym) ?? null;
    setSelectedSecurity(found);
    setPrice('');
    setQuantity(1);
    setMessage(null);
  };

  /* ---------- quantity helpers ---------- */
  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setQuantity(val);
    } else if (e.target.value === '') {
      setQuantity(1);
    }
  };

  /* ---------- place order ---------- */
  const handlePlaceOrder = async () => {
    if (!selectedSecurity || !selectedPortfolioId) {
      setMessage({ type: 'error', text: 'Please select a security and ensure you have a portfolio.' });
      return;
    }

    if (quantity < 1) {
      setMessage({ type: 'error', text: 'Quantity must be at least 1.' });
      return;
    }

    if (!isPriceDisabled && (!price || parseFloat(price) <= 0)) {
      setMessage({ type: 'error', text: 'Please enter a valid price.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload: Record<string, unknown> = {
      portfolio_id: selectedPortfolioId,
      security_id: selectedSecurity.id,
      symbol: selectedSecurity.symbol,
      side,
      order_type: orderKind,
      quantity,
    };

    if (!isPriceDisabled && price) {
      payload.price = parseFloat(price);
    }

    try {
      await api.post('/orders', payload);
      setMessage({ type: 'success', text: `Order placed successfully: ${side.toUpperCase()} ${quantity} ${selectedSecurity.symbol}` });
      setQuantity(1);
      setPrice('');
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message ?? error.message ?? 'Failed to place order. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- cancel order ---------- */
  const handleCancelOrder = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      setMessage({ type: 'success', text: 'Order cancelled successfully.' });
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error.response?.data?.message ?? error.message ?? 'Failed to cancel order.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setCancellingId(null);
    }
  };

  /* ---------- clear message after timeout ---------- */
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [message]);

  /* ---------- render ---------- */
  const canCancel = (status: string) => status === 'pending' || status === 'open';

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">Place Order</h1>
        <p className="text-sm text-gray-400 mt-1">
          Welcome back, {user?.name ?? 'User'}. Place buy or sell orders for your portfolio.
        </p>
      </div>

      {/* ---- Message banner ---- */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---- Top row: Order Form + Order Book ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ======== Order Form ======== */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">New Order</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* ---- Left column ---- */}

            {/* Security selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Security</label>
              <select
                value={selectedSecurity?.symbol ?? ''}
                onChange={handleSecurityChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                {loadingSecurities ? (
                  <option value="">Loading...</option>
                ) : (
                  securities.map((s) => (
                    <option key={s.id} value={s.symbol}>
                      {s.symbol} - {s.name}
                    </option>
                  ))
                )}
              </select>
              {selectedSecurity && (
                <p className="text-xs text-gray-500 mt-1">
                  Current price: {selectedSecurity.current_price
                    ? `${Number(selectedSecurity.current_price).toLocaleString()} VND`
                    : '--'}
                </p>
              )}
            </div>

            {/* Portfolio selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Portfolio</label>
              <select
                value={selectedPortfolioId ?? ''}
                onChange={(e) => setSelectedPortfolioId(parseInt(e.target.value, 10))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              >
                {portfolios.length === 0 && <option value="">No portfolios</option>}
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Quantity</label>
              <div className="flex items-center gap-0">
                <button
                  type="button"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                  className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-l-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-lg font-medium"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={handleQuantityInput}
                  className="w-24 text-center bg-gray-800 border-t border-b border-gray-700 px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => adjustQuantity(1)}
                  className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-r-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Price {isPriceDisabled && <span className="text-gray-500 font-normal">(N/A for Market)</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isPriceDisabled}
                  placeholder={isPriceDisabled ? 'Market price' : 'Enter price'}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {selectedSecurity && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {selectedSecurity.currency}
                  </span>
                )}
              </div>
            </div>

            {/* ---- Right column ---- */}

            {/* Buy / Sell toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Order Type</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-700">
                <button
                  type="button"
                  onClick={() => setSide('buy')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    side === 'buy'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide('sell')}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    side === 'sell'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Order kind radio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Order Kind</label>
              <div className="flex gap-3">
                {(['market', 'limit', 'stop'] as OrderKind[]).map((kind) => (
                  <label
                    key={kind}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                      orderKind === kind
                        ? kind === 'market'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : kind === 'limit'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderKind"
                      value={kind}
                      checked={orderKind === kind}
                      onChange={() => {
                        setOrderKind(kind);
                        if (kind !== 'market') {
                          setPrice('');
                        }
                      }}
                      className="sr-only"
                    />
                    {kind === 'market' ? 'Market' : kind === 'limit' ? 'Limit' : 'Stop'}
                  </label>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="md:col-span-2 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Estimated Total</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm font-mono">
                  {total !== null && selectedSecurity
                    ? selectedSecurity.currency === 'VND'
                      ? `${total.toLocaleString()} VND`
                      : `$${total.toFixed(2)}`
                    : '--'}
                </div>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={submitting || !selectedSecurity || !selectedPortfolioId}
                  className={`px-8 py-2.5 rounded-lg text-sm font-bold text-white transition-all ${
                    side === 'buy'
                      ? 'bg-green-600 hover:bg-green-500 active:bg-green-700'
                      : 'bg-red-600 hover:bg-red-500 active:bg-red-700'
                  } disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                    side === 'buy'
                      ? 'shadow-green-600/20'
                      : 'shadow-red-600/20'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Placing...
                    </span>
                  ) : (
                    `Place ${side === 'buy' ? 'Buy' : 'Sell'} Order`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======== Order Book ======== */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Order Book
            {selectedSecurity && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                {selectedSecurity.symbol}
              </span>
            )}
          </h2>

          {!selectedSecurity ? (
            <p className="text-sm text-gray-500">Select a security to view the order book.</p>
          ) : orderBook ? (
            <div className="space-y-3">
              {/* Latest price */}
              <div className="text-center py-3 border-b border-gray-800">
                <p className="text-xs text-gray-500 mb-0.5">Last Price</p>
                <p className={`text-2xl font-bold font-mono ${
                  orderBook.price >= 0 ? 'text-white' : 'text-white'
                }`}>
                  {orderBook.price != null
                    ? Number(orderBook.price).toLocaleString()
                    : '--'}
                </p>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 font-medium px-1">
                <span className="text-left">Price</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Total</span>
              </div>

              {/* Asks (sell orders) */}
              <div className="space-y-0.5">
                {orderBook.asks.slice(0, 6).reverse().map((level, i) => (
                  <div
                    key={`ask-${i}`}
                    className="grid grid-cols-3 gap-2 text-xs font-mono px-1 py-0.5 rounded hover:bg-gray-800/50"
                  >
                    <span className="text-left text-red-400 font-medium">{level.price.toFixed(2)}</span>
                    <span className="text-right text-gray-300">{level.quantity.toLocaleString()}</span>
                    <span className="text-right text-gray-500">{level.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>

              {/* Spread */}
              {orderBook.asks.length > 0 && orderBook.bids.length > 0 && (
                <div className="border-t border-b border-gray-800 py-2 text-center">
                  <span className="text-xs text-gray-500">
                    Spread: {(orderBook.asks[orderBook.asks.length - 1].price - orderBook.bids[0].price).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Bids (buy orders) */}
              <div className="space-y-0.5">
                {orderBook.bids.slice(0, 6).map((level, i) => (
                  <div
                    key={`bid-${i}`}
                    className="grid grid-cols-3 gap-2 text-xs font-mono px-1 py-0.5 rounded hover:bg-gray-800/50"
                  >
                    <span className="text-left text-green-400 font-medium">{level.price.toFixed(2)}</span>
                    <span className="text-right text-gray-300">{level.quantity.toLocaleString()}</span>
                    <span className="text-right text-gray-500">{level.total.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading order book...</p>
          )}
        </div>
      </div>

      {/* ======== My Orders ======== */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Orders</h2>
          <button
            type="button"
            onClick={fetchOrders}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Symbol</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Side</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Quantity</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Price</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Date</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No orders yet. Place your first order above.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-3 font-medium text-white">{order.symbol}</td>
                    <td className="py-3 px-3">
                      <span className="text-gray-300 capitalize">{order.type}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          order.side === 'buy'
                            ? 'text-green-400 bg-green-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {order.side === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300 font-mono">
                      {order.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-300 font-mono">
                      {order.price != null ? (selectedSecurity?.currency === 'VND' ? order.price.toLocaleString() : `$${order.price.toFixed(2)}`) : '--'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-3 text-right text-gray-400 text-xs whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canCancel(order.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                        >
                          {cancellingId === order.id ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              ...
                            </span>
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
