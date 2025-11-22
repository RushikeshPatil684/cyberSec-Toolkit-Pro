from flask import Blueprint, request, jsonify
import socket
from typing import List, Dict


tools_bp = Blueprint("tools", __name__)


COMMON_PORTS: List[int] = [22, 80, 443, 8080, 3306]


def is_port_open(host: str, port: int, timeout_seconds: float = 0.5) -> bool:
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


@tools_bp.route("/portscan", methods=["POST"])
def portscan():
  body = request.get_json(silent=True) or {}
  target = (body.get("target") or body.get("host") or "").strip()
  ports = body.get("ports")

  if not target:
    return jsonify({"error": "Missing 'target' (hostname or IP)"}), 400

  # Sanitize port list: use provided subset intersected with COMMON_PORTS or default list
  allowed_set = set(COMMON_PORTS)
  if isinstance(ports, list) and ports:
    try:
      requested = {int(p) for p in ports}
      port_list = sorted(list(requested & allowed_set))
    except Exception:
      port_list = COMMON_PORTS
  else:
    port_list = COMMON_PORTS

  results: Dict[int, str] = {}
  for p in port_list:
    open_flag = is_port_open(target, p, timeout_seconds=0.5)
    results[str(p)] = "open" if open_flag else "closed"

  summary = {
    "target": target,
    "ports": port_list,
    "results": results,
  }
  return jsonify(summary)


