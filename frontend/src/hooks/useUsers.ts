import { useQuery } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  importUsers,
  deleteUser,
  batchDeleteUsers,
} from '@/api/users';
import type { IUserListResponse, IImportResult } from '@/api/users';
import { useCrudMutation } from './useCrudMutation';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

export function useUsers(params?: {
  keyword?: string;
  status?: string;
  role?: string;
  department_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  return useQuery<IUserListResponse>({
    queryKey: userKeys.list(params || {}),
    queryFn: () => getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  return useCrudMutation(
    (data: { name: string; username: string; email: string; password: string; department_id?: string; phone?: string; role?: string }) =>
      createUser(data),
    userKeys.lists(),
  );
}

export function useUpdateUser() {
  return useCrudMutation(
    ({ id, data }: { id: string; data: { name?: string; email?: string; department_id?: string; phone?: string; role?: string } }) =>
      updateUser(id, data),
    userKeys.lists(),
  );
}

export function useToggleUserStatus() {
  return useCrudMutation(
    ({ id, status }: { id: string; status: 'active' | 'disabled' }) =>
      toggleUserStatus(id, status),
    userKeys.lists(),
  );
}

export function useImportUsers() {
  return useCrudMutation<IImportResult, File>(
    (file) => importUsers(file),
    userKeys.lists(),
  );
}

export function useDeleteUser() {
  return useCrudMutation(
    (id: string) => deleteUser(id),
    userKeys.lists(),
  );
}

export function useBatchDeleteUsers() {
  return useCrudMutation(
    (ids: string[]) => batchDeleteUsers(ids),
    userKeys.lists(),
  );
}
