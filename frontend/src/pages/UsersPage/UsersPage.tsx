import React from 'react';
import PageTemplate from '@/components/PageTemplate';
import UserListSection from './UserListSection';

const UsersPage: React.FC = () => (
  <PageTemplate title="用户管理" description="管理系统用户账号、角色分配与权限控制">
    <UserListSection />
  </PageTemplate>
);

export default UsersPage;
