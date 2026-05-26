<?php

namespace StuMed\MyAdmin\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use StuMed\MyAdmin\Models\Menu;
use StuMed\MyAdmin\Models\Permission;

class PermissionSyncCommand extends Command
{
    protected $signature = 'my-admin:permission-sync
        {--dry-run : 只预览，不实际写入数据库}
        {--clean : 清理数据库中存在但扫描结果中不存在的权限}';

    protected $description = '自动扫描路由中间件，同步权限到数据库';

    protected array $actionLabelMap = [
        'view' => '查看',
        'create' => '新增',
        'edit' => '编辑',
        'delete' => '删除',
        'status' => '状态管理',
        'sort' => '排序',
        'visible' => '显示/隐藏',
        'permission' => '权限配置',
        'assign' => '分配',
        'upload' => '上传',
        'import' => '导入',
    ];

    protected array $moduleLabelMap = [];

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $shouldClean = $this->option('clean');

        $this->moduleLabelMap = Menu::whereNotNull('code')
            ->pluck('name', 'code')
            ->toArray();

        $this->info('🔍 正在扫描路由中间件...');

        $allPermissions = $this->scanRoutePermissions();
        sort($allPermissions);

        $existingNames = Permission::pluck('name')->toArray();

        $toCreate = array_values(array_diff($allPermissions, $existingNames));
        $kept = array_values(array_intersect($allPermissions, $existingNames));
        $stale = $shouldClean ? array_values(array_diff($existingNames, $allPermissions)) : [];

        $this->newLine();
        $this->info("📋 扫描完成：共发现 " . count($allPermissions) . " 个权限");
        $this->newLine();
        $this->info("📊 同步状态:");
        $this->line("   已存在: " . count($kept) . " 个");
        $this->line("   待新增: " . count($toCreate) . " 个");
        if ($shouldClean) {
            $this->line("   待删除: " . count($stale) . " 个");
        }

        if (!empty($toCreate)) {
            $this->newLine();
            $this->info('➕ 待新增权限:');
            $this->table(
                ['权限名称', '中文标签'],
                array_map(fn($p) => [$p, $this->generateLabel($p)], $toCreate)
            );
        }

        if (!empty($stale)) {
            $this->newLine();
            $this->warn('➖ 待删除权限:');
            $this->table(['权限名称'], array_map(fn($p) => [$p], $stale));
        }

        if ($isDryRun) {
            $this->newLine();
            $this->warn('⚠️  预览模式，未做任何修改。去掉 --dry-run 以执行同步。');
            return self::SUCCESS;
        }

        $created = 0;
        $deleted = 0;

        if (!empty($toCreate)) {
            foreach ($toCreate as $name) {
                Permission::create([
                    'name' => $name,
                    'guard_name' => 'web',
                    'label' => $this->generateLabel($name),
                ]);
                $created++;
            }
        }

        foreach ($kept as $name) {
            Permission::where('name', $name)
                ->whereNull('label')
                ->update(['label' => $this->generateLabel($name)]);
        }

        if (!empty($stale)) {
            $deleted = Permission::whereIn('name', $stale)->delete();
        }

        $this->newLine();
        $this->info("✅ 同步完成！新增 {$created} 个，保留 " . count($kept) . " 个" .
            ($shouldClean ? "，删除 {$deleted} 个" : ''));

        return self::SUCCESS;
    }

    protected function scanRoutePermissions(): array
    {
        $permissions = [];
        $routes = Route::getRoutes();

        foreach ($routes as $route) {
            $middlewares = $route->gatherMiddleware();

            foreach ($middlewares as $middleware) {
                if (preg_match('/^permission:(.+)$/', $middleware, $matches)) {
                    $permissions[] = $matches[1];
                }
            }
        }

        return array_unique($permissions);
    }

    protected function generateLabel(string $name): string
    {
        $parts = explode(':', $name);
        if (count($parts) !== 2) {
            return $name;
        }

        [$module, $action] = $parts;
        $moduleLabel = $this->moduleLabelMap[$module] ?? $module;
        $actionLabel = $this->actionLabelMap[$action] ?? $action;

        return "{$moduleLabel}-{$actionLabel}";
    }
}
