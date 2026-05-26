import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  Building2Icon,
  SaveIcon,
  Loader2Icon,
  KeyIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/axios';

const ProfilePage: React.FC = () => {
  const { user, fetchUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('姓名不能为空');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.put('/auth/profile', formData);
      await fetchUser();
      toast.success('个人信息已更新');
    } catch {
      toast.error('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password) {
      toast.error('请输入当前密码');
      return;
    }
    if (!passwordData.new_password) {
      toast.error('请输入新密码');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('新密码至少6位');
      return;
    }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', passwordData);
      toast.success('密码修改成功');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '密码修改失败';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  const avatarChar = (user.name || user.username || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="w-full flex flex-col gap-5">
      <section className="w-full">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          个人中心
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          查看和编辑您的个人基础信息
        </p>
      </section>

      <section className="w-full max-w-2xl">
        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
          {/* 头部个人信息概览 */}
          <div className="relative px-8 pt-8 pb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary/[0.02]" />
            <div className="relative flex items-center gap-5">
              <Avatar className="size-20 ring-2 ring-border shadow-md">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {avatarChar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {user.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  @{user.username}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {user.department && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      <Building2Icon className="size-3" />
                      {user.department.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 编辑表单 */}
          <div className="p-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">
              基础信息
            </h3>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <UserIcon className="size-3.5 text-muted-foreground" />
                  姓名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="请输入您的姓名"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    邮箱
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="请输入邮箱地址"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5 text-muted-foreground" />
                    联系电话
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="请输入联系电话"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              账号信息
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">用户名</span>
                <span className="text-sm font-mono text-foreground">
                  {user.username}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">所属部门</span>
                <span className="text-sm text-foreground">
                  {user.department?.name || '未分配'}
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="h-10 px-6 shadow-sm shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <SaveIcon className="size-4" />
                    保存修改
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 修改密码 */}
      <section className="w-full max-w-2xl">
        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
              <KeyIcon className="size-4" />
              修改密码
            </h3>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label className="text-xs font-medium text-foreground/80">
                  当前密码 <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      current_password: e.target.value,
                    }))
                  }
                  placeholder="请输入当前密码"
                  className="h-10 max-w-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-foreground/80">
                    新密码 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        new_password: e.target.value,
                      }))
                    }
                    placeholder="至少6位"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-foreground/80">
                    确认新密码 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={passwordData.new_password_confirmation}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        new_password_confirmation: e.target.value,
                      }))
                    }
                    placeholder="再次输入新密码"
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                variant="outline"
                className="h-10 px-6"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <KeyIcon className="size-4" />
                    修改密码
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
