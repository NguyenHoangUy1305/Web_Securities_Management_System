<?php

namespace App\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;

class BaseRepository
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    /**
     * Retrieve all records.
     */
    public function all(): Collection
    {
        return $this->model->all();
    }

    /**
     * Find a record by its primary key.
     */
    public function find(int|string $id): ?Model
    {
        return $this->model->find($id);
    }

    /**
     * Find records matching an array of criteria.
     */
    public function findBy(array $criteria): Collection
    {
        return $this->model->where($criteria)->get();
    }

    /**
     * Find records using a column, operator, value comparison.
     */
    public function findWhere(string $column, string $operator, mixed $value): Collection
    {
        return $this->model->where($column, $operator, $value)->get();
    }

    /**
     * Create a new record.
     */
    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    /**
     * Update an existing record.
     */
    public function update(int|string $id, array $data): ?Model
    {
        $record = $this->find($id);

        if ($record) {
            $record->update($data);
            return $record;
        }

        return null;
    }

    /**
     * Delete a record.
     */
    public function delete(int|string $id): bool
    {
        $record = $this->find($id);

        if ($record) {
            return $record->delete();
        }

        return false;
    }

    /**
     * Paginate records.
     */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model->paginate($perPage);
    }

    /**
     * Eager load relationships.
     */
    public function with(array|string $relations): Builder
    {
        return $this->model->with($relations);
    }
}
