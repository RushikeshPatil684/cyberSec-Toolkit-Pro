import ToolTemplate from './ToolTemplate';
import { FileText } from 'lucide-react';

export default function Headers() {
  return (
    <ToolTemplate
      title="HTTP Header Analyzer"
      description="Analyze HTTP response headers and security configurations"
      icon={FileText}
      iconColor="from-cyan-500 to-blue-500"
      endpoint="/api/tools/headers"
      method="POST"
      inputLabel="URL"
      inputPlaceholder="https://example.com"
      scanType="headers"
      buttonText="Analyze Headers"
    />
  );
}

