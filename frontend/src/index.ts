// 组件导出
export { default as Layout } from './components/Layout'
export { default as PageTemplate } from './components/PageTemplate'
export { default as PaginationBar } from './components/PaginationBar'
export { default as ImportDialog } from './components/ImportDialog'
export { default as ProtectedRoute } from './components/ProtectedRoute'
export { default as SetupGuard } from './components/SetupGuard'

// 页面导出
export { default as UsersPage } from './pages/UsersPage/UsersPage'
export { default as DepartmentsPage } from './pages/DepartmentsPage/DepartmentsPage'
export { default as RolesPage } from './pages/RolesPage/RolesPage'
export { default as MenusPage } from './pages/MenusPage/MenusPage'
export { default as LoginPage } from './pages/LoginPage/LoginPage'
export { default as ProfilePage } from './pages/ProfilePage/ProfilePage'
export { default as OperationLogsPage } from './pages/OperationLogsPage/OperationLogsPage'
export { default as NotFound } from './pages/NotFound/NotFound'
export { default as WelcomePage } from './pages/WelcomePage/WelcomePage'
export { default as SetupGuidePage } from './pages/SetupGuidePage/SetupGuidePage'
export { default as CasCallback } from './pages/CasCallback/CasCallback'

// Hooks 导出
export { useCrudMutation } from './hooks/useCrudMutation'
export { useDebouncedValue } from './hooks/useDebouncedValue'
export { useDepartmentTree, useDepartments, departmentKeys } from './hooks/useDepartments'
export { useMenuTree, useMenus, menuKeys } from './hooks/useMenus'
export { useRoles, roleKeys } from './hooks/useRoles'
export { useUsers, userKeys } from './hooks/useUsers'
export { useOperationLogs, operationLogKeys } from './hooks/useOperationLogs'

// API 导出
export * from './api'

// 类型导出
export * from './types'

// Context 导出
export { AuthProvider, useAuth } from './contexts/AuthContext'

// 工具导出
export { default as apiClient, TOKEN_KEY } from './lib/axios'
export { cn } from './lib/utils'
export { queryClient } from './lib/queryClient'

// App 路由组件（完整应用）
export { default as App, preloadPage } from './app'
