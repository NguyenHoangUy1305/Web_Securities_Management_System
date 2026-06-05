<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'view securities', 'create securities', 'edit securities', 'delete securities',
            'view portfolios', 'create portfolios', 'edit portfolios', 'delete portfolios',
            'view orders', 'create orders', 'edit orders', 'cancel orders',
            'view transactions', 'export transactions',
            'view watchlists', 'create watchlists',
            'view news',
            'view dividends',
            'manage users', 'manage roles',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['guard_name' => 'api', 'name' => $permission]);
        }

        $admin = Role::create(['guard_name' => 'api', 'name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $broker = Role::create(['guard_name' => 'api', 'name' => 'broker']);
        $broker->givePermissionTo([
            'view securities',
            'view portfolios', 'create portfolios', 'edit portfolios',
            'view orders', 'create orders', 'edit orders', 'cancel orders',
            'view transactions', 'export transactions',
            'view watchlists', 'create watchlists',
            'view news', 'view dividends',
        ]);

        $investor = Role::create(['guard_name' => 'api', 'name' => 'investor']);
        $investor->givePermissionTo([
            'view securities',
            'view portfolios', 'create portfolios',
            'view orders', 'create orders', 'cancel orders',
            'view transactions', 'export transactions',
            'view watchlists', 'create watchlists',
            'view news', 'view dividends',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
