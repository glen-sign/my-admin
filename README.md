# stumed/my-admin

Laravel 后台管理基础包，提供用户、角色、权限、部门、菜单、文件管理等核心功能。

## 功能特性

- 用户管理（CRUD、导入导出、批量操作）
- 部门管理（树形结构、拖拽排序）
- 角色管理（RBAC 权限分配）
- 菜单管理（动态菜单、按角色分配）
- 文件管理（上传、预签名下载、支持 MinIO/本地存储）
- 操作日志（自动记录关键操作）
- CAS 单点登录支持
- 预构建前端产物（开箱即用）

## 安装

```bash
composer require stumed/my-admin
```

## 快速开始

```bash
# 运行安装命令（发布配置、迁移、前端资源）
php artisan my-admin:install --seed
```

## 配置

发布配置文件后，编辑 `config/my-admin.php`：

```php
return [
    'route_prefix' => 'api',           // 路由前缀
    'middleware' => ['api'],            // 基础中间件
    'auth_middleware' => ['auth:sanctum'], // 认证中间件
    'super_admin_role' => 'admin',     // 超级管理员角色名
    'cas' => [...],                    // CAS 配置
    'upload' => [...],                 // 文件上传配置
];
```

## User 模型

包提供了完整的 User 模型，宿主项目可以直接继承：

```php
namespace App\Models;

use StuMed\MyAdmin\Models\User as BaseUser;

class User extends BaseUser
{
    // 添加你的自定义字段和方法
}
```

然后在 `config/auth.php` 中指向你的 User 模型。

## 权限同步

```bash
# 预览将要同步的权限
php artisan my-admin:permission-sync --dry-run

# 执行同步
php artisan my-admin:permission-sync
```

## 前端

包内含预构建的前端产物，安装后访问 `/vendor/my-admin/index.html`。

如需深度定制前端，可安装 npm 包：

```bash
npm install @stumed/my-admin-ui
```

## License

MIT
