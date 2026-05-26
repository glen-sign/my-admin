import apiClient from '@/lib/axios';

export interface IUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  department_id?: string;
  department?: {
    id: string;
    name: string;
  };
  phone?: string;
  avatar?: string;
  status: 'active' | 'disabled';
  roles: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
}

export interface IUserListResponse {
  list: IUser[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getUsers(params?: {
  keyword?: string;
  status?: string;
  role?: string;
  department_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}): Promise<IUserListResponse> {
  return apiClient.get('/users', { params });
}

export async function getUserById(id: string): Promise<IUser> {
  return apiClient.get(`/users/${id}`);
}

export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  department_id?: string;
  phone?: string;
  role?: string;
}): Promise<IUser> {
  return apiClient.post('/users', data);
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    department_id?: string;
    phone?: string;
    role?: string;
  },
): Promise<IUser> {
  return apiClient.put(`/users/${id}`, data);
}

export async function toggleUserStatus(
  id: string,
  status: 'active' | 'disabled',
): Promise<IUser> {
  return apiClient.patch(`/users/${id}/status`, { status });
}

export interface IImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export async function importUsers(file: File): Promise<IImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/users/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getUserImportTemplateUrl(): string {
  return '/api/users/import-template';
}

export async function deleteUser(id: string): Promise<void> {
  return apiClient.delete(`/users/${id}`);
}

export async function batchDeleteUsers(ids: string[]): Promise<{ deleted_count: number }> {
  return apiClient.post('/users/batch-destroy', { ids });
}

export function getUsersExportUrl(params?: {
  keyword?: string;
  status?: string;
  role?: string;
  department_id?: string;
}): string {
  const query = new URLSearchParams();
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.status) query.set('status', params.status);
  if (params?.role) query.set('role', params.role);
  if (params?.department_id) query.set('department_id', params.department_id);
  const qs = query.toString();
  return `/api/users/export${qs ? `?${qs}` : ''}`;
}
