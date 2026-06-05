<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            SecuritiesSeeder::class,
            NewsSeeder::class,
        ]);

        $this->command->info('Database seeding completed!');
    }
}
