<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'menu_ids' => 'required|array',
            'menu_ids.*' => 'integer|exists:menus,id',
        ];
    }
}
