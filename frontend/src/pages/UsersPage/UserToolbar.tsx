import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  SearchIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
  ChevronsUpDownIcon,
} from 'lucide-react';
import type { IRole } from '@/api/roles';
import type { IDepartment } from '@/api/departments';

interface UserToolbarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  roles: IRole[];
  departments: IDepartment[];
  onExport: () => void;
  onImport: () => void;
  onAdd: () => void;
}

const UserToolbar: React.FC<UserToolbarProps> = ({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  roles,
  departments,
  onExport,
  onImport,
  onAdd,
}) => {
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

  return (
    <div className="p-5 border-b border-border/60">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户姓名、邮箱、电话..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="h-9 w-full sm:w-32">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="h-9 w-full sm:w-36">
              <SelectValue placeholder="角色筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-full sm:w-40 justify-between font-normal">
                {departmentFilter
                  ? departments.find((d) => String(d.id) === departmentFilter)?.name || '部门筛选'
                  : '部门筛选'}
                <ChevronsUpDownIcon className="size-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandInput placeholder="搜索部门..." className="h-9" />
                <CommandList>
                  <CommandEmpty>未找到部门</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=""
                      onSelect={() => {
                        onDepartmentFilterChange('');
                        setDepartmentPopoverOpen(false);
                      }}
                    >
                      全部部门
                    </CommandItem>
                    {departments.map((dept) => (
                      <CommandItem
                        key={dept.id}
                        value={dept.name}
                        onSelect={() => {
                          onDepartmentFilterChange(String(dept.id));
                          setDepartmentPopoverOpen(false);
                        }}
                      >
                        {dept.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 shrink-0" onClick={onExport}>
            <DownloadIcon className="size-4 mr-1.5" />
            导出
          </Button>
          <Button variant="outline" className="h-9 shrink-0" onClick={onImport}>
            <UploadIcon className="size-4 mr-1.5" />
            导入
          </Button>
          <Button className="h-9 shrink-0" onClick={onAdd}>
            <PlusIcon className="size-4 mr-1.5" />
            新增用户
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserToolbar;
