<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'parent_id' => ['nullable', 'exists:departments,id', Rule::notIn([$this->route('department')])],
            'code' => ['nullable', 'string', 'max:100', Rule::unique('departments')->ignore($this->route('department'))],
            'manager_id' => 'nullable|exists:users,id',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
