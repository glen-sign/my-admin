import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useDepartments } from '@/hooks/useDepartments';
import type { IUser } from '@/api/users';

const userFormSchema = z.object({
  name: z.string().min(1, '请输入姓名'),
  username: z.string().optional(),
  email: z.string().min(1, '请输入邮箱').email('邮箱格式不正确'),
  password: z.string().optional(),
  department_id: z.string().optional(),
  role: z.string().min(1, '请选择角色'),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 编辑时传入用户对象，新建时传 null */
  user: IUser | null;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ open, onOpenChange, user }) => {
  const isEditing = !!user;
  const { data: rolesData } = useRoles();
  const { data: departmentsData } = useDepartments();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const roles = rolesData || [];
  const departments = departmentsData || [];

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      password: '',
      department_id: user?.department?.id || '',
      role: user?.roles?.[0]?.name || '',
      phone: user?.phone || '',
    },
  });

  // 当 user 变化时重置表单
  React.useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name || '',
        username: user?.username || '',
        email: user?.email || '',
        password: '',
        department_id: user?.department?.id || '',
        role: user?.roles?.[0]?.name || '',
        phone: user?.phone || '',
      });
    }
  }, [open, user, form]);

  const handleSave = form.handleSubmit((data) => {
    if (!isEditing) {
      let hasError = false;
      if (!data.username || data.username.length === 0) {
        form.setError('username', { message: '请输入工号' });
        hasError = true;
      }
      if (!data.password || data.password.length < 6) {
        form.setError('password', { message: '密码至少6位' });
        hasError = true;
      }
      if (hasError) return;
    }

    if (isEditing && user) {
      updateUserMutation.mutate(
        { id: user.id, data },
        {
          onSuccess: () => {
            toast.success('用户信息已更新');
            onOpenChange(false);
          },
          onError: (err: Error) => toast.error(err.message || '更新用户失败'),
        },
      );
    } else {
      createUserMutation.mutate(
        data as unknown as { name: string; username: string; email: string; password: string; department_id?: string; phone?: string; role?: string },
        {
          onSuccess: () => {
            toast.success('用户已添加');
            onOpenChange(false);
          },
          onError: (err: Error) => toast.error(err.message || '添加用户失败'),
        },
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <DialogHeader className="px-7 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {isEditing ? '编辑用户信息' : '创建新用户'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing ? '修改用户的基本信息和权限配置' : '填写以下信息以创建一个新的系统用户'}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form id="user-form" onSubmit={handleSave} className="px-7 pb-6 space-y-6">
            {/* 基本信息区块 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                <div className="size-1.5 rounded-full bg-blue-500" />
                基本信息
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">
                        姓名 <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="用户姓名" className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!isEditing && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-foreground/80">
                          工号 <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="登录用户名" className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">
                        邮箱 <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="name@company.com" className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">联系电话</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="手机号码" className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="border-t border-dashed border-border/60" />

            {/* 组织与权限区块 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                组织与权限
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">所属部门</FormLabel>
                      <Select value={field.value || '_none'} onValueChange={(val) => field.onChange(val === '_none' ? '' : val)}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors">
                            <SelectValue placeholder="选择部门" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none">选择部门</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">
                        角色 <span className="text-red-400">*</span>
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 密码设置 */}
            {!isEditing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  <div className="size-1.5 rounded-full bg-amber-500" />
                  密码设置
                </div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-foreground/80">
                        初始密码 <span className="text-red-400">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="至少6位" className="h-10 bg-muted/30 border-border/50 focus:bg-background transition-colors max-w-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </form>
        </Form>

        <div className="flex items-center justify-end gap-3 px-7 py-4 bg-muted/30 border-t border-border/40">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-9 px-5 text-sm">
            取消
          </Button>
          <Button
            type="submit"
            form="user-form"
            className="h-9 px-6 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-sm"
          >
            {isEditing ? '保存修改' : '创建用户'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
