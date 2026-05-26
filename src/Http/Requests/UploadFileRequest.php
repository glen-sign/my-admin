<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:102400', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,csv,zip,rar,txt,mp4,mp3'],
            'directory' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_\-\/]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => '请选择要上传的文件',
            'file.file' => '上传的内容必须是有效的文件',
            'file.max' => '文件大小不能超过 100MB',
            'directory.string' => '目录参数必须是字符串',
            'directory.max' => '目录名称不能超过 255 个字符',
            'description.string' => '描述必须是字符串',
            'description.max' => '描述不能超过 500 个字符',
        ];
    }
}
