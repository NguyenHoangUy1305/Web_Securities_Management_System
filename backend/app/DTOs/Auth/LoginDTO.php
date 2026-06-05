<?php

declare(strict_types=1);

namespace App\DTOs\Auth;

use App\DTOs\BaseDTO;

class LoginDTO extends BaseDTO
{
    public string $email;

    public string $password;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'email'    => $this->email,
            'password' => $this->password,
        ];
    }
}
