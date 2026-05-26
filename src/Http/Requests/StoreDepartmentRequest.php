<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:departments,id',
            'code' => 'nullable|string|max:100|unique:departments,code',
            'manager_id' => 'nullable|exists:users,id',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
