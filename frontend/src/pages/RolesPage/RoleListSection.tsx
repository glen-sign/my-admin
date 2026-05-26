import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheckIcon,
  PlusIcon,
  SearchIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  KeyIcon,
  BanIcon,
  UserCheckIcon,
  FolderOpenIcon,
  ListChecksIcon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  UserIcon,
  BuildingIcon,
  MenuIcon,
  SettingsIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useToggleRoleStatus,
  useUpdateRolePermissions,
  useAllPermissions,
  useRoleMenus,
  useUpdateRoleMenus,
} from '@/hooks/useRoles';
import { useMenuTree } from '@/hooks/useMenus';
import type { IRole, IPermission } from '@/api/roles';
import type { IMenuItem } from '@/api/menus';

/** 模块图标映射 */
const MODULE_ICON_MAP: Record<string, React.ReactNode> = {
  project: <FolderOpenIcon className="size-4" />,
  task: <ListChecksIcon className="size-4" />,
  approval: <ClipboardCheckIcon className="size-4" />,
  user: <UserIcon className="size-4" />,
  department: <BuildingIcon className="size-4" />,
  role: <ShieldCheckIcon className="size-4" />,
  menu: <MenuIcon className="size-4" />,
  system: <SettingsIcon className="size-4" />,
};

/** 从权限列表构建模块和操作的中文标签映射 */
function buildLabelMaps(permissions: IPermission[]): {
  moduleMap: Record<string, string>;
  actionMap: Record<string, string>;
} {
  const moduleMap: Record<string, string> = {};
  const actionMap: Record<string, string> = {};

  for (const perm of permissions) {
    if (!perm.label) continue;
    const [module, action] = perm.name.split(':');
    const parts = perm.label.split('-');
    if (parts.length >= 2) {
      if (!moduleMap[module]) {
        moduleMap[module] = parts[0];
      }
      if (!actionMap[action]) {
        actionMap[action] = parts.slice(1).join('-');
      }
    }
  }

  return { moduleMap, actionMap };
}

/** 将权限列表按模块分组 */
function groupPermissionsByModule(
  permissions: string[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const perm of permissions) {
    const [module] = perm.split(':');
    if (!groups[module]) {
      groups[module] = [];
    }
    groups[module].push(perm);
  }
  return groups;
}

/** 获取模块图标 */
function getModuleIcon(module: string): React.ReactNode {
  return MODULE_ICON_MAP[module] || <LayoutDashboardIcon className="size-4" />;
}

/** 菜单树节点组件 */
const MenuTreeNode: React.FC<{
  menu: IMenuItem;
  selectedMenuIds: number[];
  toggleMenuId: (id: number) => void;
  toggleMenuWithChildren: (menu: IMenuItem, checked: boolean) => void;
  level: number;
}> = ({
  menu,
  selectedMenuIds,
  toggleMenuId,
  toggleMenuWithChildren,
  level,
}) => {
  const menuId = Number(menu.id);
  const isChecked = selectedMenuIds.includes(menuId);
  const hasChildren = menu.children && menu.children.length > 0;

  return (
    <div style={{ paddingLeft: `${level * 20}px` }}>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40">
        <Checkbox
          id={`menu-node-${menu.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => {
            if (hasChildren) {
              toggleMenuWithChildren(menu, !!checked);
            } else {
              toggleMenuId(menuId);
            }
          }}
        />
        <label
          htmlFor={`menu-node-${menu.id}`}
          className="flex items-center gap-1.5 text-sm cursor-pointer"
        >
          {menu.type === 'directory' ? (
            <FolderOpenIcon className="size-3.5 text-muted-foreground" />
          ) : menu.type === 'button' ? (
            <KeyIcon className="size-3.5 text-muted-foreground" />
          ) : (
            <MenuIcon className="size-3.5 text-muted-foreground" />
          )}
          <span>{menu.name}</span>
          {menu.type === 'directory' && (
            <span className="text-xs text-muted-foreground ml-1">(目录)</span>
          )}
          {menu.type === 'button' && (
            <span className="text-xs text-muted-foreground ml-1">(按钮)</span>
          )}
        </label>
      </div>
      {hasChildren &&
        menu.children!.map((child) => (
          <MenuTreeNode
            key={child.id}
            menu={child}
            selectedMenuIds={selectedMenuIds}
            toggleMenuId={toggleMenuId}
            toggleMenuWithChildren={toggleMenuWithChildren}
            level={level + 1}
          />
        ))}
    </div>
  );
};

const RoleListSection: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<IRole | null>(null);
  const [togglingRole, setTogglingRole] = useState<IRole | null>(null);
  const [menuEditingRole, setMenuEditingRole] = useState<IRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const {
    data: roles = [],
    isLoading,
    isError,
  } = useRoles({ keyword: searchKeyword });
  const { data: allPermissions = [] } = useAllPermissions();
  const { data: menuTree = [] } = useMenuTree();
  const { data: roleMenusData } = useRoleMenus(
    menuEditingRole?.id || '',
    menuDialogOpen,
  );

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const updateMenusMutation = useUpdateRoleMenus();

  /** 按模块分组的权限数据 */
  const groupedPermissions = useMemo(() => {
    const allPermNames = allPermissions.map((p) => p.name);
    return groupPermissionsByModule(allPermNames);
  }, [allPermissions]);

  /** 从 API 数据动态构建中文标签映射 */
  const { moduleMap, actionMap } = useMemo(() => {
    return buildLabelMaps(allPermissions);
  }, [allPermissions]);

  const getModuleLabel = (module: string): string => {
    return moduleMap[module] || module;
  };

  const getActionLabel = (perm: string): string => {
    const action = perm.split(':')[1] || perm;
    return actionMap[action] || action;
  };

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', code: '', description: '' });
    setSelectedPermissions([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (role: IRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      code: role.code || '',
      description: role.description || '',
    });
    setSelectedPermissions(
      (role.permissions ?? []).map((p) => (typeof p === 'string' ? p : p.name)),
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error('角色名称和编码不能为空');
      return;
    }

    if (editingRole) {
      updateRoleMutation.mutate(
        { id: editingRole.id, data: formData },
        {
          onSuccess: () => {
            toast.success('角色已更新');
            setDialogOpen(false);
          },
          onError: () => toast.error('更新角色失败'),
        },
      );
    } else {
      createRoleMutation.mutate(
        { ...formData, permissions: selectedPermissions },
        {
          onSuccess: () => {
            toast.success('角色已创建');
            setDialogOpen(false);
          },
          onError: () => toast.error('创建角色失败'),
        },
      );
    }
  };

  const handleDeleteConfirm = (role: IRole) => {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingRole) return;
    deleteRoleMutation.mutate(deletingRole.id, {
      onSuccess: () => {
        toast.success(`已删除角色「${deletingRole.name}」`);
        setDeleteDialogOpen(false);
        setDeletingRole(null);
      },
      onError: () => toast.error('删除角色失败'),
    });
  };

  const handleToggleStatusConfirm = (role: IRole) => {
    setTogglingRole(role);
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = () => {
    if (!togglingRole) return;
    const newStatus = togglingRole.status === 'active' ? 'disabled' : 'active';
    toggleStatusMutation.mutate(
      { id: togglingRole.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'disabled'
              ? `已禁用角色「${togglingRole.name}」`
              : `已启用角色「${togglingRole.name}」`,
          );
          setStatusDialogOpen(false);
          setTogglingRole(null);
        },
        onError: () => toast.error('操作失败'),
      },
    );
  };

  const handleOpenPermission = (role: IRole) => {
    setEditingRole(role);
    setSelectedPermissions(
      (role.permissions ?? []).map((p) => (typeof p === 'string' ? p : p.name)),
    );
    setPermissionDialogOpen(true);
  };

  const handleOpenMenus = (role: IRole) => {
    setMenuEditingRole(role);
    setSelectedMenuIds([]);
    setMenuDialogOpen(true);
  };

  // 当角色菜单数据加载完成时，更新选中状态
  React.useEffect(() => {
    if (roleMenusData && menuDialogOpen) {
      setSelectedMenuIds(roleMenusData.menu_ids || []);
    }
  }, [roleMenusData, menuDialogOpen]);

  const handleSaveMenus = () => {
    if (!menuEditingRole) return;
    updateMenusMutation.mutate(
      { id: menuEditingRole.id, menuIds: selectedMenuIds },
      {
        onSuccess: () => {
          toast.success('菜单配置已保存');
          setMenuDialogOpen(false);
          setMenuEditingRole(null);
        },
        onError: () => toast.error('保存菜单配置失败'),
      },
    );
  };

  const toggleMenuId = (id: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  /** 递归选中/取消选中菜单及其所有子菜单 */
  const toggleMenuWithChildren = (menu: IMenuItem, checked: boolean) => {
    const collectIds = (item: IMenuItem): number[] => {
      const ids = [Number(item.id)];
      if (item.children) {
        for (const child of item.children) {
          ids.push(...collectIds(child));
        }
      }
      return ids;
    };
    const ids = collectIds(menu);
    if (checked) {
      setSelectedMenuIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      setSelectedMenuIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleSavePermissions = () => {
    if (!editingRole) return;
    updatePermissionsMutation.mutate(
      { id: editingRole.id, permissions: selectedPermissions },
      {
        onSuccess: () => {
          toast.success('权限配置已保存');
          setPermissionDialogOpen(false);
        },
        onError: () => toast.error('保存权限配置失败'),
      },
    );
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const toggleModuleAll = (modulePerms: string[]) => {
    const allSelected = modulePerms.every((p) =>
      selectedPermissions.includes(p),
    );
    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !modulePerms.includes(p)),
      );
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePerms])]);
    }
  };

  const isModuleAllSelected = (modulePerms: string[]) => {
    return modulePerms.every((p) => selectedPermissions.includes(p));
  };

  const isModulePartialSelected = (modulePerms: string[]) => {
    const selectedCount = modulePerms.filter((p) =>
      selectedPermissions.includes(p),
    ).length;
    return selectedCount > 0 && selectedCount < modulePerms.length;
  };

  return (
    <section className="w-full">
      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        {/* 工具栏 */}
        <div className="p-5 border-b border-border/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="搜索角色名称、编码..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
            <Button className="h-9 shrink-0" onClick={handleOpenCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              新增角色
            </Button>
          </div>
        </div>

        {/* 表格内容 */}
        <div className="p-4">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[160px]" />
                  <Skeleton className="h-4 w-[50px]" />
                  <Skeleton className="h-5 w-[48px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-7 w-[60px]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p>数据加载失败，请稍后重试</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShieldCheckIcon className="size-10 mb-3 opacity-30" />
              <p>暂无角色数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">角色</TableHead>
                  <TableHead className="w-[120px]">编码</TableHead>
                  <TableHead className="w-[200px]">描述</TableHead>
                  <TableHead className="w-[80px]">用户数</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead className="w-[120px]">创建时间</TableHead>
                  <TableHead className="w-[220px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/50">
                          <ShieldCheckIcon className="size-4 text-accent-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {role.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {role.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {role.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground flex items-center gap-1">
                        <UsersIcon className="size-3 text-muted-foreground" />
                        {role.user_count ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          role.status === 'active' ? 'default' : 'destructive'
                        }
                        className={
                          role.status === 'active'
                            ? 'bg-[hsl(158_56%_92%)] text-[hsl(158_56%_32%)] hover:bg-[hsl(158_56%_88%)]'
                            : ''
                        }
                      >
                        {role.status === 'active' ? '启用' : '已禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {role.created_at?.split('T')[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleOpenEdit(role)}
                        >
                          <PencilIcon className="size-3.5 mr-1" />
                          编辑
                        </Button>
                        {role.code !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenPermission(role)}
                          >
                            <KeyIcon className="size-3.5 mr-1" />
                            权限
                          </Button>
                        )}
                        {role.code !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleOpenMenus(role)}
                          >
                            <MenuIcon className="size-3.5 mr-1" />
                            菜单
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 px-2 text-xs ${
                            role.status === 'active'
                              ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                              : 'text-success hover:text-success hover:bg-success/10'
                          }`}
                          onClick={() => handleToggleStatusConfirm(role)}
                        >
                          {role.status === 'active' ? (
                            <>
                              <BanIcon className="size-3.5 mr-1" />
                              禁用
                            </>
                          ) : (
                            <>
                              <UserCheckIcon className="size-3.5 mr-1" />
                              启用
                            </>
                          )}
                        </Button>
                        {role.code !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteConfirm(role)}
                          >
                            <Trash2Icon className="size-3.5 mr-1" />
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* 新增/编辑角色对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? '修改角色基本信息与权限配置'
                : '创建新的角色并分配初始权限'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                角色名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例如：项目管理员"
              />
            </div>
            <div className="grid gap-2">
              <Label>
                角色编码 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="例如：project_admin"
              />
            </div>
            <div className="grid gap-2">
              <Label>角色描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="描述该角色的职责与权限范围..."
                rows={3}
              />
            </div>
            {!editingRole && (
              <div className="grid gap-2">
                <Label>初始权限</Label>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const moduleAllSelected = isModuleAllSelected(perms);
                    const modulePartial = isModulePartialSelected(perms);

                    return (
                      <div
                        key={module}
                        className="rounded-md border border-border/60 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                          <Checkbox
                            id={`create-module-${module}`}
                            checked={
                              moduleAllSelected
                                ? true
                                : modulePartial
                                  ? 'indeterminate'
                                  : false
                            }
                            onCheckedChange={() => toggleModuleAll(perms)}
                          />
                          <label
                            htmlFor={`create-module-${module}`}
                            className="flex items-center gap-1.5 text-sm font-medium text-foreground cursor-pointer"
                          >
                            <span className="text-primary/70">
                              {getModuleIcon(module)}
                            </span>
                            {getModuleLabel(module)}
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2">
                          {perms.map((perm) => (
                            <div
                              key={perm}
                              className="flex items-center gap-1.5"
                            >
                              <Checkbox
                                id={`create-perm-${perm}`}
                                checked={selectedPermissions.includes(perm)}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                              <label
                                htmlFor={`create-perm-${perm}`}
                                className="text-xs text-foreground cursor-pointer"
                              >
                                {getActionLabel(perm)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限配置对话框 */}
      <Dialog
        open={permissionDialogOpen}
        onOpenChange={setPermissionDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyIcon className="size-5 text-primary" />
              权限配置
            </DialogTitle>
            <DialogDescription>
              为「{editingRole?.name}」配置可访问的权限项
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[55vh] pr-1">
            {/* 全选操作栏 */}
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-perms"
                  checked={
                    allPermissions.length > 0 &&
                    selectedPermissions.length === allPermissions.length
                  }
                  onCheckedChange={() => {
                    if (selectedPermissions.length === allPermissions.length) {
                      setSelectedPermissions([]);
                    } else {
                      setSelectedPermissions(allPermissions.map((p) => p.name));
                    }
                  }}
                />
                <label
                  htmlFor="select-all-perms"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  全选所有权限
                </label>
              </div>
              <span className="text-xs text-muted-foreground">
                已选择{' '}
                <span className="font-semibold text-primary">
                  {selectedPermissions.length}
                </span>{' '}
                / {allPermissions.length} 项
              </span>
            </div>

            {/* 按模块分组的权限卡片 */}
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(groupedPermissions).map(([module, perms]) => {
                const moduleAllSelected = isModuleAllSelected(perms);
                const modulePartial = isModulePartialSelected(perms);
                const selectedCount = perms.filter((p) =>
                  selectedPermissions.includes(p),
                ).length;

                return (
                  <div
                    key={module}
                    className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/50">
                      <div className="flex items-center gap-2.5">
                        <Checkbox
                          id={`module-${module}`}
                          checked={
                            moduleAllSelected
                              ? true
                              : modulePartial
                                ? 'indeterminate'
                                : false
                          }
                          onCheckedChange={() => toggleModuleAll(perms)}
                        />
                        <div className="flex items-center gap-2 text-foreground">
                          <span className="text-primary/80">
                            {getModuleIcon(module)}
                          </span>
                          <label
                            htmlFor={`module-${module}`}
                            className="text-sm font-semibold cursor-pointer"
                          >
                            {getModuleLabel(module)}
                          </label>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {selectedCount}/{perms.length}
                      </Badge>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                        {perms.map((perm) => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox
                              id={`cfg-perm-${perm}`}
                              checked={selectedPermissions.includes(perm)}
                              onCheckedChange={() => togglePermission(perm)}
                            />
                            <label
                              htmlFor={`cfg-perm-${perm}`}
                              className="text-sm text-foreground cursor-pointer whitespace-nowrap"
                            >
                              {getActionLabel(perm)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermissionDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSavePermissions}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 菜单分配对话框 */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MenuIcon className="size-5 text-primary" />
              菜单分配
            </DialogTitle>
            <DialogDescription>
              为「{menuEditingRole?.name}」配置可访问的菜单项
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 overflow-y-auto max-h-[55vh] pr-1">
            {menuTree.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无菜单数据
              </div>
            ) : (
              menuTree.map((menu: IMenuItem) => (
                <MenuTreeNode
                  key={menu.id}
                  menu={menu}
                  selectedMenuIds={selectedMenuIds}
                  toggleMenuId={toggleMenuId}
                  toggleMenuWithChildren={toggleMenuWithChildren}
                  level={0}
                />
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveMenus}>保存配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，角色「{deletingRole?.name}
              」将无法恢复，已分配该角色的用户将失去对应权限。确定要继续吗？
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

      {/* 启用/禁用确认弹窗 */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingRole?.status === 'active'
                ? '确认禁用角色'
                : '确认启用角色'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingRole?.status === 'active'
                ? `禁用后，拥有角色「${togglingRole?.name}」的用户将暂时失去对应权限。确定要继续吗？`
                : `启用后，拥有角色「${togglingRole?.name}」的用户将恢复对应权限。确定要继续吗？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleStatus}
              className={
                togglingRole?.status === 'active'
                  ? 'bg-destructive text-white'
                  : ''
              }
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default RoleListSection;
