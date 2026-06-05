import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const SecurityDetailPage = () => {
  const { symbol } = useParams<{ symbol: string }>();

  return (
    <div className="space-y-6">
      {/* -- Back link -- */}
      <Link
        to="/securities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Securities
      </Link>

      {/* -- Header -- */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-400">
              {symbol?.slice(0, 2) ?? '?'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Security Detail: {symbol ?? 'Unknown'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Detailed information and market data for {symbol ?? 'this security'}
            </p>
          </div>
        </div>
      </div>

      {/* -- Placeholder content -- */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            Detail page under development
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Charts, financials, and news for {symbol ?? 'this security'} will appear here
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityDetailPage;
