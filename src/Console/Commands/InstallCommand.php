<?php

namespace StuMed\MyAdmin\Console\Commands;

use Illuminate\Console\Command;

class InstallCommand extends Command
{
    protected $signature = 'my-admin:install
        {--seed : 运行数据库填充（创建默认管理员、权限、菜单）}
        {--force : 强制覆盖已存在的配置文件}';

    protected $description = '安装 MyAdmin 后台管理包';

    public function handle(): int
    {
        $this->info('🚀 开始安装 MyAdmin...');
        $this->newLine();

        // 1. 发布配置文件
        $this->info('📄 发布配置文件...');
        $this->call('vendor:publish', [
            '--tag' => 'my-admin-config',
            '--force' => $this->option('force'),
        ]);

        // 2. 发布 spatie/permission 的迁移（确保 roles/permissions 表先创建）
        $this->info('📄 发布权限包迁移...');
        $this->call('vendor:publish', [
            '--provider' => 'Spatie\\Permission\\PermissionServiceProvider',
            '--tag' => 'permission-migrations',
        ]);

        // 3. 发布 MyAdmin 迁移文件
        $this->info('📄 发布 MyAdmin 迁移文件...');
        $this->call('vendor:publish', [
            '--tag' => 'my-admin-migrations',
        ]);

        // 4. 运行迁移
        $this->info('🗄️  运行数据库迁移...');
        $this->call('migrate');

        // 5. 发布前端资源
        $this->info('🎨 发布前端资源...');
        $this->call('vendor:publish', [
            '--tag' => 'my-admin-assets',
            '--force' => true,
        ]);

        // 6. 运行 Seeder（可选）
        if ($this->option('seed')) {
            $this->info('🌱 填充初始数据...');
            $this->call('db:seed', [
                '--class' => \StuMed\MyAdmin\Database\Seeders\AdminSeeder::class,
            ]);
        }

        $this->newLine();
        $this->info('✅ MyAdmin 安装完成！');
        $this->newLine();
        $this->line('后续步骤：');
        $this->line('  1. 配置 config/my-admin.php 中的选项');
        $this->line('  2. 在 config/auth.php 中将 User 模型指向 StuMed\\MyAdmin\\Models\\User');
        $this->line('  3. 访问 /vendor/my-admin/index.html 使用前端');
        $this->line('  4. 默认管理员：admin / password');

        return self::SUCCESS;
    }
}
