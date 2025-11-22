import ToolTemplate from './ToolTemplate';
import { Mail } from 'lucide-react';

export default function Breach() {
  return (
    <ToolTemplate
      title="Email Breach Checker"
      description="Check if an email has been compromised in data breaches"
      icon={Mail}
      iconColor="from-orange-500 to-amber-500"
      endpoint="/api/tools/breach"
      method="POST"
      inputLabel="Email Address"
      inputPlaceholder="email@example.com"
      inputType="email"
      scanType="breach"
      buttonText="Check Breach"
    />
  );
}

