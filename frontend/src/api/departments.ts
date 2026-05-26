import apiClient from '@/lib/axios';

export interface IDepartment {
  id: string;
  name: string;
  parent_id?: string;
  code?: string;
  manager_id?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  sort_order: number;
  children?: IDepartment[];
  created_at: string;
}

export async function getDepartmentTree(params?: {
  keyword?: string;
}): Promise<IDepartment[]> {
  return apiClient.get('/departments/tree', { params });
}

export async function getDepartments(params?: {
  keyword?: string;
}): Promise<IDepartment[]> {
  return apiClient.get('/departments', { params });
}

export async function getDepartmentById(id: string): Promise<IDepartment> {
  return apiClient.get(`/departments/${id}`);
}

export async function createDepartment(data: {
  name: string;
  parent_id?: string;
  code?: string;
  manager_id?: string;
  sort_order?: number;
}): Promise<IDepartment> {
  return apiClient.post('/departments', data);
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    parent_id?: string;
    code?: string;
    manager_id?: string;
    sort_order?: number;
  },
): Promise<IDepartment> {
  return apiClient.put(`/departments/${id}`, data);
}

export async function deleteDepartment(id: string): Promise<void> {
  return apiClient.delete(`/departments/${id}`);
}

export async function updateDepartmentSort(
  id: string,
  sort_order: number,
): Promise<IDepartment> {
  return apiClient.patch(`/departments/${id}/sort`, { sort_order });
}

export interface IDepartmentImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

export async function importDepartments(file: File): Promise<IDepartmentImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post('/departments/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getDepartmentImportTemplateUrl(): string {
  return '/api/departments/import-template';
}
