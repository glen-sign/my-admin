<?php

namespace StuMed\MyAdmin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use StuMed\MyAdmin\Models\FileAttachment;

class FileService
{
    protected function getStorageDisk(): string
    {
        $endpoint = config('filesystems.disks.minio.endpoint');
        $bucket = config('filesystems.disks.minio.bucket');
        $key = config('filesystems.disks.minio.key');

        if (!empty($endpoint) && !empty($bucket) && !empty($key)
            && $key !== 'your-access-key') {
            return 'minio';
        }

        Log::info('MinIO 未配置，文件存储将使用本地磁盘（public）');
        return 'public';
    }

    public function upload(UploadedFile $file, int $userId, string $directory = 'general', ?string $description = null): FileAttachment
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;
        $storagePath = trim($directory, '/') . '/' . $filename;

        $fileHash = md5_file($file->getRealPath());
        $disk = $this->getStorageDisk();

        Storage::disk($disk)->putFileAs(
            trim($directory, '/'),
            $file,
            $filename
        );

        $attachment = FileAttachment::create([
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $storagePath,
            'disk' => $disk,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'file_hash' => $fileHash,
            'directory' => $directory,
            'uploaded_by' => $userId,
            'description' => $description,
        ]);

        return $attachment;
    }

    public function getPresignedUrl(FileAttachment $file, int $expirationMinutes = 30): string
    {
        if ($file->disk === 'public') {
            return Storage::disk($file->disk)->url($file->storage_path);
        }

        $expiration = now()->addMinutes($expirationMinutes);

        return Storage::disk($file->disk)->temporaryUrl(
            $file->storage_path,
            $expiration
        );
    }

    public function delete(FileAttachment $file): bool
    {
        try {
            $deleted = Storage::disk($file->disk)->delete($file->storage_path);
            if (!$deleted) {
                Log::warning("存储文件不存在或删除失败，继续清理数据库记录", [
                    'path' => $file->storage_path,
                    'disk' => $file->disk,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning("存储删除异常，继续清理数据库记录", [
                'path' => $file->storage_path,
                'error' => $e->getMessage(),
            ]);
        }

        $file->delete();
        return true;
    }

    public function batchDelete(array $fileIds): int
    {
        $deletedCount = 0;
        $files = FileAttachment::whereIn('id', $fileIds)->get();

        foreach ($files as $file) {
            try {
                $this->delete($file);
                $deletedCount++;
            } catch (\Exception $e) {
                Log::warning("批量删除中单个文件删除失败", [
                    'file_id' => $file->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $deletedCount;
    }

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = FileAttachment::query()->orderBy('created_at', 'desc');

        if (!empty($filters['directory'])) {
            $query->where('directory', $filters['directory']);
        }

        return $query->paginate($perPage);
    }
}
