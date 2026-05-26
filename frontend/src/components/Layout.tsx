import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { preloadPage } from '@/app';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LogOutIcon, ShieldCheckIcon, UserCircleIcon, SunIcon, MoonIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth, type MenuNode } from '@/contexts/AuthContext';
import { iconMap } from '@/lib/iconMap';
import { useTheme } from '@/components/ui/theme-provider';

const LayoutContent = () => {
  const { pathname } = useLocation();
  const { user, menus, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const handleLogout = async () => {
    await logout().catch(() => {});
  };

  const isActive = (path: string) => pathname === path;

  const displayName = user?.name || user?.username || '未登录';
  const avatarChar = displayName.charAt(0).toUpperCase();

  // 动态菜单：按顶级目录分组
  const menuGroups = menus.map((m: MenuNode) => {
    if (m.type === 'directory' && m.children && m.children.length > 0) {
      return {
        label: m.name,
        items: m.children.map((child: MenuNode) => ({
          path: child.path,
          label: child.name,
          icon: child.icon || '',
        })),
      };
    }
    // 顶级非目录菜单归入默认分组
    return {
      label: '',
      items: [
        {
          path: m.path,
          label: m.name,
          icon: m.icon || '',
        },
      ],
    };
  });

  // 合并没有 label 的项到一个默认组
  const groupedMenus: Array<{
    label: string;
    items: Array<{ path?: string; label: string; icon: string }>;
  }> = [];
  const ungroupedItems: Array<{ path?: string; label: string; icon: string }> =
    [];
  for (const group of menuGroups) {
    if (group.label) {
      groupedMenus.push(group);
    } else {
      ungroupedItems.push(...group.items);
    }
  }
  if (ungroupedItems.length > 0) {
    groupedMenus.unshift({ label: '导航', items: ungroupedItems });
  }

  const renderDynamicMenuItems = (
    items: Array<{ path?: string; label: string; icon: string }>,
  ) => (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = iconMap[item.icon] || ShieldCheckIcon;
        const path = item.path ?? '/';
        return (
          <SidebarMenuItem key={item.path || item.label}>
            <SidebarMenuButton asChild isActive={isActive(path)}>
              <Link to={path} onMouseEnter={() => preloadPage(path)}>
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="bg-gradient-to-b from-primary/[0.06] to-transparent pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="h-auto py-3">
                <Link to="/">
                  <div className="flex aspect-square size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                    <ShieldCheckIcon className="size-5" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-base font-bold text-sidebar-foreground tracking-tight">
                      后台管理
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground mt-0.5">
                      基础管理系统
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {groupedMenus.map((group, idx) => (
            <SidebarGroup key={group.label || idx}>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-muted-foreground/70 text-[11px] uppercase tracking-wider font-medium">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {renderDynamicMenuItems(group.items)}
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter />
      </Sidebar>

      <main className="flex-1 min-w-0 px-8 py-6 bg-background">
        <header className="flex items-center justify-between mb-6">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          <div className="flex items-center gap-1">
          <button
            className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 hover:bg-accent/60 transition-colors outline-none">
                <Avatar className="size-8 ring-1 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {avatarChar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserCircleIcon className="mr-2 size-4" />
                <span>个人中心</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 size-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
};

const Layout = () => {
  return <LayoutContent />;
};

export default Layout;
