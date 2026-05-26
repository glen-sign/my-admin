<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use StuMed\MyAdmin\Http\Requests\StoreMenuRequest;
use StuMed\MyAdmin\Http\Requests\UpdateMenuRequest;
use StuMed\MyAdmin\Http\Requests\UpdateVisibleRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Http\Traits\TreeTrait;
use StuMed\MyAdmin\Models\Menu;

class MenuController extends Controller
{
    use ApiResponse, TreeTrait;

    public function tree(Request $request): JsonResponse
    {
        $menus = Menu::whereNull('parent_id')
            ->with('children')
            ->orderBy('sort_order')
            ->get();

        return $this->success($menus);
    }

    public function index(Request $request): JsonResponse
    {
        $menus = Menu::orderBy('sort_order')->get();
        return $this->success($menus);
    }

    public function store(StoreMenuRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $maxSortOrder = Menu::where('parent_id', $validated['parent_id'] ?? null)
            ->max('sort_order') ?? 0;

        $menu = Menu::create([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'path' => $validated['path'] ?? null,
            'type' => $validated['type'],
            'visible' => $validated['visible'] ?? true,
            'sort_order' => $validated['sort_order'] ?? $maxSortOrder + 1,
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        return $this->created($menu);
    }

    public function show(Menu $menu): JsonResponse
    {
        return $this->success($menu->load('children'));
    }

    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        $validated = $request->validated();
        $newParentId = array_key_exists('parent_id', $validated) ? ($validated['parent_id'] ?? null) : $menu->parent_id;

        if ($newParentId && $newParentId !== $menu->parent_id) {
            if ($this->isDescendantOf(Menu::class, $menu->id, $newParentId)) {
                return $this->businessError('不能将菜单移动到其自身的子菜单下');
            }
        }

        $menu->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $menu->code,
            'icon' => $validated['icon'] ?? null,
            'path' => $validated['path'] ?? null,
            'type' => $validated['type'],
            'visible' => $validated['visible'] ?? true,
            'sort_order' => $validated['sort_order'] ?? $menu->sort_order,
            'parent_id' => $newParentId,
        ]);

        return $this->success($menu);
    }

    public function destroy(Menu $menu): JsonResponse
    {
        if ($menu->children()->count() > 0) {
            $menu->children()->update(['parent_id' => $menu->parent_id]);
        }

        $menu->delete();
        return $this->noContent();
    }

    public function updateVisible(UpdateVisibleRequest $request, Menu $menu): JsonResponse
    {
        $menu->update(['visible' => $request->validated('visible')]);
        return $this->success($menu);
    }
}
