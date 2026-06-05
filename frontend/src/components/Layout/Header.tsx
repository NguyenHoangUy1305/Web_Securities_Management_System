import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import {
  MagnifyingGlassIcon,
  BellIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onMenuToggle: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Header: FC<HeaderProps> = ({ onMenuToggle }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* ---- Left: hamburger (mobile) + search ---- */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        {/* Search */}
        <div className="hidden sm:block flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search securities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ---- Right: status / notifications / user ---- */}
      <div className="flex items-center gap-3">
        {/* Market status */}
        <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          Market Open
        </div>

        {/* Notifications (only when logged in) */}
        {isAuthenticated && (
          <button
            type="button"
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
          </button>
        )}

        {/* User section */}
        <div className="relative">
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden md:block text-sm">{user.name}</span>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-20">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm text-white font-medium">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button type="button" onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">Profile</button>
                      <button type="button" onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700">Logout</button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Login</a>
              <span className="text-slate-600">|</span>
              <a href="/register" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Register</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
