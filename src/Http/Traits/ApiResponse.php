<?php

namespace StuMed\MyAdmin\Http\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function success($data = null, string $message = 'OK', int $code = 200): JsonResponse
    {
        return response()->json([
            'code' => 'SUCCESS',
            'message' => $message,
            'data' => $data,
            'timestamp' => now()->timestamp,
        ], $code);
    }

    protected function created($data = null, string $message = 'Created'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function error(string $code, string $message, int $httpStatus = 400, $details = null, $fieldErrors = null): JsonResponse
    {
        $errorBody = [
            'code' => $code,
            'message' => $message,
            'timestamp' => now()->timestamp,
        ];

        if ($details !== null) {
            $errorBody['details'] = $details;
        }

        if ($fieldErrors !== null) {
            $errorBody['fieldErrors'] = $fieldErrors;
        }

        return response()->json([
            'error' => $errorBody,
        ], $httpStatus);
    }

    protected function badRequest(string $message = 'Bad Request', $details = null): JsonResponse
    {
        return $this->error('BAD_REQUEST', $message, 400, $details);
    }

    protected function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error('UNAUTHORIZED', $message, 401);
    }

    protected function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error('FORBIDDEN', $message, 403);
    }

    protected function notFound(string $message = 'Not Found'): JsonResponse
    {
        return $this->error('NOT_FOUND', $message, 404);
    }

    protected function validationError(string $message = 'Validation Error', $fieldErrors = null): JsonResponse
    {
        return $this->error('VALIDATION_ERROR', $message, 422, null, $fieldErrors);
    }

    protected function conflict(string $message = 'Conflict'): JsonResponse
    {
        return $this->error('CONFLICT', $message, 409);
    }

    protected function tooManyRequests(string $message = 'Too Many Requests'): JsonResponse
    {
        return $this->error('TOO_MANY_REQUESTS', $message, 429);
    }

    protected function internalError(string $message = 'Internal Server Error', $stack = null): JsonResponse
    {
        $errorBody = [
            'code' => 'INTERNAL_ERROR',
            'message' => $message,
            'timestamp' => now()->timestamp,
        ];

        if ($stack !== null && config('app.debug')) {
            $errorBody['stack'] = $stack;
        }

        return response()->json([
            'error' => $errorBody,
        ], 500);
    }

    protected function businessError(string $message, $details = null, $fieldErrors = null): JsonResponse
    {
        return $this->error('BUSINESS_ERROR', $message, 422, $details, $fieldErrors);
    }
}
