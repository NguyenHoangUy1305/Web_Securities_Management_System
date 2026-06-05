<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\NewsArticle;
use App\Models\Security;
use Exception;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RAGService
{
    /**
     * Directory within storage/app where knowledge documents are persisted.
     */
    private const KNOWLEDGE_STORAGE_PATH = 'ai-knowledge';

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Search the knowledge base (securities and news articles) for records
     * relevant to the given query.
     *
     * @param  string $query The search query.
     * @return array<string, mixed> An array with 'securities' and 'news' keys.
     */
    public function searchKnowledgeBase(string $query): array
    {
        $securities = Security::query()
            ->active()
            ->where(function ($q) use ($query) {
                $q->where('symbol', 'LIKE', "%{$query}%")
                  ->orWhere('name', 'LIKE', "%{$query}%")
                  ->orWhere('sector', 'LIKE', "%{$query}%")
                  ->orWhere('industry', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get();

        $news = NewsArticle::query()
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('summary', 'LIKE', "%{$query}%")
                  ->orWhere('content', 'LIKE', "%{$query}%");
            })
            ->orderBy('published_at', 'desc')
            ->limit(10)
            ->get();

        return [
            'securities' => $securities,
            'news'       => $news,
        ];
    }

    /**
     * Build a human-readable context string from securities and news data
     * relevant to the query.
     *
     * @param  string $query The search query.
     * @return string A formatted context string suitable for injecting into an AI prompt.
     */
    public function getRelevantContext(string $query): string
    {
        $results = $this->searchKnowledgeBase($query);

        $parts = [];

        // ── Securities context ──────────────────────────────────────────
        if ($results['securities']->isNotEmpty()) {
            $lines = ["### Relevant Securities\n"];
            foreach ($results['securities'] as $security) {
                $lines[] = sprintf(
                    "- **%s** (%s): %s | Sector: %s | Industry: %s | Price: \$%.2f | P/E: %s | EPS: %s",
                    $security->symbol,
                    $security->name,
                    $security->exchange,
                    $security->sector ?? 'N/A',
                    $security->industry ?? 'N/A',
                    $security->current_price ?? 0,
                    $security->pe_ratio !== null ? number_format($security->pe_ratio, 2) : 'N/A',
                    $security->eps !== null ? number_format($security->eps, 2) : 'N/A',
                );
            }
            $parts[] = implode("\n", $lines);
        }

        // ── News context ────────────────────────────────────────────────
        if ($results['news']->isNotEmpty()) {
            $lines = ["\n### Relevant News Articles\n"];
            foreach ($results['news'] as $article) {
                $date = $article->published_at
                    ? $article->published_at->toDateString()
                    : 'Unknown date';

                $sentiment = $article->sentiment ?? 'neutral';

                $lines[] = sprintf(
                    "- **[%s]** %s | Sentiment: %s\n  %s",
                    $date,
                    $article->title,
                    $sentiment,
                    Str::limit($article->summary ?? $article->content ?? '', 200)
                );
            }
            $parts[] = implode("\n", $lines);
        }

        // ── Stored knowledge documents context ──────────────────────────
        $storedDocs = $this->retrieveStoredDocuments($query);
        if (!empty($storedDocs)) {
            $lines = ["\n### Stored Knowledge Documents\n"];
            foreach ($storedDocs as $doc) {
                $lines[] = sprintf(
                    "- **[%s]** %s",
                    $doc['type'] ?? 'general',
                    Str::limit($doc['content'] ?? '', 300)
                );
            }
            $parts[] = implode("\n", $lines);
        }

        return implode("\n", $parts);
    }

    /**
     * Augment a user query with relevant context from the knowledge base,
     * producing a prompt-ready string.
     *
     * @param  string $query The original user query.
     * @return string The augmented prompt containing context followed by the query.
     */
    public function augmentPrompt(string $query): string
    {
        $context = $this->getRelevantContext($query);

        if (empty(trim($context))) {
            return $query;
        }

        return "Here is relevant information from the knowledge base:\n\n"
            . "{$context}\n\n"
            . "Based on the above information, please respond to the following:\n\n{$query}";
    }

    /**
     * Ingest a document into the knowledge base for future retrieval.
     *
     * Documents are persisted as JSON files in the storage directory.
     *
     * @param  string               $content   The document content.
     * @param  string               $type      The document type (e.g. 'report', 'article', 'note').
     * @param  array<string, mixed> $metadata  Optional metadata (e.g. ['symbol' => 'AAPL', 'source' => 'manual']).
     * @return bool True on success.
     *
     * @throws Exception
     */
    public function ingestDocument(string $content, string $type, array $metadata = []): bool
    {
        if (empty(trim($content))) {
            throw new Exception('Cannot ingest empty document content.');
        }

        $document = [
            'id'        => (string) Str::uuid(),
            'content'   => $content,
            'type'      => $type,
            'metadata'  => $metadata,
            'created_at' => now()->toIso8601String(),
        ];

        $filename = sprintf(
            '%s_%s.json',
            now()->format('Ymd_His'),
            $document['id']
        );

        $path = self::KNOWLEDGE_STORAGE_PATH . '/' . $filename;

        try {
            Storage::disk('local')->put($path, json_encode($document, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } catch (Exception $e) {
            throw new Exception('Failed to store knowledge document: ' . $e->getMessage());
        }

        return true;
    }

    // ── Internal helpers ────────────────────────────────────────────────

    /**
     * Retrieve stored knowledge documents that match the given query.
     *
     * Performs a simple keyword-based search over stored document content
     * and metadata. In a production system this would be replaced with
     * a vector or full-text search engine.
     *
     * @param  string $query
     * @return array<int, array{content: string, type: string, metadata: array}>
     */
    private function retrieveStoredDocuments(string $query): array
    {
        $results = [];
        $keywords = array_filter(explode(' ', strtolower($query)));

        if (empty($keywords)) {
            return $results;
        }

        try {
            $files = Storage::disk('local')->files(self::KNOWLEDGE_STORAGE_PATH);
        } catch (Exception) {
            return $results;
        }

        foreach ($files as $file) {
            if (!str_ends_with($file, '.json')) {
                continue;
            }

            try {
                $content = Storage::disk('local')->get($file);
                $doc     = json_decode($content, true);

                if (empty($doc) || empty($doc['content'])) {
                    continue;
                }

                $searchableText = strtolower($doc['content'] . ' ' . json_encode($doc['metadata'] ?? []));

                foreach ($keywords as $keyword) {
                    if (Str::contains($searchableText, $keyword)) {
                        $results[] = $doc;
                        break;
                    }
                }
            } catch (Exception) {
                continue;
            }
        }

        // Sort by created_at descending (most recent first).
        usort($results, function (array $a, array $b): int {
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        });

        return array_slice($results, 0, 5);
    }
}
