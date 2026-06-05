<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\Security\SecurityDTO;
use App\Models\Security;
use App\Repositories\SecurityRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SecurityService extends BaseService
{
    protected SecurityRepository $securityRepository;

    public function __construct(SecurityRepository $securityRepository)
    {
        parent::__construct($securityRepository);
        $this->securityRepository = $securityRepository;
    }

    /**
     * Create a new security from a DTO.
     */
    public function createSecurity(SecurityDTO $dto): Security
    {
        /** @var Security */
        return $this->securityRepository->create($dto->toArray());
    }

    /**
     * Update an existing security from a DTO.
     */
    public function updateSecurity(int $id, SecurityDTO $dto): ?Security
    {
        /** @var Security|null */
        return $this->securityRepository->update($id, $dto->toArray());
    }

    /**
     * Search securities with optional filters.
     */
    public function search(
        string $keyword,
        ?string $exchange = null,
        ?string $type = null,
        ?string $sector = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->securityRepository->search($keyword, $exchange, $type, $sector, $perPage);
    }

    /**
     * Get the top gaining securities.
     *
     * @return Collection<int, Security>
     */
    public function getTopGainers(int $limit = 10): Collection
    {
        return $this->securityRepository->getTopGainers($limit);
    }

    /**
     * Get the top losing securities.
     *
     * @return Collection<int, Security>
     */
    public function getTopLosers(int $limit = 10): Collection
    {
        return $this->securityRepository->getTopLosers($limit);
    }

    /**
     * Find a security by its symbol.
     */
    public function getBySymbol(string $symbol): ?Security
    {
        return $this->securityRepository->getBySymbol($symbol);
    }

    /**
     * Sync securities from an external API.
     *
     * This is a placeholder. Implement actual API integration (e.g.,
     * Alpha Vantage, Yahoo Finance, IEX Cloud) as needed.
     */
    public function syncFromExternalAPI(): array
    {
        // @todo: Implement external API sync logic.
        //
        // Example:
        //   $response = Http::get('https://api.example.com/securities');
        //   foreach ($response->json() as $data) {
        //       $dto = SecurityDTO::fromArray($data);
        //       $existing = $this->securityRepository->getBySymbol($dto->symbol);
        //       if ($existing) {
        //           $this->securityRepository->update($existing->id, $dto->toArray());
        //       } else {
        //           $this->securityRepository->create($dto->toArray());
        //       }
        //   }

        return [
            'imported' => 0,
            'updated'  => 0,
            'message'  => 'External API sync is not yet implemented.',
        ];
    }
}
