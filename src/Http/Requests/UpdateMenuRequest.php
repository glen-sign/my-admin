<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => ['nullable', 'string', 'max:50', Rule::unique('menus')->ignore($this->route('menu'))],
            'parent_id' => ['nullable', 'exists:menus,id', Rule::notIn([$this->route('menu')])],
            'icon' => 'nullable|string|max:100',
            'path' => 'nullable|string|max:500',
            'type' => 'required|in:directory,page,button',
            'visible' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
