import React, { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2Icon } from 'lucide-react';
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
import { toast } from 'sonner';
import {
  useUsers,
  useToggleUserStatus,
  useImportUsers,
  useDeleteUser,
  useBatchDeleteUsers,
} from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useDepartments } from '@/hooks/useDepartments';
import type { IUser, IImportResult } from '@/api/users';
import { getUserImportTemplateUrl, getUsersExportUrl } from '@/api/users';
import ImportDialog from '@/components/ImportDialog';
import PaginationBar from '@/components/PaginationBar';
import UserToolbar from './UserToolbar';
import UserTable from './UserTable';
import UserFormDialog from './UserFormDialog';

const UserListSection: React.FC = () => {
  // 筛选状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const debouncedSearch = useDebouncedValue(searchText);

  // 选择与对话框状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'batch'>('single');
  const [importResult, setImportResult] = useState<IImportResult | null>(null);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  // 数据查询
  const { data: usersData, isLoading, isError } = useUsers({
    keyword: debouncedSearch,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    department_id: departmentFilter || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    page: pagination.current,
    pageSize: pagination.pageSize,
  });
  const { data: rolesData } = useRoles();
  const { data: departmentsData } = useDepartments();

  const toggleStatusMutation = useToggleUserStatus();
  const importUsersMutation = useImportUsers();
  const deleteUserMutation = useDeleteUser();
  const batchDeleteUsersMutation = useBatchDeleteUsers();

  const users = usersData?.list || [];
  const total = usersData?.total || 0;
  const roles = rolesData || [];
  const departments = departmentsData || [];

  // 重置分页和选择
  const resetPagination = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    setSelectedIds([]);
  };

  // 事件处理
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    resetPagination();
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    setSelectedIds(checked ? users.map((u) => u.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((i) => i !== id));
  };

  const handleToggleStatus = (user: IUser) => {
    setCurrentUser(user);
    setDisableDialogOpen(true);
  };

  const confirmToggleStatus = () => {
    if (!currentUser) return;
    const newStatus = currentUser.status === 'active' ? 'disabled' : 'active';
    toggleStatusMutation.mutate(
      { id: currentUser.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(newStatus === 'disabled' ? `已禁用用户 ${currentUser.name}` : `已启用用户 ${currentUser.name}`);
          setDisableDialogOpen(false);
          setCurrentUser(null);
        },
        onError: (err: Error) => toast.error(err.message || '操作失败'),
      },
    );
  };

  const handleDeleteSingle = (user: IUser) => {
    setCurrentUser(user);
    setDeleteTarget('single');
    setDeleteDialogOpen(true);
  };

  const handleDeleteBatch = () => {
    setDeleteTarget('batch');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget === 'single' && currentUser) {
      deleteUserMutation.mutate(currentUser.id, {
        onSuccess: () => {
          toast.success(`已删除用户 ${currentUser.name}`);
          setDeleteDialogOpen(false);
          setCurrentUser(null);
          setSelectedIds((prev) => prev.filter((id) => id !== currentUser.id));
        },
        onError: (err: Error) => toast.error(err.message || '删除失败'),
      });
    } else if (deleteTarget === 'batch' && selectedIds.length > 0) {
      batchDeleteUsersMutation.mutate(selectedIds, {
        onSuccess: (data) => {
          toast.success(`已批量删除 ${data.deleted_count} 个用户`);
          setDeleteDialogOpen(false);
          setSelectedIds([]);
        },
        onError: (err: Error) => toast.error(err.message || '批量删除失败'),
      });
    }
  };

  const handleImport = (file: File) => {
    importUsersMutation.mutate(file, {
      onSuccess: (data) => {
        setImportResult(data);
        if (data.failed === 0) {
          toast.success(`成功导入 ${data.success} 条用户数据`);
        } else {
          toast.warning(`导入完成：成功 ${data.success} 条，失败 ${data.failed} 条`);
        }
      },
      onError: (err: Error) => toast.error(err.message || '导入失败'),
    });
  };

  const handleExport = () => {
    const url = getUsersExportUrl({
      keyword: debouncedSearch || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      department_id: departmentFilter || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <section className="w-full">
      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        <UserToolbar
          searchText={searchText}
          onSearchChange={(v) => { setSearchText(v); resetPagination(); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(v) => { setStatusFilter(v); resetPagination(); }}
          roleFilter={roleFilter}
          onRoleFilterChange={(v) => { setRoleFilter(v); resetPagination(); }}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={(v) => { setDepartmentFilter(v); resetPagination(); }}
          roles={roles}
          departments={departments}
          onExport={handleExport}
          onImport={() => { setImportResult(null); setImportDialogOpen(true); }}
          onAdd={() => { setCurrentUser(null); setEditDialogOpen(true); }}
        />

        <div className="p-4">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: pagination.pageSize }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-4 w-[90px]" />
                  <Skeleton className="h-5 w-[48px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-7 w-[60px]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <span>数据加载失败，请稍后重试</span>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>刷新页面</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">暂无数据</div>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 mb-3 bg-muted/50 rounded-lg border border-border/40">
                  <span className="text-sm text-muted-foreground">
                    已选择 <span className="font-medium text-foreground">{selectedIds.length}</span> 项
                  </span>
                  <Button variant="destructive" size="sm" className="h-7 px-3 text-xs" onClick={handleDeleteBatch}>
                    <Trash2Icon className="size-3.5 mr-1" />批量删除
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedIds([])}>
                    取消选择
                  </Button>
                </div>
              )}

              <UserTable
                users={users}
                selectedIds={selectedIds}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onSelectAll={handleSelectAll}
                onSelectRow={handleSelectRow}
                onEdit={(user) => { setCurrentUser(user); setEditDialogOpen(true); }}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteSingle}
              />

              <PaginationBar
                page={pagination.current}
                pageSize={pagination.pageSize}
                total={total}
                onPageChange={(p) => { setPagination((prev) => ({ ...prev, current: p })); setSelectedIds([]); }}
              />
            </>
          )}
        </div>
      </div>

      {/* 用户表单对话框 */}
      <UserFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={currentUser}
      />

      {/* 禁用/启用确认 */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentUser?.status === 'active' ? '确认禁用用户' : '确认启用用户'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentUser?.status === 'active'
                ? `禁用后，用户 ${currentUser?.name} 将无法登录系统并处理相关任务。确定要继续吗？`
                : `启用后，用户 ${currentUser?.name} 将恢复正常使用权限。确定要继续吗？`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleStatus}
              className={currentUser?.status === 'active' ? 'bg-destructive text-white' : ''}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'single'
                ? `确定要删除用户 ${currentUser?.name} 吗？此操作不可撤销。`
                : `确定要删除选中的 ${selectedIds.length} 个用户吗？此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 导入对话框 */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="导入用户"
        templateUrl={getUserImportTemplateUrl()}
        templateName="users_import_template.csv"
        onImport={handleImport}
        importing={importUsersMutation.isPending}
        result={importResult}
      />
    </section>
  );
};

export default UserListSection;
