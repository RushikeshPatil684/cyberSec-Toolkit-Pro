# app.py — CyberSec Toolkit Pro (Flask + Firebase Integration)

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import requests
import whois
import dns.resolver
import socket
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Preformatted
from reportlab.lib.enums import TA_LEFT
from io import BytesIO
import json
import re
import threading
import time
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from ipaddress import ip_address
from urllib.parse import urlparse
import ssl
import base64

# Import normalizers
try:
    from utils.normalizers import normalize_ip_info, normalize_whois, normalize_dns, normalize_ssl, normalize_cve
except ImportError:
    # Fallback if normalizers not available
    normalize_ip_info = normalize_whois = normalize_dns = normalize_ssl = normalize_cve = None

# Import cryptography for SSL parsing
try:
    from cryptography import x509
    from cryptography.hazmat.backends import default_backend
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False
    print("Warning: cryptography package not available. SSL checker will have limited functionality.")

# ------------------------------
# 🔹 Load Environment Variables
# ------------------------------
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize Flask App
app = Flask(__name__)

# Parse ALLOWED_ORIGINS safely: split by comma, strip whitespace, ignore empty entries
# Default includes localhost for dev and Vercel domains for production
_default_origins = "http://localhost:3000,https://cyber-sec-toolkit-pro.vercel.app,https://cybersec-toolkit-pro.vercel.app"
_origins_str = os.getenv("ALLOWED_ORIGINS", _default_origins)
ALLOWED_ORIGINS = [origin.strip() for origin in _origins_str.split(",") if origin.strip()]

# Configure CORS with flask_cors if available
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
    # Use "*" if ALLOWED_ORIGINS is empty, otherwise use the list
    _cors_origins = ALLOWED_ORIGINS if ALLOWED_ORIGINS else "*"
    CORS(app, resources={r"/api/*": {"origins": _cors_origins, "supports_credentials": True}})
    print(f"[CORS] Configured with flask_cors for origins: {_cors_origins}")
except ImportError:
    CORS_AVAILABLE = False
    print("[CORS] Warning: flask_cors not available, using fallback CORS handlers")
except Exception as e:
    CORS_AVAILABLE = False
    print(f"[CORS] Warning: flask_cors configuration failed: {e}, using fallback CORS handlers")

# Security helpers
RATE_LIMIT = int(os.getenv("API_RATE_LIMIT", "120"))
RATE_WINDOW_SECONDS = int(os.getenv("API_RATE_WINDOW_SECONDS", "60"))
_rate_limit_bucket = {}
SAFE_HOSTNAME_RE = re.compile(
    r'^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$',
    re.IGNORECASE
)
EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')


def sanitize_hostname(value):
    if not value:
        return None
    candidate = value.strip().lower()
    candidate = candidate.replace("https://", "").replace("http://", "").split("/")[0]
    candidate = candidate.split(":")[0]
    return candidate if SAFE_HOSTNAME_RE.match(candidate) else None


def sanitize_ip_value(value):
    if not value:
        return None
    try:
        return str(ip_address(value.strip()))
    except Exception:
        return None


def sanitize_url_value(value):
    if not value:
        return None
    candidate = value.strip()
    parsed = urlparse(candidate if "://" in candidate else f"https://{candidate}")
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return parsed.geturl()
    return None


def sanitize_email_value(value):
    if not value:
        return None
    candidate = value.strip().lower()
    return candidate if EMAIL_RE.match(candidate) else None


@app.before_request
def handle_cors_preflight():
    """Handle CORS preflight (OPTIONS) requests with fallback if flask_cors is unavailable."""
    if not request.path.startswith("/api/"):
        return None
    
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        
        # Determine allowed origin: echo request origin if in ALLOWED_ORIGINS, otherwise use first allowed or "*"
        if origin in ALLOWED_ORIGINS:
            allow_origin = origin
        elif ALLOWED_ORIGINS:
            allow_origin = ALLOWED_ORIGINS[0]
        else:
            allow_origin = "*"
        
        # Build CORS headers
        cors_headers = {
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
        
        response = app.make_default_options_response()
        response.headers.update(cors_headers)
        return response
    
    return None


@app.before_request
def enforce_rate_limit():
    if not request.path.startswith("/api/"):
        return None

    ip_key = (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For")
        or request.remote_addr
        or "anonymous"
    )
    now = time.time()
    bucket = _rate_limit_bucket.get(ip_key, {"count": 0, "reset": now + RATE_WINDOW_SECONDS})

    if now > bucket["reset"]:
        bucket = {"count": 0, "reset": now + RATE_WINDOW_SECONDS}

    bucket["count"] += 1
    _rate_limit_bucket[ip_key] = bucket

    if bucket["count"] > RATE_LIMIT:
        retry_after = max(1, int(bucket["reset"] - now))
        response = jsonify(
            {"error": "Too many requests", "retry_after": retry_after, "hint": "Slow down your scans or wait a minute."}
        )
        response.status_code = 429
        response.headers["Retry-After"] = str(retry_after)
        return response


@app.after_request
def apply_security_headers(response):
    """Apply security headers and merge CORS headers for /api/* routes."""
    # Preserve existing security headers
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' https://ipinfo.io; "
        "frame-ancestors 'none';"
    )
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=()"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    
    # Add CORS headers for /api/* routes (merge with existing, don't overwrite)
    if request.path.startswith("/api/"):
        origin = request.headers.get("Origin", "")
        
        # Determine allowed origin: echo request origin if in ALLOWED_ORIGINS, otherwise use first allowed or "*"
        if origin in ALLOWED_ORIGINS:
            allow_origin = origin
        elif ALLOWED_ORIGINS:
            allow_origin = ALLOWED_ORIGINS[0]
        else:
            allow_origin = "*"
        
        # Merge CORS headers (don't overwrite if flask_cors already set them)
        if "Access-Control-Allow-Origin" not in response.headers:
            response.headers["Access-Control-Allow-Origin"] = allow_origin
        if "Access-Control-Allow-Methods" not in response.headers:
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        if "Access-Control-Allow-Headers" not in response.headers:
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        if "Access-Control-Allow-Credentials" not in response.headers:
            response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# Secret key (for future JWT or sessions)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

# ------------------------------
# 🔹 Initialize Firebase Firestore
# ------------------------------
try:
    cred = credentials.Certificate("firebase-key.json")  # path to your key file
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase Firestore successfully.")
except Exception as e:
    print("❌ Firebase initialization failed:", e)
    db = None

# ------------------------------
# 🔹 Basic Route
# ------------------------------
@app.route("/")
def home():
    return jsonify({"message": "CyberSec Toolkit Pro API running!"})

# ------------------------------
# 🔹 Reconnaissance Routes
# ------------------------------
@app.route("/api/recon/ipinfo", methods=["POST"])
def ip_info():
    """Fetch IP information using ipinfo.io API."""
    try:
        body = request.get_json(silent=True) or {}
        ip_candidate = sanitize_ip_value(body.get("ip"))
        if not ip_candidate:
            return jsonify({"error": "Please provide a valid IP address (IPv4 or IPv6)"}), 400

        res = requests.get(f"https://ipinfo.io/{ip_candidate}/json", timeout=10)
        res.raise_for_status()
        return jsonify(res.json()), res.status_code
    except requests.RequestException as e:
        return jsonify({"error": f"Unable to fetch IP information: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/recon/whois", methods=["POST"])
def whois_lookup():
    """Perform WHOIS lookup for a domain."""
    try:
        body = request.get_json(silent=True) or {}
        domain = sanitize_hostname(body.get("domain"))
        if not domain:
            return jsonify({"error": "Please provide a valid domain name (e.g., example.com)"}), 400

        w = whois.whois(domain)
        # Convert whois result to JSON-serializable format
        safe_result = {}
        for k, v in dict(w).items():
            try:
                if isinstance(v, (list, tuple)):
                    safe_result[k] = [str(i) for i in v]
                elif v is None:
                    safe_result[k] = None
                else:
                    safe_result[k] = str(v)
            except Exception:
                safe_result[k] = "N/A"
        return jsonify(safe_result)
    except whois.parser.PywhoisError as e:
        return jsonify({"error": f"WHOIS lookup failed: {str(e)}"}), 404
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route("/api/recon/dns", methods=["POST"])
def dns_lookup():
    """Perform DNS lookup for a domain."""
    try:
        body = request.get_json(silent=True) or {}
        domain = sanitize_hostname(body.get("domain"))
        if not domain:
            return jsonify({"error": "Please provide a valid domain name (e.g., example.com)"}), 400

        record_types = ["A", "MX", "NS", "TXT", "CNAME"]
        result = {}
        errors = []
        for rtype in record_types:
            try:
                answers = dns.resolver.resolve(domain, rtype, lifetime=5)
                result[rtype] = [str(rdata) for rdata in answers]
            except dns.resolver.NXDOMAIN:
                result[rtype] = []
                errors.append(f"{rtype}: Domain not found")
            except dns.resolver.NoAnswer:
                result[rtype] = []
            except dns.resolver.Timeout:
                result[rtype] = []
                errors.append(f"{rtype}: Query timeout")
            except Exception as e:
                result[rtype] = []
                errors.append(f"{rtype}: {str(e)}")
        
        if errors:
            result["_warnings"] = errors
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"DNS lookup failed: {str(e)}"}), 500


# ------------------------------
# 🔹 Subdomain Finder Cache & Helpers
# ------------------------------
CACHE_DIR = "cache"
CACHE_FILE = os.path.join(CACHE_DIR, "subdomain_cache.json")
CACHE_DURATION_HOURS = 24

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

def load_cache():
    """Load cache from JSON file."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache_data):
    """Save cache to JSON file."""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save cache: {e}")

def is_cache_valid(timestamp_str):
    """Check if cache entry is still valid (within 24 hours)."""
    try:
        cached_time = datetime.fromisoformat(timestamp_str)
        return datetime.now() - cached_time < timedelta(hours=CACHE_DURATION_HOURS)
    except Exception:
        return False

# Hostname validation regex (RFC 1123 compliant, case-insensitive)
HOSTNAME_REGEX = re.compile(
    r'^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$',
    re.IGNORECASE
)

def extract_and_clean_subdomains(raw_data, domain):
    """Extract and clean subdomains from crt.sh data."""
    raw_candidates = set()
    cleaned_subdomains = {}
    
    # Extract all name_value fields from crt.sh results
    for entry in raw_data:
        name_value = entry.get("name_value", "").strip()
        if not name_value:
            continue
        
        # Split by newlines (crt.sh returns multiple domains per entry)
        for line in name_value.split("\n"):
            line = line.strip()
            if not line:
                continue
            
            raw_candidates.add(line)
            
            # Skip entries with obvious issues
            if " " in line or "@" in line or " - " in line:
                print(f"  [LOG] Discarded invalid entry: {line[:80]}")
                continue
            
            # Normalize: lowercase, trim spaces and trailing dots
            normalized = line.lower().strip().rstrip(".")
            
            # Handle wildcard entries
            is_wildcard = False
            if normalized.startswith("*."):
                is_wildcard = True
                # Keep the wildcard prefix in the host field
                host_value = normalized
                # For validation, check the domain part without "*."
                normalized_for_check = normalized[2:]
            else:
                host_value = normalized
                normalized_for_check = normalized
            
            # Validate with regex (skip wildcard prefix for validation)
            if not HOSTNAME_REGEX.match(normalized_for_check):
                print(f"  [LOG] Discarded non-hostname pattern: {normalized[:80]}")
                continue
            
            # Ensure it's a subdomain of the target domain
            domain_lower = domain.lower()
            if normalized_for_check != domain_lower and not normalized_for_check.endswith("." + domain_lower):
                print(f"  [LOG] Discarded non-subdomain: {normalized[:80]}")
                continue
            
            # Deduplicate by hostname (use the full host value including wildcard)
            if host_value not in cleaned_subdomains:
                cleaned_subdomains[host_value] = {
                    "host": host_value,
                    "wildcard": is_wildcard,
                    "resolves": False,
                    "records": [],
                    "confidence": "medium"
                }
    
    return len(raw_candidates), cleaned_subdomains

def verify_dns(hostname, timeout=0.5):
    """Verify DNS resolution for a hostname. Returns (resolves, records)."""
    records = []
    resolves = False
    
    # Skip wildcard entries for DNS verification
    if hostname.startswith("*."):
        return False, []
    
    try:
        resolver = dns.resolver.Resolver()
        resolver.timeout = timeout
        resolver.lifetime = timeout
        
        # Try A record
        try:
            answers = resolver.resolve(hostname, 'A')
            records.append('A')
            resolves = True
        except Exception:
            pass
        
        # Try AAAA record
        try:
            answers = resolver.resolve(hostname, 'AAAA')
            if 'AAAA' not in records:
                records.append('AAAA')
            resolves = True
        except Exception:
            pass
        
        # Try CNAME record
        try:
            answers = resolver.resolve(hostname, 'CNAME')
            if 'CNAME' not in records:
                records.append('CNAME')
            resolves = True
        except Exception:
            pass
            
    except Exception:
        pass
    
    return resolves, records

def calculate_confidence(resolves, hostname):
    """Calculate confidence score for a subdomain."""
    # Wildcards are always medium confidence (found in CT but can't verify via DNS)
    if hostname.startswith("*."):
        return "medium"
    
    if resolves:
        return "high"
    
    # Check for anomalies
    labels = hostname.split(".")
    if len(labels) > 0:
        first_label = labels[0]
        # Numeric-only label might be less reliable
        if first_label.isdigit():
            return "low"
    
    # Default to medium if found in CT logs but doesn't resolve
    return "medium"

@app.route("/api/recon/subdomains", methods=["POST"])
def subdomain_finder_enhanced():
    """Enhanced subdomain finder with cleaning, DNS verification, and confidence scoring."""
    try:
        data = request.get_json(silent=True) or {}
        domain = (data.get("domain") or "").strip().lower()
        
        if not domain:
            return jsonify({"error": "Please provide a valid domain name (e.g., example.com)"}), 400
        
        # Validate domain format
        sanitized_domain = sanitize_hostname(domain)
        if not sanitized_domain:
            return jsonify({"error": "Invalid domain format. Please provide a valid domain name."}), 400
        domain = sanitized_domain
        
        # Remove protocol if present
        domain = domain.replace("http://", "").replace("https://", "").split("/")[0]
        domain = domain.split(":")[0]  # Remove port if present
        
        # Check cache first
        cache = load_cache()
        cache_key = f"subdomains_{domain}"
        
        if cache_key in cache:
            cached_entry = cache[cache_key]
            if is_cache_valid(cached_entry.get("timestamp", "")):
                print(f"  [LOG] Returning cached results for {domain}")
                return jsonify(cached_entry["data"])
        
        # Fetch from crt.sh
        print(f"  [LOG] Fetching subdomains for {domain} from crt.sh...")
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        
        try:
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            raw_data = resp.json()
        except Exception as e:
            print(f"  [LOG] Error fetching from crt.sh: {e}")
            return jsonify({
                "domain": domain,
                "total_raw": 0,
                "total_clean": 0,
                "subdomains": [],
                "error": f"Failed to fetch from crt.sh: {str(e)}"
            }), 500
        
        # Extract and clean subdomains
        total_raw, cleaned_subdomains = extract_and_clean_subdomains(raw_data, domain)
        print(f"  [LOG] Found {total_raw} raw candidates, {len(cleaned_subdomains)} after cleaning")
        
        # DNS verification with threading (max 10 concurrent)
        print(f"  [LOG] Verifying DNS for {len(cleaned_subdomains)} subdomains...")
        subdomain_list = list(cleaned_subdomains.values())
        
        def verify_one(subdomain_info):
            hostname = subdomain_info["host"]
            resolves, records = verify_dns(hostname, timeout=0.5)
            subdomain_info["resolves"] = resolves
            subdomain_info["records"] = records
            subdomain_info["confidence"] = calculate_confidence(resolves, hostname)
            return subdomain_info
        
        # Use ThreadPoolExecutor with max 10 workers
        verified_subdomains = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_subdomain = {
                executor.submit(verify_one, subdomain): subdomain 
                for subdomain in subdomain_list
            }
            
            for future in as_completed(future_to_subdomain):
                try:
                    verified_subdomains.append(future.result())
                except Exception as e:
                    print(f"  [LOG] Error verifying subdomain: {e}")
        
        # Sort by hostname for consistent output
        verified_subdomains.sort(key=lambda x: x["host"])
        
        # Build response
        response_data = {
            "domain": domain,
            "total_raw": total_raw,
            "total_clean": len(verified_subdomains),
            "subdomains": verified_subdomains
        }
        
        # Cache the results
        cache[cache_key] = {
            "timestamp": datetime.now().isoformat(),
            "data": response_data
        }
        save_cache(cache)
        
        print(f"  [LOG] Completed: {len(verified_subdomains)} clean subdomains found")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"  [LOG] Error in subdomain finder: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ------------------------------
# 🔹 Tools Routes (Port Scanner)
# ------------------------------
COMMON_PORTS = [22, 80, 443, 8080, 3306]


def _is_port_open(host: str, port: int, timeout_seconds: float = 0.5) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout_seconds)
    try:
        result = s.connect_ex((host, port))
        return result == 0
    except Exception:
        return False
    finally:
        try:
            s.close()
        except Exception:
            pass


@app.route("/api/tools/portscan", methods=["POST"])
def portscan():
    data = request.get_json(silent=True) or {}
    target = (data.get("target") or data.get("host") or "").strip()
    ports = data.get("ports")

    if not target:
        return jsonify({"error": "Missing 'target' (hostname or IP)"}), 400

    allowed = set(COMMON_PORTS)
    if isinstance(ports, list) and ports:
        try:
            requested = {int(p) for p in ports}
            port_list = sorted(list(requested & allowed))
        except Exception:
            port_list = COMMON_PORTS
    else:
        port_list = COMMON_PORTS

    results = {}
    for p in port_list:
        open_flag = _is_port_open(target, p, timeout_seconds=0.5)
        results[str(p)] = "open" if open_flag else "closed"

    return jsonify({
        "target": target,
        "ports": port_list,
        "results": results
    })


# ------------------------------
# 🔹 Tools Routes (Hash Generator)
# ------------------------------
ALLOWED_HASH_ALGS = {
    "md5": hashlib.md5,
    "sha1": hashlib.sha1,
    "sha224": hashlib.sha224,
    "sha256": hashlib.sha256,
    "sha384": hashlib.sha384,
    "sha512": hashlib.sha512,
}


@app.route("/api/tools/hash", methods=["POST"])
def generate_hash():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    alg = (data.get("alg") or "sha256").lower()

    if not isinstance(text, str):
        return jsonify({"error": "'text' must be a string"}), 400

    if alg not in ALLOWED_HASH_ALGS:
        return jsonify({
            "error": "Unsupported algorithm",
            "allowed": sorted(list(ALLOWED_HASH_ALGS.keys()))
        }), 400

    hasher = ALLOWED_HASH_ALGS[alg]()
    hasher.update(text.encode("utf-8"))
    digest = hasher.hexdigest()

    return jsonify({
        "alg": alg,
        "text_len": len(text),
        "hash": digest
    })

# ------------------------------
# 🔹 Tools Routes (CVE Lookup)
# ------------------------------
@app.route("/api/tools/cve", methods=["GET"])
def cve_lookup():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "Missing 'query'"}), 400

    # Check for NVD API key
    nvd_api_key = os.getenv("NVD_API_KEY")
    
    # Check local cache first
    cache_file = os.path.join(CACHE_DIR, "cve_snippets.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
                # Simple fuzzy matching on query
                query_lower = query.lower()
                for cached_query, cached_results in cache_data.items():
                    if query_lower in cached_query.lower() or cached_query.lower() in query_lower:
                        return jsonify({
                            "query": query, 
                            "count": len(cached_results), 
                            "results": cached_results, 
                            "cached": True,
                            "source": "local_cache"
                        })
        except:
            pass

    # Use NVD public endpoint (rate-limited without key, better with key)
    nvd_url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    params = {
        "keywordSearch": query,
        "resultsPerPage": 10,
    }
    
    headers = {}
    if nvd_api_key:
        headers["apiKey"] = nvd_api_key

    try:
        resp = requests.get(nvd_url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        payload = resp.json()
        items = []
        for vuln in payload.get("vulnerabilities", [])[:10]:
            cve = vuln.get("cve", {})
            cve_id = cve.get("id")
            descriptions = cve.get("descriptions", [])
            desc = next((d.get("value") for d in descriptions if d.get("lang") == "en"), None) or (
                descriptions[0].get("value") if descriptions else ""
            )
            
            # Extract CVSS scores
            metrics = cve.get("metrics", {})
            cvss_v3 = metrics.get("cvssMetricV31") or metrics.get("cvssMetricV30") or metrics.get("cvssMetricV2")
            cvss_score = None
            if cvss_v3 and isinstance(cvss_v3, list) and cvss_v3:
                cvss_data = cvss_v3[0].get("cvssData", {})
                cvss_score = cvss_data.get("baseScore")
            
            severity = "Unknown"
            if cvss_score is not None:
                if cvss_score >= 9:
                    severity = "Critical"
                elif cvss_score >= 7:
                    severity = "High"
                elif cvss_score >= 4:
                    severity = "Medium"
                else:
                    severity = "Low"
            
            items.append({
                "id": cve_id,
                "cve_id": cve_id,
                "published": cve.get("published"),
                "lastModified": cve.get("lastModified"),
                "description": desc,
                "summary": desc,
                "cvss_v3_score": cvss_score,
                "severity": severity,
                "references": cve.get("references", []),
                "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}" if cve_id else None,
            })
        return jsonify({
            "query": query, 
            "count": len(items), 
            "results": items,
            "source": "nvd_api" if nvd_api_key else "nvd_public"
        })
    except requests.RequestException as exc:
        # Fallback stub on network error
        return jsonify({
            "query": query,
            "count": 0,
            "results": [],
            "source": "fallback",
            "warning": f"CVE lookup failed: {str(exc)}. Configure NVD API key or use local dataset for better reliability."
        }), 502

# ------------------------------
# 🔹 Tools Routes (Subdomain Finder)
# ------------------------------
@app.route("/api/tools/subdomain", methods=["POST"])
def subdomain_finder():
    data = request.get_json(silent=True) or {}
    domain = sanitize_hostname(data.get("domain"))
    
    if not domain:
        return jsonify({"error": "Missing or invalid 'domain'"}), 400
    
    # Use crt.sh API for subdomain enumeration
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        results = resp.json()
        
        # Extract unique subdomains
        subdomains = set()
        for entry in results[:100]:  # Limit to 100 results
            name = entry.get("name_value", "").strip()
            if name and domain in name:
                subdomains.add(name.split("\n")[0].lower())
        
        return jsonify({
            "domain": domain,
            "count": len(subdomains),
            "subdomains": sorted(list(subdomains))
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# 🔹 SSL Certificate Checker (Robust Implementation)
# ------------------------------
# In-memory cache for SSL checks (10 min TTL)
_ssl_cache = {}
_ssl_cache_ttl = 600  # 10 minutes

def parse_certificate(cert_der):
    """Parse certificate using cryptography library. Returns dict with parsed fields."""
    errors = []
    result = {
        "issuer": None,
        "subject": None,
        "serial": None,
        "signature_algorithm": None,
        "san": [],
        "not_before": None,
        "not_after": None,
    }
    
    if not CRYPTOGRAPHY_AVAILABLE:
        errors.append("cryptography package not available")
        result["errors"] = errors
        return result
    
    try:
        cert_obj = x509.load_der_x509_certificate(cert_der, default_backend())
        
        # Extract issuer
        try:
            issuer_parts = []
            for attr in cert_obj.issuer:
                issuer_parts.append(f"{attr.oid._name}={attr.value}")
            result["issuer"] = ", ".join(issuer_parts)
        except Exception as e:
            errors.append(f"Issuer parse error: {str(e)}")
        
        # Extract subject
        try:
            subject_parts = []
            for attr in cert_obj.subject:
                subject_parts.append(f"{attr.oid._name}={attr.value}")
            result["subject"] = ", ".join(subject_parts)
        except Exception as e:
            errors.append(f"Subject parse error: {str(e)}")
        
        # Extract serial
        try:
            result["serial"] = hex(cert_obj.serial_number)[2:].upper()
        except Exception as e:
            errors.append(f"Serial parse error: {str(e)}")
        
        # Extract signature algorithm
        try:
            sig_oid = cert_obj.signature_algorithm_oid
            result["signature_algorithm"] = sig_oid._name if hasattr(sig_oid, '_name') else str(sig_oid)
        except Exception as e:
            errors.append(f"Signature algorithm parse error: {str(e)}")
        
        # Extract SANs
        try:
            san_ext = cert_obj.extensions.get_extension_for_oid(x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            result["san"] = [str(name.value) for name in san_ext.value if hasattr(name, 'value')]
        except x509.ExtensionNotFound:
            pass  # No SAN extension is fine
        except Exception as e:
            errors.append(f"SAN parse error: {str(e)}")
        
        # Extract dates
        try:
            result["not_before"] = cert_obj.not_valid_before.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')
        except Exception as e:
            errors.append(f"NotBefore parse error: {str(e)}")
        
        try:
            result["not_after"] = cert_obj.not_valid_after.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')
        except Exception as e:
            errors.append(f"NotAfter parse error: {str(e)}")
        
    except Exception as e:
        errors.append(f"Certificate parse error: {str(e)}")
    
    result["errors"] = errors
    return result

@app.route("/api/ssl/check", methods=["POST"])
def ssl_check_robust():
    """Robust SSL certificate checker with full parsing and error handling."""
    data = request.get_json(silent=True) or {}
    host_input = (data.get("host") or data.get("domain") or "").strip()
    port = int(data.get("port") or 443)
    
    # Validate host
    if not host_input:
        return jsonify({"error": "Missing 'host' field"}), 400
    
    # Parse host:port if provided
    if ":" in host_input:
        parts = host_input.rsplit(":", 1)
        host = parts[0]
        try:
            port = int(parts[1])
        except ValueError:
            return jsonify({"error": f"Invalid port in host:port format"}), 400
    else:
        host = host_input
    
    # Validate hostname
    host = sanitize_hostname(host)
    if not host:
        return jsonify({"error": "Invalid hostname format"}), 400
    
    # Check cache
    cache_key = f"{host}:{port}"
    now = time.time()
    if cache_key in _ssl_cache:
        cached_entry = _ssl_cache[cache_key]
        if now - cached_entry["timestamp"] < _ssl_cache_ttl:
            print(f"  [SSL] Cache hit for {cache_key}")
            return jsonify(cached_entry["data"])
    
    # Initialize result
    result = {
        "domain": host,
        "port": port,
        "valid": False,
        "chain_valid": None,
        "days_remaining": None,
        "issued": None,
        "expires": None,
        "issuer": None,
        "subject": None,
        "serial": None,
        "signature_algorithm": None,
        "san": [],
        "raw_chain_pems": [],
        "errors": [],
    }
    
    # Check if chain validation is enabled
    validate_chains = os.getenv("SSL_VALIDATE_CHAINS", "false").lower() == "true"
    
    try:
        # Create SSL context for fetching (no verification to get certs)
        fetch_context = ssl.create_default_context()
        fetch_context.check_hostname = False
        fetch_context.verify_mode = ssl.CERT_NONE
        
        # Create connection with timeout
        print(f"  [SSL] Connecting to {host}:{port}...")
        sock = socket.create_connection((host, port), timeout=6)
        
        try:
            # Wrap socket with SSL using SNI
            with fetch_context.wrap_socket(sock, server_hostname=host) as ssock:
                # Get leaf certificate
                cert_der = ssock.getpeercert(binary_form=True)
                
                # Parse certificate
                parsed = parse_certificate(cert_der)
                result.update(parsed)
                
                # Get chain if available
                try:
                    chain = ssock.getpeercert_chain()
                    if chain:
                        for chain_cert in chain:
                            if chain_cert:
                                # Convert DER to PEM for chain
                                pem = "-----BEGIN CERTIFICATE-----\n"
                                pem += base64.b64encode(chain_cert).decode('ascii')
                                pem += "\n-----END CERTIFICATE-----\n"
                                result["raw_chain_pems"].append(pem)
                except Exception as e:
                    result["errors"].append(f"Chain extraction error: {str(e)}")
                
                # Perform chain validation if enabled
                if validate_chains:
                    try:
                        verify_context = ssl.create_default_context()
                        verify_sock = socket.create_connection((host, port), timeout=6)
                        try:
                            with verify_context.wrap_socket(verify_sock, server_hostname=host) as verify_ssock:
                                result["chain_valid"] = True
                        except ssl.SSLError as e:
                            result["chain_valid"] = False
                            result["errors"].append(f"Chain validation failed: {str(e)}")
                        finally:
                            verify_sock.close()
                    except Exception as e:
                        result["chain_valid"] = False
                        result["errors"].append(f"Chain validation error: {str(e)}")
                
        finally:
            sock.close()
        
        # Compute validity and days remaining
        if parsed["not_after"]:
            try:
                expires_dt = datetime.fromisoformat(parsed["not_after"].replace('Z', '+00:00'))
                now_dt = datetime.now(timezone.utc)
                result["valid"] = now_dt < expires_dt
                delta = expires_dt - now_dt
                result["days_remaining"] = delta.days
            except Exception as e:
                result["errors"].append(f"Date calculation error: {str(e)}")
        
        # Cache result
        _ssl_cache[cache_key] = {
            "timestamp": now,
            "data": result,
        }
        
        # Clean old cache entries
        if len(_ssl_cache) > 100:
            _ssl_cache.clear()
        
        # Return 200 even if cert expired (data is valid)
        return jsonify(result), 200
        
    except socket.timeout:
        print(f"  [SSL] Timeout connecting to {host}:{port}")
        return jsonify({
            "error": "Connection timed out",
            "domain": host,
            "port": port,
        }), 504
    except socket.gaierror as e:
        print(f"  [SSL] DNS resolution failed for {host}: {e}")
        return jsonify({
            "error": f"DNS resolution failed: {str(e)}",
            "domain": host,
            "port": port,
        }), 400
    except ssl.SSLError as e:
        print(f"  [SSL] SSL error for {host}:{port}: {e}")
        result["errors"].append(f"SSL handshake error: {str(e)}")
        return jsonify(result), 422
    except Exception as e:
        print(f"  [SSL] Unexpected error for {host}:{port}: {e}")
        import traceback
        traceback.print_exc()
        result["errors"].append(f"Unexpected error: {str(e)}")
        return jsonify(result), 422

# Keep old endpoint for backward compatibility
@app.route("/api/tools/ssl", methods=["POST"])
def ssl_checker():
    """Legacy SSL endpoint - redirects to new robust endpoint."""
    data = request.get_json(silent=True) or {}
    domain = data.get("domain") or data.get("host")
    if domain:
        return ssl_check_robust()
    return jsonify({"error": "Missing 'domain' or 'host'"}), 400

# ------------------------------
# 🔹 Tools Routes (HTTP Header Analyzer)
# ------------------------------
@app.route("/api/tools/headers", methods=["POST"])
def header_analyzer():
    data = request.get_json(silent=True) or {}
    url = sanitize_url_value(data.get("url"))
    
    if not url:
        return jsonify({"error": "Missing or invalid 'url'"}), 400
    
    try:
        resp = requests.get(url, timeout=10, allow_redirects=True)
        headers = dict(resp.headers)
        
        # Security headers check
        security_headers = {
            "X-Frame-Options": headers.get("X-Frame-Options", "Missing"),
            "X-Content-Type-Options": headers.get("X-Content-Type-Options", "Missing"),
            "Strict-Transport-Security": headers.get("Strict-Transport-Security", "Missing"),
            "Content-Security-Policy": headers.get("Content-Security-Policy", "Missing"),
            "X-XSS-Protection": headers.get("X-XSS-Protection", "Missing"),
        }
        
        return jsonify({
            "url": url,
            "status_code": resp.status_code,
            "headers": headers,
            "security_headers": security_headers,
            "server": headers.get("Server", "Unknown"),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# 🔹 Tools Routes (Email Breach Checker)
# ------------------------------
@app.route("/api/tools/breach", methods=["POST"])
def breach_checker():
    data = request.get_json(silent=True) or {}
    email = sanitize_email_value(data.get("email"))
    
    if not email:
        return jsonify({"error": "Missing or invalid 'email'"}), 400
    
    # Check for HIBP API key
    hibp_api_key = os.getenv("HIBP_API_KEY")
    
    if hibp_api_key:
        # Use HIBP API v3 for full email breach check
        try:
            url = "https://haveibeenpwned.com/api/v3/breachedaccount/" + email
            headers = {"hibp-api-key": hibp_api_key, "User-Agent": "CyberSec-Toolkit-Pro"}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                breaches = resp.json()
                return jsonify({
                    "email": email,
                    "breached": True,
                    "breach_count": len(breaches),
                    "breaches": breaches,
                    "source": "hibp_v3"
                })
            elif resp.status_code == 404:
                return jsonify({
                    "email": email,
                    "breached": False,
                    "breach_count": 0,
                    "breaches": [],
                    "source": "hibp_v3"
                })
            else:
                # API error, fall through to fallback
                pass
        except Exception as e:
            # Fall through to fallback
            pass
    
    # Fallback: Use simplified check (password API - not ideal for emails)
    try:
        # Hash email with SHA-1 (first 5 chars for k-anonymity)
        import hashlib
        email_hash = hashlib.sha1(email.encode()).hexdigest().upper()
        prefix = email_hash[:5]
        suffix = email_hash[5:]
        
        # Check against HIBP range API (password API, not ideal for emails)
        url = f"https://api.pwnedpasswords.com/range/{prefix}"
        resp = requests.get(url, timeout=10)
        
        breaches = []
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                if suffix in line:
                    breaches.append({"hash_suffix": line.split(":")[0], "count": int(line.split(":")[1])})
        
        return jsonify({
            "email": email,
            "breached": len(breaches) > 0,
            "breach_count": len(breaches),
            "breaches": breaches if breaches else [],
            "source": "fallback",
            "note": "Running in fallback mode. Configure HIBP API v3 key for full email breach data."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# 🔹 Tools Routes (AI Risk Analyzer)
# ------------------------------
@app.route("/api/tools/risk-analyzer", methods=["POST"])
def risk_analyzer():
    data = request.get_json(silent=True) or {}
    target = (data.get("target") or "").strip()
    scan_data = data.get("scan_data", {})
    
    if not target:
        return jsonify({"error": "Missing 'target'"}), 400
    
    # Build explainable factors array
    factors = []
    base_score = 50
    
    # Analyze open ports
    open_ports = scan_data.get("open_ports", [])
    if open_ports:
        port_delta = len(open_ports) * 10
        factors.append({
            "factor": "Open ports detected",
            "details": f"{len(open_ports)} open ports: {', '.join(map(str, open_ports[:5]))}",
            "score_delta": port_delta,
            "severity": "Medium" if len(open_ports) <= 3 else "High"
        })
        base_score += port_delta
    
    # Analyze SSL validity
    if scan_data.get("ssl_valid") == False:
        factors.append({
            "factor": "Invalid or expired SSL certificate",
            "details": "SSL certificate is invalid, expired, or misconfigured",
            "score_delta": 20,
            "severity": "High"
        })
        base_score += 20
    
    # Analyze security headers
    security_headers_missing = scan_data.get("security_headers_missing", [])
    if security_headers_missing:
        factors.append({
            "factor": "Missing security headers",
            "details": f"Missing: {', '.join(security_headers_missing[:3])}",
            "score_delta": 15,
            "severity": "Medium"
        })
        base_score += 15
    
    # Analyze CVE vulnerabilities
    cve_count = scan_data.get("cve_count", 0)
    if cve_count > 0:
        critical_cves = scan_data.get("critical_cves", 0)
        if critical_cves > 0:
            factors.append({
                "factor": "Critical CVEs detected",
                "details": f"{critical_cves} critical CVEs found",
                "score_delta": 25,
                "severity": "Critical"
            })
            base_score += 25
        else:
            factors.append({
                "factor": "CVEs detected",
                "details": f"{cve_count} CVEs found",
                "score_delta": 10,
                "severity": "Medium"
            })
            base_score += 10
    
    # Normalize score
    risk_score = min(100, max(0, base_score))
    threat_level = "Low" if risk_score < 40 else "Medium" if risk_score < 70 else "High" if risk_score < 90 else "Critical"
    
    # Generate recommendations based on factors
    recommendations = []
    if open_ports:
        recommendations.append("Close unnecessary ports and restrict access to required services only")
    if scan_data.get("ssl_valid") == False:
        recommendations.append("Renew or fix SSL certificate configuration")
    if security_headers_missing:
        recommendations.append("Implement missing security headers (HSTS, CSP, X-Frame-Options, etc.)")
    if cve_count > 0:
        recommendations.append("Patch or mitigate identified CVEs immediately")
    if not recommendations:
        recommendations.append("Ensure all services are up to date")
        recommendations.append("Use strong SSL/TLS configuration")
        recommendations.append("Implement security headers")
    
    # Build structured target object
    target_obj = {
        "value": target,
        "type": "domain" if "." in target and not target.replace(".", "").replace(":", "").isdigit() else "ip"
    }
    
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if openai_key:
        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)
            
            prompt = f"""Analyze the security posture of {target} based on this scan data:
{json.dumps(scan_data, indent=2)}

Provide a risk score (0-100), threat level (Low/Medium/High/Critical), and 3-5 key security recommendations.
Format as JSON: {{"risk_score": number, "threat_level": "string", "recommendations": ["string"], "factors": [{{"factor": "string", "score_delta": number, "severity": "string"}}]}}"""
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            # Try to parse JSON from response
            try:
                import re
                json_match = re.search(r'\{.*\}', answer, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                    return jsonify({
                        "target": target_obj,
                        "source": "openai",
                        "generated_at": datetime.utcnow().isoformat() + "Z",
                        "risk_score": parsed.get("risk_score", risk_score),
                        "threat_level": parsed.get("threat_level", threat_level),
                        "recommendations": parsed.get("recommendations", recommendations),
                        "factors": parsed.get("factors", factors)
                    })
            except:
                pass
            
            return jsonify({
                "target": target_obj,
                "source": "openai",
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "risk_score": risk_score,
                "threat_level": threat_level,
                "recommendations": recommendations,
                "factors": factors,
                "analysis": answer
            })
        except ImportError:
            pass
        except Exception as e:
            pass
    
    # Fallback analysis with explainable factors
    return jsonify({
        "target": target_obj,
        "source": "fallback",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "risk_score": risk_score,
        "threat_level": threat_level,
        "recommendations": recommendations,
        "factors": factors
    })

# ------------------------------
# 🔹 Firebase Report Routes
# ------------------------------
@app.route("/api/reports", methods=["POST"])
def create_report():
    """Save a scan report to Firebase Firestore with idempotency and enhanced error handling."""
    if db is None:
        return jsonify({"error": "Firebase not connected"}), 500

    try:
        data = request.json or {}
        title = data.get("title", "Untitled Scan")
        report_data = data.get("data", {})
        client_id = data.get("client_id")  # UUID for idempotency
        user_id_from_payload = data.get("user_id")  # Optional user_id from client

        # Get user ID from auth token if available (preferred over payload)
        user_id = None
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if token and db is not None:
                decoded = firebase_auth.verify_id_token(token)
                user_id = decoded.get("uid")
                print(f"  [LOG] Verified user from token: {user_id}")
        except Exception as e:
            print(f"  [LOG] Token verification failed (non-fatal): {e}")
            # Fall back to user_id from payload if provided
            if user_id_from_payload:
                user_id = user_id_from_payload

        # Check for duplicate if client_id provided (idempotency)
        if client_id:
            try:
                # Query Firestore for existing report with same client_id
                existing = db.collection("reports").where("client_id", "==", client_id).limit(1).stream()
                for doc in existing:
                    existing_data = doc.to_dict()
                    print(f"  [LOG] Found existing report with client_id {client_id}, returning existing")
                    return jsonify({
                        "id": doc.id,
                        "saved": True,
                        "message": "Report already exists (idempotent)",
                        "created_at": existing_data.get("created_at"),
                        "updated_at": existing_data.get("updated_at"),
                    }), 200
            except Exception as e:
                print(f"  [LOG] Error checking for duplicate: {e}")

        # Extract threat_level and risk_score from report_data for dashboard metrics
        threat_level = "Low"
        risk_score = 0
        
        if isinstance(report_data, dict):
            # Check if risk analysis data exists
            risk_data = report_data.get("result", {})
            if isinstance(risk_data, dict):
                threat_level = risk_data.get("threat_level", "Low")
                risk_score = risk_data.get("risk_score", 0)
            
            # Also check direct fields in report_data
            if "threat_level" in report_data:
                threat_level = report_data.get("threat_level", "Low")
            if "risk_score" in report_data:
                risk_score = report_data.get("risk_score", 0)

        # Create new report
        now_iso = datetime.utcnow().isoformat() + "Z"
        payload = {
            "title": title,
            "data": report_data,
            "userId": user_id,
            "client_id": client_id,  # Store client_id for idempotency
            "threat_level": threat_level,  # Top-level field for dashboard
            "risk_score": risk_score,  # Top-level field for dashboard
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        try:
            doc_ref = db.collection("reports").add(payload)
            report_id = doc_ref[1].id
            print(f"  [LOG] Report saved successfully: {report_id}")
            
            return jsonify({
                "id": report_id,
                "saved": True,
                "message": "Report saved successfully",
                "created_at": payload["created_at"],
                "updated_at": payload["updated_at"],
            }), 201
        except Exception as e:
            print(f"  [LOG] Firestore save error: {e}")
            # Retry once for transient failures
            try:
                doc_ref = db.collection("reports").add(payload)
                report_id = doc_ref[1].id
                print(f"  [LOG] Report saved on retry: {report_id}")
                return jsonify({
                    "id": report_id,
                    "saved": True,
                    "message": "Report saved successfully (retry)",
                    "created_at": payload["created_at"],
                    "updated_at": payload["updated_at"],
                }), 201
            except Exception as retry_error:
                print(f"  [LOG] Retry also failed: {retry_error}")
                raise retry_error

    except Exception as e:
        print(f"  [LOG] Fatal error in create_report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "saved": False}), 500


@app.route("/api/reports/batch", methods=["POST"])
def create_reports_batch():
    """Batch save multiple reports (for syncing queued reports from client)."""
    if db is None:
        return jsonify({"error": "Firebase not connected"}), 500

    try:
        data = request.json or {}
        reports = data.get("reports", [])
        
        if not isinstance(reports, list):
            return jsonify({"error": "Expected 'reports' array"}), 400
        
        if len(reports) == 0:
            return jsonify({"error": "Empty reports array"}), 400
        
        # Get user ID from auth token if available
        user_id = None
        try:
            token = request.headers.get("Authorization", "").replace("Bearer ", "")
            if token and db is not None:
                decoded = firebase_auth.verify_id_token(token)
                user_id = decoded.get("uid")
        except:
            pass

        results = []
        now_iso = datetime.utcnow().isoformat() + "Z"
        
        for report_data in reports:
            try:
                title = report_data.get("title", "Untitled Scan")
                data_payload = report_data.get("data", {})
                client_id = report_data.get("client_id")
                
                # Check for duplicate
                if client_id:
                    existing = db.collection("reports").where("client_id", "==", client_id).limit(1).stream()
                    found_existing = False
                    for doc in existing:
                        results.append({
                            "client_id": client_id,
                            "id": doc.id,
                            "saved": True,
                            "status": "duplicate"
                        })
                        found_existing = True
                        break
                    if found_existing:
                        continue
                
                # Extract threat_level and risk_score from data_payload
                threat_level = "Low"
                risk_score = 0
                
                if isinstance(data_payload, dict):
                    risk_data = data_payload.get("result", {})
                    if isinstance(risk_data, dict):
                        threat_level = risk_data.get("threat_level", "Low")
                        risk_score = risk_data.get("risk_score", 0)
                    if "threat_level" in data_payload:
                        threat_level = data_payload.get("threat_level", "Low")
                    if "risk_score" in data_payload:
                        risk_score = data_payload.get("risk_score", 0)
                
                # Create new report
                payload = {
                    "title": title,
                    "data": data_payload,
                    "userId": user_id or report_data.get("user_id"),
                    "client_id": client_id,
                    "threat_level": threat_level,
                    "risk_score": risk_score,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
                
                doc_ref = db.collection("reports").add(payload)
                results.append({
                    "client_id": client_id,
                    "id": doc_ref[1].id,
                    "saved": True,
                    "status": "created"
                })
            except Exception as e:
                print(f"  [LOG] Error saving report in batch: {e}")
                results.append({
                    "client_id": report_data.get("client_id"),
                    "saved": False,
                    "error": str(e)
                })
        
        return jsonify({
            "saved": len([r for r in results if r.get("saved")]),
            "total": len(reports),
            "results": results
        }), 200
        
    except Exception as e:
        print(f"  [LOG] Fatal error in create_reports_batch: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Fetch reports with simple limit/offset pagination via query params."""
    if db is None:
        return jsonify({"error": "Firebase not connected"}), 500

    try:
        # Defaults: limit=20, offset=0
        try:
            limit = max(0, int(request.args.get("limit", 20)))
        except Exception:
            limit = 20
        try:
            offset = max(0, int(request.args.get("offset", 0)))
        except Exception:
            offset = 0

        # Fetch and sort by created_at desc if present
        docs = db.collection("reports").stream()
        all_reports = []
        for doc in docs:
            item = doc.to_dict() or {}
            item["id"] = doc.id
            all_reports.append(item)

        def sort_key(x):
            return x.get("created_at", "")

        all_reports.sort(key=sort_key, reverse=True)

        total = len(all_reports)
        sliced = all_reports[offset: offset + limit] if limit > 0 else all_reports[offset:]

        return jsonify({
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": sliced,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/<report_id>", methods=["DELETE"])
def delete_report(report_id: str):
    """Delete a report by id from Firebase Firestore."""
    if db is None:
        return jsonify({"error": "Firebase not connected"}), 500

    try:
        if not report_id:
            return jsonify({"error": "Missing report id"}), 400

        ref = db.collection("reports").document(report_id)
        if not ref.get().exists:
            return jsonify({"error": "Report not found"}), 404

        ref.delete()
        return jsonify({"id": report_id, "deleted": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/<report_id>/export", methods=["POST"])
def export_report_pdf(report_id: str):
    """Export a report as PDF."""
    if db is None:
        return jsonify({"error": "Firebase not connected"}), 500

    try:
        if not report_id:
            return jsonify({"error": "Missing report id"}), 400

        ref = db.collection("reports").document(report_id)
        doc = ref.get()
        if not doc.exists:
            return jsonify({"error": "Report not found"}), 404

        report = doc.to_dict() or {}
        report["id"] = doc.id

        # Generate PDF in memory
        buffer = BytesIO()
        doc_pdf = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=(0.2, 0.6, 0.9),
            spaceAfter=12,
        )
        story.append(Paragraph(report.get("title", "Untitled Scan"), title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Metadata
        if report.get("created_at"):
            story.append(Paragraph(f"<b>Created:</b> {report.get('created_at')}", styles["Normal"]))
            story.append(Spacer(1, 0.1 * inch))
        if report.get("id"):
            story.append(Paragraph(f"<b>Report ID:</b> {report.get('id')}", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        # Data section
        story.append(Paragraph("<b>Report Data:</b>", styles["Heading2"]))
        story.append(Spacer(1, 0.1 * inch))

        # Format JSON data
        data_str = json.dumps(report.get("data", {}), indent=2, ensure_ascii=False)
        story.append(Preformatted(data_str, styles["Code"], maxLineLength=80))
        story.append(Spacer(1, 0.2 * inch))

        # Build PDF
        doc_pdf.build(story)
        buffer.seek(0)

        # Return as file download
        filename = f"report_{report_id[:8]}.pdf"
        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------
# 🔹 AI Assistant Routes
# ------------------------------
@app.route("/api/ai/assistant", methods=["POST"])
def ai_assistant():
    """AI assistant endpoint - uses OpenAI if key exists, otherwise returns fallback."""
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    context = data.get("context", {})

    if not prompt:
        return jsonify({"error": "Missing 'prompt'"}), 400

    openai_key = os.getenv("OPENAI_API_KEY")
    
    if openai_key:
        # Use OpenAI API
        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)
            
            # Build context-aware system message
            system_msg = "You are a cybersecurity assistant. Provide clear, educational explanations about security topics."
            if context:
                system_msg += f"\n\nContext: {json.dumps(context, indent=2)}"
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            return jsonify({
                "answer": answer,
                "source": "openai",
                "model": "gpt-3.5-turbo"
            })
        except ImportError:
            # openai package not installed
            pass
        except Exception as e:
            # OpenAI API error - fall through to fallback
            pass

    # Fallback: deterministic explanation
    prompt_lower = prompt.lower()
    answer = "I can help explain cybersecurity concepts. "
    
    if any(word in prompt_lower for word in ["port", "scan", "scanner"]):
        answer += "Port scanning checks which network ports are open on a target system. Common ports include 22 (SSH), 80 (HTTP), 443 (HTTPS), and 8080 (HTTP-alt). Open ports may indicate running services that could be vulnerable."
    elif any(word in prompt_lower for word in ["hash", "hash function", "sha", "md5"]):
        answer += "Hash functions convert input data into a fixed-size string. Common algorithms include MD5, SHA-1, SHA-256, and SHA-512. Hashes are used for data integrity verification, password storage, and digital signatures."
    elif any(word in prompt_lower for word in ["cve", "vulnerability", "exploit"]):
        answer += "CVEs (Common Vulnerabilities and Exposures) are publicly disclosed security vulnerabilities. Each CVE has a unique identifier (e.g., CVE-2021-44228). Check the NVD database for details, severity scores, and remediation guidance."
    elif any(word in prompt_lower for word in ["whois", "domain", "dns"]):
        answer += "WHOIS provides domain registration information including owner, registrar, and expiration dates. DNS (Domain Name System) resolves domain names to IP addresses. Use these tools for reconnaissance and domain analysis."
    elif any(word in prompt_lower for word in ["ip", "geolocation", "asn"]):
        answer += "IP geolocation identifies the approximate physical location of an IP address. ASN (Autonomous System Number) identifies the network operator. This information helps with threat intelligence and network analysis."
    else:
        answer += "For specific security questions, try using the tools in this toolkit: IP lookup, WHOIS, DNS resolution, port scanning, hash generation, and CVE search."
    
    if context:
        answer += f"\n\nNote: Context provided: {json.dumps(context, indent=2)}"
    
    return jsonify({
        "answer": answer,
        "source": "fallback",
        "note": "OpenAI API key not configured. Install 'openai' package and set OPENAI_API_KEY for AI-powered responses."
    })


# ------------------------------
# 🔹 Auth Verification Route
# ------------------------------
@app.route("/api/auth/verify", methods=["POST"])
def verify_auth():
    """Verify Firebase Auth token from frontend."""
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Missing authorization token"}), 401

        # Verify token using Firebase Admin SDK
        if db is None:
            return jsonify({"error": "Firebase not initialized"}), 500

        decoded_token = firebase_auth.verify_id_token(token)
        
        return jsonify({
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "verified": True
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401


# ------------------------------
# 🔹 Contact Form Route
# ------------------------------
@app.route("/api/contact", methods=["POST"])
def contact():
    """Handle contact form submissions."""
    try:
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        message = data.get("message", "").strip()
        
        if not name or not email or not message:
            return jsonify({"error": "All fields are required"}), 400
        
        # In production, integrate with EmailJS, SendGrid, or similar
        # For now, just log and return success
        print(f"Contact form submission: {name} ({email}): {message}")
        
        return jsonify({
            "message": "Thank you for your message! We'll get back to you soon.",
            "success": True
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------------------
# 🔹 Enrichment Endpoints
# ------------------------------
@app.route("/api/enrich/ip", methods=["POST"])
def enrich_ip():
    """Enrich IP results from local cache if available."""
    data = request.get_json(silent=True) or {}
    ip = sanitize_ip_value(data.get("ip"))
    
    if not ip:
        return jsonify({"error": "Missing or invalid IP"}), 400
    
    cache_file = os.path.join(CACHE_DIR, "ip_cache.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
                if ip in cache_data:
                    entry = cache_data[ip]
                    # Check TTL (12 hours default)
                    timestamp = entry.get("timestamp")
                    if timestamp:
                        try:
                            cached_time = datetime.fromisoformat(timestamp)
                            if datetime.now() - cached_time < timedelta(hours=12):
                                return jsonify({"ip": ip, "enriched": True, **entry.get("data", {})})
                        except:
                            pass
        except:
            pass
    
    return jsonify({"error": "No enrichment data available"}), 404


@app.route("/api/enrich/whois", methods=["POST"])
def enrich_whois():
    """Enrich WHOIS results from local cache if available."""
    data = request.get_json(silent=True) or {}
    domain = sanitize_hostname(data.get("domain"))
    
    if not domain:
        return jsonify({"error": "Missing or invalid domain"}), 400
    
    cache_file = os.path.join(CACHE_DIR, "whois_cache.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cache_data = json.load(f)
                if domain in cache_data:
                    entry = cache_data[domain]
                    # Check TTL (12 hours default)
                    timestamp = entry.get("timestamp")
                    if timestamp:
                        try:
                            cached_time = datetime.fromisoformat(timestamp)
                            if datetime.now() - cached_time < timedelta(hours=12):
                                return jsonify({"domain": domain, "enriched": True, **entry.get("data", {})})
                        except:
                            pass
        except:
            pass
    
    return jsonify({"error": "No enrichment data available"}), 404


# ------------------------------
# 🔹 Run Flask App
# ------------------------------
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
