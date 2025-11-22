import React from 'react';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <>
      <SEO title="Privacy Policy" description="How CyberSec Toolkit Pro handles data and telemetry." />
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="rounded-3xl border border-white/10 bg-[#050b1f]/80 p-6 sm:p-10 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400">
            CyberSec Toolkit Pro stores only the data required to operate your scans—Firebase auth metadata and encrypted
            Firestore reports. No marketing trackers, no third-party analytics. Delete requests purge Firestore docs and queued
            indexedDB entries.
          </p>
        </section>
        </div>
      </PageWrapper>
    </>
  );
}

