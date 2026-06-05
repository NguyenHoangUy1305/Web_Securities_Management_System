<?php

declare(strict_types=1);

namespace App\DTOs\AI;

use App\DTOs\BaseDTO;

class CompanyAnalysisDTO extends BaseDTO
{
    public string $symbol;

    /** @var array<string, mixed> */
    public array $financialData = [];

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'symbol'        => $this->symbol,
            'financial_data' => $this->financialData,
        ];
    }
}
