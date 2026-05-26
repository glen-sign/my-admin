<?php

namespace StuMed\MyAdmin\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use StuMed\MyAdmin\Models\Department;
use StuMed\MyAdmin\Models\Menu;
use StuMed\MyAdmin\Models\Permission;
use StuMed\MyAdmin\Models\Role;
use StuMed\MyAdmin\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPermissions();
        $this->seedDepartments();
        $this->seedUsers();
        $this->seedMenus();
    }

    protected function seedPermissions(): void
    {
        $permissions = [
            'user:view' => '用户管理-查看',
            'user:create' => '用户管理-新增',
            'user:edit' => '用户管理-编辑',
            'user:delete' => '用户管理-删除',
            'user:status' => '用户管理-状态管理',
            'department:view' => '部门管理-查看',
            'department:create' => '部门管理-新增',
            'department:edit' => '部门管理-编辑',
            'department:delete' => '部门管理-删除',
            'department:sort' => '部门管理-排序',
            'role:view' => '角色管理-查看',
            'role:create' => '角色管理-新增',
            'role:edit' => '角色管理-编辑',
            'role:delete' => '角色管理-删除',
            'role:status' => '角色管理-状态管理',
            'role:permission' => '角色管理-权限配置',
            'menu:view' => '菜单管理-查看',
            'menu:create' => '菜单管理-新增',
            'menu:edit' => '菜单管理-编辑',
            'menu:delete' => '菜单管理-删除',
            'menu:visible' => '菜单管理-显示/隐藏',
            'file:upload' => '文件管理-上传',
            'file:view' => '文件管理-查看',
            'file:delete' => '文件管理-删除',
            'log:view' => '操作日志-查看',
        ];

        foreach ($permissions as $name => $label) {
            Permission::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['label' => $label]
            );
        }

        // 创建角色
        $adminRole = Role::updateOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            ['code' => 'admin', 'description' => '超级管理员', 'status' => 'active']
        );

        $managerRole = Role::updateOrCreate(
            ['name' => 'manager', 'guard_name' => 'web'],
            ['code' => 'manager', 'description' => '管理者', 'status' => 'active']
        );
        $managerRole->syncPermissions([
            'user:view', 'user:create', 'user:edit',
            'department:view', 'department:create', 'department:edit',
            'role:view',
            'menu:view',
            'file:upload', 'file:view',
            'log:view',
        ]);

        $userRole = Role::updateOrCreate(
            ['name' => 'user', 'guard_name' => 'web'],
            ['code' => 'user', 'description' => '普通用户', 'status' => 'active']
        );
        $userRole->syncPermissions([
            'user:view',
            'department:view',
            'file:view',
        ]);
    }

    protected function seedDepartments(): void
    {
        $departments = [
            ['name' => '技术部', 'code' => 'TECH', 'sort_order' => 1],
            ['name' => '产品部', 'code' => 'PRODUCT', 'sort_order' => 2],
            ['name' => '设计部', 'code' => 'DESIGN', 'sort_order' => 3],
            ['name' => '运营部', 'code' => 'OPERATIONS', 'sort_order' => 4],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['code' => $dept['code']], $dept);
        }
    }

    protected function seedUsers(): void
    {
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '系统管理员',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'department_id' => Department::where('code', 'TECH')->first()?->id,
                'phone' => '13800138000',
                'status' => 'active',
            ]
        );
        $adminUser->syncRoles(['admin']);

        $users = [
            ['name' => '张三', 'username' => 'zhangsan', 'email' => 'zhangsan@example.com', 'department_code' => 'TECH', 'phone' => '13800138001', 'role' => 'manager'],
            ['name' => '李四', 'username' => 'lisi', 'email' => 'lisi@example.com', 'department_code' => 'PRODUCT', 'phone' => '13800138002', 'role' => 'user'],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'username' => $userData['username'],
                    'password' => Hash::make('password'),
                    'department_id' => Department::where('code', $userData['department_code'])->first()?->id,
                    'phone' => $userData['phone'],
                    'status' => 'active',
                ]
            );
            $user->syncRoles([$userData['role']]);
        }
    }

    protected function seedMenus(): void
    {
        $systemMenu = Menu::firstOrCreate(
            ['name' => '系统管理'],
            [
                'code' => 'system',
                'icon' => 'Setting',
                'path' => '/system',
                'type' => 'directory',
                'visible' => true,
                'sort_order' => 1,
            ]
        );

        $menus = [
            ['name' => '用户管理', 'code' => 'user', 'path' => '/system/users', 'sort_order' => 1],
            ['name' => '部门管理', 'code' => 'department', 'path' => '/system/departments', 'sort_order' => 2],
            ['name' => '角色管理', 'code' => 'role', 'path' => '/system/roles', 'sort_order' => 3],
            ['name' => '菜单管理', 'code' => 'menu', 'path' => '/system/menus', 'sort_order' => 4],
        ];

        foreach ($menus as $menuData) {
            Menu::firstOrCreate(
                ['name' => $menuData['name']],
                [
                    'parent_id' => $systemMenu->id,
                    'code' => $menuData['code'],
                    'icon' => null,
                    'path' => $menuData['path'],
                    'type' => 'page',
                    'visible' => true,
                    'sort_order' => $menuData['sort_order'],
                ]
            );
        }
    }
}
