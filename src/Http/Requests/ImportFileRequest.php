<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => '请上传文件',
            'file.mimes' => '仅支持 CSV 格式文件',
            'file.max' => '文件大小不能超过 2MB',
        ];
    }
}
