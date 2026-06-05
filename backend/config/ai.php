<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for the AI Investment Assistant
    | module, including the OpenAI API key, model settings, and default
    | system prompts.
    |
    */

    'api_key' => env('OPENAI_API_KEY'),

    'model' => env('OPENAI_MODEL', 'gpt-4'),

    'max_tokens' => (int) env('OPENAI_MAX_TOKENS', 1024),

    'temperature' => (float) env('OPENAI_TEMPERATURE', 0.7),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Maximum number of OpenAI API calls allowed per minute. Set to 0 to
    | disable rate limiting.
    |
    */
    'rate_limit_per_minute' => (int) env('OPENAI_RATE_LIMIT', 30),

    /*
    |--------------------------------------------------------------------------
    | System Prompt
    |--------------------------------------------------------------------------
    |
    | The default system prompt used for all AI interactions. This sets the
    | overall behaviour and expertise domain of the assistant.
    |
    */
    'system_prompt' => env('OPENAI_SYSTEM_PROMPT',
        'You are an expert AI investment assistant with deep knowledge of '
        . 'financial markets, securities analysis, portfolio management, and '
        . 'investment strategies. Provide clear, data-driven insights and '
        . 'explanations. Always clarify that your recommendations are for '
        . 'informational purposes only and do not constitute financial advice. '
        . 'Use markdown formatting where appropriate for readability.'
    ),
];
