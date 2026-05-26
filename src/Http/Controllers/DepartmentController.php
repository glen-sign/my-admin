<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use StuMed\MyAdmin\Http\Requests\ImportFileRequest;
use StuMed\MyAdmin\Http\Requests\StoreDepartmentRequest;
use StuMed\MyAdmin\Http\Requests\UpdateDepartmentRequest;
use StuMed\MyAdmin\Http\Requests\UpdateSortRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Http\Traits\TreeTrait;
use StuMed\MyAdmin\Models\Department;
use StuMed\MyAdmin\Services\ImportService;

class DepartmentController extends Controller
{
    use ApiResponse, TreeTrait;

    public function tree(Request $request): JsonResponse
    {
        $keyword = $request->input('keyword');

        if ($keyword) {
            $escaped = addcslashes($keyword, '%_');
            $matchedIds = Department::where('name', 'like', "%{$escaped}%")
                ->orWhere('code', 'like', "%{$escaped}%")
                ->pluck('id')
                ->toArray();

            $allDepartments = Department::with('manager')->orderBy('sort_order')->get();
            $visibleIds = $this->getAncestorIds($allDepartments, $matchedIds);

            $departments = $allDepartments->filter(fn($dept) => in_array($dept->id, $visibleIds))->values();

            return $this->success($this->buildTree($departments, null));
        }

        $departments = Department::with(['manager', 'children.manager'])
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();

        return $this->success($departments);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Department::with(['manager']);

        if ($keyword = $request->input('keyword')) {
            $escaped = addcslashes($keyword, '%_');
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'like', "%{$escaped}%")
                  ->orWhere('code', 'like', "%{$escaped}%");
            });
        }

        $departments = $query->orderBy('sort_order')->get();

        return $this->success($departments);
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $maxSortOrder = Department::where('parent_id', $validated['parent_id'] ?? null)
            ->max('sort_order') ?? 0;

        $department = Department::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'parent_id' => $validated['parent_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? $maxSortOrder + 1,
        ]);

        return $this->created($department->load('manager'));
    }

    public function show(Department $department): JsonResponse
    {
        return $this->success($department->load(['manager', 'children', 'parent']));
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $validated = $request->validated();
        $newParentId = $validated['parent_id'] ?? null;

        if ($newParentId && $newParentId !== $department->parent_id) {
            if ($this->isDescendantOf(Department::class, $department->id, $newParentId)) {
                return $this->businessError('不能将部门移动到其自身的子部门下');
            }
        }

        $department->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'parent_id' => $newParentId,
            'manager_id' => $validated['manager_id'] ?? null,
            'sort_order' => $validated['sort_order'] ?? $department->sort_order,
        ]);

        return $this->success($department->load('manager'));
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->users()->count() > 0) {
            return $this->businessError('该部门下存在用户，无法删除');
        }

        if ($department->children()->count() > 0) {
            $department->children()->update(['parent_id' => $department->parent_id]);
        }

        $department->delete();

        return $this->noContent();
    }

    public function updateSort(UpdateSortRequest $request, Department $department): JsonResponse
    {
        $department->update(['sort_order' => $request->validated('sort_order')]);
        return $this->success($department);
    }

    public function import(ImportFileRequest $request, ImportService $importService): JsonResponse
    {
        $result = $importService->importDepartments($request->file('file'));
        return $this->success($result, '导入完成');
    }

    public function importTemplate(ImportService $importService)
    {
        $csv = $importService->getDepartmentTemplate();

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="departments_import_template.csv"',
        ]);
    }
}
