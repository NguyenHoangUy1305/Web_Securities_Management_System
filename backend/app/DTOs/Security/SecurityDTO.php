<?php

declare(strict_types=1);

namespace App\DTOs\Security;

use App\DTOs\BaseDTO;
use App\Models\Security;

class SecurityDTO extends BaseDTO
{
    public ?int $id = null;

    public string $symbol;

    public string $name;

    public string $exchange;

    public string $type;

    public ?string $sector = null;

    public ?string $industry = null;

    public ?float $market_cap = null;

    public ?float $current_price = null;

    public ?float $eps = null;

    public ?float $pe_ratio = null;

    public ?float $dividend_yield = null;

    public ?int $volume = null;

    public ?float $day_high = null;

    public ?float $day_low = null;

    public ?float $year_high = null;

    public ?float $year_low = null;

    public bool $is_active = true;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'symbol'         => $this->symbol,
            'name'           => $this->name,
            'exchange'       => $this->exchange,
            'type'           => $this->type,
            'sector'         => $this->sector,
            'industry'       => $this->industry,
            'market_cap'     => $this->market_cap,
            'current_price'  => $this->current_price,
            'eps'            => $this->eps,
            'pe_ratio'       => $this->pe_ratio,
            'dividend_yield' => $this->dividend_yield,
            'volume'         => $this->volume,
            'day_high'       => $this->day_high,
            'day_low'        => $this->day_low,
            'year_high'      => $this->year_high,
            'year_low'       => $this->year_low,
            'is_active'      => $this->is_active,
        ];
    }

    /**
     * Create a DTO from a Security model instance.
     */
    public static function fromModel(Security $security): self
    {
        $dto = new self();

        $dto->id            = $security->id;
        $dto->symbol        = $security->symbol;
        $dto->name          = $security->name;
        $dto->exchange      = $security->exchange;
        $dto->type          = $security->type;
        $dto->sector        = $security->sector;
        $dto->industry      = $security->industry;
        $dto->market_cap    = $security->market_cap !== null ? (float) $security->market_cap : null;
        $dto->current_price = $security->current_price !== null ? (float) $security->current_price : null;
        $dto->eps           = $security->eps !== null ? (float) $security->eps : null;
        $dto->pe_ratio      = $security->pe_ratio !== null ? (float) $security->pe_ratio : null;
        $dto->dividend_yield = $security->dividend_yield !== null ? (float) $security->dividend_yield : null;
        $dto->volume        = $security->volume !== null ? (int) $security->volume : null;
        $dto->day_high      = $security->day_high !== null ? (float) $security->day_high : null;
        $dto->day_low       = $security->day_low !== null ? (float) $security->day_low : null;
        $dto->year_high     = $security->year_high !== null ? (float) $security->year_high : null;
        $dto->year_low      = $security->year_low !== null ? (float) $security->year_low : null;
        $dto->is_active     = (bool) $security->is_active;

        return $dto;
    }
}
