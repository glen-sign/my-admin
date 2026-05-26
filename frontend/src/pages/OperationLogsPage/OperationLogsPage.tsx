import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchIcon, EyeIcon, ScrollTextIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationBar from '@/components/PaginationBar';
import { useOperationLogs, useOperationLogModules } from '@/hooks/useOperationLogs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { IOperationLog } from '@/api/operationLogs';

const actionColorMap: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  import: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  login: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  logout: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const actionLabelMap: Record<string, string> = {
  create: '新增',
  update: '更新',
  delete: '删除',
  import: '导入',
  login: '登录',
  logout: '登出',
};

const OperationLogsPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  const [detailLog, setDetailLog] = useState<IOperationLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const { data: logsData, isLoading, isError, refetch } = useOperationLogs({
    keyword: debouncedKeyword || undefined,
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
  });

  const { data: modules = [] } = useOperationLogModules();

  const logs = logsData?.list || [];
  const total = logsData?.total || 0;

  const handleViewDetail = (log: IOperationLog) => {
    setDetailLog(log);
    setDetailOpen(true);
  };

  return (
    <section className="w-full">
      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        {/* 工具栏 */}
        <div className="p-5 border-b border-border/60">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="搜索操作描述、路径..."
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setPagination((p) => ({ ...p, current: 1 }));
                  }}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}>
                <SelectTrigger className="h-9 w-full sm:w-36">
                  <SelectValue placeholder="操作模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部模块</SelectItem>
                  {modules.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPagination((p) => ({ ...p, current: 1 })); }}>
                <SelectTrigger className="h-9 w-full sm:w-32">
                  <SelectValue placeholder="操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="create">新增</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="import">导入</SelectItem>
                  <SelectItem value="login">登录</SelectItem>
                  <SelectItem value="logout">登出</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="p-4">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: pagination.pageSize }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[48px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[50px]" />
                  <Skeleton className="h-4 w-[160px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-5 w-[48px]" />
                  <Skeleton className="h-4 w-[50px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-7 w-[40px]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p>数据加载失败，请稍后重试</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>重试</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ScrollTextIcon className="size-10 mb-3 opacity-30" />
              <p>暂无操作日志</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">操作用户</TableHead>
                    <TableHead className="w-[100px]">模块</TableHead>
                    <TableHead className="w-[80px]">类型</TableHead>
                    <TableHead className="w-[180px]">描述</TableHead>
                    <TableHead className="w-[80px]">方法</TableHead>
                    <TableHead className="w-[200px]">路径</TableHead>
                    <TableHead className="w-[100px]">IP</TableHead>
                    <TableHead className="w-[80px]">状态码</TableHead>
                    <TableHead className="w-[80px]">耗时</TableHead>
                    <TableHead className="w-[160px]">操作时间</TableHead>
                    <TableHead className="w-[60px] text-right">详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className="text-sm font-medium">{log.user?.name || log.user?.username || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.module}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${actionColorMap[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {actionLabelMap[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{log.description}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-mono">{log.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono truncate block max-w-[200px]" title={log.path}>
                          {log.path}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">{log.ip_address || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${log.status_code >= 400 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {log.status_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{log.duration}ms</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {log.created_at?.replace('T', ' ').slice(0, 19)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleViewDetail(log)}
                        >
                          <EyeIcon className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <PaginationBar
                page={pagination.current}
                pageSize={pagination.pageSize}
                total={total}
                onPageChange={(p) => setPagination((prev) => ({ ...prev, current: p }))}
              />
            </>
          )}
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>操作日志详情</DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-3 py-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">操作用户：</span>
                  <span className="font-medium">{detailLog.user?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">操作时间：</span>
                  <span>{detailLog.created_at?.replace('T', ' ').slice(0, 19)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">操作模块：</span>
                  <span>{detailLog.module}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">操作类型：</span>
                  <span>{actionLabelMap[detailLog.action] || detailLog.action}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">操作描述：</span>
                  <span>{detailLog.description}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">请求方法：</span>
                  <Badge variant="secondary" className="text-xs font-mono">{detailLog.method}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">状态码：</span>
                  <span>{detailLog.status_code}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">请求路径：</span>
                  <span className="font-mono text-xs">{detailLog.path}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">IP 地址：</span>
                  <span className="font-mono">{detailLog.ip_address || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">耗时：</span>
                  <span>{detailLog.duration}ms</span>
                </div>
              </div>
              {detailLog.request_data && Object.keys(detailLog.request_data).length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-1">请求参数：</span>
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-auto max-h-48 font-mono">
                    {JSON.stringify(detailLog.request_data, null, 2)}
                  </pre>
                </div>
              )}
              {detailLog.user_agent && (
                <div>
                  <span className="text-muted-foreground block mb-1">User Agent：</span>
                  <p className="text-xs text-muted-foreground break-all">{detailLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default OperationLogsPage;
