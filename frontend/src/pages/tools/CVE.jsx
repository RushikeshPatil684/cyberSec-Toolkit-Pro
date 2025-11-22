import ToolTemplate from './ToolTemplate';
import { Shield } from 'lucide-react';

export default function CVE() {
  return (
    <ToolTemplate
      title="CVE Search"
      description="Search recent CVEs by keyword (NVD)"
      icon={Shield}
      iconColor="from-rose-500 to-red-500"
      endpoint="/api/tools/cve"
      method="GET"
      inputLabel="Search Query"
      inputPlaceholder="e.g., openssl, apache, log4j"
      scanType="cve"
      buttonText="Search CVEs"
    />
  );
}

