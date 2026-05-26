<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use StuMed\MyAdmin\Http\Traits\ApiResponse;
use StuMed\MyAdmin\Models\OperationLog;

class OperationLogController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = OperationLog::with('user:id,name,username');

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($module = $request->input('module')) {
            $query->where('module', $module);
        }

        if ($action = $request->input('action')) {
            $query->where('action', $action);
        }

        if ($keyword = $request->input('keyword')) {
            $escaped = addcslashes($keyword, '%_');
            $query->where(function ($q) use ($escaped) {
                $q->where('description', 'like', "%{$escaped}%")
                  ->orWhere('path', 'like', "%{$escaped}%");
            });
        }

        if ($startDate = $request->input('start_date')) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('created_at', '<=', $endDate . ' 23:59:59');
        }

        $pageSize = min((int) $request->input('pageSize', 20), 100);
        $logs = $query->orderBy('id', 'desc')->paginate($pageSize);

        return $this->success([
            'list' => $logs->items(),
            'total' => $logs->total(),
            'page' => $logs->currentPage(),
            'pageSize' => $logs->perPage(),
        ]);
    }

    public function modules(): JsonResponse
    {
        $modules = OperationLog::select('module')
            ->distinct()
            ->pluck('module');

        return $this->success($modules);
    }
}
