<?php

declare(strict_types=1);

namespace App\DTOs\Auth;

use App\DTOs\BaseDTO;

class RegisterDTO extends BaseDTO
{
    public string $name;

    public string $email;

    public string $password;

    public ?string $phone = null;

    public string $role = 'investor';

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'name'     => $this->name,
            'email'    => $this->email,
            'password' => $this->password,
            'phone'    => $this->phone,
            'role'     => $this->role,
        ];
    }
}
