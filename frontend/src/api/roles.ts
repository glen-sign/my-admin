import apiClient from '@/lib/axios';

export interface IRole {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: 'active' | 'disabled';
  user_count: number;
  permissions?: IPermission[];
  created_at: string;
  guard_name?: string;
}

export interface IPermission {
  id: string;
  name: string;
  guard_name: string;
  label?: string;
}

export interface IRoleListResponse {
  list: IRole[];
  total: number;
}

export async function getRoles(params?: {
  keyword?: string;
}): Promise<IRole[]> {
  return apiClient.get('/roles', { params });
}

export async function getRoleById(id: string): Promise<IRole> {
  return apiClient.get(`/roles/${id}`);
}

export async function createRole(data: {
  name: string;
  code?: string;
  description?: string;
  permissions?: string[];
}): Promise<IRole> {
  return apiClient.post('/roles', data);
}

export async function updateRole(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
  },
): Promise<IRole> {
  return apiClient.put(`/roles/${id}`, data);
}

export async function deleteRole(id: string): Promise<void> {
  return apiClient.delete(`/roles/${id}`);
}

export async function toggleRoleStatus(
  id: string,
  status: 'active' | 'disabled',
): Promise<IRole> {
  return apiClient.patch(`/roles/${id}/status`, { status });
}

export async function updateRolePermissions(
  id: string,
  permissions: string[],
): Promise<IRole> {
  return apiClient.put(`/roles/${id}/permissions`, { permissions });
}

export async function getAllPermissions(): Promise<IPermission[]> {
  return apiClient.get('/roles/permissions');
}

export async function getRoleMenus(id: string): Promise<{ menu_ids: number[] }> {
  return apiClient.get(`/roles/${id}/menus`);
}

export async function updateRoleMenus(
  id: string,
  menuIds: number[],
): Promise<{ menu_ids: number[] }> {
  return apiClient.put(`/roles/${id}/menus`, { menu_ids: menuIds });
}
