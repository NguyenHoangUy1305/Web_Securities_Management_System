import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import DashboardLayout from './components/Layout/DashboardLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import SecuritiesPage from './pages/SecuritiesPage';
import SecurityDetailPage from './pages/SecurityDetailPage';
import MarketDataPage from './pages/MarketDataPage';
import NewsPage from './pages/NewsPage';
import DividendsPage from './pages/DividendsPage';
import PortfolioPage from './pages/PortfolioPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AIAssistantPage from './pages/AIAssistantPage';
import ThemeSettingsPage from './pages/ThemeSettingsPage';
import TransactionsPage from './pages/TransactionsPage';
import WatchlistPage from './pages/WatchlistPage';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-gray-400 mt-2">This section is under development</p>
    </div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="securities" element={<SecuritiesPage />} />
          <Route path="securities/:symbol" element={<SecurityDetailPage />} />
          <Route path="market-data" element={<MarketDataPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="dividends" element={<DividendsPage />} />

          <Route path="portfolios" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
          <Route path="ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
          <Route path="theme-settings" element={<ProtectedRoute><ThemeSettingsPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
