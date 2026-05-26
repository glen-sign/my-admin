<?php

namespace StuMed\MyAdmin\Exceptions;

use Exception;
use Symfony\Component\HttpFoundation\Response;

class BusinessException extends Exception
{
    protected string $errorCode;

    public function __construct(
        string $errorCode,
        string $message,
        protected int $httpStatus = Response::HTTP_BAD_REQUEST,
        protected ?string $details = null,
        protected ?array $fieldErrors = null,
    ) {
        $this->errorCode = $errorCode;
        parent::__construct($message);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getHttpStatus(): int
    {
        return $this->httpStatus;
    }

    public function getDetails(): ?string
    {
        return $this->details;
    }

    public function getFieldErrors(): ?array
    {
        return $this->fieldErrors;
    }
}
