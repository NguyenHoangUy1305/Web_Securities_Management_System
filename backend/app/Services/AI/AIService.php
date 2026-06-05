<?php

declare(strict_types=1);

namespace App\Services\AI;

use Exception;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    /**
     * The OpenAI API endpoint for chat completions.
     */
    private const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

    /**
     * Cache key prefix for rate limiting.
     */
    private const RATE_LIMIT_CACHE_KEY = 'ai_rate_limit_';

    /**
     * Get the configured OpenAI API key.
     */
    private function apiKey(): string
    {
        $key = Config::get('ai.api_key');

        if (empty($key)) {
            throw new Exception(
                'OpenAI API key is not configured. Set OPENAI_API_KEY in your .env file.'
            );
        }

        return $key;
    }

    /**
     * Get the configured model name.
     */
    private function model(): string
    {
        return Config::get('ai.model', 'gpt-4');
    }

    /**
     * Get the configured system prompt.
     */
    private function systemPrompt(): string
    {
        return Config::get('ai.system_prompt', 'You are an expert AI investment assistant.');
    }

    /**
     * Check and consume a rate-limit slot.
     *
     * @throws Exception When the rate limit is exceeded.
     */
    private function checkRateLimit(): void
    {
        $maxCalls = Config::get('ai.rate_limit_per_minute', 30);

        if ($maxCalls <= 0) {
            return; // rate limiting disabled
        }

        $key     = self::RATE_LIMIT_CACHE_KEY . md5(request()->ip() ?? 'local');
        $current = (int) Cache::get($key, 0);

        if ($current >= $maxCalls) {
            throw new Exception(
                'Rate limit exceeded. Please wait before making another request.'
            );
        }

        Cache::add($key, 0, 60); // reset every 60 seconds
        Cache::increment($key);
    }

    /**
     * Send a chat completion request to the OpenAI API.
     *
     * @param  array<int, array{role: string, content: string}> $messages
     * @return string The assistant's reply text.
     *
     * @throws Exception
     */
    private function callOpenAI(array $messages): string
    {
        $this->checkRateLimit();

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey(),
            'Content-Type'  => 'application/json',
        ])->timeout(60)->post(self::OPENAI_ENDPOINT, [
            'model'       => $this->model(),
            'messages'    => $messages,
            'max_tokens'  => Config::get('ai.max_tokens', 1024),
            'temperature' => Config::get('ai.temperature', 0.7),
        ]);

        if ($response->failed()) {
            $status  = $response->status();
            $body    = $response->body();

            Log::error('OpenAI API request failed', [
                'status' => $status,
                'body'   => $body,
            ]);

            $message = match (true) {
                $status === 401 => 'Invalid OpenAI API key.',
                $status === 429 => 'OpenAI rate limit exceeded. Please try again later.',
                $status >= 500  => 'OpenAI server error. Please try again later.',
                default         => 'AI service request failed. Please try again.',
            };

            throw new Exception($message, $status);
        }

        $data = $response->json();

        return trim($data['choices'][0]['message']['content'] ?? '');
    }

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Answer a general investment-related question with optional context.
     *
     * @param  string      $question The user's question.
     * @param  string|null $context  Optional contextual information.
     * @return string The AI-generated answer.
     *
     * @throws Exception
     */
    public function askQuestion(string $question, ?string $context = null): string
    {
        $systemMessage = $this->systemPrompt();

        $userMessage = $context
            ? "Context:\n{$context}\n\nQuestion:\n{$question}"
            : $question;

        return $this->callOpenAI([
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $userMessage],
        ]);
    }

    /**
     * Perform a detailed analysis of a company based on its financial data.
     *
     * @param  string               $symbol       The security ticker symbol.
     * @param  array<string, mixed> $financialData Key-value pairs of financial metrics.
     * @return string The AI-generated analysis.
     *
     * @throws Exception
     */
    public function analyzeCompany(string $symbol, array $financialData): string
    {
        $systemMessage = $this->systemPrompt() . "\n\n"
            . 'You are a financial analyst. Provide a comprehensive company analysis '
            . 'including strengths, weaknesses, valuation assessment, and key risks.';

        $dataString = json_encode($financialData, JSON_PRETTY_PRINT);

        $userMessage = "Please analyze the following financial data for {$symbol}:\n\n{$dataString}\n\n"
            . "Provide a structured analysis covering:\n"
            . "1. Company overview and key metrics\n"
            . "2. Financial health assessment\n"
            . "3. Valuation analysis\n"
            . "4. Strengths and opportunities\n"
            . "5. Risks and concerns\n"
            . "6. Overall assessment";

        return $this->callOpenAI([
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $userMessage],
        ]);
    }

    /**
     * Explain a specific financial metric and its current value.
     *
     * @param  string      $metricName The name of the metric (e.g. "PE Ratio").
     * @param  float|int   $value      The current value of the metric.
     * @return string The AI-generated explanation.
     *
     * @throws Exception
     */
    public function explainFinancialMetric(string $metricName, float|int $value): string
    {
        $systemMessage = 'You are a financial education expert. Explain financial metrics '
            . 'in clear, simple terms that any investor can understand.';

        $userMessage = "Please explain the financial metric \"{$metricName}\" which currently "
            . "has a value of {$value}.\n\n"
            . "Cover the following in your explanation:\n"
            . "1. What this metric measures\n"
            . "2. How to interpret the current value ({$value})\n"
            . "3. What is considered a good or bad range\n"
            . "4. Limitations of this metric\n"
            . "5. Related metrics to consider alongside it";

        return $this->callOpenAI([
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $userMessage],
        ]);
    }

    /**
     * Summarise a block of financial news text.
     *
     * @param  string $newsText The raw news content.
     * @return string The AI-generated summary.
     *
     * @throws Exception
     */
    public function summarizeNews(string $newsText): string
    {
        $systemMessage = 'You are a financial news analyst. Summarise news articles '
            . 'concisely while preserving key facts, market implications, and sentiment.';

        $userMessage = "Please summarise the following financial news:\n\n{$newsText}\n\n"
            . "Provide:\n"
            . "1. A one-paragraph summary (max 100 words)\n"
            . "2. Key takeaways (bullet points)\n"
            . "3. Market sentiment (bullish / bearish / neutral)\n"
            . "4. Potential impact areas";

        return $this->callOpenAI([
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $userMessage],
        ]);
    }

    /**
     * Get investment advice based on portfolio data and a specific question.
     *
     * @param  array<string, mixed> $portfolioData The user's portfolio information.
     * @param  string               $question      The user's portfolio-related question.
     * @return string The AI-generated advice.
     *
     * @throws Exception
     */
    public function getInvestmentAdvice(array $portfolioData, string $question): string
    {
        $systemMessage = $this->systemPrompt() . "\n\n"
            . 'You are a portfolio management advisor. Provide personalised investment '
            . 'guidance based on the user\'s portfolio data. Always remind the user that '
            . 'this is for informational purposes only and not personalised financial advice.';

        $portfolioString = json_encode($portfolioData, JSON_PRETTY_PRINT);

        $userMessage = "Portfolio Data:\n{$portfolioString}\n\n"
            . "User Question:\n{$question}\n\n"
            . "Please provide a helpful response based on the portfolio data above. "
            . "Consider diversification, risk exposure, sector allocation, and any "
            . "rebalancing opportunities where relevant.";

        return $this->callOpenAI([
            ['role' => 'system', 'content' => $systemMessage],
            ['role' => 'user',   'content' => $userMessage],
        ]);
    }
}
