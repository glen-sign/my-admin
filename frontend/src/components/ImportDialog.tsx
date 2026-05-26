import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  UploadIcon,
  FileTextIcon,
  DownloadIcon,
  CheckCircleIcon,
  XCircleIcon,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  templateUrl: string;
  templateName: string;
  onImport: (file: File) => void;
  importing?: boolean;
  result?: {
    success: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  title,
  templateUrl,
  templateName,
  onImport,
  importing = false,
  result = null,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
  });

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSelectedFile(null);
    }
    onOpenChange(val);
  };

  const handleDownloadTemplate = async () => {
    try {
      const apiPath = templateUrl.replace(/^\/api/, '');
      const blob = await apiClient.get(apiPath, { responseType: 'blob' });
      const url = URL.createObjectURL(blob as unknown as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = templateName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('模板下载失败，请重试');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 下载模板 */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/60">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileTextIcon className="size-4" />
              <span>请先下载导入模板，按模板格式填写数据</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <DownloadIcon className="size-3.5 mr-1.5" />
              下载模板
            </Button>
          </div>

          {/* 文件上传区域 */}
          {!result && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : selectedFile
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileTextIcon className="size-8 text-green-600" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB ·
                    点击或拖拽更换文件
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? '释放文件到此处'
                      : '点击或拖拽 CSV 文件到此处'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    仅支持 .csv 格式，最大 2MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 导入结果 */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  <span>成功: {result.success} 条</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <XCircleIcon className="size-4 text-destructive" />
                    <span>失败: {result.failed} 条</span>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  {result.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-destructive">
                      第 {err.row} 行: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result ? '关闭' : '取消'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importing}
            >
              {importing ? '导入中...' : '开始导入'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
