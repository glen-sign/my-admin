import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  Building2Icon,
  ShieldCheckIcon,
  ListIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuickNavItem {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  permission: string;
  accent: string;
}

const quickNavItems: QuickNavItem[] = [
  {
    path: '/system/users',
    label: '用户管理',
    description: '管理系统用户账号、角色分配',
    icon: UsersIcon,
    permission: 'user:view',
    accent: 'from-blue-500/10 to-indigo-500/10 text-blue-600',
  },
  {
    path: '/system/departments',
    label: '部门管理',
    description: '管理组织架构与层级',
    icon: Building2Icon,
    permission: 'department:view',
    accent: 'from-emerald-500/10 to-teal-500/10 text-emerald-600',
  },
  {
    path: '/system/roles',
    label: '角色管理',
    description: '管理角色与权限配置',
    icon: ShieldCheckIcon,
    permission: 'role:view',
    accent: 'from-violet-500/10 to-purple-500/10 text-violet-600',
  },
  {
    path: '/system/menus',
    label: '菜单管理',
    description: '管理系统导航菜单',
    icon: ListIcon,
    permission: 'menu:view',
    accent: 'from-amber-500/10 to-orange-500/10 text-amber-600',
  },
];

const WelcomePage: React.FC = () => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();

  const filteredNavItems = quickNavItems.filter((item) =>
    permissions.includes(item.permission),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* 欢迎信息区 */}
      <section className="w-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent border border-primary/[0.08] p-8">
          <div className="relative z-10">
            <p className="text-sm text-muted-foreground mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {user?.name || user?.username || '用户'}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              欢迎回到后台管理系统，祝您工作顺利
            </p>
          </div>
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/[0.04] rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="absolute bottom-0 right-24 w-32 h-32 bg-primary/[0.03] rounded-full translate-y-1/2 blur-xl" />
        </div>
      </section>

      {/* 快捷导航 */}
      {filteredNavItems.length > 0 && (
        <section className="w-full">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            快捷入口
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  role="button"
                  tabIndex={0}
                  className="group cursor-pointer rounded-xl border border-border/60 bg-card p-5 card-hover"
                  onClick={() => navigate(item.path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(item.path);
                    }
                  }}
                >
                  <div
                    className={`size-10 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-4`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground text-[15px] mb-1">
                    {item.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span>进入</span>
                    <ArrowRightIcon className="size-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default WelcomePage;
