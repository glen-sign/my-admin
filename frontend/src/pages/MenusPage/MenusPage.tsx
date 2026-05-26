import React from 'react';
import PageTemplate from '@/components/PageTemplate';
import MenuTreeSection from './MenuTreeSection';

const MenusPage: React.FC = () => (
  <PageTemplate title="菜单管理" description="管理系统导航菜单结构、路由配置与显示权限">
    <MenuTreeSection />
  </PageTemplate>
);

export default MenusPage;
