<?php

namespace StuMed\MyAdmin\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileAttachment extends Model
{
    protected $fillable = [
        'original_name',
        'storage_path',
        'disk',
        'mime_type',
        'file_size',
        'file_hash',
        'directory',
        'uploaded_by',
        'description',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
