<?php

namespace StuMed\MyAdmin\Http\Traits;

/**
 * 树形结构通用处理 Trait
 */
trait TreeTrait
{
    /**
     * 检查 targetParentId 是否是 nodeId 的子孙节点（循环检测）
     */
    protected function isDescendantOf(string $modelClass, int $nodeId, int $targetParentId): bool
    {
        $currentId = $targetParentId;
        $visited = [];

        while ($currentId !== null) {
            if ($currentId === $nodeId) {
                return true;
            }
            if (isset($visited[$currentId])) {
                break;
            }
            $visited[$currentId] = true;
            $parent = $modelClass::find($currentId);
            $currentId = $parent?->parent_id;
        }

        return false;
    }

    /**
     * 从扁平列表构建树形结构
     */
    protected function buildTree($items, $parentId = null): array
    {
        $tree = [];

        foreach ($items as $item) {
            if ($item->parent_id === $parentId) {
                $node = $item->toArray();
                $children = $this->buildTree($items, $item->id);
                $node['children'] = $children;
                $tree[] = $node;
            }
        }

        return $tree;
    }

    /**
     * 获取匹配节点及其所有祖先节点的 ID 集合
     */
    protected function getAncestorIds($allItems, array $matchedIds): array
    {
        $parentMap = $allItems->pluck('parent_id', 'id')->toArray();
        $visibleIds = $matchedIds;

        foreach ($matchedIds as $id) {
            $currentId = $id;
            $visited = [];
            while (isset($parentMap[$currentId]) && $parentMap[$currentId] !== null) {
                $parentId = $parentMap[$currentId];
                if (in_array($parentId, $visibleIds) || isset($visited[$parentId])) {
                    break;
                }
                $visited[$parentId] = true;
                $visibleIds[] = $parentId;
                $currentId = $parentId;
            }
        }

        return array_unique($visibleIds);
    }
}
