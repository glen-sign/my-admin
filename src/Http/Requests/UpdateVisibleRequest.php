<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVisibleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'visible' => 'required|boolean',
        ];
    }
}
