import ToolTemplate from './ToolTemplate';
import { Brain } from 'lucide-react';

export default function Risk() {
  return (
    <ToolTemplate
      title="AI Risk Analyzer"
      description="AI-powered security risk assessment using scan data"
      icon={Brain}
      iconColor="from-red-500 to-pink-500"
      endpoint="/api/tools/risk-analyzer"
      method="POST"
      inputLabel="Target Domain or IP"
      inputPlaceholder="example.com or 8.8.8.8"
      scanType="risk"
      buttonText="Analyze Risk"
    />
  );
}

