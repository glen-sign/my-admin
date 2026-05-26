import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { ShieldCheckIcon, UserIcon, LockIcon, ShieldIcon } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { login, casLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : '登录失败，请检查用户名和密码',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[60%] h-[60%] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-chart-2/[0.02] blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] px-4 relative z-10 page-enter">
        {/* Logo 和标题 */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-primary text-primary-foreground mb-5 shadow-lg shadow-primary/20">
            <ShieldCheckIcon className="size-8" />
          </div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
            后台管理系统
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            安全登录以继续使用
          </p>
        </div>

        <Card className="shadow-xl shadow-black/[0.03] border-border/60">
          <CardHeader className="pb-4 pt-6 px-7">
            <CardTitle className="text-lg font-semibold">账号登录</CardTitle>
            <CardDescription>请输入您的账号和密码</CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/8 border border-destructive/15 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    className="pl-10 h-10"
                    autoComplete="username"
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    className="pl-10 h-10"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10 font-medium shadow-sm shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                  或
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={casLogin}
              >
                <ShieldIcon className="size-4" />
                CAS 单点登录
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/70 mt-8">
          &copy; {new Date().getFullYear()} 后台管理 · 基础管理系统
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
