<?php

declare(strict_types=1);

namespace App\DTOs\MarketData;

use App\DTOs\BaseDTO;
use App\Models\MarketData;
use Carbon\Carbon;

class MarketDataDTO extends BaseDTO
{
    public ?int $id = null;

    public int $security_id;

    public string $timestamp;

    public ?float $open = null;

    public ?float $high = null;

    public ?float $low = null;

    public ?float $close = null;

    public ?int $volume = null;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'security_id' => $this->security_id,
            'timestamp'   => $this->timestamp,
            'open'        => $this->open,
            'high'        => $this->high,
            'low'         => $this->low,
            'close'       => $this->close,
            'volume'      => $this->volume,
        ];
    }

    /**
     * Create a DTO from a MarketData model instance.
     */
    public static function fromModel(MarketData $marketData): self
    {
        $dto = new self();

        $dto->id          = $marketData->id;
        $dto->security_id = $marketData->security_id;
        $dto->timestamp   = $marketData->timestamp instanceof Carbon
            ? $marketData->timestamp->toISOString()
            : (string) $marketData->timestamp;
        $dto->open        = $marketData->open !== null ? (float) $marketData->open : null;
        $dto->high        = $marketData->high !== null ? (float) $marketData->high : null;
        $dto->low         = $marketData->low !== null ? (float) $marketData->low : null;
        $dto->close       = $marketData->close !== null ? (float) $marketData->close : null;
        $dto->volume      = $marketData->volume !== null ? (int) $marketData->volume : null;

        return $dto;
    }
}
