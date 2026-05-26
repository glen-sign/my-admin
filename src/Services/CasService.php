<?php

namespace StuMed\MyAdmin\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CasService
{
    public function getLoginUrl(): string
    {
        $serviceUrl = $this->getServiceUrl();
        return $this->getCasBaseUrl() . '/login?service=' . urlencode($serviceUrl);
    }

    public function getLogoutUrl(): string
    {
        return $this->getCasBaseUrl() . '/logout';
    }

    public function validateTicket(string $ticket): ?array
    {
        $serviceUrl = $this->getServiceUrl();
        $validateUrl = $this->getCasBaseUrl() . '/serviceValidate';

        Log::info('CAS ticket 验证请求', [
            'validateUrl' => $validateUrl,
            'service' => $serviceUrl,
        ]);

        try {
            $response = Http::withoutVerifying()->get($validateUrl, [
                'service' => $serviceUrl,
                'ticket' => $ticket,
            ]);

            $body = $response->body();
            Log::info('CAS 验证响应', ['body' => $body]);

            if (!$response->successful()) {
                Log::error('CAS 验证请求失败', ['status' => $response->status()]);
                return null;
            }

            return $this->parseValidationResponse($body);
        } catch (\Exception $e) {
            Log::error('CAS ticket 验证异常', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    private function parseValidationResponse(string $xml): ?array
    {
        $xml = trim($xml);

        $dom = new \DOMDocument();
        if (!$dom->loadXML($xml, LIBXML_NONET)) {
            Log::error('CAS 响应 XML 解析失败', ['xml' => $xml]);
            return null;
        }

        $successNodes = $dom->getElementsByTagNameNS('http://www.yale.edu/tp/cas', 'authenticationSuccess');

        if ($successNodes->length === 0) {
            $failureNodes = $dom->getElementsByTagNameNS('http://www.yale.edu/tp/cas', 'authenticationFailure');
            $reason = $failureNodes->length > 0 ? trim($failureNodes->item(0)->textContent) : '未知原因';
            Log::warning('CAS 认证失败', ['reason' => $reason]);
            return null;
        }

        $userNodes = $dom->getElementsByTagNameNS('http://www.yale.edu/tp/cas', 'user');

        if ($userNodes->length === 0) {
            Log::error('CAS 响应中未找到用户名');
            return null;
        }

        $uid = trim($userNodes->item(0)->textContent);

        $attributes = [];
        $attrNodes = $dom->getElementsByTagNameNS('http://www.yale.edu/tp/cas', 'attributes');

        if ($attrNodes->length > 0) {
            $attrNode = $attrNodes->item(0);
            foreach ($attrNode->childNodes as $child) {
                if ($child->nodeType === XML_ELEMENT_NODE) {
                    $attributes[$child->localName] = trim($child->textContent);
                }
            }
        }

        Log::info('CAS 认证成功', ['uid' => $uid, 'attributes' => $attributes]);

        return [
            'uid' => $uid,
            'attributes' => $attributes,
        ];
    }

    private function getCasBaseUrl(): string
    {
        $casHost = config('my-admin.cas.host');
        $casPort = (int) config('my-admin.cas.port', 443);
        $casUri = config('my-admin.cas.uri');

        $baseUrl = "https://{$casHost}";
        if ($casPort !== 443) {
            $baseUrl .= ":{$casPort}";
        }

        return $baseUrl . $casUri;
    }

    private function getServiceUrl(): string
    {
        return config('my-admin.cas.base_url') . '/' . trim(config('my-admin.route_prefix', 'api'), '/') . '/auth/cas/callback';
    }
}
