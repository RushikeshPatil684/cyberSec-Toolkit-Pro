# QA Checklist - Tool Accuracy Improvements

## ✅ Completed Changes

### 1. Removed IP-checker Demo from Home
- [x] Removed demo IP checker section from Home.jsx
- [x] Removed unused imports (axios, ScanEye icon, demo state)
- [x] Removed demo-related functions (runDemo, formatDemoValue, demoFields)

### 2. Normalization Layer
- [x] Created `frontend/src/utils/normalizeToolResults.js` with normalizers for all tools
- [x] Created `backend/utils/normalizers.py` with server-side normalizers
- [x] Updated IP Info, WHOIS, SSL, Subdomain tools to use normalization
- [x] All normalized results include `normalized: true` flag and `raw` data

### 3. Enrichment Endpoints
- [x] Added `POST /api/enrich/ip` endpoint
- [x] Added `POST /api/enrich/whois` endpoint
- [x] Created cache directory structure (`backend/cache/`)
- [x] Cache files: `ip_cache.json`, `whois_cache.json`, `cve_snippets.json`
- [x] 12-hour TTL for cache entries

### 4. Caching System
- [x] Frontend LRU cache (`frontend/src/utils/cache.js`) - 50 entry limit
- [x] Backend file cache with TTL validation
- [x] Cache integration in IP Info, WHOIS, SSL, Subdomain tools
- [x] Sensitive tools (password, breach) excluded from caching

### 5. Tool Improvements

#### SSL Checker
- [x] Enhanced to extract SANs (Subject Alternative Names)
- [x] Signature algorithm detection
- [x] Weak signature detection (SHA1, MD5)
- [x] Days remaining calculation
- [x] ISO8601 date normalization

#### CVE Search
- [x] CVSS score extraction and severity classification
- [x] Local cache support (`cve_snippets.json`)
- [x] Normalized results with CVE ID, summary, dates, severity

#### Subdomain Finder
- [x] DNS validation for each subdomain
- [x] Deduplication and wildcard removal
- [x] Confidence scoring (high/medium/low)
- [x] Shows `validated: true/false` for each entry

#### WHOIS
- [x] Redacted field detection
- [x] ISO8601 date normalization
- [x] Graceful handling of missing/redacted data

#### HTTP Headers
- [x] Security header classification (present/missing/misconfigured)
- [x] Remediation snippets for common misses
- [x] HSTS, CSP, X-Content-Type-Options, Referrer-Policy checks

### 6. Password Checker Enhancements
- [x] Enhanced suggestions with deterministic checks:
  - Length < 12 → suggest 16+ chars or passphrase
  - Entropy < 45 bits → recommend improvements
  - Missing symbols/numbers → specific suggestions
  - Keyboard sequences detection
  - Dictionary word detection
- [x] Added memorable passphrase generator (4 words + 2 symbols)
- [x] Privacy comment: "DO NOT send passwords to backend"
- [x] All processing remains client-side only

### 7. Shared Components
- [x] Created `ToolResultCard.jsx` component
- [x] Supports normalized data display
- [x] Raw JSON toggle (collapsed by default)
- [x] Export JSON button
- [x] Save Report button with console logging
- [x] Enrichment indicator badge

### 8. Testing & Debug
- [x] Created `tests/tool_smoke_test.py` script
- [x] Tests all tool endpoints
- [x] Verifies normalized fields presence
- [x] Console logging in ReportContext.saveReport()

### 9. Documentation
- [x] Updated README.md with "Data & Accuracy" section
- [x] Dataset integration hooks documented
- [x] Caching system explained
- [x] Smoke test instructions added
- [x] Testing checklist updated

## 🧪 Testing Steps

1. **Start Services**
   ```bash
   # Backend
   cd backend && python app.py
   
   # Frontend
   cd frontend && npm start
   ```

2. **Verify Home Page**
   - Navigate to http://localhost:3000
   - Confirm IP-checker demo is removed
   - Password checker section should be visible

3. **Test IP Info Tool**
   - Go to `/tools/ipinfo`
   - Enter `8.8.8.8`
   - Verify normalized fields: `ip`, `org`, `city`, `country`, `normalized`
   - Check console for enrichment API call (may be 404 if cache empty)

4. **Test WHOIS Tool**
   - Go to `/tools/whois`
   - Enter `example.com`
   - Verify normalized fields: `domain`, `registrar`, `creation_date`, `nameservers`, `normalized`
   - Check for redacted field handling

5. **Test SSL Tool**
   - Go to `/tools/ssl`
   - Enter `google.com`
   - Verify: `domain`, `valid`, `issuer`, `days_remaining`, `cert_san`, `normalized`
   - Check for weak signature detection

6. **Test Subdomain Finder**
   - Go to `/tools/subdomains`
   - Enter `example.com`
   - Verify: `domain`, `total_clean`, `subdomains` array with `validated` flags
   - Check deduplication works

7. **Test Password Checker**
   - Go to `/tools/password`
   - Test password generation (strong password)
   - Test passphrase generation
   - Verify enhanced suggestions appear
   - Confirm no backend calls for password processing

8. **Test Caching**
   - Run same query twice (e.g., IP Info with 8.8.8.8)
   - Second call should be instant (check console for cache hit)
   - Verify "Cached" indicator appears

9. **Test Save Report**
   - Run any tool
   - Click "Save Report" button
   - Verify toast notification
   - Check console for saveReport ID log
   - Navigate to `/reports` to verify saved report

10. **Run Smoke Test**
    ```bash
    cd tests
    python tool_smoke_test.py
    ```
    - Should pass all endpoint tests
    - Verify normalized fields are present

## ⚠️ Known Limitations

1. **Enrichment Endpoints**: Return 404 if cache files are empty (expected - populate with data for production)
2. **SSL SAN Extraction**: Requires `cryptography` package for full SAN extraction (optional, falls back gracefully)
3. **CVE Cache**: Contains example data only; populate with real CVE data for production
4. **ToolTemplate Tools**: DNS, Headers, Breach, CVE use ToolTemplate component - may need separate normalization updates
5. **Password Privacy**: All password processing is client-side only (no backend calls)

## 📝 Next Steps (Optional)

1. Populate `backend/cache/cve_snippets.json` with real CVE data
2. Add MaxMind GeoLite2 database integration for IP enrichment
3. Add local WHOIS parser for offline lookups
4. Update ToolTemplate-based tools to use normalization
5. Add rate limit UI feedback when APIs indicate rate limits
6. Implement explainable AI Risk scoring (if Risk tool exists)

## ✅ Commit Messages

Use these exact commit messages:

```bash
git add . && git commit -m "fix(tools): normalization, enrichment hooks, caching and improved accuracy"
git add . && git commit -m "feat(password): improved suggestions and generator; privacy-safe behavior"
git add . && git commit -m "chore(docs): add accuracy & dataset integration notes"
```

