<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Services\Auth\AuthService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends BaseController
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
            'role'     => 'nullable|string|in:admin,manager,broker,analyst,investor',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $dto = RegisterDTO::fromArray($validator->validated());

            $result = $this->authService->register($dto);

            return $this->sendResponse(
                [
                    'user'  => $result['user'],
                    'token' => $result['token'],
                ],
                'Registration successful.',
                201
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                is_int($e->getCode()) && $e->getCode() > 0 ? $e->getCode() : 500
            );
        }
    }

    /**
     * Authenticate a user and return a token.
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $dto = LoginDTO::fromArray($validator->validated());

            $result = $this->authService->login($dto);

            return $this->sendResponse(
                [
                    'user'  => $result['user'],
                    'token' => $result['token'],
                ],
                'Login successful.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 401
            );
        }
    }

    /**
     * Log out the authenticated user.
     */
    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout();

            return $this->sendResponse(null, 'Successfully logged out.');
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Refresh the authentication token.
     */
    public function refresh(): JsonResponse
    {
        try {
            $result = $this->authService->refreshToken();

            return $this->sendResponse(
                ['token' => $result['token']],
                'Token refreshed successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 401
            );
        }
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(): JsonResponse
    {
        try {
            $user = $this->authService->getProfile();

            return $this->sendResponse(
                ['user' => $user],
                'Profile retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 404
            );
        }
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'  => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . JWTAuth::id(),
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            /** @var User $user */
            $user = JWTAuth::user();

            $user->update($validator->validated());

            return $this->sendResponse(
                ['user' => $user->fresh()],
                'Profile updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update profile.',
                500
            );
        }
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            /** @var User $user */
            $user = JWTAuth::user();

            if (!Hash::check($request->current_password, $user->password)) {
                return $this->sendError(
                    'Current password is incorrect.',
                    422
                );
            }

            $user->update([
                'password' => $request->password,
            ]);

            return $this->sendResponse(null, 'Password updated successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update password.',
                500
            );
        }
    }
}
