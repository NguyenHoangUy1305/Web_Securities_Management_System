<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\News;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\NewsResource;
use App\Services\NewsService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NewsController extends BaseController
{
    protected NewsService $newsService;

    public function __construct(NewsService $newsService)
    {
        $this->newsService = $newsService;
    }

    /**
     * Display a paginated list of news articles.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage = (int) ($request->input('per_page', 15));
            $news    = $this->newsService->getAll();

            return $this->sendResponse(
                NewsResource::collection($news),
                'News articles retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve news articles.',
                500
            );
        }
    }

    /**
     * Store a newly created news article.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'              => 'required|string|max:255',
            'source'             => 'nullable|string|max:255',
            'url'                => 'required|string|url|max:2048|unique:news_articles,url',
            'summary'            => 'nullable|string',
            'content'            => 'nullable|string',
            'sentiment'          => 'nullable|string|in:positive,negative,neutral',
            'related_security_id' => 'nullable|integer|exists:securities,id',
            'published_at'       => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $news = $this->newsService->create($validator->validated());

            return $this->sendResponse(
                new NewsResource($news),
                'News article created successfully.',
                201
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Display the specified news article.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $news = $this->newsService->getById($id);

            if (!$news) {
                return $this->sendError('News article not found.', 404);
            }

            return $this->sendResponse(
                new NewsResource($news),
                'News article retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve news article.',
                500
            );
        }
    }

    /**
     * Update the specified news article.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'              => 'sometimes|required|string|max:255',
            'source'             => 'nullable|string|max:255',
            'url'                => 'sometimes|required|string|url|max:2048|unique:news_articles,url,' . $id,
            'summary'            => 'nullable|string',
            'content'            => 'nullable|string',
            'sentiment'          => 'nullable|string|in:positive,negative,neutral',
            'related_security_id' => 'nullable|integer|exists:securities,id',
            'published_at'       => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $news = $this->newsService->getById($id);

            if (!$news) {
                return $this->sendError('News article not found.', 404);
            }

            $this->newsService->update($id, $validator->validated());

            return $this->sendResponse(
                new NewsResource($news->fresh()),
                'News article updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update news article.',
                500
            );
        }
    }

    /**
     * Remove the specified news article.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $news = $this->newsService->getById($id);

            if (!$news) {
                return $this->sendError('News article not found.', 404);
            }

            $this->newsService->delete($id);

            return $this->sendResponse(null, 'News article deleted successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to delete news article.',
                500
            );
        }
    }

    /**
     * Get news articles by security ID.
     */
    public function bySecurity(int $id): JsonResponse
    {
        try {
            $news = $this->newsService->getNewsBySecurity($id);

            return $this->sendResponse(
                NewsResource::collection($news),
                'News articles by security retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve news articles by security.',
                500
            );
        }
    }

    /**
     * Get market summary with sentiment counts.
     */
    public function marketSummary(): JsonResponse
    {
        try {
            $summary = $this->newsService->getMarketSummary();

            return $this->sendResponse(
                $summary,
                'Market summary retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve market summary.',
                500
            );
        }
    }

    /**
     * Search news articles by keyword.
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'keyword'  => 'required|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $keyword = $request->input('keyword');
            $perPage = (int) ($request->input('per_page', 15));

            $news = $this->newsService->searchNews($keyword, $perPage);

            return $this->sendResponse(
                NewsResource::collection($news),
                'Search completed successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to search news articles.',
                500
            );
        }
    }
}
