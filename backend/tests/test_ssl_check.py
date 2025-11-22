#!/usr/bin/env python3
"""
SSL Certificate Checker Tests
Run with: python -m pytest backend/tests/test_ssl_check.py
Or manually: python backend/tests/test_ssl_check.py
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import parse_certificate
import ssl
import socket
from cryptography import x509
from cryptography.hazmat.backends import default_backend


def test_parse_certificate():
    """Test certificate parsing function with a real certificate."""
    print("\n[TEST] parse_certificate function")
    
    try:
        # Fetch a real certificate
        host = "google.com"
        port = 443
        
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        sock = socket.create_connection((host, port), timeout=6)
        try:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cert_der = ssock.getpeercert(binary_form=True)
                
                # Parse certificate
                result = parse_certificate(cert_der)
                
                # Assertions
                assert result["issuer"] is not None, "Issuer should be parsed"
                assert result["subject"] is not None, "Subject should be parsed"
                assert result["serial"] is not None, "Serial should be parsed"
                assert result["signature_algorithm"] is not None, "Signature algorithm should be parsed"
                assert result["not_before"] is not None, "NotBefore should be parsed"
                assert result["not_after"] is not None, "NotAfter should be parsed"
                
                print(f"  ✅ Issuer: {result['issuer'][:50]}...")
                print(f"  ✅ Subject: {result['subject'][:50]}...")
                print(f"  ✅ Serial: {result['serial']}")
                print(f"  ✅ Algorithm: {result['signature_algorithm']}")
                print(f"  ✅ Valid from: {result['not_before']}")
                print(f"  ✅ Valid to: {result['not_after']}")
                print(f"  ✅ SANs: {len(result['san'])} entries")
                
                if result["errors"]:
                    print(f"  ⚠️  Warnings: {result['errors']}")
                
                return True
        finally:
            sock.close()
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def manual_test_checklist():
    """Manual test checklist for SSL checker."""
    print("\n" + "=" * 60)
    print("MANUAL TEST CHECKLIST")
    print("=" * 60)
    print("\n1. expired.badssl.com")
    print("   Expected: valid=false, days_remaining <= 0")
    print("   Command: curl -X POST http://localhost:5000/api/ssl/check -H 'Content-Type: application/json' -d '{\"host\":\"expired.badssl.com\"}'")
    
    print("\n2. google.com")
    print("   Expected: valid=true, days_remaining > 30")
    print("   Command: curl -X POST http://localhost:5000/api/ssl/check -H 'Content-Type: application/json' -d '{\"host\":\"google.com\"}'")
    
    print("\n3. invalid.host")
    print("   Expected: 400 error or friendly DNS error")
    print("   Command: curl -X POST http://localhost:5000/api/ssl/check -H 'Content-Type: application/json' -d '{\"host\":\"invalid.host\"}'")
    
    print("\n4. Custom port (if available)")
    print("   Expected: Connect to non-standard port")
    print("   Command: curl -X POST http://localhost:5000/api/ssl/check -H 'Content-Type: application/json' -d '{\"host\":\"example.com\",\"port\":8443}'")
    
    print("\n5. Frontend UI")
    print("   - Navigate to http://localhost:3000/tools/ssl")
    print("   - Enter 'expired.badssl.com' and verify red 'Expired' badge")
    print("   - Enter 'google.com' and verify green 'Valid' badge and days remaining")
    print("   - Test 'Test cert' button (dev mode only)")
    print("   - Verify error messages for invalid hosts")
    print("   - Check raw JSON toggle and export functionality")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    print("SSL Certificate Checker Tests")
    print("=" * 60)
    
    # Run parse test
    success = test_parse_certificate()
    
    # Show manual checklist
    manual_test_checklist()
    
    if success:
        print("\n✅ Parse test passed!")
        sys.exit(0)
    else:
        print("\n❌ Parse test failed!")
        sys.exit(1)

