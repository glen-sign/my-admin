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

        // 2. 发布迁移文件
        $this->info('📄 发布迁移文件...');
        $this->call('vendor:publish', [
            '--tag' => 'my-admin-migrations',
        ]);

        // 3. 运行迁移
        $this->info('🗄️  运行数据库迁移...');
        $this->call('migrate');

        // 4. 发布前端资源
        $this->info('🎨 发布前端资源...');
        $this->call('vendor:publish', [
            '--tag' => 'my-admin-assets',
            '--force' => true,
        ]);

        // 5. 运行 Seeder（可选）
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
        $this->line('  2. 确保 User 模型继承自 StuMed\MyAdmin\Models\User');
        $this->line('  3. 运行 php artisan my-admin:install --seed 初始化数据');
        $this->line('  4. 访问前端页面开始使用');

        return self::SUCCESS;
    }
}
