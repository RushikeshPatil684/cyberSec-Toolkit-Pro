import axios from 'axios';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ToolPageLayout from '../../components/ToolPageLayout';
import { apiUrl } from '../../config/api';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { normalizeIpInfo } from '../../utils/normalizeToolResults';
import { getCachedResult, cacheResult } from '../../utils/cache';

const runIpInfo = async (ip) => {
  const target = sanitizeInput(ip, 'ip');
  if (!target) throw new Error('Please provide a valid IP address.');
  
  // Check cache first
  const cached = getCachedResult('ipinfo', target);
  if (cached) {
    return cached;
  }
  
  const res = await axios.post(apiUrl('/api/recon/ipinfo'), { ip: target });
  const normalized = normalizeIpInfo(res.data, target);
  
  // Try enrichment
  try {
    const enrichRes = await axios.post(apiUrl('/api/enrich/ip'), { ip: target });
    if (enrichRes.data && !enrichRes.data.error) {
      Object.assign(normalized, enrichRes.data);
      normalized.enriched = true;
    }
  } catch {
    // Enrichment not available, continue with primary result
  }
  
  cacheResult('ipinfo', target, normalized);
  return normalized;
};

export default function IPInfo() {
  return (
    <>
      <SEO title="IP Info Lookup" description="Inspect IP ownership, location, and ASN details." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <ToolPageLayout
            title="IP Info Lookup"
            subtitle="Understand where an IP lives, who operates it, and how it routes across the internet."
            inputLabel="IP Address"
            placeholder="8.8.8.8"
            example="8.8.8.8"
            runLabel="Lookup IP"
            toolKey="ipinfo"
            onRun={runIpInfo}
            normalizeResult={(raw, ip) => raw} // Already normalized in runIpInfo
          />
        </div>
      </PageWrapper>
    </>
  );
}
