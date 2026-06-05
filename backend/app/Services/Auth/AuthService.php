<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Exceptions\Auth\AuthenticationException;
use App\Models\User;
use App\Repositories\UserRepository;
use Exception;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Register a new user and return an authentication token.
     *
     * @return array{user: User, token: string}
     */
    public function register(RegisterDTO $dto): array
    {
        $existingUser = $this->userRepository->findByEmail($dto->email);

        if ($existingUser) {
            throw new AuthenticationException('A user with this email already exists.', [], 409);
        }

        $userData = $dto->toArray();
        $role = $userData['role'] ?? 'investor';
        unset($userData['role']);

        /** @var User $user */
        $user = $this->userRepository->create($userData);

        $user->assignRole($role);

        $token = JWTAuth::fromUser($user);

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Authenticate a user and return a token.
     *
     * @return array{user: User, token: string}
     */
    public function login(LoginDTO $dto): array
    {
        $credentials = $dto->toArray();

        if (!$token = JWTAuth::attempt($credentials)) {
            throw new AuthenticationException('Invalid email or password.', [], 401);
        }

        /** @var User $user */
        $user = JWTAuth::user();

        if ($user->status !== 'active') {
            JWTAuth::invalidate($token);
            throw new AuthenticationException('Your account has been deactivated.', [], 403);
        }

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Log out the current user by invalidating the token.
     */
    public function logout(): void
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (Exception $e) {
            throw new AuthenticationException('Failed to log out, please try again.', [], 500);
        }
    }

    /**
     * Refresh the current authentication token.
     *
     * @return array{token: string}
     */
    public function refreshToken(): array
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());

            return [
                'token' => $token,
            ];
        } catch (Exception $e) {
            throw new AuthenticationException('Unable to refresh token.', [], 401);
        }
    }

    /**
     * Get the currently authenticated user's profile.
     */
    public function getProfile(): User
    {
        /** @var User|null */
        $user = JWTAuth::user();

        if (!$user) {
            throw new AuthenticationException('User not found.', [], 404);
        }

        return $user;
    }
}
