import axios from 'axios';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ToolPageLayout from '../../components/ToolPageLayout';
import { apiUrl } from '../../config/api';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { normalizeSsl } from '../../utils/normalizeToolResults';
import { getCachedResult, cacheResult } from '../../utils/cache';

const runSsl = async (domain) => {
  const target = sanitizeInput(domain, 'domain');
  if (!target) throw new Error('Enter a valid domain before running the check.');
  
  // Check cache first
  const cached = getCachedResult('ssl', target);
  if (cached) {
    return cached;
  }
  
  const res = await axios.post(apiUrl('/api/tools/ssl'), { domain: target });
  const normalized = normalizeSsl(res.data, target);
  
  cacheResult('ssl', target, normalized);
  return normalized;
};

export default function SSL() {
  return (
    <>
      <SEO title="SSL Checker" description="Validate certificate chains, issuers, and expiration dates." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <ToolPageLayout
            title="SSL Certificate Checker"
            subtitle="Confirm that a host presents a trustworthy certificate chain and that it is not about to expire."
            inputLabel="Domain"
            placeholder="example.com"
            example="login.example.com"
            runLabel="Inspect SSL"
            toolKey="ssl"
            onRun={runSsl}
            normalizeResult={(raw, domain) => raw} // Already normalized in runSsl
          />
        </div>
      </PageWrapper>
    </>
  );
}
