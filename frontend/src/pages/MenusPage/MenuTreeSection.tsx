import React, { useState, useMemo } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  FolderIcon,
  FileIcon,
  Loader2Icon,
} from 'lucide-react';
import { iconMap, iconOptions } from '@/lib/iconMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useMenuTree,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useToggleMenuVisible,
} from '@/hooks/useMenus';
import type { IMenuItem } from '@/api/menus';

function RenderIcon({ name }: { name?: string }) {
  const IconComp = name ? iconMap[name] : null;
  return IconComp ? (
    <IconComp className="size-4" />
  ) : (
    <FileIcon className="size-4" />
  );
}

/**
 * 将树形菜单扁平化，用于父菜单选择器
 */
function flattenMenus(
  menus: IMenuItem[],
  level = 0,
): Array<{ id: string; name: string; level: number }> {
  const result: Array<{ id: string; name: string; level: number }> = [];
  for (const menu of menus) {
    // 只有目录类型可以作为父菜单
    if (menu.type === 'directory') {
      result.push({ id: menu.id, name: menu.name, level });
      if (menu.children?.length) {
        result.push(...flattenMenus(menu.children, level + 1));
      }
    }
  }
  return result;
}

const MenuTreeSection: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<IMenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon: 'File',
    path: '',
    type: 'page' as IMenuItem['type'],
    visible: true,
    sort_order: 0,
    parent_id: '',
  });

  const { data: menuData = [], isLoading, isError, refetch } = useMenuTree();
  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();
  const deleteMenuMutation = useDeleteMenu();
  const toggleVisibleMutation = useToggleMenuVisible();

  // 扁平化的目录列表，用于父菜单选择
  const parentOptions = useMemo(() => flattenMenus(menuData), [menuData]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleVisible = (id: string, currentVisible: boolean) => {
    toggleVisibleMutation.mutate(
      { id, visible: !currentVisible },
      {
        onSuccess: () => toast.success('显示状态已更新'),
        onError: () => toast.error('更新显示状态失败'),
      },
    );
  };

  const handleDeleteConfirm = (item: IMenuItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    deleteMenuMutation.mutate(deletingItem.id, {
      onSuccess: () => {
        toast.success('菜单已删除');
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      },
      onError: () => toast.error('删除菜单失败'),
    });
  };

  const handleAdd = (parentId?: string) => {
    setFormData({
      name: '',
      code: '',
      icon: 'File',
      path: '',
      type: parentId ? 'page' : 'directory',
      visible: true,
      sort_order: 0,
      parent_id: parentId || '',
    });
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: IMenuItem) => {
    setFormData({
      name: item.name,
      code: item.code || '',
      icon: item.icon || 'File',
      path: item.path || '',
      type: item.type,
      visible: item.visible,
      sort_order: item.sort_order,
      parent_id: item.parent_id || '',
    });
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('请填写菜单名称');
      return;
    }
    if (formData.type !== 'directory' && !formData.path) {
      toast.error('菜单类型需要填写路由路径');
      return;
    }

    const submitData = {
      name: formData.name,
      code: formData.code || undefined,
      icon: formData.icon,
      path: formData.path || undefined,
      type: formData.type,
      visible: formData.visible,
      sort_order: formData.sort_order,
      parent_id: formData.parent_id || undefined,
    };

    if (editingItem) {
      updateMenuMutation.mutate(
        { id: editingItem.id, data: submitData },
        {
          onSuccess: () => {
            toast.success('菜单已更新');
            setDialogOpen(false);
          },
          onError: () => toast.error('更新菜单失败'),
        },
      );
    } else {
      createMenuMutation.mutate(submitData, {
        onSuccess: () => {
          toast.success('菜单已添加');
          setDialogOpen(false);
        },
        onError: () => toast.error('添加菜单失败'),
      });
    }
  };

  const renderTree = (items: IMenuItem[], level: number = 0) => {
    return items.map((item) => {
      const isExpanded = expandedIds.has(item.id);
      const hasChildren = item.children && item.children.length > 0;

      return (
        <div key={item.id}>
          <div
            className={`group flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            <button
              onClick={() => hasChildren && toggleExpand(item.id)}
              className={`shrink-0 size-5 flex items-center justify-center rounded hover:bg-accent transition-colors ${
                hasChildren ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                )
              ) : (
                <span className="size-3.5" />
              )}
            </button>

            <div
              className={`shrink-0 p-1.5 rounded ${item.type === 'directory' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-accent/50 text-accent-foreground'}`}
            >
              {item.type === 'directory' ? (
                <FolderIcon className="size-4" />
              ) : (
                <RenderIcon name={item.icon} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </span>
                <Badge
                  variant={item.type === 'directory' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {item.type === 'directory'
                    ? '目录'
                    : item.type === 'button'
                      ? '按钮'
                      : '菜单'}
                </Badge>
                {item.code && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {item.code}
                  </Badge>
                )}
                {!item.visible && (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground"
                  >
                    隐藏
                  </Badge>
                )}
              </div>
              {item.path && (
                <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                  {item.path}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Switch
                checked={item.visible}
                onCheckedChange={() =>
                  handleToggleVisible(item.id, item.visible)
                }
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => handleEdit(item)}
                title="编辑"
              >
                <EditIcon className="size-3.5" />
              </Button>
              {item.type === 'directory' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleAdd(item.id)}
                  title="添加子菜单"
                >
                  <PlusIcon className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => handleDeleteConfirm(item)}
                title="删除"
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {hasChildren && isExpanded && renderTree(item.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <section className="w-full">
      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        {/* 头部操作区 */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div>
            <h2 className="text-lg font-semibold text-foreground">菜单管理</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              管理系统导航菜单结构，支持多级目录与子菜单
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleAdd()}>
              <FolderIcon className="mr-2 size-4" />
              新增目录
            </Button>
            <Button
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  type: 'page',
                  parent_id: '',
                }));
                handleAdd();
              }}
            >
              <PlusIcon className="mr-2 size-4" />
              新增菜单
            </Button>
          </div>
        </div>

        {/* 菜单树列表 */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p>数据加载失败，请稍后重试</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                重试
              </Button>
            </div>
          ) : menuData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderIcon className="size-10 mb-3 opacity-30" />
              <p>暂无菜单数据</p>
              <p className="text-xs mt-1">点击上方按钮创建第一个目录或菜单</p>
            </div>
          ) : (
            renderTree(menuData)
          )}
        </div>
      </div>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑菜单' : '新增菜单'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? '修改菜单配置信息'
                : '添加新的导航菜单项，目录可包含子菜单'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  菜单类型 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: v as IMenuItem['type'],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="directory">
                      目录（可包含子菜单）
                    </SelectItem>
                    <SelectItem value="page">菜单（页面链接）</SelectItem>
                    <SelectItem value="button">按钮（权限标识）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>父级菜单</Label>
                <Select
                  value={formData.parent_id || '_none'}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      parent_id: v === '_none' ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="无（顶级菜单）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">无（顶级菜单）</SelectItem>
                    {parentOptions
                      .filter((opt) => opt.id !== editingItem?.id) // 不能选自己作为父级
                      .map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {'　'.repeat(opt.level)}
                          {opt.level > 0 ? '└ ' : ''}
                          {opt.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                菜单名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="请输入菜单名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>权限标识码</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="如 user、log"
                />
                <p className="text-xs text-muted-foreground">
                  对应权限模块名，如 user:view 中的 user
                </p>
              </div>

              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>

            {formData.type !== 'directory' && (
              <div className="space-y-2">
                <Label>
                  路由路径 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.path}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, path: e.target.value }))
                  }
                  placeholder="/system/users"
                />
              </div>
            )}

            {formData.type === 'directory' && (
              <div className="space-y-2">
                <Label>路径前缀</Label>
                <Input
                  value={formData.path}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, path: e.target.value }))
                  }
                  placeholder="/system（可选，用于路径分组）"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>图标</Label>
              <Select
                value={formData.icon}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, icon: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <RenderIcon name={formData.icon} />
                      <span>{formData.icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {iconOptions.map((name) => {
                    const IconComp = iconMap[name];
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <IconComp className="size-4" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>是否显示</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  隐藏后不在侧边栏显示
                </p>
              </div>
              <Switch
                checked={formData.visible}
                onCheckedChange={(v) =>
                  setFormData((prev) => ({ ...prev, visible: v }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除菜单</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem?.children?.length
                ? `菜单「${deletingItem?.name}」下有 ${deletingItem?.children?.length} 个子菜单，删除后子菜单也将被移除。确定要继续吗？`
                : `确定要删除菜单「${deletingItem?.name}」吗？此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default MenuTreeSection;
