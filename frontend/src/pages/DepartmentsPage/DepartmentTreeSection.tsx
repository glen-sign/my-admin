import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import {
  Building2Icon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  UsersIcon,
  UploadIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useDepartmentTree,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useImportDepartments,
} from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { IDepartment, IDepartmentImportResult } from '@/api/departments';
import { getDepartmentImportTemplateUrl } from '@/api/departments';
import ImportDialog from '@/components/ImportDialog';

const DepartmentTreeSection: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] =
    useState<IDepartmentImportResult | null>(null);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [deletingDept, setDeletingDept] = useState<IDepartment | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager_id: '',
  });

  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useDepartmentTree({
    keyword: debouncedSearchQuery,
  });
  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();
  const importDepartmentsMutation = useImportDepartments();
  const { data: usersData } = useUsers({ pageSize: 200 });
  const allUsers = usersData?.list || [];

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

  const handleOpenCreate = (pId?: string) => {
    setEditingDept(null);
    setParentId(pId);
    setFormData({ name: '', code: '', manager_id: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (dept: IDepartment) => {
    setEditingDept(dept);
    setParentId(undefined);
    setFormData({
      name: dept.name,
      code: dept.code || '',
      manager_id: dept.manager_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error('请填写完整信息');
      return;
    }
    if (editingDept) {
      updateDepartmentMutation.mutate(
        {
          id: editingDept.id,
          data: {
            name: formData.name,
            code: formData.code,
            manager_id: formData.manager_id,
          },
        },
        {
          onSuccess: () => {
            toast.success('部门信息已更新');
            setDialogOpen(false);
          },
          onError: () => toast.error('更新部门失败'),
        },
      );
    } else {
      createDepartmentMutation.mutate(
        {
          name: formData.name,
          code: formData.code,
          manager_id: formData.manager_id,
          parent_id: parentId,
        },
        {
          onSuccess: () => {
            toast.success('部门已创建');
            setDialogOpen(false);
          },
          onError: () => toast.error('创建部门失败'),
        },
      );
    }
  };

  const handleDeleteConfirm = (dept: IDepartment) => {
    setDeletingDept(dept);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingDept) return;
    deleteDepartmentMutation.mutate(deletingDept.id, {
      onSuccess: () => {
        toast.success(`已删除部门「${deletingDept.name}」`);
        setDeleteDialogOpen(false);
        setDeletingDept(null);
      },
      onError: (err: Error) => toast.error(err.message || '删除部门失败'),
    });
  };

  const handleImport = (file: File) => {
    importDepartmentsMutation.mutate(file, {
      onSuccess: (data) => {
        setImportResult(data);
        if (data.failed === 0) {
          toast.success(`成功导入 ${data.success} 条部门数据`);
        } else {
          toast.warning(
            `导入完成：成功 ${data.success} 条，失败 ${data.failed} 条`,
          );
        }
      },
      onError: () => toast.error('导入失败'),
    });
  };

  const renderTree = (depts: IDepartment[], level: number = 0) => {
    return depts.map((dept) => {
      const isExpanded = expandedIds.has(dept.id);
      const hasChildren = dept.children && dept.children.length > 0;

      return (
        <React.Fragment key={dept.id}>
          <TableRow>
            <TableCell>
              <div
                className="flex items-center gap-2"
                style={{ paddingLeft: `${level * 24}px` }}
              >
                <button
                  onClick={() => hasChildren && toggleExpand(dept.id)}
                  className={`shrink-0 size-5 flex items-center justify-center rounded hover:bg-accent transition-colors ${
                    hasChildren ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDownIcon className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    )
                  ) : (
                    <Building2Icon className="size-4 text-muted-foreground" />
                  )}
                </button>
                <span className="text-sm font-medium text-foreground">
                  {dept.name}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">
                {dept.code || '-'}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-foreground flex items-center gap-1">
                <UsersIcon className="size-3 text-muted-foreground" />
                {dept.manager?.name || '-'}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {dept.created_at?.split('T')[0] || '-'}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleOpenEdit(dept)}
                >
                  <PencilIcon className="size-3.5 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleOpenCreate(dept.id)}
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  添加子部门
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteConfirm(dept)}
                >
                  <Trash2Icon className="size-3.5 mr-1" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && renderTree(dept.children!, level + 1)}
        </React.Fragment>
      );
    });
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
                  placeholder="搜索部门名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 shrink-0"
                onClick={() => {
                  setImportResult(null);
                  setImportDialogOpen(true);
                }}
              >
                <UploadIcon className="size-4 mr-1.5" />
                导入
              </Button>
              <Button
                className="h-9 shrink-0"
                onClick={() => handleOpenCreate()}
              >
                <PlusIcon className="size-4 mr-1.5" />
                新增部门
              </Button>
            </div>
          </div>
        </div>

        {/* 表格内容 */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              加载中...
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p>数据加载失败，请稍后重试</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                重试
              </Button>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2Icon className="size-10 mb-3 opacity-30" />
              <p>暂无部门数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">
                    部门名称
                  </TableHead>
                  <TableHead className="w-[120px]">
                    部门编码
                  </TableHead>
                  <TableHead className="w-[150px]">
                    负责人
                  </TableHead>
                  <TableHead className="w-[120px]">
                    创建时间
                  </TableHead>
                  <TableHead className="w-[240px] text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTree(departments)}</TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[580px] p-0 gap-0 overflow-hidden border-0 shadow-2xl">
          <DialogHeader className="px-7 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              {editingDept ? '编辑部门信息' : '创建新部门'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {editingDept
                ? '修改部门的基本信息和负责人'
                : '填写以下信息以创建一个新的组织部门'}
            </p>
          </DialogHeader>

          <div className="px-7 pb-6 space-y-6">
            {/* 基本信息区块 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                <div className="size-1.5 rounded-full bg-blue-500" />
                基本信息
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/80">
                    部门名称 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="部门名称"
                    className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground/80">
                    部门编码 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    placeholder="如 DZB、JSB"
                    className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-dashed border-border/60" />

            {/* 负责人区块 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                负责人
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground/80">
                  选择负责人
                </Label>
                <Select
                  value={formData.manager_id || '_none'}
                  onValueChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      manager_id: val === '_none' ? '' : val,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors">
                    <SelectValue placeholder="选择负责人" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">暂不指定</SelectItem>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                        {user.department?.name
                          ? ` (${user.department.name})`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="flex items-center justify-end gap-3 px-7 py-4 bg-muted/30 border-t border-border/40">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="h-9 px-5 text-sm"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="h-9 px-6 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm"
            >
              {editingDept ? '保存修改' : '创建部门'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除部门</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，部门「{deletingDept?.name}
              」及其子部门数据将无法恢复。确定要继续吗？
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

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="导入部门"
        templateUrl={getDepartmentImportTemplateUrl()}
        templateName="departments_import_template.csv"
        onImport={handleImport}
        importing={importDepartmentsMutation.isPending}
        result={importResult}
      />
    </section>
  );
};

export default DepartmentTreeSection;
