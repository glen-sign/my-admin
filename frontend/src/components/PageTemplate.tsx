import React from 'react';

interface PageTemplateProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * 通用页面模板 - 统一页面标题 + 描述 + 内容区域的布局
 */
const PageTemplate: React.FC<PageTemplateProps> = ({ title, description, children }) => {
  return (
    <div className="w-full flex flex-col gap-5">
      <section className="w-full">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </section>
      <section className="w-full">{children}</section>
    </div>
  );
};

export default PageTemplate;
