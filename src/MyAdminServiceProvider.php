<?php

namespace StuMed\MyAdmin;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use StuMed\MyAdmin\Console\Commands\InstallCommand;
use StuMed\MyAdmin\Console\Commands\PermissionSyncCommand;
use StuMed\MyAdmin\Http\Middleware\OperationLogMiddleware;
use StuMed\MyAdmin\Models\FileAttachment;

class MyAdminServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/my-admin.php', 'my-admin');
    }

    public function boot(): void
    {
        $this->registerPublishing();
        $this->registerRoutes();
        $this->registerCommands();
        $this->registerMiddleware();
        $this->registerGate();
        $this->registerRouteBindings();
    }

    /**
     * 注册发布资源
     */
    protected function registerPublishing(): void
    {
        if ($this->app->runningInConsole()) {
            // 发布配置文件
            $this->publishes([
                __DIR__ . '/../config/my-admin.php' => config_path('my-admin.php'),
            ], 'my-admin-config');

            // 发布迁移文件
            $this->publishes([
                __DIR__ . '/../database/migrations/' => database_path('migrations'),
            ], 'my-admin-migrations');

            // 发布前端资源
            $this->publishes([
                __DIR__ . '/../resources/dist/' => public_path(config('my-admin.assets_path', 'vendor/my-admin')),
            ], 'my-admin-assets');
        }

        // 不使用 loadMigrationsFrom，迁移文件必须通过 vendor:publish 发布后才运行
        // 这样可以确保用户控制迁移顺序（spatie/permission 的迁移必须先运行）
    }

    /**
     * 注册路由
     */
    protected function registerRoutes(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
    }

    /**
     * 注册 Artisan 命令
     */
    protected function registerCommands(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallCommand::class,
                PermissionSyncCommand::class,
            ]);
        }
    }

    /**
     * 注册中间件
     */
    protected function registerMiddleware(): void
    {
        if (config('my-admin.operation_log', true)) {
            $router = $this->app['router'];
            $router->pushMiddlewareToGroup('api', OperationLogMiddleware::class);
        }
    }

    /**
     * 注册 Gate 超级管理员逻辑
     */
    protected function registerGate(): void
    {
        Gate::before(function ($user, $ability) {
            $superAdminRole = config('my-admin.super_admin_role', 'admin');
            if ($user->hasRole($superAdminRole)) {
                return true;
            }
        });
    }

    /**
     * 注册路由模型绑定
     */
    protected function registerRouteBindings(): void
    {
        Route::model('file', FileAttachment::class);
    }
}
