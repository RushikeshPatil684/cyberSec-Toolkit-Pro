#!/bin/bash
# CORS smoke test for /api/recon/ipinfo endpoint
# Tests OPTIONS preflight and POST request with CORS headers

set -e

# Default backend URL (override with BACKEND_URL env var)
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
TEST_ORIGIN="https://cyber-sec-toolkit-pro.vercel.app"
ENDPOINT="${BACKEND_URL}/api/recon/ipinfo"

echo "Testing CORS for endpoint: ${ENDPOINT}"
echo "Test Origin: ${TEST_ORIGIN}"
echo ""

# Test 1: OPTIONS preflight request
echo "=== Test 1: OPTIONS Preflight Request ==="
OPTIONS_RESPONSE=$(curl -s -i -X OPTIONS "${ENDPOINT}" \
  -H "Origin: ${TEST_ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "${OPTIONS_RESPONSE}" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
OPTIONS_HEADERS=$(echo "${OPTIONS_RESPONSE}" | grep -i "access-control")

echo "HTTP Status: ${HTTP_CODE}"
echo "CORS Headers:"
echo "${OPTIONS_HEADERS}"

# Check for required CORS headers
if echo "${OPTIONS_HEADERS}" | grep -qi "access-control-allow-origin.*${TEST_ORIGIN}"; then
    echo "✅ Access-Control-Allow-Origin: OK (matches ${TEST_ORIGIN})"
else
    echo "❌ Access-Control-Allow-Origin: FAILED (expected ${TEST_ORIGIN})"
    exit 1
fi

if echo "${OPTIONS_HEADERS}" | grep -qi "access-control-allow-methods"; then
    echo "✅ Access-Control-Allow-Methods: OK"
else
    echo "❌ Access-Control-Allow-Methods: MISSING"
    exit 1
fi

if echo "${OPTIONS_HEADERS}" | grep -qi "access-control-allow-credentials.*true"; then
    echo "✅ Access-Control-Allow-Credentials: OK"
else
    echo "❌ Access-Control-Allow-Credentials: MISSING or not true"
    exit 1
fi

if [ "${HTTP_CODE}" = "204" ] || [ "${HTTP_CODE}" = "200" ]; then
    echo "✅ OPTIONS preflight: OK (HTTP ${HTTP_CODE})"
else
    echo "❌ OPTIONS preflight: FAILED (HTTP ${HTTP_CODE}, expected 204 or 200)"
    exit 1
fi

echo ""
echo "=== Test 2: POST Request with CORS ==="
POST_RESPONSE=$(curl -s -i -X POST "${ENDPOINT}" \
  -H "Origin: ${TEST_ORIGIN}" \
  -H "Content-Type: application/json" \
  -d '{"ip":"8.8.8.8"}' \
  -w "\nHTTP_CODE:%{http_code}")

POST_HTTP_CODE=$(echo "${POST_RESPONSE}" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
POST_CORS_HEADERS=$(echo "${POST_RESPONSE}" | grep -i "access-control")

echo "HTTP Status: ${POST_HTTP_CODE}"
echo "CORS Headers:"
echo "${POST_CORS_HEADERS}"

if echo "${POST_CORS_HEADERS}" | grep -qi "access-control-allow-origin.*${TEST_ORIGIN}"; then
    echo "✅ POST Access-Control-Allow-Origin: OK"
else
    echo "❌ POST Access-Control-Allow-Origin: FAILED"
    exit 1
fi

if [ "${POST_HTTP_CODE}" = "200" ] || [ "${POST_HTTP_CODE}" = "502" ]; then
    echo "✅ POST request: OK (HTTP ${POST_HTTP_CODE})"
else
    echo "⚠️  POST request: HTTP ${POST_HTTP_CODE} (may be expected if backend not running)"
fi

echo ""
echo "=== All CORS tests passed ==="

