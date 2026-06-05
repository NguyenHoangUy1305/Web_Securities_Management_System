<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NewsArticle;
use App\Repositories\NewsRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class NewsService extends BaseService
{
    protected NewsRepository $newsRepository;

    public function __construct(NewsRepository $newsRepository)
    {
        parent::__construct($newsRepository);
        $this->newsRepository = $newsRepository;
    }

    /**
     * Get the latest news articles.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getLatestNews(int $limit = 20): Collection
    {
        return $this->newsRepository->getLatest($limit);
    }

    /**
     * Get news articles by security ID.
     *
     * @return Collection<int, NewsArticle>
     */
    public function getNewsBySecurity(int $id): Collection
    {
        return $this->newsRepository->getBySecurity($id);
    }

    /**
     * Search news articles by keyword.
     *
     * @return LengthAwarePaginator<NewsArticle>
     */
    public function searchNews(string $keyword, int $perPage = 15): LengthAwarePaginator
    {
        return $this->newsRepository->search($keyword, $perPage);
    }

    /**
     * Get market summary with sentiment counts.
     *
     * @return array<string, mixed>
     */
    public function getMarketSummary(): array
    {
        $positive = $this->newsRepository->getBySentiment('positive')->count();
        $negative = $this->newsRepository->getBySentiment('negative')->count();
        $neutral  = $this->newsRepository->getBySentiment('neutral')->count();

        return [
            'sentiment_counts' => [
                'positive' => $positive,
                'negative' => $negative,
                'neutral'  => $neutral,
                'total'    => $positive + $negative + $neutral,
            ],
        ];
    }

    /**
     * Fetch external news from an API.
     *
     * This is a placeholder. Implement actual API integration (e.g.,
     * NewsAPI, Alpha Vantage news, Yahoo Finance news) as needed.
     */
    public function fetchExternalNews(): array
    {
        // @todo: Implement external news fetch logic.
        //
        // Example:
        //   $response = Http::get('https://newsapi.org/v2/everything', [
        //       'apiKey' => config('services.newsapi.key'),
        //       'q'      => 'stock market',
        //   ]);
        //   foreach ($response->json()['articles'] as $article) {
        //       $this->newsRepository->create([
        //           'title'       => $article['title'],
        //           'source'      => $article['source']['name'],
        //           'url'         => $article['url'],
        //           'summary'     => $article['description'],
        //           'content'     => $article['content'],
        //           'sentiment'   => null,
        //           'published_at'=> $article['publishedAt'],
        //       ]);
        //   }

        return [
            'imported' => 0,
            'message'  => 'External news fetch is not yet implemented.',
        ];
    }
}
