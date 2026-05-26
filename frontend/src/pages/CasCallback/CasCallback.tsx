import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TOKEN_KEY } from '@/lib/axios';

export default function CasCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorMsg = searchParams.get('error');

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // 使用 window.location 确保完整刷新，让 AuthContext 重新加载用户信息
      window.location.href = '/';
    } else {
      setError('未收到认证令牌，请重试');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <p className="text-muted-foreground text-sm">
            3秒后自动跳转到登录页...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-lg">正在完成登录...</p>
      </div>
    </div>
  );
}
