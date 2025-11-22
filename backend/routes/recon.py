from flask import Blueprint, request, jsonify
import requests
import whois
import dns.resolver


recon_bp = Blueprint("recon", __name__)


@recon_bp.route("/ipinfo", methods=["POST"])
def ip_info():
    body = request.get_json(silent=True) or {}
    ip = (body.get("ip") or "").strip()
    if not ip:
        return jsonify({"error": "Missing 'ip'"}), 400

    try:
        res = requests.get(f"https://ipinfo.io/{ip}/json", timeout=10)
        res.raise_for_status()
        return jsonify(res.json())
    except requests.RequestException as exc:
        return jsonify({"error": str(exc)}), 502


@recon_bp.route("/whois", methods=["POST"])
def whois_lookup():
    body = request.get_json(silent=True) or {}
    domain = (body.get("domain") or "").strip()
    if not domain:
        return jsonify({"error": "Missing 'domain'"}), 400

    try:
        w = whois.whois(domain)
        # whois library returns non-JSON-serializable types sometimes; cast to dict/str
        safe = {}
        for k, v in dict(w).items():
            try:
                if isinstance(v, (list, tuple)):
                    safe[k] = [str(i) for i in v]
                else:
                    safe[k] = str(v)
            except Exception:
                safe[k] = "N/A"
        return jsonify(safe)
    except Exception as exc:  # whois raises various exceptions
        return jsonify({"error": str(exc)}), 502


@recon_bp.route("/dns", methods=["POST"])
def dns_lookup():
    body = request.get_json(silent=True) or {}
    domain = (body.get("domain") or "").strip()
    if not domain:
        return jsonify({"error": "Missing 'domain'"}), 400

    record_types = ["A", "MX", "NS"]
    result = {rtype: [] for rtype in record_types}

    for rtype in record_types:
        try:
            answers = dns.resolver.resolve(domain, rtype)
            result[rtype] = [str(rdata) for rdata in answers]
        except Exception:
            result[rtype] = ["N/A"]

    return jsonify(result)


