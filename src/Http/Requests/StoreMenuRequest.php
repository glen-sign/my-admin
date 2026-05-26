<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:menus,code',
            'parent_id' => 'nullable|exists:menus,id',
            'icon' => 'nullable|string|max:100',
            'path' => 'nullable|string|max:500',
            'type' => 'required|in:directory,page,button',
            'visible' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }
}
