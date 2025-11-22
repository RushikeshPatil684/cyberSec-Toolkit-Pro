# CORS Configuration Fix

This document describes the CORS (Cross-Origin Resource Sharing) configuration added to support frontend API calls from Vercel deployments.

## What Was Added

The backend now includes robust CORS support for all `/api/*` endpoints with:
- **Preflight handling**: Automatic OPTIONS request handling for CORS preflight checks
- **Dynamic origin matching**: Echoes the request Origin header if it's in the allowed list
- **Fallback support**: Works even if `flask_cors` is unavailable or misconfigured
- **Security headers preserved**: All existing security headers are maintained and merged with CORS headers

## Configuration

Set the `ALLOWED_ORIGINS` environment variable in Render (or your deployment platform) with comma-separated origins:

```
ALLOWED_ORIGINS=http://localhost:3000,https://cyber-sec-toolkit-pro.vercel.app,https://cybersec-toolkit-pro.vercel.app
```

**Default origins** (if not set):
- `http://localhost:3000` (development)
- `https://cyber-sec-toolkit-pro.vercel.app` (production)
- `https://cybersec-toolkit-pro.vercel.app` (production)

## Verification

Test CORS preflight with:

```bash
curl -i -X OPTIONS http://localhost:5000/api/recon/ipinfo \
  -H "Origin: https://cyber-sec-toolkit-pro.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

Expected response includes:
- `Access-Control-Allow-Origin: https://cyber-sec-toolkit-pro.vercel.app`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Credentials: true`
- HTTP status: 204 or 200

Or run the automated smoke test:
```bash
bash tests/test_cors_smoke.sh
```

