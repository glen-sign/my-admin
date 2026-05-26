<?php

use Illuminate\Support\Facades\Route;
use StuMed\MyAdmin\Http\Controllers\AuthController;
use StuMed\MyAdmin\Http\Controllers\DepartmentController;
use StuMed\MyAdmin\Http\Controllers\FileController;
use StuMed\MyAdmin\Http\Controllers\MenuController;
use StuMed\MyAdmin\Http\Controllers\OperationLogController;
use StuMed\MyAdmin\Http\Controllers\RoleController;
use StuMed\MyAdmin\Http\Controllers\SystemSetupController;
use StuMed\MyAdmin\Http\Controllers\UserController;

$prefix = config('my-admin.route_prefix', 'api');
$middleware = config('my-admin.middleware', ['api']);
$authMiddleware = config('my-admin.auth_middleware', ['auth:sanctum']);

Route::prefix($prefix)->middleware($middleware)->group(function () use ($authMiddleware) {

    // 系统初始化状态检测（无需认证）
    Route::get('system/setup-status', [SystemSetupController::class, 'status']);

    Route::prefix('auth')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
        Route::get('cas/login', [AuthController::class, 'casLogin'])->middleware('throttle:10,1');
        Route::get('cas/callback', [AuthController::class, 'casCallback'])->middleware('throttle:10,1');
    });

    Route::middleware($authMiddleware)->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('change-password', [AuthController::class, 'changePassword']);
        });

        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->middleware('permission:user:view');
            Route::post('/', [UserController::class, 'store'])->middleware('permission:user:create');
            Route::post('/import', [UserController::class, 'import'])->middleware('permission:user:create');
            Route::get('/import-template', [UserController::class, 'importTemplate'])->middleware('permission:user:view');
            Route::get('/export', [UserController::class, 'export'])->middleware('permission:user:view');
            Route::post('/batch-destroy', [UserController::class, 'batchDestroy'])->middleware('permission:user:delete');
            Route::get('/{user}', [UserController::class, 'show'])->middleware('permission:user:view');
            Route::put('/{user}', [UserController::class, 'update'])->middleware('permission:user:edit');
            Route::delete('/{user}', [UserController::class, 'destroy'])->middleware('permission:user:delete');
            Route::patch('/{user}/status', [UserController::class, 'updateStatus'])->middleware('permission:user:status');
        });

        Route::prefix('departments')->group(function () {
            Route::get('/', [DepartmentController::class, 'index'])->middleware('permission:department:view');
            Route::get('/tree', [DepartmentController::class, 'tree'])->middleware('permission:department:view');
            Route::post('/', [DepartmentController::class, 'store'])->middleware('permission:department:create');
            Route::post('/import', [DepartmentController::class, 'import'])->middleware('permission:department:create');
            Route::get('/import-template', [DepartmentController::class, 'importTemplate'])->middleware('permission:department:view');
            Route::get('/{department}', [DepartmentController::class, 'show'])->middleware('permission:department:view');
            Route::put('/{department}', [DepartmentController::class, 'update'])->middleware('permission:department:edit');
            Route::delete('/{department}', [DepartmentController::class, 'destroy'])->middleware('permission:department:delete');
            Route::patch('/{department}/sort', [DepartmentController::class, 'updateSort'])->middleware('permission:department:sort');
        });

        Route::prefix('roles')->group(function () {
            Route::get('/', [RoleController::class, 'index'])->middleware('permission:role:view');
            Route::post('/', [RoleController::class, 'store'])->middleware('permission:role:create');
            Route::get('/permissions', [RoleController::class, 'getAllPermissions'])->middleware('permission:role:permission');
            Route::get('/{role}', [RoleController::class, 'show'])->middleware('permission:role:view');
            Route::put('/{role}', [RoleController::class, 'update'])->middleware('permission:role:edit');
            Route::delete('/{role}', [RoleController::class, 'destroy'])->middleware('permission:role:delete');
            Route::patch('/{role}/status', [RoleController::class, 'updateStatus'])->middleware('permission:role:status');
            Route::put('/{role}/permissions', [RoleController::class, 'updatePermissions'])->middleware('permission:role:permission');
            Route::get('/{role}/menus', [RoleController::class, 'getMenus'])->middleware('permission:role:permission');
            Route::put('/{role}/menus', [RoleController::class, 'updateMenus'])->middleware('permission:role:permission');
        });

        Route::prefix('menus')->group(function () {
            Route::get('/', [MenuController::class, 'index'])->middleware('permission:menu:view');
            Route::get('/tree', [MenuController::class, 'tree'])->middleware('permission:menu:view');
            Route::post('/', [MenuController::class, 'store'])->middleware('permission:menu:create');
            Route::get('/{menu}', [MenuController::class, 'show'])->middleware('permission:menu:view');
            Route::put('/{menu}', [MenuController::class, 'update'])->middleware('permission:menu:edit');
            Route::delete('/{menu}', [MenuController::class, 'destroy'])->middleware('permission:menu:delete');
            Route::patch('/{menu}/visible', [MenuController::class, 'updateVisible'])->middleware('permission:menu:visible');
        });

        Route::prefix('files')->group(function () {
            Route::post('/upload', [FileController::class, 'upload'])->middleware('permission:file:upload');
            Route::get('/', [FileController::class, 'index'])->middleware('permission:file:view');
            Route::get('/{file}', [FileController::class, 'show'])->middleware('permission:file:view');
            Route::get('/{file}/url', [FileController::class, 'getDownloadUrl'])->middleware('permission:file:view');
            Route::delete('/{file}', [FileController::class, 'destroy'])->middleware('permission:file:delete');
            Route::post('/batch-delete', [FileController::class, 'batchDestroy'])->middleware('permission:file:delete');
        });

        Route::prefix('operation-logs')->group(function () {
            Route::get('/', [OperationLogController::class, 'index'])->middleware('permission:log:view');
            Route::get('/modules', [OperationLogController::class, 'modules'])->middleware('permission:log:view');
        });
    });
});
