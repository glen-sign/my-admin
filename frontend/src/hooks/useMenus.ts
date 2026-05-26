import { useQuery } from '@tanstack/react-query';
import {
  getMenuTree,
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuVisible,
} from '@/api/menus';
import { useCrudMutation } from './useCrudMutation';

export const menuKeys = {
  all: ['menus'] as const,
  trees: () => [...menuKeys.all, 'tree'] as const,
  tree: () => [...menuKeys.trees()] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: () => [...menuKeys.lists()] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
};

export function useMenuTree() {
  return useQuery({
    queryKey: menuKeys.tree(),
    queryFn: () => getMenuTree(),
  });
}

export function useMenus() {
  return useQuery({
    queryKey: menuKeys.list(),
    queryFn: () => getMenus(),
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => getMenuById(id),
    enabled: !!id,
  });
}

export function useCreateMenu() {
  return useCrudMutation(
    (data: { name: string; parent_id?: string; icon?: string; path?: string; type: 'directory' | 'page' | 'button'; visible?: boolean; sort_order?: number }) =>
      createMenu(data),
    menuKeys.all,
  );
}

export function useUpdateMenu() {
  return useCrudMutation(
    ({ id, data }: { id: string; data: { name?: string; parent_id?: string; icon?: string; path?: string; type?: 'directory' | 'page' | 'button'; visible?: boolean; sort_order?: number } }) =>
      updateMenu(id, data),
    menuKeys.all,
  );
}

export function useDeleteMenu() {
  return useCrudMutation(
    (id: string) => deleteMenu(id),
    menuKeys.all,
  );
}

export function useToggleMenuVisible() {
  return useCrudMutation(
    ({ id, visible }: { id: string; visible: boolean }) =>
      toggleMenuVisible(id, visible),
    menuKeys.all,
  );
}
