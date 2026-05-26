import { useQuery } from '@tanstack/react-query';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  updateRolePermissions,
  getAllPermissions,
  getRoleMenus,
  updateRoleMenus,
} from '@/api/roles';
import { useCrudMutation } from './useCrudMutation';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...roleKeys.lists(), params] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  permissions: () => [...roleKeys.all, 'permissions'] as const,
};

export function useRoles(params?: { keyword?: string }) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => getRoles(params),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => getRoleById(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  return useCrudMutation(
    (data: { name: string; code?: string; description?: string; permissions?: string[] }) => createRole(data),
    roleKeys.lists(),
  );
}

export function useUpdateRole() {
  return useCrudMutation(
    ({ id, data }: { id: string; data: { name?: string; code?: string; description?: string } }) => updateRole(id, data),
    roleKeys.lists(),
  );
}

export function useDeleteRole() {
  return useCrudMutation(
    (id: string) => deleteRole(id),
    roleKeys.lists(),
  );
}

export function useToggleRoleStatus() {
  return useCrudMutation(
    ({ id, status }: { id: string; status: 'active' | 'disabled' }) => toggleRoleStatus(id, status),
    roleKeys.lists(),
  );
}

export function useUpdateRolePermissions() {
  return useCrudMutation(
    ({ id, permissions }: { id: string; permissions: string[] }) => updateRolePermissions(id, permissions),
    roleKeys.all,
  );
}

export function useAllPermissions() {
  return useQuery({
    queryKey: roleKeys.permissions(),
    queryFn: () => getAllPermissions(),
  });
}

export function useRoleMenus(id: string, enabled = true) {
  return useQuery({
    queryKey: [...roleKeys.detail(id), 'menus'] as const,
    queryFn: () => getRoleMenus(id),
    enabled: !!id && enabled,
  });
}

export function useUpdateRoleMenus() {
  return useCrudMutation(
    ({ id, menuIds }: { id: string; menuIds: number[] }) => updateRoleMenus(id, menuIds),
    roleKeys.all,
  );
}
