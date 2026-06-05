<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\NewsArticle;
use Illuminate\Http\Request;

class NewsResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var NewsArticle $news */
        $news = $this->resource;

        return [
            'id'                  => $news->id,
            'title'               => $news->title,
            'source'              => $news->source,
            'url'                 => $news->url,
            'summary'             => $news->summary,
            'content'             => $news->content,
            'sentiment'           => $news->sentiment,
            'related_security_id' => $news->related_security_id,
            'published_at'        => $news->published_at?->toISOString(),
            'created_at'          => $news->created_at?->toISOString(),
            'updated_at'          => $news->updated_at?->toISOString(),
        ];
    }
}
