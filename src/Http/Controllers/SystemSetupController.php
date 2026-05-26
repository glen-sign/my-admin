<?php

namespace StuMed\MyAdmin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use StuMed\MyAdmin\Http\Traits\ApiResponse;

class SystemSetupController extends Controller
{
    use ApiResponse;

    public function status(): JsonResponse
    {
        return $this->success([
            'system_name_changed' => $this->checkSystemNameChanged(),
            'database_configured' => $this->checkDatabaseConfigured(),
            'database_migrated' => $this->checkDatabaseMigrated(),
        ]);
    }

    protected function checkSystemNameChanged(): bool
    {
        try {
            $appName = config('app.name');
            return $appName !== 'Laravel' && $appName !== '后台管理';
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function checkDatabaseConfigured(): bool
    {
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");
        return $driver !== 'sqlite';
    }

    protected function checkDatabaseMigrated(): bool
    {
        try {
            Artisan::call('migrate:status');
            $output = Artisan::output();
            return !str_contains($output, 'Pending');
        } catch (\Exception $e) {
            return false;
        }
    }
}
