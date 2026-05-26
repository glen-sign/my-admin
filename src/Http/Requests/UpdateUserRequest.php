<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($this->route('user'))],
            'department_id' => 'nullable|exists:departments,id',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|string|exists:roles,name',
        ];
    }
}
