<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Dividend;
use Illuminate\Http\Request;

class DividendResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Dividend $dividend */
        $dividend = $this->resource;

        return [
            'id'               => $dividend->id,
            'security_id'      => $dividend->security_id,
            'ex_date'          => $dividend->ex_date?->toDateString(),
            'payment_date'     => $dividend->payment_date?->toDateString(),
            'record_date'      => $dividend->record_date?->toDateString(),
            'amount_per_share' => $dividend->amount_per_share,
            'currency'         => $dividend->currency,
            'dividend_type'    => $dividend->dividend_type,
            'security'         => $this->whenLoaded('security', function () use ($dividend) {
                return [
                    'id'     => $dividend->security->id,
                    'symbol' => $dividend->security->symbol,
                    'name'   => $dividend->security->name,
                ];
            }),
            'created_at'       => $dividend->created_at?->toISOString(),
            'updated_at'       => $dividend->updated_at?->toISOString(),
        ];
    }
}
