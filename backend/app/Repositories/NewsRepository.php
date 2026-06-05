<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\NewsArticle;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NewsRepository extends BaseRepository
{
    public function __construct(NewsArticle $newsArticle)
    {
        parent::__construct($newsArticle);
    }

    /**
     * Get the latest news articles.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getLatest(int $limit = 20): Collection
    {
        /** @var Collection<int, NewsArticle> */
        return $this->model
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get news articles by security ID.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getBySecurity(int $id): Collection
    {
        /** @var Collection<int, NewsArticle> */
        return $this->model
            ->where('related_security_id', $id)
            ->orderByDesc('published_at')
            ->get();
    }

    /**
     * Search news articles by keyword in title, summary, or content.
     *
     * @return LengthAwarePaginator<NewsArticle>
     */
    public function search(string $keyword, int $perPage = 15): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<NewsArticle> */
        return $this->model
            ->where(function ($query) use ($keyword) {
                $query->where('title', 'like', "%{$keyword}%")
                      ->orWhere('summary', 'like', "%{$keyword}%")
                      ->orWhere('content', 'like', "%{$keyword}%");
            })
            ->orderByDesc('published_at')
            ->paginate($perPage);
    }

    /**
     * Get news articles by sentiment.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getBySentiment(string $sentiment): Collection
    {
        /** @var Collection<int, NewsArticle> */
        return $this->model
            ->where('sentiment', $sentiment)
            ->orderByDesc('published_at')
            ->get();
    }

    /**
     * Get news articles within a date range.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getByDateRange(string $from, string $to): Collection
    {
        /** @var Collection<int, NewsArticle> */
        return $this->model
            ->where('published_at', '>=', $from)
            ->where('published_at', '<=', $to)
            ->orderByDesc('published_at')
            ->get();
    }
}
