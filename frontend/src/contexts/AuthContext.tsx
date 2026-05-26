import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { TOKEN_KEY } from '@/lib/axios';

interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  department_id: number | null;
  department: { id: number; name: string } | null;
}

export interface MenuNode {
  id: number;
  name: string;
  type: 'directory' | 'page' | 'button';
  path?: string;
  icon?: string;
  visible?: boolean;
  sort_order?: number;
  children?: MenuNode[];
}

interface AuthContextType {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  menus: MenuNode[];
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  casLogin: () => void;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menus, setMenus] = useState<MenuNode[]>([]);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const skipFetchRef = useRef(false);

  const clearAuth = useCallback(() => {
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setMenus([]);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  // 监听 401 事件清除状态
  useEffect(() => {
    const handleLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [clearAuth]);

  const fetchUser = useCallback(async () => {
    try {
      const res = (await apiClient.get('/auth/me')) as {
        user: AuthUser;
        roles: string[];
        permissions: string[];
        menus: MenuNode[];
      };
      setUser(res.user);
      setRoles(res.roles || []);
      setPermissions(res.permissions || []);
      setMenus(res.menus || []);
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    if (token) {
      // login 已设置状态时跳过 fetchUser
      if (skipFetchRef.current) {
        skipFetchRef.current = false;
        setIsLoading(false);
      } else {
        fetchUser().finally(() => setIsLoading(false));
      }
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (username: string, password: string) => {
    const res = (await apiClient.post('/auth/login', {
      username,
      password,
    })) as {
      token: string;
      user: AuthUser;
      roles: string[];
      permissions: string[];
      menus: MenuNode[];
    };
    localStorage.setItem(TOKEN_KEY, res.token);
    skipFetchRef.current = true;
    setToken(res.token);
    setUser(res.user);
    setRoles(res.roles || []);
    setPermissions(res.permissions || []);
    setMenus(res.menus || []);
  };

  const casLogin = () => {
    // 浏览器直接导航不走 Vite proxy,需要使用后端完整地址
    const apiBaseUrl = import.meta.env.VITE_PROXY_TARGET;
    window.location.href = `${apiBaseUrl}/api/auth/cas/login`;
  };

  const logout = async () => {
    try {
      const res = (await apiClient.post('/auth/logout')) as
        | { cas_logout_url?: string }
        | undefined;
      clearAuth();

      // 如果是 CAS 登录的用户，跳转到 CAS 服务器进行单点登出
      if (res?.cas_logout_url) {
        window.location.href = res.cas_logout_url;
        return;
      }
    } catch {
      clearAuth();
    }

    navigate('/login', { replace: true });
  };

  const value = useMemo(
    () => ({
      user,
      roles,
      permissions,
      menus,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      casLogin,
      logout,
      fetchUser,
    }),
    [
      user,
      roles,
      permissions,
      menus,
      token,
      isLoading,
      login,
      casLogin,
      logout,
      fetchUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
