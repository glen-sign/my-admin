import React from 'react';
import PageTemplate from '@/components/PageTemplate';
import DepartmentTreeSection from './DepartmentTreeSection';

const DepartmentsPage: React.FC = () => (
  <PageTemplate title="部门管理" description="管理组织架构、部门层级与负责人分配">
    <DepartmentTreeSection />
  </PageTemplate>
);

export default DepartmentsPage;
