<?php

namespace StuMed\MyAdmin\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BatchDestroyUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1|max:50',
            'ids.*' => 'integer|exists:users,id',
        ];
    }
}
