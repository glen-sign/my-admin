import React from 'react';
import PageTemplate from '@/components/PageTemplate';
import RoleListSection from './RoleListSection';

const RolesPage: React.FC = () => (
  <PageTemplate title="角色管理" description="管理系统角色与权限配置，控制用户访问范围">
    <RoleListSection />
  </PageTemplate>
);

export default RolesPage;
