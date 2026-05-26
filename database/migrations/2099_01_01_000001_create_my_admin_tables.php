<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 用户表扩展字段（假设 users 表已存在）
        if (Schema::hasTable('users')) {
            if (!Schema::hasColumn('users', 'username')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('username')->nullable()->unique()->after('name');
                });
            }
            if (!Schema::hasColumn('users', 'department_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unsignedBigInteger('department_id')->nullable()->after('email');
                    $table->string('phone', 20)->nullable()->after('department_id');
                    $table->string('avatar', 255)->nullable()->after('phone');
                    $table->enum('status', ['active', 'disabled'])->default('active')->after('avatar');
                });
            }
            if (!Schema::hasColumn('users', 'deleted_at')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }

        // 部门表
        if (!Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->string('name', 100);
                $table->string('code', 50)->unique();
                $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
                $table->softDeletes();
            });

            // 添加 users 表的 department_id 外键
            if (Schema::hasColumn('users', 'department_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
                });
            }
        }

        // 菜单表
        if (!Schema::hasTable('menus')) {
            Schema::create('menus', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->nullable()->constrained('menus')->nullOnDelete();
                $table->string('name', 100);
                $table->string('code', 50)->nullable()->comment('菜单英文标识');
                $table->string('icon', 100)->nullable();
                $table->string('path', 255)->nullable();
                $table->enum('type', ['directory', 'page', 'button'])->default('page');
                $table->boolean('visible')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 角色-菜单关联表
        if (!Schema::hasTable('role_has_menus')) {
            Schema::create('role_has_menus', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id');
                $table->unsignedBigInteger('menu_id');
                $table->primary(['role_id', 'menu_id']);
                $table->foreign('menu_id')->references('id')->on('menus')->cascadeOnDelete();
                $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            });
        }

        // 角色表扩展字段
        if (Schema::hasTable('roles')) {
            if (!Schema::hasColumn('roles', 'code')) {
                Schema::table('roles', function (Blueprint $table) {
                    $table->string('code')->nullable()->after('name');
                    $table->string('description', 500)->nullable()->after('code');
                    $table->string('status', 20)->default('active')->after('description');
                });
            }
        }

        // 权限表扩展字段
        if (Schema::hasTable('permissions')) {
            if (!Schema::hasColumn('permissions', 'label')) {
                Schema::table('permissions', function (Blueprint $table) {
                    $table->string('label')->nullable()->after('name')->comment('权限中文标签');
                });
            }
        }

        // 登录日志表
        if (!Schema::hasTable('login_logs')) {
            Schema::create('login_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->enum('login_type', ['local', 'cas']);
                $table->string('ip_address')->nullable();
                $table->text('user_agent')->nullable();
                $table->string('device')->nullable();
                $table->enum('status', ['success', 'failed']);
                $table->timestamp('created_at')->nullable();
            });
        }

        // 文件附件表
        if (!Schema::hasTable('file_attachments')) {
            Schema::create('file_attachments', function (Blueprint $table) {
                $table->id();
                $table->string('original_name');
                $table->string('storage_path')->unique();
                $table->string('disk')->default('public');
                $table->string('mime_type');
                $table->unsignedBigInteger('file_size');
                $table->string('file_hash', 64);
                $table->string('directory')->default('general');
                $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
                $table->string('description')->nullable();
                $table->timestamps();

                $table->index('directory');
                $table->index('uploaded_by');
                $table->index('file_hash');
            });
        }

        // 操作日志表
        if (!Schema::hasTable('operation_logs')) {
            Schema::create('operation_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('module', 50)->comment('操作模块');
                $table->string('action', 50)->comment('操作类型');
                $table->string('description')->comment('操作描述');
                $table->string('method', 10)->comment('请求方法');
                $table->string('path', 500)->comment('请求路径');
                $table->json('request_data')->nullable()->comment('请求参数（脱敏）');
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->smallInteger('status_code')->default(200)->comment('响应状态码');
                $table->integer('duration')->default(0)->comment('请求耗时(ms)');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        // Personal Access Tokens（Sanctum）
        if (!Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_logs');
        Schema::dropIfExists('file_attachments');
        Schema::dropIfExists('login_logs');
        Schema::dropIfExists('role_has_menus');
        Schema::dropIfExists('menus');

        if (Schema::hasColumn('users', 'department_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['department_id']);
            });
        }

        Schema::dropIfExists('departments');

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = ['username', 'department_id', 'phone', 'avatar', 'status', 'deleted_at'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('users', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('roles')) {
            Schema::table('roles', function (Blueprint $table) {
                $columns = ['code', 'description', 'status'];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('roles', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('permissions') && Schema::hasColumn('permissions', 'label')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->dropColumn('label');
            });
        }

        Schema::dropIfExists('personal_access_tokens');
    }
};
