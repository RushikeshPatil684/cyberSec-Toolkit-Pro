import axios from 'axios';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ToolPageLayout from '../../components/ToolPageLayout';
import { apiUrl } from '../../config/api';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { normalizeSubdomains } from '../../utils/normalizeToolResults';
import { getCachedResult, cacheResult } from '../../utils/cache';

const runSubdomain = async (domain) => {
  const target = sanitizeInput(domain, 'domain');
  if (!target) throw new Error('Enter a valid domain before searching for hosts.');
  
  // Check cache first
  const cached = getCachedResult('subdomain', target);
  if (cached) {
    return cached;
  }
  
  const res = await axios.post(apiUrl('/api/recon/subdomains'), { domain: target });
  const normalized = normalizeSubdomains(res.data, target);
  
  cacheResult('subdomain', target, normalized);
  return normalized;
};

export default function Subdomain() {
  return (
    <>
      <SEO title="Subdomain Finder" description="Enumerate hosts discovered in certificate transparency data." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <ToolPageLayout
            title="Subdomain Finder"
            subtitle="Quickly list subdomains sourced from certificate transparency and passive datasets."
            inputLabel="Domain"
            placeholder="example.com"
            example="securitylab.example"
            runLabel="Find Subdomains"
            toolKey="subdomain"
            onRun={runSubdomain}
            normalizeResult={(raw, domain) => raw} // Already normalized in runSubdomain
          />
        </div>
      </PageWrapper>
    </>
  );
}
