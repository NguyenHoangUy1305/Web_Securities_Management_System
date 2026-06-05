<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Dividend;

class DividendRepository extends BaseRepository
{
    public function __construct(Dividend $dividend)
    {
        parent::__construct($dividend);
    }
}
