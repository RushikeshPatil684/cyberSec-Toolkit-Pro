# CyberSec Toolkit Pro

Practical reconnaissance tools for learners — open, auditable, and transparent. Frontend: React + Tailwind. Backend: Flask + Firebase/Firestore mirrors.

## Quick Start

### Backend
1. `cd backend`
2. `py -m venv venv && venv\Scripts\activate` (PowerShell) or `python3 -m venv venv && source venv/bin/activate` (Unix)
3. `pip install -r requirements.txt`
4. `python app.py` → API at `http://localhost:5000`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start` → UI at `http://localhost:3000`

Set `REACT_APP_API_BASE` inside `frontend/.env` when the API is not on `localhost:5000`.

## Environment Variables

### Frontend (`frontend/.env`)
```
REACT_APP_API_BASE=http://localhost:5000
REACT_APP_ENABLE_DEBUG_SAVE=true
```

### Backend (`backend/.env`)
```
OPENAI_API_KEY=            # optional, fallback summaries used when empty
ALLOWED_ORIGINS=http://localhost:3000
API_RATE_LIMIT=120         # requests per window
API_RATE_WINDOW_SECONDS=60
```

## Reports & Debugging
- Reports view now streams directly from Firestore (per-user) with zero backend mirroring.
- `DebugSaveButton` still available under `/debug` (when `REACT_APP_ENABLE_DEBUG_SAVE=true`) to validate Firestore writes.
- Console logs focus on `ReportContext` sync events so you can see when Firestore pulls in new reports.

## Report Persistence & Password Tooling
- `ReportContext` writes a single Firestore document per report (`{ userId, tool, result, createdAt }`) and listens with `onSnapshot`.
- Every tool page calls `saveReport({ tool, result })` after successful scans—no dashboard route or backend fallback required.
- Home now exposes a public password strength checker with a neon card UI; `/tools/password` still offers the detailed zxcvbn workflow.

## Firebase Storage Rules (Profile Pictures)

Profile pictures are stored at `avatars/{userId}.jpg`. Ensure your Firebase Storage rules allow authenticated users to upload:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}.jpg {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      // Allow write only for the owner
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

If you encounter CORS errors when accessing avatars:
- Firebase Storage handles CORS automatically for authenticated requests
- If using Google Cloud Storage directly, configure CORS with: `gsutil cors set cors.json gs://YOUR_BUCKET`

## Security Hardening
- Frontend sanitizes IPs/domains/URLs/emails before sending requests. Backend re-validates with helper functions plus rate limiting (`API_RATE_LIMIT`/`API_RATE_WINDOW_SECONDS`).
- Global CORS respects `ALLOWED_ORIGINS` and responses now ship CSP, Referrer-Policy, and X-Frame-Options headers.
- `header_analyzer`, `breach`, `ssl`, `subdomain`, `ipinfo`, `whois`, and `dns` all sanitize incoming payloads server-side.

## Testing
- Unit tests: `cd frontend && npm test -- --watch=false`
- Build check: `cd frontend && npm run build`
- E2E smoke (Playwright):
  1. `cd frontend`
  2. `npx playwright install --with-deps` (first run)
  3. `E2E_EMAIL=... E2E_PASSWORD=... npm run test:e2e`
  4. Test logs in, runs IP Intel, saves a report, and verifies the Reports view update.

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies, runs unit tests/build, and lists available Playwright specs for quick verification.

## SSL Certificate Checker

The SSL checker (`/api/ssl/check`) provides robust TLS certificate inspection:

- **Endpoint**: `POST /api/ssl/check` with JSON `{ "host": "example.com", "port": 443 }`
- **Features**: Full certificate parsing (SANs, issuer, subject, serial, signature algorithm), validity checking, days remaining calculation
- **Chain Validation**: Set `SSL_VALIDATE_CHAINS=true` in backend `.env` to enable chain verification with system CA store
- **Caching**: 10-minute in-memory cache for repeated checks
- **Timeouts**: 6-second connection/handshake timeout
- **Error Handling**: Graceful handling of expired certs, untrusted chains, timeouts, and parsing errors

## Data & Accuracy

### Normalization & Enrichment
All tools now use deterministic normalization layers that extract canonical fields and convert data to consistent formats (ISO8601 dates, standardized field names, consistent arrays). Results include both `normalized` and `raw` outputs.

**Normalization Features:**
- **IP Info**: Extracts ASN from org strings using regex `AS(\d+)`, normalizes location coordinates from `loc` field, converts to floats
- **WHOIS**: Normalizes dates to ISO8601, handles redacted fields, converts status to arrays
- **DNS**: Ensures all record types are arrays, includes resolver and TTL info
- **SSL**: Computes `days_remaining` from `not_after`, extracts SANs, detects weak signatures
- **Subdomains**: Deduplicates and lowercases hosts, validates via DNS A/AAAA/CNAME, skips wildcards for direct checks
- **CVE**: Maps CVSS scores to severity levels (Critical/High/Medium/Low), extracts references

**Dataset Integration Hooks:**
- **IP Geolocation**: Plug MaxMind GeoLite2 database into `backend/utils/normalizers.py` `normalize_ip_info()` for offline IP lookups. Cache format: `backend/cache/ip_cache.json` with `{"ip": {"timestamp": "ISO8601", "data": {...}}}`
- **WHOIS Parsing**: Integrate local WHOIS parsers or zone file snapshots in `backend/utils/normalizers.py` `normalize_whois()`. Cache format: `backend/cache/whois_cache.json`
- **CVE Database**: Add NVD CVE feed snapshots to `backend/cache/cve_snippets.json` for faster lookups. Format: `{"query": [cve_objects]}`
- **Enrichment Endpoints**: `POST /api/enrich/ip` and `POST /api/enrich/whois` return cached enrichment data (12-hour TTL) or 404 if not available

### Caching
- **Backend**: File-based cache in `backend/cache/` with 12-hour TTL for heavy operations (DNS, IP lookups, subdomain scans). Cache files are JSON with timestamp metadata
- **Frontend**: In-memory LRU cache (50 entries) for repeated queries in a session via `frontend/src/utils/cache.js`
- **Cache Files**: `ip_cache.json`, `whois_cache.json`, `cve_snippets.json`, `subdomain_cache.json` (JSON format, can be populated from external datasets)

### Validation & Deduplication
- **Subdomain Finder**: Validates each discovered subdomain with DNS A/AAAA/CNAME lookups; shows `validated: true/false`; removes wildcards and deduplicates; includes resolver and TTL when available
- **WHOIS**: Handles redacted fields gracefully; shows `redacted: true` flag and `redacted_fields` array; normalizes status to arrays
- **DNS**: Includes TTL and authoritative vs recursive indicators when available; normalizes all record types to arrays
- **HTTP Headers**: Classifies security headers as `present | missing | misconfigured`; provides remediation snippets for common misses

### Running Smoke Tests
```bash
cd tests
python tool_smoke_test.py
```
This script tests all tool endpoints and verifies normalized fields are present. Update `BASE_URL` in the script if testing against a different server.

## Testing Checklist (post-run)
- `cd frontend && npm install && npm start`
- Log in with your Firebase test user.
- Hit `/debug` (or toggle `REACT_APP_ENABLE_DEBUG_SAVE`) and trigger Debug Save if you need to test Firestore writes.
- Run any tool or the Password Checker, confirm auto-save logs and sanitized payloads.
- Navigate to `/tools/password` and verify the zxcvbn meter, generator, copy, and summary save.
- Test normalization: run IP lookup, check console for normalized fields
- Test caching: run same query twice, verify second call is instant
- Test enrichment: check if enrichment endpoints return data (may be empty initially)

## Commit Guidance
Ship changes with the agreed messages:
1. `fix(reports): streamline firestore writer, drop dashboard references`
2. `feat(tools): add password strength checker (zxcvbn)`
3. `chore(ui): dark background cleanup, concise home/about copy`

## Deployment (Render backend + Vercel frontend)

### Backend (Render)
1. Create a Render Web Service pointing at `backend`.
2. Set environment variables (`OPENAI_API_KEY`, `ALLOWED_ORIGINS`, any Firebase admin creds) plus Render’s `PORT`.
3. Use the provided `Procfile` (`gunicorn app:app --bind 0.0.0.0:$PORT`) and `requirements.txt`.
4. Add `firebase-key.json` as a Render secret file if you need admin SDK access.

### Frontend (Vercel)
1. Hook the repo to Vercel with the root directory set to `frontend`.
2. Define `REACT_APP_API_BASE=https://<your-render-service>.onrender.com` and Firebase public keys in the Vercel project settings.
3. Optionally add `REACT_APP_ENABLE_DEBUG_SAVE=true` for staging builds.
4. `npm run build` is the default build command; Vercel will serve the compiled React app globally.

Happy hacking! Contributions welcome—see `CONTRIBUTING.md` and the `CODE_OF_CONDUCT.md` for expectations.
