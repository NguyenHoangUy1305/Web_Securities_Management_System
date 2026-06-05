import { useAppSelector } from '../store/hooks';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import {
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  BellIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Transaction {
  id: string;
  symbol: string;
  type: 'Buy' | 'Sell';
  shares: number;
  price: number;
  total: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

interface GainerLoser {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const STATS = {
  portfolioValue: 245680.75,
  dailyPnl: 3240.5,
  dailyPnlPercent: 1.34,
  activeOrders: 12,
  pendingOrders: 3,
  watchlistAlerts: 3,
  priceAlerts: 2,
} as const;

const recentTransactions: Transaction[] = [
  { id: 'TRX-001', symbol: 'AAPL', type: 'Buy', shares: 50, price: 178.5, total: 8925, date: '2024-01-15', status: 'Completed' },
  { id: 'TRX-002', symbol: 'GOOGL', type: 'Sell', shares: 25, price: 141.2, total: 3530, date: '2024-01-14', status: 'Completed' },
  { id: 'TRX-003', symbol: 'MSFT', type: 'Buy', shares: 100, price: 378.9, total: 37890, date: '2024-01-14', status: 'Pending' },
  { id: 'TRX-004', symbol: 'TSLA', type: 'Buy', shares: 30, price: 245.6, total: 7368, date: '2024-01-13', status: 'Completed' },
  { id: 'TRX-005', symbol: 'AMZN', type: 'Sell', shares: 15, price: 152.3, total: 2284.5, date: '2024-01-12', status: 'Failed' },
];

const topGainers: GainerLoser[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 485.2, change: 15.2, changePercent: 3.23 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 142.8, change: 4.5, changePercent: 3.25 },
  { symbol: 'META', name: 'Meta Platforms', price: 358.4, change: 8.9, changePercent: 2.55 },
  { symbol: 'AAPL', name: 'Apple Inc', price: 178.5, change: 3.2, changePercent: 1.82 },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: 141.2, change: 2.1, changePercent: 1.51 },
];

const topLosers: GainerLoser[] = [
  { symbol: 'INTC', name: 'Intel Corp', price: 42.3, change: -2.8, changePercent: -6.21 },
  { symbol: 'DIS', name: 'Walt Disney Co', price: 89.5, change: -3.4, changePercent: -3.66 },
  { symbol: 'BA', name: 'Boeing Co', price: 210.4, change: -5.6, changePercent: -2.59 },
  { symbol: 'NKE', name: 'Nike Inc', price: 105.3, change: -2.1, changePercent: -1.96 },
  { symbol: 'CSCO', name: 'Cisco Systems', price: 48.7, change: -0.85, changePercent: -1.72 },
];

const marketIndices: IndexData[] = [
  { name: 'S&P 500', value: 4785.2, change: 40.3, changePercent: 0.85 },
  { name: 'NASDAQ', value: 15120.5, change: 187.5, changePercent: 1.25 },
  { name: 'DJIA', value: 37650.8, change: 168.2, changePercent: 0.45 },
  { name: 'VIX', value: 14.2, change: -0.35, changePercent: -2.41 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DashboardPage = () => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name ?? 'User'}. Here is your market overview.
        </p>
      </div>

      {/* ---- Stats cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <BriefcaseIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 mt-4">Total Portfolio Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(STATS.portfolioValue, 'USD')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all portfolios</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              {formatPercent(STATS.dailyPnlPercent)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-4">Today's P&amp;L</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            +{formatCurrency(STATS.dailyPnl, 'USD')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-sm text-gray-500 mt-4">Active Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{STATS.activeOrders}</p>
          <p className="text-xs text-gray-400 mt-1">{STATS.pendingOrders} pending execution</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="w-11 h-11 rounded-lg bg-red-50 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mt-4">Watchlist Alerts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{STATS.watchlistAlerts}</p>
          <p className="text-xs text-gray-400 mt-1">{STATS.priceAlerts} price alerts triggered</p>
        </div>
      </div>

      {/* ---- Chart + Gainers + Losers ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
          <div className="h-64 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-gray-100 flex items-center justify-center relative overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a56db" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1a56db" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path
                d="M0,160 C40,140 60,100 100,110 C140,120 160,60 200,70 C240,80 260,30 300,40 C340,50 370,20 400,25 L400,200 L0,200 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M0,160 C40,140 60,100 100,110 C140,120 160,60 200,70 C240,80 260,30 300,40 C340,50 370,20 400,25"
                fill="none"
                stroke="#1a56db"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-center relative">
              <p className="text-sm font-medium text-gray-400">Portfolio Growth Chart</p>
              <p className="text-xs text-gray-300 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>

        {/* Top Gainers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
            Top Gainers
          </h3>
          <div className="space-y-3">
            {topGainers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{stock.symbol}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[100px]">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${formatNumber(stock.price, 2)}
                  </p>
                  <p className="text-xs font-medium text-green-600">
                    +{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
            Top Losers
          </h3>
          <div className="space-y-3">
            {topLosers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{stock.symbol}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[100px]">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ${formatNumber(stock.price, 2)}
                  </p>
                  <p className="text-xs font-medium text-red-600">
                    {stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Transactions + Market Summary ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Symbol</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Shares</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Price</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Total</th>
                  <th className="text-right py-3 px-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-2 text-gray-500 text-xs">{tx.id}</td>
                    <td className="py-3 px-2 font-medium text-gray-900">{tx.symbol}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          tx.type === 'Buy'
                            ? 'text-green-700 bg-green-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      {formatNumber(tx.shares)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      ${tx.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      ${formatNumber(tx.total, 2)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          tx.status === 'Completed'
                            ? 'text-green-700 bg-green-50'
                            : tx.status === 'Pending'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Market Summary</h3>
          <div className="space-y-4">
            {marketIndices.map((index) => (
              <div
                key={index.name}
                className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-gray-900">{index.name}</p>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {index.value.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    className={`text-xs font-medium ${
                      index.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {index.change >= 0 ? '+' : ''}
                    {index.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
