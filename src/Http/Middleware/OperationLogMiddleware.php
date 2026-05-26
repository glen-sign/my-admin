<?php

namespace StuMed\MyAdmin\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use StuMed\MyAdmin\Models\OperationLog;
use Symfony\Component\HttpFoundation\Response;

class OperationLogMiddleware
{
    protected array $logRoutes = [
        'POST' => [
            'api/auth/login' => ['认证', 'login', '用户登录'],
            'api/auth/logout' => ['认证', 'logout', '用户登出'],
            'api/users' => ['用户管理', 'create', '创建用户'],
            'api/users/import' => ['用户管理', 'import', '导入用户'],
            'api/departments' => ['部门管理', 'create', '创建部门'],
            'api/departments/import' => ['部门管理', 'import', '导入部门'],
            'api/roles' => ['角色管理', 'create', '创建角色'],
            'api/menus' => ['菜单管理', 'create', '创建菜单'],
        ],
        'PUT' => [
            'api/users/*' => ['用户管理', 'update', '更新用户'],
            'api/auth/profile' => ['个人中心', 'update', '更新个人信息'],
            'api/departments/*' => ['部门管理', 'update', '更新部门'],
            'api/roles/*' => ['角色管理', 'update', '更新角色'],
            'api/roles/*/permissions' => ['角色管理', 'update', '更新角色权限'],
            'api/menus/*' => ['菜单管理', 'update', '更新菜单'],
        ],
        'PATCH' => [
            'api/users/*/status' => ['用户管理', 'update', '更新用户状态'],
            'api/roles/*/status' => ['角色管理', 'update', '更新角色状态'],
            'api/departments/*/sort' => ['部门管理', 'update', '更新部门排序'],
        ],
        'DELETE' => [
            'api/users/*' => ['用户管理', 'delete', '删除用户'],
            'api/departments/*' => ['部门管理', 'delete', '删除部门'],
            'api/roles/*' => ['角色管理', 'delete', '删除角色'],
            'api/menus/*' => ['菜单管理', 'delete', '删除菜单'],
        ],
    ];

    protected array $sensitiveFields = ['password', 'password_confirmation', 'token', 'secret'];

    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $response = $next($request);
        $this->logOperation($request, $response, $startTime);
        return $response;
    }

    protected function logOperation(Request $request, Response $response, float $startTime): void
    {
        $method = $request->method();
        $path = $request->path();

        $matched = $this->matchRoute($method, $path);
        if (!$matched) {
            return;
        }

        [$module, $action, $description] = $matched;
        $duration = (int) ((microtime(true) - $startTime) * 1000);
        $requestData = $this->sanitizeData($request->except(['file', '_token']));

        try {
            OperationLog::create([
                'user_id' => $request->user()?->id,
                'module' => $module,
                'action' => $action,
                'description' => $description,
                'method' => $method,
                'path' => '/' . $path,
                'request_data' => !empty($requestData) ? $requestData : null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status_code' => $response->getStatusCode(),
                'duration' => $duration,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('操作日志记录失败: ' . $e->getMessage());
        }
    }

    protected function matchRoute(string $method, string $path): ?array
    {
        $routes = $this->logRoutes[$method] ?? [];

        foreach ($routes as $pattern => $info) {
            if ($this->pathMatches($pattern, $path)) {
                return $info;
            }
        }

        return null;
    }

    protected function pathMatches(string $pattern, string $path): bool
    {
        $regex = str_replace('/', '\/', $pattern);
        $regex = str_replace('*', '[^\/]+', $regex);
        return (bool) preg_match('/^' . $regex . '$/', $path);
    }

    protected function sanitizeData(array $data): array
    {
        foreach ($this->sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '******';
            }
        }

        return $data;
    }
}
