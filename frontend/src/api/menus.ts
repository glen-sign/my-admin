import apiClient from '@/lib/axios';

export interface IMenuItem {
  id: string;
  name: string;
  code?: string;
  parent_id?: string;
  icon?: string;
  path?: string;
  type: 'directory' | 'page' | 'button';
  visible: boolean;
  sort_order: number;
  children?: IMenuItem[];
  created_at: string;
}

export async function getMenuTree(): Promise<IMenuItem[]> {
  return apiClient.get('/menus/tree');
}

export async function getMenus(): Promise<IMenuItem[]> {
  return apiClient.get('/menus');
}

export async function getMenuById(id: string): Promise<IMenuItem> {
  return apiClient.get(`/menus/${id}`);
}

export async function createMenu(data: {
  name: string;
  code?: string;
  parent_id?: string;
  icon?: string;
  path?: string;
  type: 'directory' | 'page' | 'button';
  visible?: boolean;
  sort_order?: number;
}): Promise<IMenuItem> {
  return apiClient.post('/menus', data);
}

export async function updateMenu(
  id: string,
  data: {
    name?: string;
    code?: string;
    parent_id?: string;
    icon?: string;
    path?: string;
    type?: 'directory' | 'page' | 'button';
    visible?: boolean;
    sort_order?: number;
  },
): Promise<IMenuItem> {
  return apiClient.put(`/menus/${id}`, data);
}

export async function deleteMenu(id: string): Promise<void> {
  return apiClient.delete(`/menus/${id}`);
}

export async function toggleMenuVisible(
  id: string,
  visible: boolean,
): Promise<IMenuItem> {
  return apiClient.patch(`/menus/${id}/visible`, { visible });
}
