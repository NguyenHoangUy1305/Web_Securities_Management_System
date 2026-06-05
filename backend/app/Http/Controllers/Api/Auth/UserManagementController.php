<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseController;
use App\Models\User;
use App\Repositories\UserRepository;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserManagementController extends BaseController
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Display a paginated, searchable list of users.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'nullable|integer|min:1|max:100',
            'search'   => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage = (int) ($request->input('per_page', 15));
            $search  = $request->input('search');

            if ($search) {
                $users = $this->userRepository->search($search, $perPage);
            } else {
                $users = $this->userRepository->paginate($perPage);
            }

            return $this->sendResponse(
                $users,
                'Users retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve users.',
                500
            );
        }
    }

    /**
     * Display the specified user.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->sendError('User not found.', 404);
            }

            return $this->sendResponse(
                ['user' => $user],
                'User retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve user.',
                500
            );
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'   => 'sometimes|required|string|max:255',
            'email'  => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'phone'  => 'nullable|string|max:20',
            'status' => 'sometimes|required|string|in:active,inactive,banned',
            'role'   => 'sometimes|required|string|in:admin,manager,broker,analyst,investor',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->sendError('User not found.', 404);
            }

            $data = $validator->validated();
            $role = null;

            if (isset($data['role'])) {
                $role = $data['role'];
                unset($data['role']);
            }

            if (!empty($data)) {
                $this->userRepository->update($id, $data);
            }

            if ($role) {
                /** @var User $user */
                $user->syncRoles([$role]);
            }

            return $this->sendResponse(
                ['user' => $user->fresh()],
                'User updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update user.',
                500
            );
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = $this->userRepository->find($id);

            if (!$user) {
                return $this->sendError('User not found.', 404);
            }

            $this->userRepository->delete($id);

            return $this->sendResponse(null, 'User deleted successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to delete user.',
                500
            );
        }
    }
}
