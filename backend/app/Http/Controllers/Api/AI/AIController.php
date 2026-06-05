<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\AI;

use App\Http\Controllers\Api\BaseController;
use App\Services\AI\AIService;
use App\Services\AI\RAGService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AIController extends BaseController
{
    protected AIService $aiService;

    protected RAGService $ragService;

    public function __construct(AIService $aiService, RAGService $ragService)
    {
        $this->aiService  = $aiService;
        $this->ragService = $ragService;
    }

    /**
     * Ask a general investment-related question.
     *
     * @bodyParam question string required The question to ask. Example: "What is a good P/E ratio?"
     * @bodyParam context string optional Additional context for the question.
     */
    public function ask(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'question' => 'required|string|min:2|max:2000',
            'context'  => 'nullable|string|max:10000',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $question = $request->input('question');
            $context  = $request->input('context');

            // Augment with RAG context if no explicit context provided.
            if (empty($context)) {
                $context = $this->ragService->getRelevantContext($question);
            }

            $answer = $this->aiService->askQuestion($question, $context ?: null);

            return $this->sendResponse([
                'question' => $question,
                'answer'   => $answer,
            ], 'Question answered successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage() ?: 'Failed to answer question.',
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Analyze a company based on its financial data.
     *
     * @bodyParam symbol string required The stock ticker symbol. Example: AAPL
     * @bodyParam financial_data object required Key financial metrics.
     */
    public function analyzeCompany(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'symbol'         => 'required|string|max:20',
            'financial_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $symbol        = strtoupper($request->input('symbol'));
            $financialData = $request->input('financial_data');

            $analysis = $this->aiService->analyzeCompany($symbol, $financialData);

            return $this->sendResponse([
                'symbol'   => $symbol,
                'analysis' => $analysis,
            ], 'Company analysis completed successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage() ?: 'Failed to analyze company.',
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Explain a specific financial metric.
     *
     * @bodyParam metric_name string required The metric name. Example: PE Ratio
     * @bodyParam value numeric required The current value of the metric. Example: 15.5
     */
    public function explainMetric(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'metric_name' => 'required|string|max:255',
            'value'       => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $metricName = $request->input('metric_name');
            $value      = $request->input('value');

            $explanation = $this->aiService->explainFinancialMetric($metricName, $value);

            return $this->sendResponse([
                'metric_name' => $metricName,
                'value'       => $value,
                'explanation' => $explanation,
            ], 'Metric explanation completed successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage() ?: 'Failed to explain metric.',
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Summarize financial news.
     *
     * @bodyParam news_text string required The news content to summarize. Example: "Apple reported earnings..."
     */
    public function summarizeNews(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'news_text' => 'required|string|min:10|max:50000',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $newsText = $request->input('news_text');

            $summary = $this->aiService->summarizeNews($newsText);

            return $this->sendResponse([
                'summary' => $summary,
            ], 'News summarized successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage() ?: 'Failed to summarize news.',
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Get investment advice based on portfolio data.
     *
     * @bodyParam portfolio_data object required The user's portfolio information.
     * @bodyParam question string required The portfolio-related question.
     */
    public function investmentAdvice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'portfolio_data' => 'required|array',
            'question'       => 'required|string|min:2|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $portfolioData = $request->input('portfolio_data');
            $question      = $request->input('question');

            $advice = $this->aiService->getInvestmentAdvice($portfolioData, $question);

            return $this->sendResponse([
                'question' => $question,
                'advice'   => $advice,
            ], 'Investment advice retrieved successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage() ?: 'Failed to get investment advice.',
                $e->getCode() ?: 500
            );
        }
    }
}
