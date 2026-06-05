<?php

namespace App\DTOs;

abstract class BaseDTO
{
    /**
     * Convert the DTO to an associative array.
     */
    abstract public function toArray(): array;

    /**
     * Create a new DTO instance from an associative array.
     */
    public static function fromArray(array $data): static
    {
        $dto = new static();

        foreach ($data as $key => $value) {
            if (property_exists($dto, $key)) {
                $dto->{$key} = $value;
            }
        }

        return $dto;
    }
}
