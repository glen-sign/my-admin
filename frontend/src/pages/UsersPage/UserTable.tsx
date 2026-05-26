import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  EditIcon,
  BanIcon,
  UserCheckIcon,
  Trash2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronsUpDownIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import type { IUser } from '@/api/users';

interface UserTableProps {
  users: IUser[];
  selectedIds: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onSelectAll: (checked: boolean | 'indeterminate') => void;
  onSelectRow: (id: string, checked: boolean) => void;
  onEdit: (user: IUser) => void;
  onToggleStatus: (user: IUser) => void;
  onDelete: (user: IUser) => void;
}

/** 排序图标 */
function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
  if (sortBy === column) {
    return sortOrder === 'asc' ? <ArrowUpIcon className="size-3.5" /> : <ArrowDownIcon className="size-3.5" />;
  }
  return <ChevronsUpDownIcon className="size-3 opacity-30" />;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedIds,
  sortBy,
  sortOrder,
  onSort,
  onSelectAll,
  onSelectRow,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={
                users.length > 0 && selectedIds.length === users.length
                  ? true
                  : selectedIds.length > 0 && selectedIds.length < users.length
                    ? 'indeterminate'
                    : false
              }
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="w-[200px] cursor-pointer select-none" onClick={() => onSort('name')}>
            <div className="flex items-center gap-1">
              用户
              <SortIcon column="name" sortBy={sortBy} sortOrder={sortOrder} />
            </div>
          </TableHead>
          <TableHead className="w-[150px]">所属部门</TableHead>
          <TableHead className="w-[140px]">角色</TableHead>
          <TableHead className="w-[140px]">联系电话</TableHead>
          <TableHead className="w-[100px] cursor-pointer select-none" onClick={() => onSort('status')}>
            <div className="flex items-center gap-1">
              状态
              <SortIcon column="status" sortBy={sortBy} sortOrder={sortOrder} />
            </div>
          </TableHead>
          <TableHead className="w-[120px] cursor-pointer select-none" onClick={() => onSort('created_at')}>
            <div className="flex items-center gap-1">
              创建时间
              <SortIcon column="created_at" sortBy={sortBy} sortOrder={sortOrder} />
            </div>
          </TableHead>
          <TableHead className="w-[180px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} data-state={selectedIds.includes(user.id) ? 'selected' : undefined}>
            <TableCell>
              <Checkbox
                checked={selectedIds.includes(user.id)}
                onCheckedChange={(checked) => onSelectRow(user.id, !!checked)}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-foreground">{user.department?.name || '-'}</span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {user.roles?.map((role) => (
                  <Badge key={role.id} variant="secondary" className="text-xs">{role.name}</Badge>
                )) || '-'}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm text-foreground font-mono">{user.phone || '-'}</span>
            </TableCell>
            <TableCell>
              <Badge
                variant={user.status === 'active' ? 'default' : 'destructive'}
                className={user.status === 'active' ? 'bg-[hsl(158_56%_92%)] text-[hsl(158_56%_32%)] hover:bg-[hsl(158_56%_88%)]' : ''}
              >
                {user.status === 'active' ? '正常' : '已禁用'}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{user.created_at?.split('T')[0]}</span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(user)}>
                  <EditIcon className="size-3.5 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${
                    user.status === 'active'
                      ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                      : 'text-success hover:text-success hover:bg-success/10'
                  }`}
                  onClick={() => onToggleStatus(user)}
                >
                  {user.status === 'active' ? (
                    <><BanIcon className="size-3.5 mr-1" />禁用</>
                  ) : (
                    <><UserCheckIcon className="size-3.5 mr-1" />启用</>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(user)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
