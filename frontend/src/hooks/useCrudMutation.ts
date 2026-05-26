import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 通用的 CRUD mutation 工厂
 * 封装了 useMutation + 自动缓存失效的重复逻辑
 */
export function useCrudMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: readonly unknown[],
) {
  const queryClient = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKeys });
    },
  });
}
