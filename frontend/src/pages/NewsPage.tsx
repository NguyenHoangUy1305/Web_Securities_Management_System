import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { NewsItem, PaginatedResponse } from '../types';
import { formatDate } from '../utils/formatters';
import {
  NewspaperIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Sentiment = 'positive' | 'negative' | 'neutral';

interface ArticleWithSentiment extends NewsItem {
  sentiment?: Sentiment;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; classes: string }> = {
  positive: {
    label: 'Positive',
    classes: 'bg-green-900/60 text-green-300 border-green-700/50',
  },
  negative: {
    label: 'Negative',
    classes: 'bg-red-900/60 text-red-300 border-red-700/50',
  },
  neutral: {
    label: 'Neutral',
    classes: 'bg-gray-700/60 text-gray-300 border-gray-600/50',
  },
};

function getSentiment(article: ArticleWithSentiment): Sentiment {
  if (article.sentiment && ['positive', 'negative', 'neutral'].includes(article.sentiment)) {
    return article.sentiment;
  }
  return 'neutral';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const NewsPage = () => {
  const [articles, setArticles] = useState<ArticleWithSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  /* ------ fetch a single page ------ */
  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const { data: resp } = await api.get('/news', {
          params: { page },
        });

        const items = resp?.data?.data ?? resp?.data ?? [];
        const pagination = resp?.data ?? {};

        if (append) {
          setArticles((prev) => [...prev, ...items]);
        } else {
          setArticles(items);
        }
        setCurrentPage(pagination.current_page ?? page);
        setLastPage(pagination.last_page ?? 1);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load news articles.';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  /* ------ initial load ------ */
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  /* ------ load next page ------ */
  const handleLoadMore = () => {
    if (!loadingMore && currentPage < lastPage) {
      fetchPage(currentPage + 1, true);
    }
  };

  /* ------ loading skeleton ------ */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">News</h1>
          <p className="text-sm text-gray-400 mt-1">
            Latest market news and updates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-5 animate-pulse space-y-3"
            >
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-5/6" />
              <div className="flex items-center gap-2 pt-2">
                <div className="h-5 bg-gray-700 rounded-full w-16" />
                <div className="h-3 bg-gray-700 rounded w-20 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ------ error state ------ */
  if (error && articles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">News</h1>
          <p className="text-sm text-gray-400 mt-1">
            Latest market news and updates
          </p>
        </div>

        <div className="bg-gray-800/80 border border-red-800/50 rounded-xl p-8 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-red-300 mt-4 font-medium">Failed to load news</p>
          <p className="text-gray-400 text-sm mt-1">{error}</p>
          <button
            type="button"
            onClick={() => fetchPage(1, false)}
            className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ------ empty state ------ */
  if (!loading && articles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">News</h1>
          <p className="text-sm text-gray-400 mt-1">
            Latest market news and updates
          </p>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-8 text-center">
          <NewspaperIcon className="w-12 h-12 text-gray-500 mx-auto" />
          <p className="text-gray-400 mt-4 font-medium">No news articles available</p>
          <p className="text-gray-500 text-sm mt-1">Check back later for updates.</p>
        </div>
      </div>
    );
  }

  /* ------ main content ------ */
  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div>
        <h1 className="text-2xl font-bold text-white">News</h1>
        <p className="text-sm text-gray-400 mt-1">
          Latest market news and updates
        </p>
      </div>

      {/* ---- News grid ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {articles.map((article) => {
          const sentiment = getSentiment(article);
          const { label, classes } = SENTIMENT_CONFIG[sentiment];

          return (
            <article
              key={article.id}
              className="bg-gray-800/80 border border-gray-700/50 rounded-xl p-5 hover:border-gray-600 transition-colors duration-200 flex flex-col"
            >
              {/* Category label */}
              {article.category && (
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">
                  {article.category}
                </span>
              )}

              {/* Title */}
              <h3 className="text-base font-semibold text-white leading-snug mb-2 line-clamp-2">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
                {article.summary}
              </p>

              {/* Bottom row: source + date + sentiment */}
              <div className="flex items-center justify-between flex-wrap gap-2 mt-auto pt-3 border-t border-gray-700/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-gray-300 truncate max-w-[120px]">
                    {article.source}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(article.published_at)}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
                >
                  {label}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* ---- Load More ---- */}
      {currentPage < lastPage && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg border border-gray-700/50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4" />
                Load More
              </>
            )}
          </button>
        </div>
      )}

      {/* ---- Error banner (non-blocking) ---- */}
      {error && articles.length > 0 && (
        <div className="bg-red-900/30 border border-red-800/40 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
