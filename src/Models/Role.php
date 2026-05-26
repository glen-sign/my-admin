<?php

namespace StuMed\MyAdmin\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
        'code',
        'description',
        'status',
    ];

    public function menus(): BelongsToMany
    {
        return $this->belongsToMany(Menu::class, 'role_has_menus');
    }
}
