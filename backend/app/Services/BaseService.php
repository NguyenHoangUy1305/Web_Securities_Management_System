<?php

namespace App\Services;

use App\Repositories\BaseRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class BaseService
{
    protected BaseRepository $repository;

    public function __construct(BaseRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Retrieve all records.
     */
    public function getAll(): Collection
    {
        return $this->repository->all();
    }

    /**
     * Find a record by its primary key.
     */
    public function getById(int|string $id): ?Model
    {
        return $this->repository->find($id);
    }

    /**
     * Create a new record.
     */
    public function create(array $data): Model
    {
        return $this->repository->create($data);
    }

    /**
     * Update an existing record.
     */
    public function update(int|string $id, array $data): ?Model
    {
        return $this->repository->update($id, $data);
    }

    /**
     * Delete a record.
     */
    public function delete(int|string $id): bool
    {
        return $this->repository->delete($id);
    }
}
