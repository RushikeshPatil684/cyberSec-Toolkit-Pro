import axios from 'axios';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ToolPageLayout from '../../components/ToolPageLayout';
import { apiUrl } from '../../config/api';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { normalizeWhois } from '../../utils/normalizeToolResults';
import { getCachedResult, cacheResult } from '../../utils/cache';

const runWhois = async (domain) => {
  const target = sanitizeInput(domain, 'domain');
  if (!target) throw new Error('Please enter a valid domain.');
  
  // Check cache first
  const cached = getCachedResult('whois', target);
  if (cached) {
    return cached;
  }
  
  const res = await axios.post(apiUrl('/api/recon/whois'), { domain: target });
  const normalized = normalizeWhois(res.data, target);
  
  // Try enrichment
  try {
    const enrichRes = await axios.post(apiUrl('/api/enrich/whois'), { domain: target });
    if (enrichRes.data && !enrichRes.data.error) {
      Object.assign(normalized, enrichRes.data);
      normalized.enriched = true;
    }
  } catch {
    // Enrichment not available, continue with primary result
  }
  
  cacheResult('whois', target, normalized);
  return normalized;
};

export default function WHOIS() {
  return (
    <>
      <SEO title="WHOIS Lookup" description="Review ownership, registrar, and expiration data for any domain." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <ToolPageLayout
            title="WHOIS Lookup"
            subtitle="Check when a domain was registered, who manages it, and when it expires."
            inputLabel="Domain"
            placeholder="example.com"
            example="example.com"
            runLabel="Lookup Domain"
            toolKey="whois"
            onRun={runWhois}
            normalizeResult={(raw, domain) => raw} // Already normalized in runWhois
          />
        </div>
      </PageWrapper>
    </>
  );
}
