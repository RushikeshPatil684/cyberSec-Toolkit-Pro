import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, Shield, Hash, Network, ShieldCheck, Signal, Layers, Server, Mail, Activity } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';

const toolLinks = [
  { key: 'ipinfo', title: 'IP Info Lookup', description: 'Inspect IP ownership, ASN, and location details.', icon: MapPin, to: '/tools/ipinfo' },
  { key: 'whois', title: 'WHOIS Lookup', description: 'Review registrar data and domain timelines.', icon: Globe, to: '/tools/whois' },
  { key: 'ssl', title: 'SSL Checker', description: 'Validate certificate chains and expiry windows.', icon: Shield, to: '/tools/ssl' },
  { key: 'hash', title: 'Hash Generator', description: 'Create MD5/SHA digests for payload validation.', icon: Hash, to: '/tools/hash' },
  { key: 'subdomain', title: 'Subdomain Finder', description: 'List hosts sourced from transparency logs.', icon: Network, to: '/tools/subdomains' },
  { key: 'password', title: 'Password Strength', description: 'Measure strength, entropy, and crack times.', icon: ShieldCheck, to: '/tools/password' },
  { key: 'dns', title: 'DNS Resolver', description: 'Resolve DNS records for fast recon checks.', icon: Signal, to: '/tools/dns' },
  { key: 'cve', title: 'CVE Pulse', description: 'Query recent CVEs for quick vulnerability context.', icon: Layers, to: '/tools/cve' },
  { key: 'headers', title: 'Header Analyst', description: 'Check HTTP response headers and security flags.', icon: Server, to: '/tools/headers' },
  { key: 'breach', title: 'Breach Monitor', description: 'Check if an email appears in public breaches.', icon: Mail, to: '/tools/breach' },
  { key: 'risk', title: 'Risk Analyzer', description: 'Summarize posture using previously saved scans.', icon: Activity, to: '/tools/risk' },
];

export default function Tools() {
  return (
    <>
      <SEO
        title="Security Tools"
        description="Pick a recon or analysis tool to run deeper investigations inside CyberSec Toolkit Pro."
      />
      <PageWrapper>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <header className="space-y-3 text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Toolkit</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Choose a tool</h1>
            <p className="text-slate-300 max-w-3xl">
              Every tool lives on its own page with focused inputs, caching, export, and report-saving controls. Start wherever your
              investigation requires.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {toolLinks.map(({ key, title, description, icon: Icon, to }) => (
              <Link
                key={key}
                to={to}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/50"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-[0_0_18px_rgba(0,255,255,0.3)]">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-300 flex-1">{description}</p>
                <span className="mt-4 text-sm font-semibold text-cyan-200">Open tool →</span>
              </Link>
            ))}
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

