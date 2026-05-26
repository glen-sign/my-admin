import { useQuery } from '@tanstack/react-query';
import {
  getDepartmentTree,
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateDepartmentSort,
  importDepartments,
} from '@/api/departments';
import type { IDepartmentImportResult } from '@/api/departments';
import { useCrudMutation } from './useCrudMutation';

export const departmentKeys = {
  all: ['departments'] as const,
  trees: () => [...departmentKeys.all, 'tree'] as const,
  tree: (params?: Record<string, unknown>) => [...departmentKeys.trees(), params] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) => [...departmentKeys.lists(), params] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

export function useDepartmentTree(params?: { keyword?: string }) {
  return useQuery({
    queryKey: departmentKeys.tree(params),
    queryFn: () => getDepartmentTree(params),
  });
}

export function useDepartments(params?: { keyword?: string }) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => getDepartments(params),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  return useCrudMutation(
    (data: { name: string; parent_id?: string; code?: string; manager_id?: string; sort_order?: number }) =>
      createDepartment(data),
    departmentKeys.all,
  );
}

export function useUpdateDepartment() {
  return useCrudMutation(
    ({ id, data }: { id: string; data: { name?: string; parent_id?: string; code?: string; manager_id?: string; sort_order?: number } }) =>
      updateDepartment(id, data),
    departmentKeys.all,
  );
}

export function useDeleteDepartment() {
  return useCrudMutation(
    (id: string) => deleteDepartment(id),
    departmentKeys.all,
  );
}

export function useUpdateDepartmentSort() {
  return useCrudMutation(
    ({ id, sortOrder }: { id: string; sortOrder: number }) =>
      updateDepartmentSort(id, sortOrder),
    departmentKeys.all,
  );
}

export function useImportDepartments() {
  return useCrudMutation<IDepartmentImportResult, File>(
    (file) => importDepartments(file),
    departmentKeys.all,
  );
}
