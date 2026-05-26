import apiClient from '@/lib/axios';

export interface IOperationLog {
  id: number;
  user_id: number | null;
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
  module: string;
  action: string;
  description: string;
  method: string;
  path: string;
  request_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  status_code: number;
  duration: number;
  created_at: string;
}

export interface IOperationLogListResponse {
  list: IOperationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getOperationLogs(params?: {
  keyword?: string;
  user_id?: string;
  module?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}): Promise<IOperationLogListResponse> {
  return apiClient.get('/operation-logs', { params });
}

export async function getOperationLogModules(): Promise<string[]> {
  return apiClient.get('/operation-logs/modules');
}
