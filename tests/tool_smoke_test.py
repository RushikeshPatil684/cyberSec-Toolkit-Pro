#!/usr/bin/env python3
"""
Smoke test script for tool endpoints
Tests that all tools return normalized results with expected fields
"""

import requests
import json
import sys
from typing import Dict, Any, List

BASE_URL = "http://localhost:5000"

# Expected normalized fields per tool
EXPECTED_FIELDS = {
    "ipinfo": ["ip", "org", "city", "country", "normalized"],
    "whois": ["domain", "registrar", "creation_date", "nameservers", "normalized"],
    "dns": ["domain", "a", "mx", "ns", "normalized"],
    "ssl": ["domain", "valid", "issuer", "valid_from", "valid_to", "days_remaining", "normalized"],
    "headers": ["url", "status_code", "header_map", "security_headers", "normalized"],
    "cve": ["query", "count", "results", "normalized"],
    "subdomain": ["domain", "total_clean", "subdomains", "normalized"],
    "breach": ["email", "breached", "breach_count", "normalized"],
    "hash": ["algorithm", "text_length", "hash", "normalized"],
}

# Test inputs
TEST_INPUTS = {
    "ipinfo": {"ip": "8.8.8.8"},
    "whois": {"domain": "example.com"},
    "dns": {"domain": "example.com"},
    "ssl": {"domain": "google.com"},
    "headers": {"url": "https://example.com"},
    "cve": {"query": "openssl"},
    "subdomain": {"domain": "example.com"},
    "breach": {"email": "test@example.com"},
    "hash": {"text": "test", "alg": "sha256"},
}

def test_endpoint(tool_name: str, endpoint: str, method: str, data: Dict[str, Any]) -> bool:
    """Test a single endpoint and verify normalized fields."""
    print(f"\n[TEST] {tool_name.upper()}")
    print(f"  Endpoint: {endpoint} ({method})")
    print(f"  Input: {json.dumps(data, indent=2)}")
    
    try:
        if method == "GET":
            params = data if isinstance(data, dict) else {}
            response = requests.get(f"{BASE_URL}{endpoint}", params=params, timeout=10)
        else:
            response = requests.post(f"{BASE_URL}{endpoint}", json=data, timeout=10)
        
        response.raise_for_status()
        result = response.json()
        
        # Check for error
        if "error" in result:
            print(f"  ⚠️  Warning: {result['error']}")
            return False
        
        # Check expected fields
        expected = EXPECTED_FIELDS.get(tool_name, [])
        missing_fields = []
        for field in expected:
            if field not in result:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"  ❌ Missing fields: {missing_fields}")
            print(f"  Response: {json.dumps(result, indent=2)[:500]}")
            return False
        
        # Check if normalized flag is present
        if "normalized" in expected and result.get("normalized") is not True:
            print(f"  ⚠️  Warning: normalized flag is not True")
        
        print(f"  ✅ All expected fields present")
        if "normalized" in result:
            print(f"  ✅ Normalized: {result['normalized']}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Request failed: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    """Run all smoke tests."""
    print("=" * 60)
    print("Tool Smoke Test")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    
    results = {}
    
    # Test each tool
    tests = [
        ("ipinfo", "/api/recon/ipinfo", "POST", TEST_INPUTS["ipinfo"]),
        ("whois", "/api/recon/whois", "POST", TEST_INPUTS["whois"]),
        ("dns", "/api/recon/dns", "POST", TEST_INPUTS["dns"]),
        ("ssl", "/api/tools/ssl", "POST", TEST_INPUTS["ssl"]),
        ("headers", "/api/tools/headers", "POST", TEST_INPUTS["headers"]),
        ("cve", "/api/tools/cve", "GET", TEST_INPUTS["cve"]),
        ("subdomain", "/api/recon/subdomains", "POST", TEST_INPUTS["subdomain"]),
        ("breach", "/api/tools/breach", "POST", TEST_INPUTS["breach"]),
        ("hash", "/api/tools/hash", "POST", TEST_INPUTS["hash"]),
    ]
    
    for tool_name, endpoint, method, data in tests:
        results[tool_name] = test_endpoint(tool_name, endpoint, method, data)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for tool_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {tool_name:15} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())

