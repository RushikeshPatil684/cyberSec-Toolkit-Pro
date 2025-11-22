/**
 * Normalization utilities for tool results
 * Provides deterministic parsing and canonical field extraction
 */

/**
 * Normalize IP Info results
 * @param {Object} raw - Raw API response
 * @param {string} ip - Input IP address
 * @returns {Object} Normalized result with canonical fields
 */
export function normalizeIpInfo(raw, ip) {
  if (!raw || typeof raw !== 'object') {
    return { ip: ip || 'unknown', error: 'Invalid response' };
  }

  // Extract ASN from org string using regex AS(\d+)
  let asn = raw.asn?.asn || raw.as || raw.autonomous_system || null;
  const org = raw.org || raw.company || raw.isp || raw.asn?.name || null;
  if (!asn && org && typeof org === 'string') {
    const asnMatch = org.match(/AS(\d+)/i);
    if (asnMatch) {
      asn = parseInt(asnMatch[1], 10);
    }
  }

  // Normalize location coordinates
  let latitude = raw.lat || raw.latitude || null;
  let longitude = raw.lon || raw.longitude || null;
  if (raw.loc && typeof raw.loc === 'string') {
    const parts = raw.loc.split(',');
    if (parts.length === 2) {
      latitude = parseFloat(parts[0]) || latitude;
      longitude = parseFloat(parts[1]) || longitude;
    }
  }

  return {
    ip: raw.ip || raw.query || ip || 'unknown',
    hostname: raw.hostname || null,
    org: org,
    city: raw.city || null,
    region: raw.region || raw.regionName || null,
    country: raw.country || raw.country_name || null,
    postal: raw.postal || raw.zip || null,
    timezone: raw.timezone || raw.time_zone || null,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    asn: asn ? (typeof asn === 'number' ? asn : parseInt(asn, 10)) : null,
    normalized: true,
    raw,
  };
}

/**
 * Normalize WHOIS results
 * @param {Object} raw - Raw WHOIS response
 * @param {string} domain - Input domain
 * @returns {Object} Normalized result
 */
export function normalizeWhois(raw, domain) {
  if (!raw || typeof raw !== 'object') {
    return { domain: domain || 'unknown', error: 'Invalid response' };
  }

  // Handle redacted fields
  const redactedFields = [];
  const checkRedacted = (value) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower.includes('redacted') || lower.includes('privacy') || lower === 'n/a' || lower === 'none') {
        return true;
      }
    }
    return false;
  };

  const creationDate = raw.creation_date || raw.created || raw.registered_date;
  const expirationDate = raw.expiration_date || raw.expires || raw.registrar_expiration_date;
  const updatedDate = raw.updated_date || raw.last_updated;

  // Normalize dates to ISO8601
  const normalizeDate = (dateValue) => {
    if (!dateValue) return null;
    if (Array.isArray(dateValue)) {
      dateValue = dateValue[0];
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    if (typeof dateValue === 'string') {
      try {
        return new Date(dateValue).toISOString();
      } catch {
        return dateValue;
      }
    }
    return null;
  };

  const registrar = raw.registrar || raw.registrar_name || null;
  if (checkRedacted(registrar)) {
    redactedFields.push('registrar');
  }

  // Normalize status to array
  let status = raw.status || raw.domain_status || [];
  if (!Array.isArray(status)) {
    status = typeof status === 'string' ? [status] : [];
  }

  return {
    domain: domain || raw.domain_name || 'unknown',
    registrar: checkRedacted(registrar) ? null : registrar,
    creation_date: normalizeDate(creationDate),
    expiration_date: normalizeDate(expirationDate),
    updated_date: normalizeDate(updatedDate),
    nameservers: Array.isArray(raw.name_servers) ? raw.name_servers : (raw.nameservers || []),
    status: status,
    redacted: redactedFields.length > 0,
    redacted_fields: redactedFields,
    normalized: true,
    raw,
  };
}

/**
 * Normalize DNS results
 * @param {Object} raw - Raw DNS response
 * @param {string} domain - Input domain
 * @returns {Object} Normalized result
 */
export function normalizeDns(raw, domain) {
  if (!raw || typeof raw !== 'object') {
    return { domain: domain || 'unknown', error: 'Invalid response' };
  }

  // Normalize arrays and ensure consistent format
  const normalizeArray = (arr) => {
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') return [arr];
    return [];
  };

  return {
    domain: domain || 'unknown',
    a: normalizeArray(raw.A || raw.a || []),
    aaaa: normalizeArray(raw.AAAA || raw.aaaa || []),
    mx: normalizeArray(raw.MX || raw.mx || []),
    ns: normalizeArray(raw.NS || raw.ns || raw.nameservers || []),
    txt: normalizeArray(raw.TXT || raw.txt || []),
    cname: normalizeArray(raw.CNAME || raw.cname || []),
    ttl: raw.ttl || null,
    authoritative: raw.authoritative || false,
    resolver: raw.resolver || null,
    normalized: true,
    raw,
  };
}

/**
 * Normalize SSL certificate results
 * @param {Object} raw - Raw SSL response
 * @param {string} domain - Input domain
 * @returns {Object} Normalized result
 */
export function normalizeSsl(raw, domain) {
  if (!raw || typeof raw !== 'object') {
    return { domain: domain || 'unknown', error: 'Invalid response' };
  }

  const validFrom = raw.issued || raw.not_before || raw.valid_from;
  const validTo = raw.expires || raw.not_after || raw.valid_to;

  // Parse dates and compute days remaining
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle various date formats
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  const validFromIso = parseDate(validFrom);
  const validToIso = parseDate(validTo);

  let daysRemaining = null;
  if (validToIso) {
    const now = new Date();
    const expires = new Date(validToIso);
    const diff = expires - now;
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Extract SANs from subjectAltName if available
  const sanList = raw.subjectAltName || raw.san || raw.alternative_names || [];

  // Check signature algorithm
  const signatureAlg = raw.signature_algorithm || raw.algorithm || null;
  const weakSignature = signatureAlg && (signatureAlg.includes('SHA1') || signatureAlg.includes('MD5'));

  return {
    domain: domain || raw.domain || 'unknown',
    valid: raw.valid !== false,
    issuer: raw.issuer?.organizationName || raw.issuer || null,
    subject: raw.subject?.commonName || raw.subject || domain,
    valid_from: validFromIso,
    valid_to: validToIso,
    days_remaining: daysRemaining,
    serial: raw.serial || raw.serialNumber || null,
    cert_san: Array.isArray(sanList) ? sanList : [],
    signature_algorithm: signatureAlg,
    weak_signature: weakSignature,
    normalized: true,
    raw,
  };
}

/**
 * Normalize HTTP headers results
 * @param {Object} raw - Raw headers response
 * @param {string} url - Input URL
 * @returns {Object} Normalized result
 */
export function normalizeHeaders(raw, url) {
  if (!raw || typeof raw !== 'object') {
    return { url: url || 'unknown', error: 'Invalid response' };
  }

  const headers = raw.headers || {};
  const securityHeaders = raw.security_headers || {};

  // Classify security headers
  const classifyHeader = (headerName, headerValue) => {
    if (!headerValue || headerValue === 'Missing') {
      return { status: 'missing', value: null };
    }
    if (typeof headerValue === 'string' && headerValue.toLowerCase().includes('none')) {
      return { status: 'misconfigured', value: headerValue };
    }
    return { status: 'present', value: headerValue };
  };

  const hsts = classifyHeader('Strict-Transport-Security', headers['Strict-Transport-Security'] || securityHeaders['Strict-Transport-Security']);
  const csp = classifyHeader('Content-Security-Policy', headers['Content-Security-Policy'] || securityHeaders['Content-Security-Policy']);
  const xContentType = classifyHeader('X-Content-Type-Options', headers['X-Content-Type-Options'] || securityHeaders['X-Content-Type-Options']);
  const referrerPolicy = classifyHeader('Referrer-Policy', headers['Referrer-Policy'] || securityHeaders['Referrer-Policy']);

  // Generate remediation snippets
  const remediation = [];
  if (hsts.status === 'missing') {
    remediation.push({
      header: 'Strict-Transport-Security',
      snippet: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
      description: 'Enforce HTTPS connections for 1 year'
    });
  }
  if (csp.status === 'missing') {
    remediation.push({
      header: 'Content-Security-Policy',
      snippet: "Content-Security-Policy: default-src 'self'",
      description: 'Restrict resource loading to same origin'
    });
  }
  if (xContentType.status === 'missing') {
    remediation.push({
      header: 'X-Content-Type-Options',
      snippet: "X-Content-Type-Options: nosniff",
      description: 'Prevent MIME type sniffing'
    });
  }
  if (referrerPolicy.status === 'missing') {
    remediation.push({
      header: 'Referrer-Policy',
      snippet: "Referrer-Policy: strict-origin-when-cross-origin",
      description: 'Control referrer information sent'
    });
  }

  return {
    url: url || raw.url || 'unknown',
    status_code: raw.status_code || null,
    server: headers.Server || raw.server || null,
    header_map: headers,
    security_headers: {
      hsts,
      csp,
      x_content_type_options: xContentType,
      referrer_policy: referrerPolicy,
    },
    remediation,
    normalized: true,
    raw,
  };
}

/**
 * Normalize CVE search results
 * @param {Object} raw - Raw CVE response
 * @param {string} query - Search query
 * @returns {Object} Normalized result
 */
export function normalizeCve(raw, query) {
  if (!raw || typeof raw !== 'object') {
    return { query: query || 'unknown', error: 'Invalid response', results: [] };
  }

  const results = (raw.results || []).map((vuln) => {
    const cve = vuln.cve || {};
    const cveId = cve.id || vuln.id || null;
    const descriptions = cve.descriptions || [];
    const desc = descriptions.find((d) => d.lang === 'en')?.value || descriptions[0]?.value || vuln.description || '';

    // Extract CVSS scores
    const metrics = cve.metrics || {};
    const cvssV3 = metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0] || metrics.cvssMetricV2?.[0];
    const cvssScore = cvssV3?.cvssData?.baseScore || null;
    const severity = cvssScore >= 9 ? 'Critical' : cvssScore >= 7 ? 'High' : cvssScore >= 4 ? 'Medium' : 'Low';

    return {
      cve_id: cveId,
      summary: desc,
      published_date: cve.published || vuln.published || null,
      last_modified: cve.lastModified || vuln.lastModified || null,
      cvss_v3_score: cvssScore,
      severity,
      references: cve.references || vuln.references || [],
      url: cveId ? `https://nvd.nist.gov/vuln/detail/${cveId}` : null,
    };
  });

  return {
    query: query || raw.query || 'unknown',
    count: results.length,
    results,
    normalized: true,
    raw,
  };
}

/**
 * Normalize subdomain finder results
 * @param {Object} raw - Raw subdomain response
 * @param {string} domain - Input domain
 * @returns {Object} Normalized result
 */
export function normalizeSubdomains(raw, domain) {
  if (!raw || typeof raw !== 'object') {
    return { domain: domain || 'unknown', error: 'Invalid response', subdomains: [] };
  }

  // Process subdomains: deduplicate, lowercase, skip wildcards for direct A-checks
  const subdomains = (raw.subdomains || []).map((sub) => {
    const host = typeof sub === 'string' ? sub : (sub.host || sub);
    const hostLower = host.toLowerCase().trim();
    
    return {
      host: hostLower,
      validated: sub.resolves !== undefined ? sub.resolves : (sub.validated || false),
      wildcard: sub.wildcard || hostLower.startsWith('*.'),
      records: Array.isArray(sub.records) ? sub.records : [],
      confidence: sub.confidence || 'medium',
      resolver: sub.resolver || null,
      ttl: sub.ttl || null,
    };
  });

  // Deduplicate by hostname (lowercase)
  const seen = new Set();
  const unique = subdomains.filter((sub) => {
    if (seen.has(sub.host)) return false;
    seen.add(sub.host);
    return true;
  });

  // Filter out raw wildcard entries for direct A-checks (keep them but mark as non-validated)
  const validated = unique.map(sub => {
    if (sub.wildcard && !sub.validated) {
      // Wildcard entries can't be validated via direct DNS A checks
      return { ...sub, validated: false };
    }
    return sub;
  });

  return {
    domain: domain || raw.domain || 'unknown',
    total_raw: raw.total_raw || 0,
    total_clean: validated.length,
    subdomains: validated,
    normalized: true,
    raw,
  };
}

/**
 * Normalize email breach results
 * @param {Object} raw - Raw breach response
 * @param {string} email - Input email
 * @returns {Object} Normalized result
 */
export function normalizeBreach(raw, email) {
  if (!raw || typeof raw !== 'object') {
    return { email: email || 'unknown', error: 'Invalid response' };
  }

  return {
    email: email || raw.email || 'unknown',
    breached: raw.breached === true || raw.breach_count > 0,
    breach_count: raw.breach_count || 0,
    breaches: raw.breaches || [],
    normalized: true,
    raw,
  };
}

/**
 * Normalize hash results
 * @param {Object} raw - Raw hash response
 * @param {string} text - Input text
 * @returns {Object} Normalized result
 */
export function normalizeHash(raw, text) {
  if (!raw || typeof raw !== 'object') {
    return { text: text || 'unknown', error: 'Invalid response' };
  }

  return {
    algorithm: raw.alg || raw.algorithm || 'unknown',
    text_length: raw.text_len || text?.length || 0,
    hash: raw.hash || raw.digest || null,
    normalized: true,
    raw,
  };
}

