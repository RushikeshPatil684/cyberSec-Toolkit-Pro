import React from 'react';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <>
      <SEO title="Terms of Use" description="Responsible usage guidelines for CyberSec Toolkit Pro." />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="rounded-3xl border border-white/10 bg-[#050b1f]/80 p-6 sm:p-10 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4">Terms of Use</h1>
          <p className="text-slate-400">
            Operate CyberSec Toolkit Pro only on assets you own or have explicit permission to test. You are solely responsible
            for how you run scans and distribute reports. We reserve the right to revoke access if abuse is detected.
          </p>
        </section>
        </div>
      </PageWrapper>
    </>
  );
}

