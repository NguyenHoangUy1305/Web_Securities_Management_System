<?php

declare(strict_types=1);

namespace App\DTOs\Portfolio;

use App\DTOs\BaseDTO;
use App\Models\Portfolio;

class PortfolioDTO extends BaseDTO
{
    public ?int $id = null;

    public int $user_id;

    public string $name;

    public ?string $description = null;

    public ?float $total_value = 0.0;

    public ?float $cash_balance = 0.0;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'user_id'     => $this->user_id,
            'name'        => $this->name,
            'description' => $this->description,
            'total_value' => $this->total_value ?? 0.0,
            'cash_balance' => $this->cash_balance ?? 0.0,
        ];
    }

    /**
     * Create a DTO from a Portfolio model instance.
     */
    public static function fromModel(Portfolio $portfolio): self
    {
        $dto = new self();

        $dto->id          = $portfolio->id;
        $dto->user_id     = $portfolio->user_id;
        $dto->name        = $portfolio->name;
        $dto->description = $portfolio->description;
        $dto->total_value = $portfolio->total_value !== null ? (float) $portfolio->total_value : null;
        $dto->cash_balance = $portfolio->cash_balance !== null ? (float) $portfolio->cash_balance : null;

        return $dto;
    }
}
