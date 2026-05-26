import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SetupGuard from './components/SetupGuard';
import LoginPage from './pages/LoginPage/LoginPage';
import CasCallback from './pages/CasCallback/CasCallback';
import SetupGuidePage from './pages/SetupGuidePage/SetupGuidePage';
import { queryClient } from '@/lib/queryClient';
import { getUsers } from '@/api/users';
import { getMenuTree } from '@/api/menus';
import { getDepartmentTree } from '@/api/departments';
import { getRoles } from '@/api/roles';
import { getOperationLogs } from '@/api/operationLogs';
import { userKeys } from '@/hooks/useUsers';
import { menuKeys } from '@/hooks/useMenus';
import { departmentKeys } from '@/hooks/useDepartments';
import { roleKeys } from '@/hooks/useRoles';
import { operationLogKeys } from '@/hooks/useOperationLogs';

// 页面导入函数，用于 lazy 加载和预加载
const pageImports: Record<string, () => Promise<unknown>> = {
  '/': () => import('./pages/WelcomePage/WelcomePage'),
  '/system/users': () => import('./pages/UsersPage/UsersPage'),
  '/system/departments': () => import('./pages/DepartmentsPage/DepartmentsPage'),
  '/system/roles': () => import('./pages/RolesPage/RolesPage'),
  '/system/menus': () => import('./pages/MenusPage/MenusPage'),
  '/profile': () => import('./pages/ProfilePage/ProfilePage'),
  '/system/logs': () => import('./pages/OperationLogsPage/OperationLogsPage'),
};

// 页面数据预取映射
const pagePrefetch: Record<string, () => void> = {
  '/system/users': () => {
    queryClient.prefetchQuery({
      queryKey: userKeys.list({}),
      queryFn: () => getUsers(),
    });
  },
  '/system/departments': () => {
    queryClient.prefetchQuery({
      queryKey: departmentKeys.tree(undefined),
      queryFn: () => getDepartmentTree(),
    });
  },
  '/system/roles': () => {
    queryClient.prefetchQuery({
      queryKey: roleKeys.list(undefined),
      queryFn: () => getRoles(),
    });
  },
  '/system/menus': () => {
    queryClient.prefetchQuery({
      queryKey: menuKeys.tree(),
      queryFn: () => getMenuTree(),
    });
  },
  '/system/logs': () => {
    queryClient.prefetchQuery({
      queryKey: operationLogKeys.list({}),
      queryFn: () => getOperationLogs(),
    });
  },
};

const WelcomePage = React.lazy(() => import('./pages/WelcomePage/WelcomePage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage/UsersPage'));
const DepartmentsPage = React.lazy(
  () => import('./pages/DepartmentsPage/DepartmentsPage'),
);
const RolesPage = React.lazy(() => import('./pages/RolesPage/RolesPage'));
const MenusPage = React.lazy(() => import('./pages/MenusPage/MenusPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage/ProfilePage'));
const OperationLogsPage = React.lazy(
  () => import('./pages/OperationLogsPage/OperationLogsPage'),
);
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'));

/**
 * 预加载指定路径的页面代码块和数据
 * 在菜单 hover 时调用，避免首次点击出现加载状态
 */
export function preloadPage(path: string) {
  const loader = pageImports[path];
  if (loader) {
    loader();
  }
  const prefetch = pagePrefetch[path];
  if (prefetch) {
    prefetch();
  }
}

const PageLoading = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="text-muted-foreground text-sm">加载中...</div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
    <p className="text-destructive text-sm">页面加载失败</p>
    <p className="text-muted-foreground text-xs">
      {error instanceof Error ? error.message : String(error)}
    </p>
    <button
      className="text-sm text-primary underline"
      onClick={resetErrorBoundary}
    >
      重试
    </button>
  </div>
);

const RoutesComponent = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/setup" element={<SetupGuidePage />} />
          <Route path="/login" element={<SetupGuard><LoginPage /></SetupGuard>} />
          <Route path="/auth/cas/callback" element={<CasCallback />} />
          <Route element={<SetupGuard><ProtectedRoute /></SetupGuard>}>
            <Route element={<Layout />}>
              <Route index element={<WelcomePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="system/users" element={<UsersPage />} />
              <Route path="system/departments" element={<DepartmentsPage />} />
              <Route path="system/roles" element={<RolesPage />} />
              <Route path="system/menus" element={<MenusPage />} />
              <Route path="system/logs" element={<OperationLogsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default RoutesComponent;
