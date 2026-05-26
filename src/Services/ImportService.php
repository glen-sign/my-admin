<?php

namespace StuMed\MyAdmin\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use StuMed\MyAdmin\Models\Department;
use StuMed\MyAdmin\Models\User;

class ImportService
{
    protected function parseCsv(UploadedFile $file): array
    {
        $rows = [];
        $handle = fopen($file->getRealPath(), 'r');

        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") {
            rewind($handle);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return [];
        }

        $header = array_map('trim', $header);

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) === count($header)) {
                $rows[] = array_combine($header, array_map('trim', $row));
            }
        }

        fclose($handle);
        return $rows;
    }

    protected function importFromCsv(
        UploadedFile $file,
        array $rules,
        array $messages,
        callable $processRow,
    ): array {
        $rows = $this->parseCsv($file);

        if (empty($rows)) {
            return ['success' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => '文件为空或格式不正确']]];
        }

        if (count($rows) > 1000) {
            return ['success' => 0, 'failed' => 0, 'errors' => [['row' => 0, 'message' => '单次导入不能超过 1000 行']]];
        }

        $success = 0;
        $failed = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $index => $row) {
                $rowNum = $index + 2;

                $validator = Validator::make($row, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = ['row' => $rowNum, 'message' => implode('; ', $validator->errors()->all())];
                    continue;
                }

                $result = $processRow($row, $rowNum);

                if ($result['success']) {
                    $success++;
                } else {
                    $failed++;
                    $errors[] = ['row' => $rowNum, 'message' => $result['message']];
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('导入事务回滚', ['error' => $e->getMessage()]);
            return ['success' => 0, 'failed' => count($rows), 'errors' => [['row' => 0, 'message' => '导入失败，所有操作已回滚：' . $e->getMessage()]]];
        }

        return ['success' => $success, 'failed' => $failed, 'errors' => $errors];
    }

    public function importUsers(UploadedFile $file): array
    {
        return $this->importFromCsv(
            $file,
            rules: [
                'name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username',
                'email' => 'required|email|max:255|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'department_code' => 'nullable|string',
                'role' => 'nullable|string',
            ],
            messages: [
                'name.required' => '姓名不能为空',
                'username.required' => '用户名不能为空',
                'username.unique' => '用户名已存在',
                'email.required' => '邮箱不能为空',
                'email.email' => '邮箱格式不正确',
                'email.unique' => '邮箱已存在',
            ],
            processRow: function (array $row, int $rowNum): array {
                $departmentId = null;
                if (!empty($row['department_code'])) {
                    $dept = Department::where('code', $row['department_code'])->first();
                    if (!$dept) {
                        return ['success' => false, 'message' => "部门编码 [{$row['department_code']}] 不存在"];
                    }
                    $departmentId = $dept->id;
                }

                $user = User::create([
                    'name' => $row['name'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'password' => Str::random(12),
                    'phone' => $row['phone'] ?? null,
                    'department_id' => $departmentId,
                    'status' => 'active',
                ]);

                if (!empty($row['role'])) {
                    try {
                        $user->assignRole($row['role']);
                    } catch (\Exception $e) {
                        Log::warning('导入用户角色分配失败', [
                            'username' => $row['username'],
                            'role' => $row['role'],
                            'error' => $e->getMessage(),
                        ]);
                        return ['success' => false, 'message' => "角色 [{$row['role']}] 分配失败"];
                    }
                }

                return ['success' => true];
            },
        );
    }

    public function importDepartments(UploadedFile $file): array
    {
        return $this->importFromCsv(
            $file,
            rules: [
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:departments,code',
                'parent_code' => 'nullable|string',
                'sort_order' => 'nullable|integer|min:0',
            ],
            messages: [
                'name.required' => '部门名称不能为空',
                'code.required' => '部门编码不能为空',
                'code.unique' => '部门编码已存在',
            ],
            processRow: function (array $row, int $rowNum): array {
                $parentId = null;
                if (!empty($row['parent_code'])) {
                    $parent = Department::where('code', $row['parent_code'])->first();
                    if (!$parent) {
                        return ['success' => false, 'message' => "父部门编码 [{$row['parent_code']}] 不存在"];
                    }
                    $parentId = $parent->id;
                }

                $sortOrder = !empty($row['sort_order'])
                    ? (int) $row['sort_order']
                    : (Department::where('parent_id', $parentId)->max('sort_order') ?? 0) + 1;

                Department::create([
                    'name' => $row['name'],
                    'code' => $row['code'],
                    'parent_id' => $parentId,
                    'sort_order' => $sortOrder,
                ]);

                return ['success' => true];
            },
        );
    }

    public function getUserTemplate(): string
    {
        $header = ['name', 'username', 'email', 'phone', 'department_code', 'role'];
        $example = ['张三', 'zhangsan', 'zhangsan@example.com', '13800138000', 'DZB', 'admin'];
        return $this->buildCsv($header, [$example]);
    }

    public function getDepartmentTemplate(): string
    {
        $header = ['name', 'code', 'parent_code', 'sort_order'];
        $example = ['技术部', 'JSB', 'DZB', '1'];
        return $this->buildCsv($header, [$example]);
    }

    protected function buildCsv(array $header, array $rows): string
    {
        $output = fopen('php://temp', 'r+');
        fwrite($output, "\xEF\xBB\xBF");
        fputcsv($output, $header);
        foreach ($rows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        return $csv;
    }
}
