<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsArticle extends Model
{
    protected $fillable = [
        'title',
        'source',
        'url',
        'summary',
        'content',
        'sentiment',
        'related_security_id',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'sentiment'    => 'string',
            'published_at' => 'datetime',
        ];
    }

    /**
     * Get the security associated with this news article.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class, 'related_security_id');
    }
}
