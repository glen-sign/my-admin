<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use StuMed\MyAdmin\Http\Requests\BatchDestroyRequest;
use StuMed\MyAdmin\Http\Requests\UploadFileRequest;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Models\FileAttachment;
use StuMed\MyAdmin\Services\FileService;

class FileController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected FileService $fileService
    ) {}

    public function upload(UploadFileRequest $request): JsonResponse
    {
        try {
            $file = $request->file('file');
            $directory = $request->input('directory', 'general');
            $description = $request->input('description');

            $attachment = $this->fileService->upload(
                $file,
                $request->user()->id,
                $directory,
                $description
            );

            return $this->success([
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'file_size' => $attachment->file_size,
                'directory' => $attachment->directory,
                'created_at' => $attachment->created_at->toISOString(),
            ], '文件上传成功');
        } catch (\Exception $e) {
            return $this->internalError('文件上传失败：' . ($e->getMessage() ?: '存储服务暂时不可用'));
        }
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [];
        if ($request->has('directory')) {
            $filters['directory'] = $request->input('directory');
        }

        $pageSize = min((int) $request->input('pageSize', 15), 100);
        $paginator = $this->fileService->list($filters, $pageSize);

        return $this->success([
            'list' => $paginator->items(),
            'total' => $paginator->total(),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
        ]);
    }

    public function show(FileAttachment $file): JsonResponse
    {
        return $this->success($file);
    }

    public function getDownloadUrl(FileAttachment $file): JsonResponse
    {
        try {
            $url = $this->fileService->getPresignedUrl($file, 30);

            return $this->success([
                'url' => $url,
                'expires_in' => 30 * 60,
                'filename' => $file->original_name,
            ]);
        } catch (\Exception $e) {
            Log::error('获取文件下载URL失败', ['file_id' => $file->id, 'error' => $e->getMessage()]);
            return $this->internalError('文件存储异常');
        }
    }

    public function destroy(FileAttachment $file): JsonResponse
    {
        try {
            $this->fileService->delete($file);
            return $this->noContent();
        } catch (\RuntimeException $e) {
            Log::error('文件删除失败', ['file_id' => $file->id, 'error' => $e->getMessage()]);
            return $this->internalError('文件删除失败');
        }
    }

    public function batchDestroy(BatchDestroyRequest $request): JsonResponse
    {
        $deletedCount = $this->fileService->batchDelete($request->validated('ids'));

        return $this->success([
            'deleted_count' => $deletedCount,
        ], '批量删除完成');
    }
}
