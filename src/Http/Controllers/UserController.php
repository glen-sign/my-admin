<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use StuMed\MyAdmin\Http\Requests\BatchDestroyUsersRequest;
use StuMed\MyAdmin\Http\Requests\ImportFileRequest;
use StuMed\MyAdmin\Http\Requests\StoreUserRequest;
use StuMed\MyAdmin\Http\Requests\UpdateStatusRequest;
use StuMed\MyAdmin\Http\Requests\UpdateUserRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Models\User;
use StuMed\MyAdmin\Services\ImportService;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = User::with(['department', 'roles']);

        $query->whereDoesntHave('roles', function ($q) {
            $q->where('name', config('my-admin.super_admin_role', 'admin'));
        });

        if ($keyword = $request->input('keyword')) {
            $escaped = addcslashes($keyword, '%_');
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                  ->orWhere('email', 'like', "%{$escaped}%")
                  ->orWhere('phone', 'like', "%{$escaped}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($role = $request->input('role')) {
            $query->role($role);
        }

        if ($departmentId = $request->input('department_id')) {
            $query->where('department_id', $departmentId);
        }

        $pageSize = min((int) $request->input('pageSize', 10), 100);

        $sortBy = $request->input('sort_by', 'id');
        $sortOrder = $request->input('sort_order', 'desc');
        $allowedSorts = ['id', 'name', 'email', 'created_at', 'status'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'id';
        }
        if (!in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $users = $query->orderBy($sortBy, $sortOrder)->paginate($pageSize);

        return $this->success([
            'list' => $users->items(),
            'total' => $users->total(),
            'page' => $users->currentPage(),
            'pageSize' => $users->perPage(),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'department_id' => $validated['department_id'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        if (!empty($validated['role'])) {
            $user->assignRole($validated['role']);
        }

        return $this->created($user->load(['department', 'roles']));
    }

    public function show(User $user): JsonResponse
    {
        return $this->success($user->load(['department', 'roles']));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'department_id' => $validated['department_id'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ]);

        if (!empty($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return $this->success($user->load(['department', 'roles']));
    }

    public function updateStatus(UpdateStatusRequest $request, User $user): JsonResponse
    {
        $user->update(['status' => $request->validated('status')]);
        return $this->success($user);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->businessError('不能删除当前登录用户');
        }

        $user->syncRoles([]);
        $user->tokens()->delete();
        $user->delete();

        return $this->noContent();
    }

    public function import(ImportFileRequest $request, ImportService $importService): JsonResponse
    {
        $result = $importService->importUsers($request->file('file'));
        return $this->success($result, '导入完成');
    }

    public function importTemplate(ImportService $importService)
    {
        $csv = $importService->getUserTemplate();

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="users_import_template.csv"',
        ]);
    }

    public function batchDestroy(BatchDestroyUsersRequest $request): JsonResponse
    {
        $ids = $request->validated('ids');
        $currentUserId = auth()->id();

        if (in_array($currentUserId, $ids)) {
            return $this->businessError('不能删除当前登录用户');
        }

        $deletedCount = 0;
        DB::transaction(function () use ($ids, &$deletedCount) {
            $users = User::whereIn('id', $ids)->get();
            foreach ($users as $user) {
                $user->syncRoles([]);
                $user->tokens()->delete();
                $user->delete();
                $deletedCount++;
            }
        });

        return $this->success(['deleted_count' => $deletedCount], '批量删除完成');
    }

    public function export(Request $request)
    {
        $query = User::with(['department', 'roles']);

        $query->whereDoesntHave('roles', function ($q) {
            $q->where('name', config('my-admin.super_admin_role', 'admin'));
        });

        if ($keyword = $request->input('keyword')) {
            $escaped = addcslashes($keyword, '%_');
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                  ->orWhere('email', 'like', "%{$escaped}%")
                  ->orWhere('phone', 'like', "%{$escaped}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($role = $request->input('role')) {
            $query->role($role);
        }

        if ($departmentId = $request->input('department_id')) {
            $query->where('department_id', $departmentId);
        }

        $users = $query->orderBy('id', 'desc')->get();
        $filename = 'users_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($users) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['姓名', '工号', '邮箱', '电话', '部门', '角色', '状态', '创建时间']);
            foreach ($users as $user) {
                fputcsv($output, [
                    $user->name,
                    $user->username,
                    $user->email,
                    $user->phone ?? '',
                    $user->department?->name ?? '',
                    $user->roles->pluck('name')->join(', '),
                    $user->status === 'active' ? '正常' : '已禁用',
                    $user->created_at?->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($output);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
