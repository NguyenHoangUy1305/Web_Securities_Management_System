<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class TestUserSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure roles exist
        if (!Role::where('name', 'admin')->where('guard_name', 'api')->exists()) {
            $this->call(RoleSeeder::class);
        }

        // Admin account
        $admin = User::firstOrCreate(
            ['email' => 'admin@securities.com'],
            [
                'name' => 'Admin System',
                'password' => 'admin@123',
                'phone' => '0901000001',
                'status' => 'active',
            ]
        );
        $admin->assignRole('admin');
        $this->command->info("Admin: admin@securities.com / admin@123");

        // Broker account
        $broker = User::firstOrCreate(
            ['email' => 'broker@securities.com'],
            [
                'name' => 'Broker Nguyen',
                'password' => 'broker@123',
                'phone' => '0901000002',
                'status' => 'active',
            ]
        );
        $broker->assignRole('broker');
        $this->command->info("Broker: broker@securities.com / broker@123");

        // Investor account
        $investor = User::firstOrCreate(
            ['email' => 'investor@securities.com'],
            [
                'name' => 'Investor Le',
                'password' => 'investor@123',
                'phone' => '0901000003',
                'status' => 'active',
            ]
        );
        $investor->assignRole('investor');
        $this->command->info("Investor: investor@securities.com / investor@123");

        // Existing test user
        $test = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test Investor',
                'password' => 'password123',
                'phone' => '0901000004',
                'status' => 'active',
            ]
        );
        if (!$test->hasRole('investor')) {
            $test->assignRole('investor');
        }
        $this->command->info("Test: test@example.com / password123");
    }
}
