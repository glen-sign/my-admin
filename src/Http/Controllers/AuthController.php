<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use StuMed\MyAdmin\Http\Requests\LoginRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Models\LoginLog;
use StuMed\MyAdmin\Models\Menu;
use StuMed\MyAdmin\Models\User;
use StuMed\MyAdmin\Services\CasService;

class AuthController extends Controller
{
    use ApiResponse;

    private function recordLoginLog(Request $request, ?int $userId, string $loginType, string $status): void
    {
        LoginLog::create([
            'user_id' => $userId,
            'login_type' => $loginType,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device' => $request->header('User-Agent'),
            'status' => $status,
            'created_at' => now(),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('username', $request->username)->first();

        if (!$user) {
            $this->recordLoginLog($request, null, 'local', 'failed');
            return $this->unauthorized('用户名或密码错误');
        }

        if ($user->status !== 'active') {
            $this->recordLoginLog($request, $user->id, 'local', 'failed');
            return $this->forbidden('账户已被禁用');
        }

        if (!Auth::attempt(['username' => $request->username, 'password' => $request->password])) {
            $this->recordLoginLog($request, $user->id, 'local', 'failed');
            return $this->unauthorized('用户名或密码错误');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->recordLoginLog($request, $user->id, 'local', 'success');

        $user->load(['department', 'roles']);

        return $this->success([
            'token' => $token,
            'user' => $user,
            'roles' => $user->getRoleNames()->toArray(),
            'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            'menus' => $this->buildUserMenus($user),
        ]);
    }

    public function casLogin(CasService $cas)
    {
        $loginUrl = $cas->getLoginUrl();
        return redirect()->away($loginUrl);
    }

    public function casCallback(Request $request, CasService $cas)
    {
        $ticket = $request->query('ticket');
        $frontendUrl = config('my-admin.cas.frontend_url', 'http://localhost:5173');

        if (!$ticket) {
            return redirect()->away("{$frontendUrl}/login?error=" . urlencode('CAS认证失败：未收到ticket'));
        }

        try {
            $casInfo = $cas->validateTicket($ticket);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('CAS认证异常', ['message' => $e->getMessage()]);
            return redirect()->away("{$frontendUrl}/login?error=" . urlencode('CAS认证失败，请稍后重试'));
        }

        if (!$casInfo) {
            return redirect()->away("{$frontendUrl}/login?error=" . urlencode('CAS认证失败：ticket验证未通过'));
        }

        $casUsername = $casInfo['uid'];
        $user = User::where('username', $casUsername)->first();

        if (!$user) {
            return redirect()->away("{$frontendUrl}/login?error=" . urlencode('CAS用户在系统中不存在，请联系管理员'));
        }

        if ($user->status !== 'active') {
            return redirect()->away("{$frontendUrl}/login?error=" . urlencode('账户已被禁用'));
        }

        $token = $user->createToken('cas_token')->plainTextToken;

        LoginLog::create([
            'user_id' => $user->id,
            'login_type' => 'cas',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device' => $request->header('User-Agent'),
            'status' => 'success',
            'created_at' => now(),
        ]);

        return redirect()->away("{$frontendUrl}/auth/cas/callback?token=" . urlencode($token));
    }

    public function logout(Request $request, CasService $cas): JsonResponse
    {
        $loginType = $request->user()->currentAccessToken()->name;
        $request->user()->currentAccessToken()->delete();

        if ($loginType === 'cas_token') {
            $frontendUrl = config('my-admin.cas.frontend_url', 'http://localhost:5173');
            $casLogoutUrl = $cas->getLogoutUrl() . '?service=' . urlencode($frontendUrl . '/login');

            return $this->success([
                'cas_logout_url' => $casLogoutUrl,
            ], '已退出登录');
        }

        return $this->success(null, '已退出登录');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('department');
        $roles = $user->getRoleNames()->toArray();
        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        $menus = $this->buildUserMenus($user);

        return $this->success([
            'user' => $user,
            'roles' => $roles,
            'permissions' => $permissions,
            'menus' => $menus,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'email' => 'sometimes|nullable|email|max:100',
            'phone' => 'sometimes|nullable|string|max:20',
            'avatar' => 'sometimes|nullable|string|max:255',
        ]);

        $user->update($validated);
        $user->load('department');

        return $this->success(['user' => $user], '个人信息已更新');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ], [
            'current_password.required' => '请输入当前密码',
            'new_password.required' => '请输入新密码',
            'new_password.min' => '新密码至少6位',
            'new_password.confirmed' => '两次输入的新密码不一致',
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($validated['current_password'], $user->password)) {
            return $this->businessError('当前密码不正确');
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($validated['new_password']),
        ]);

        $user->tokens()->delete();

        return $this->success(null, '密码修改成功，请重新登录');
    }

    private function buildUserMenus(User $user): array
    {
        $superAdminRole = config('my-admin.super_admin_role', 'admin');

        if ($user->hasRole($superAdminRole)) {
            $menus = Menu::where('visible', true)
                ->orderBy('sort_order')
                ->get();
        } else {
            $roleIds = $user->roles->pluck('id')->toArray();

            $directMenus = Menu::whereHas('roles', function ($query) use ($roleIds) {
                $query->whereIn('roles.id', $roleIds);
            })
                ->where('visible', true)
                ->orderBy('sort_order')
                ->get();

            $menuIds = $directMenus->pluck('id')->toArray();
            $parentIds = $directMenus->pluck('parent_id')->filter()->unique()->toArray();
            $allParentIds = array_diff($parentIds, $menuIds);

            if (!empty($allParentIds)) {
                $allVisibleMenus = Menu::where('visible', true)->orderBy('sort_order')->get();
                $menuById = $allVisibleMenus->keyBy('id');

                $toVisit = $allParentIds;
                $visited = array_flip($menuIds);
                while (!empty($toVisit)) {
                    $next = [];
                    foreach ($toVisit as $pid) {
                        if (isset($visited[$pid])) continue;
                        $visited[$pid] = true;
                        $menu = $menuById[$pid] ?? null;
                        if ($menu && $menu->parent_id && !isset($visited[$menu->parent_id])) {
                            $next[] = $menu->parent_id;
                        }
                    }
                    $toVisit = $next;
                }

                $ancestorIds = array_keys($visited);
                $menus = $allVisibleMenus->filter(fn($m) => in_array($m->id, $ancestorIds))->values();
            } else {
                $menus = $directMenus;
            }
        }

        return $this->buildMenuTree($menus, null);
    }

    private function buildMenuTree($menus, $parentId): array
    {
        $tree = [];

        foreach ($menus as $menu) {
            if ($menu->parent_id === $parentId) {
                $children = $this->buildMenuTree($menus, $menu->id);
                $item = [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'icon' => $menu->icon,
                    'path' => $menu->path,
                    'type' => $menu->type,
                    'visible' => $menu->visible,
                    'sort_order' => $menu->sort_order,
                ];
                if (!empty($children)) {
                    $item['children'] = $children;
                }
                $tree[] = $item;
            }
        }

        return $tree;
    }
}
