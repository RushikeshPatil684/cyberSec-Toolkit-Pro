"""
Backend normalizers for tool results
Provides deterministic parsing and canonical field extraction
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional, List


def normalize_ip_info(raw: Dict[str, Any], ip: str) -> Dict[str, Any]:
    """Normalize IP info results to canonical format."""
    if not raw or not isinstance(raw, dict):
        return {"ip": ip or "unknown", "error": "Invalid response"}

    return {
        "ip": raw.get("ip") or raw.get("query") or ip or "unknown",
        "hostname": raw.get("hostname"),
        "org": raw.get("org") or raw.get("company") or raw.get("isp") or None,
        "city": raw.get("city"),
        "region": raw.get("region") or raw.get("regionName"),
        "country": raw.get("country") or raw.get("country_name"),
        "postal": raw.get("postal") or raw.get("zip"),
        "timezone": raw.get("timezone") or raw.get("time_zone"),
        "latitude": raw.get("lat") or raw.get("latitude"),
        "longitude": raw.get("lon") or raw.get("longitude"),
        "asn": raw.get("asn", {}).get("asn") if isinstance(raw.get("asn"), dict) else raw.get("as") or raw.get("autonomous_system"),
        "normalized": True,
        "raw": raw,
    }


def normalize_whois(raw: Dict[str, Any], domain: str) -> Dict[str, Any]:
    """Normalize WHOIS results to canonical format."""
    if not raw or not isinstance(raw, dict):
        return {"domain": domain or "unknown", "error": "Invalid response"}

    def normalize_date(date_value):
        """Convert date to ISO8601 format."""
        if not date_value:
            return None
        if isinstance(date_value, list) and date_value:
            date_value = date_value[0]
        if isinstance(date_value, datetime):
            return date_value.isoformat()
        if isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace("Z", "+00:00")).isoformat()
            except:
                try:
                    return datetime.strptime(date_value, "%Y-%m-%d %H:%M:%S").isoformat()
                except:
                    return date_value
        return None

    def check_redacted(value):
        """Check if a field value indicates redaction."""
        if isinstance(value, str):
            lower = value.lower()
            return any(x in lower for x in ["redacted", "privacy", "n/a", "none", "not disclosed"])
        return False

    registrar = raw.get("registrar") or raw.get("registrar_name")
    redacted_fields = []
    if check_redacted(registrar):
        redacted_fields.append("registrar")

    return {
        "domain": domain or raw.get("domain_name") or "unknown",
        "registrar": None if check_redacted(registrar) else registrar,
        "creation_date": normalize_date(raw.get("creation_date") or raw.get("created") or raw.get("registered_date")),
        "expiration_date": normalize_date(raw.get("expiration_date") or raw.get("expires") or raw.get("registrar_expiration_date")),
        "updated_date": normalize_date(raw.get("updated_date") or raw.get("last_updated")),
        "nameservers": raw.get("name_servers") or raw.get("nameservers") or [],
        "status": raw.get("status") or raw.get("domain_status") or [],
        "redacted": len(redacted_fields) > 0,
        "redacted_fields": redacted_fields,
        "normalized": True,
        "raw": raw,
    }


def normalize_dns(raw: Dict[str, Any], domain: str) -> Dict[str, Any]:
    """Normalize DNS results to canonical format."""
    if not raw or not isinstance(raw, dict):
        return {"domain": domain or "unknown", "error": "Invalid response"}

    return {
        "domain": domain or "unknown",
        "a": raw.get("A") or raw.get("a") or [],
        "aaaa": raw.get("AAAA") or raw.get("aaaa") or [],
        "mx": raw.get("MX") or raw.get("mx") or [],
        "ns": raw.get("NS") or raw.get("ns") or raw.get("nameservers") or [],
        "txt": raw.get("TXT") or raw.get("txt") or [],
        "cname": raw.get("CNAME") or raw.get("cname") or [],
        "ttl": raw.get("ttl"),
        "authoritative": raw.get("authoritative", False),
        "normalized": True,
        "raw": raw,
    }


def normalize_ssl(raw: Dict[str, Any], domain: str) -> Dict[str, Any]:
    """Normalize SSL certificate results to canonical format."""
    if not raw or not isinstance(raw, dict):
        return {"domain": domain or "unknown", "error": "Invalid response"}

    def parse_date(date_str):
        """Parse date string to ISO8601."""
        if not date_str:
            return None
        try:
            if isinstance(date_str, datetime):
                return date_str.isoformat()
            # Try common formats
            for fmt in ["%b %d %H:%M:%S %Y %Z", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.isoformat()
                except:
                    continue
            return date_str
        except:
            return None

    valid_from = parse_date(raw.get("issued") or raw.get("not_before") or raw.get("valid_from"))
    valid_to = parse_date(raw.get("expires") or raw.get("not_after") or raw.get("valid_to"))

    days_remaining = None
    if valid_to:
        try:
            expires = datetime.fromisoformat(valid_to.replace("Z", "+00:00"))
            now = datetime.utcnow()
            diff = (expires - now).total_seconds()
            days_remaining = int(diff / (24 * 3600))
        except:
            pass

    issuer = raw.get("issuer")
    if isinstance(issuer, dict):
        issuer = issuer.get("organizationName") or issuer.get("commonName") or str(issuer)
    elif not isinstance(issuer, str):
        issuer = None

    subject = raw.get("subject")
    if isinstance(subject, dict):
        subject = subject.get("commonName") or str(subject)
    elif not isinstance(subject, str):
        subject = domain

    signature_alg = raw.get("signature_algorithm") or raw.get("algorithm")
    weak_signature = signature_alg and ("SHA1" in signature_alg or "MD5" in signature_alg)

    return {
        "domain": domain or raw.get("domain") or "unknown",
        "valid": raw.get("valid") is not False,
        "issuer": issuer,
        "subject": subject or domain,
        "valid_from": valid_from,
        "valid_to": valid_to,
        "days_remaining": days_remaining,
        "serial": raw.get("serial") or raw.get("serialNumber"),
        "cert_san": raw.get("subjectAltName") or raw.get("san") or raw.get("alternative_names") or [],
        "signature_algorithm": signature_alg,
        "weak_signature": weak_signature,
        "normalized": True,
        "raw": raw,
    }


def normalize_cve(raw: Dict[str, Any], query: str) -> Dict[str, Any]:
    """Normalize CVE search results to canonical format."""
    if not raw or not isinstance(raw, dict):
        return {"query": query or "unknown", "error": "Invalid response", "results": []}

    results = []
    for vuln in raw.get("results", []):
        cve = vuln.get("cve", {}) if isinstance(vuln.get("cve"), dict) else {}
        cve_id = cve.get("id") or vuln.get("id")

        descriptions = cve.get("descriptions", [])
        desc = next((d.get("value") for d in descriptions if d.get("lang") == "en"), None)
        if not desc and descriptions:
            desc = descriptions[0].get("value")
        if not desc:
            desc = vuln.get("description", "")

        # Extract CVSS scores
        metrics = cve.get("metrics", {})
        cvss_v3 = metrics.get("cvssMetricV31") or metrics.get("cvssMetricV30") or metrics.get("cvssMetricV2")
        cvss_data = cvss_v3[0].get("cvssData") if cvss_v3 and isinstance(cvss_v3, list) and cvss_v3 else {}
        cvss_score = cvss_data.get("baseScore")

        if cvss_score is not None:
            if cvss_score >= 9:
                severity = "Critical"
            elif cvss_score >= 7:
                severity = "High"
            elif cvss_score >= 4:
                severity = "Medium"
            else:
                severity = "Low"
        else:
            severity = "Unknown"

        results.append({
            "cve_id": cve_id,
            "summary": desc,
            "published_date": cve.get("published") or vuln.get("published"),
            "last_modified": cve.get("lastModified") or vuln.get("lastModified"),
            "cvss_v3_score": cvss_score,
            "severity": severity,
            "references": cve.get("references") or vuln.get("references") or [],
            "url": f"https://nvd.nist.gov/vuln/detail/{cve_id}" if cve_id else None,
        })

    return {
        "query": query or raw.get("query") or "unknown",
        "count": len(results),
        "results": results,
        "normalized": True,
        "raw": raw,
    }

