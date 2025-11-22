import ToolTemplate from './ToolTemplate';
import { Network } from 'lucide-react';

export default function DNS() {
  return (
    <ToolTemplate
      title="DNS Lookup"
      description="Resolve common DNS records (A, MX, NS)"
      icon={Network}
      iconColor="from-purple-500 to-violet-500"
      endpoint="/api/recon/dns"
      method="POST"
      inputLabel="Domain Name"
      inputPlaceholder="Enter domain (e.g., example.com)"
      scanType="dns"
    />
  );
}

