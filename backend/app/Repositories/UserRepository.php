<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class UserRepository extends BaseRepository
{
    public function __construct(User $user)
    {
        parent::__construct($user);
    }

    /**
     * Find a user by their email address.
     */
    public function findByEmail(string $email): ?User
    {
        /** @var User|null */
        return $this->model->where('email', $email)->first();
    }

    /**
     * Retrieve all active users.
     */
    public function findActive(): Collection
    {
        /** @var Collection */
        return $this->model->where('status', 'active')->get();
    }

    /**
     * Search users by name or email.
     */
    public function search(string $term, int $perPage = 15): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator */
        return $this->model
            ->where('name', 'like', "%{$term}%")
            ->orWhere('email', 'like', "%{$term}%")
            ->paginate($perPage);
    }
}
