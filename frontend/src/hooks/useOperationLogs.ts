import { useQuery } from '@tanstack/react-query';
import { getOperationLogs, getOperationLogModules } from '@/api/operationLogs';
import type { IOperationLogListResponse } from '@/api/operationLogs';

export const operationLogKeys = {
  all: ['operationLogs'] as const,
  lists: () => [...operationLogKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...operationLogKeys.lists(), params] as const,
  modules: () => [...operationLogKeys.all, 'modules'] as const,
};

export function useOperationLogs(params?: {
  keyword?: string;
  user_id?: string;
  module?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery<IOperationLogListResponse>({
    queryKey: operationLogKeys.list(params || {}),
    queryFn: () => getOperationLogs(params),
  });
}

export function useOperationLogModules() {
  return useQuery<string[]>({
    queryKey: operationLogKeys.modules(),
    queryFn: () => getOperationLogModules(),
  });
}
