<?php

declare(strict_types=1);

namespace App\DTOs\AI;

use App\DTOs\BaseDTO;

class QuestionDTO extends BaseDTO
{
    public string $question;

    public ?string $context = null;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'question' => $this->question,
            'context'  => $this->context,
        ];
    }
}
