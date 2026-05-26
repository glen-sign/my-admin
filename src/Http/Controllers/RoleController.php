<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use StuMed\MyAdmin\Http\Requests\StoreRoleRequest;
use StuMed\MyAdmin\Http\Requests\UpdateMenusRequest;
use StuMed\MyAdmin\Http\Requests\UpdatePermissionsRequest;
use StuMed\MyAdmin\Http\Requests\UpdateRoleRequest;
use StuMed\MyAdmin\Http\Requests\UpdateStatusRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Models\Permission;
use StuMed\MyAdmin\Models\Role;
use StuMed\MyAdmin\Models\User;

class RoleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Role::with('permissions');

        $query->where('name', '!=', config('my-admin.super_admin_role', 'admin'));

        if ($keyword = $request->input('keyword')) {
            $escaped = addcslashes($keyword, '%_');
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                  ->orWhere('code', 'like', "%{$escaped}%")
                  ->orWhere('description', 'like', "%{$escaped}%");
            });
        }

        $roles = $query->orderBy('id')->get();

        $userCounts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as total'))
            ->where('model_type', User::class)
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $roles->transform(function ($role) use ($userCounts) {
            $role->user_count = $userCounts[$role->id] ?? 0;
            return $role;
        });

        return $this->success($roles);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'code' => $validated['code'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => 'active',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return $this->created($role->load('permissions'));
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        $role->user_count = DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->where('model_type', User::class)
            ->count();

        return $this->success($role);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $validated = $request->validated();

        $role->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $role->code,
            'description' => $validated['description'] ?? $role->description,
        ]);

        return $this->success($role);
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->name === config('my-admin.super_admin_role', 'admin')) {
            return $this->businessError('管理员角色不能删除');
        }

        $role->delete();
        return $this->noContent();
    }

    public function updateStatus(UpdateStatusRequest $request, Role $role): JsonResponse
    {
        $role->update(['status' => $request->validated('status')]);
        return $this->success($role);
    }

    public function updatePermissions(UpdatePermissionsRequest $request, Role $role): JsonResponse
    {
        if ($role->name === config('my-admin.super_admin_role', 'admin')) {
            return $this->businessError('管理员角色权限不可修改');
        }

        $role->syncPermissions($request->validated('permissions'));
        return $this->success($role->load('permissions'));
    }

    public function getAllPermissions(): JsonResponse
    {
        $permissions = Permission::all();
        return $this->success($permissions);
    }

    public function getMenus(Role $role): JsonResponse
    {
        $menuIds = $role->menus()->pluck('menus.id')->toArray();
        return $this->success(['menu_ids' => $menuIds]);
    }

    public function updateMenus(UpdateMenusRequest $request, Role $role): JsonResponse
    {
        if ($role->name === config('my-admin.super_admin_role', 'admin')) {
            return $this->businessError('管理员角色菜单不可修改');
        }

        $role->menus()->sync($request->validated('menu_ids'));
        return $this->success(['menu_ids' => $request->validated('menu_ids')], '菜单配置已更新');
    }
}
