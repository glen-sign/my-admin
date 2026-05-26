import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2Icon,
  CircleIcon,
  RefreshCwIcon,
  RocketIcon,
  ShieldCheckIcon,
  TypeIcon,
  ImageIcon,
  DatabaseIcon,
  ServerIcon,
  BookOpenIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/axios';

const SETUP_COMPLETED_KEY = 'setup_completed';

interface SetupStatus {
  system_name_changed: boolean;
  database_configured: boolean;
  database_migrated: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
  autoDetect: boolean;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'system_name',
    title: '修改系统名称',
    description: '把默认的"后台管理"改成你的系统名称',
    hint: '修改 backend/.env 中的 APP_NAME，执行命令 php artisan key:generate --force ，以及 frontend/src/components/Layout.tsx 中的侧边栏标题',
    icon: <TypeIcon className="size-5" />,
    autoDetect: true,
  },
  {
    id: 'system_icon',
    title: '修改系统图标/Logo',
    description: '替换默认的盾牌图标为你的系统图标',
    hint: '修改 frontend/src/components/Layout.tsx 中 SidebarHeader 的图标组件',
    icon: <ImageIcon className="size-5" />,
    autoDetect: false,
  },
  {
    id: 'frontend_env',
    title: '修改前端环境变量',
    description: '将 API 地址和代理目标改为你的后端地址',
    hint: '编辑 frontend/.env 中的 VITE_APP_NAME 和 VITE_PROXY_TARGET',
    icon: <DatabaseIcon className="size-5" />,
    autoDetect: false,
  },
  {
    id: 'database_config',
    title: '配置数据库连接',
    description: '将数据库从默认的 SQLite 切换到 MySQL',
    hint: '编辑 backend/.env 中的 DB_CONNECTION、DB_HOST、DB_DATABASE、DB_USERNAME、DB_PASSWORD',
    icon: <DatabaseIcon className="size-5" />,
    autoDetect: true,
  },
  {
    id: 'database_migrate',
    title: '同步数据库',
    description: '执行迁移并填充基础数据（菜单、权限、用户、部门、角色）',
    hint: '运行 php artisan migrate --seed',
    icon: <ServerIcon className="size-5" />,
    autoDetect: true,
  },
  {
    id: 'read_docs',
    title: '阅读二次开发文档',
    description: '了解项目结构、开发约定和新增模块的完整流程',
    hint: '查看 docs/secondary-development-guide.md',
    icon: <BookOpenIcon className="size-5" />,
    autoDetect: false,
  },
];

export default function SetupGuidePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('setup_manual_checks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [autoStatus, setAutoStatus] = useState<SetupStatus>({
    system_name_changed: false,
    database_configured: false,
    database_migrated: false,
  });

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/system/setup-status');
      setAutoStatus(data as unknown as SetupStatus);
    } catch {
      // 接口不可用时保持默认状态
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // 持久化手动勾选状态
  useEffect(() => {
    localStorage.setItem('setup_manual_checks', JSON.stringify(manualChecks));
  }, [manualChecks]);

  const getItemCompleted = (item: ChecklistItem): boolean => {
    if (item.autoDetect) {
      switch (item.id) {
        case 'system_name':
          return autoStatus.system_name_changed;
        case 'database_config':
          return autoStatus.database_configured;
        case 'database_migrate':
          return autoStatus.database_migrated;
        default:
          return false;
      }
    }
    return manualChecks[item.id] || false;
  };

  const toggleManualCheck = (id: string) => {
    setManualChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allCompleted = checklistItems.every((item) => getItemCompleted(item));
  const completedCount = checklistItems.filter((item) => getItemCompleted(item)).length;

  const handleComplete = () => {
    localStorage.setItem(SETUP_COMPLETED_KEY, 'true');
    localStorage.removeItem('setup_manual_checks');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <ShieldCheckIcon className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">系统初始化引导</h1>
          <p className="text-muted-foreground">
            完成以下配置项，开始你的二次开发之旅
          </p>
          <div className="mt-3 text-sm text-muted-foreground">
            进度：{completedCount} / {checklistItems.length}
          </div>
        </div>

        {/* 清单 */}
        <div className="space-y-3 mb-8">
          {checklistItems.map((item) => {
            const completed = getItemCompleted(item);
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-all ${
                  completed
                    ? 'border-green-200 bg-green-50/50'
                    : 'border-border bg-card hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 状态图标 / 可点击的手动勾选 */}
                  <div className="mt-0.5">
                    {item.autoDetect ? (
                      completed ? (
                        <CheckCircle2Icon className="size-5 text-green-600" />
                      ) : (
                        <CircleIcon className="size-5 text-muted-foreground/40" />
                      )
                    ) : (
                      <button
                        onClick={() => toggleManualCheck(item.id)}
                        className="focus:outline-none"
                      >
                        {completed ? (
                          <CheckCircle2Icon className="size-5 text-green-600" />
                        ) : (
                          <CircleIcon className="size-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground/60">{item.icon}</span>
                      <h3 className={`text-sm font-medium ${completed ? 'text-green-700' : 'text-foreground'}`}>
                        {item.title}
                      </h3>
                      {item.autoDetect && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                          自动检测
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{item.description}</p>
                    <p className="text-xs text-muted-foreground/70 font-mono bg-muted/50 rounded px-2 py-1">
                      💡 {item.hint}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCwIcon className={`size-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            重新检测
          </Button>

          <Button
            onClick={handleComplete}
            disabled={!allCompleted}
            className="gap-1.5"
          >
            <RocketIcon className="size-4" />
            开始开发
          </Button>
        </div>
      </div>
    </div>
  );
}
