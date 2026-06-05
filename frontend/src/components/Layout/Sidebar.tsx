import { type FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  StarIcon,
  NewspaperIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  PaintBrushIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Navigation config                                                  */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: typeof ChartBarIcon;
}

const publicNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: ChartBarIcon },
  { label: 'Securities', href: '/securities', icon: BanknotesIcon },
  { label: 'Market Data', href: '/market-data', icon: ArrowTrendingUpIcon },
  { label: 'News', href: '/news', icon: NewspaperIcon },
  { label: 'Dividends', href: '/dividends', icon: CurrencyDollarIcon },
];

const protectedNav: NavItem[] = [
  { label: 'Portfolio', href: '/portfolios', icon: BriefcaseIcon },
  { label: 'Orders', href: '/orders', icon: DocumentTextIcon },
  { label: 'Transactions', href: '/transactions', icon: ArrowPathIcon },
  { label: 'Watchlist', href: '/watchlist', icon: StarIcon },
  { label: 'AI Assistant', href: '/ai-assistant', icon: SparklesIcon },
  { label: 'Theme Settings', href: '/theme-settings', icon: PaintBrushIcon },
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Sidebar: FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-slate-900 text-white
        flex flex-col z-50 w-64
        transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 shrink-0">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <ChartBarIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">SecuritiesMS</span>
      </div>

      {/* ---- Public Navigation ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Market</p>
        {publicNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* ---- Protected Navigation (only when logged in) ---- */}
        {isAuthenticated && (
          <>
            <div className="border-t border-slate-800 my-3" />
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Account</p>
            {protectedNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* ---- User section ---- */}
      <div className="border-t border-slate-800 px-4 py-4 shrink-0">
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user.role ?? 'investor'}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors" title="Logout">
              <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export default Sidebar;
