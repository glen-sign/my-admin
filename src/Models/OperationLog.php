<?php

namespace StuMed\MyAdmin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'module',
        'action',
        'description',
        'method',
        'path',
        'request_data',
        'ip_address',
        'user_agent',
        'status_code',
        'duration',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'request_data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
