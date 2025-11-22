import React from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { Code, Shield, Zap } from 'lucide-react';
import SEO from '../components/SEO';

const timeline = [
  {
    year: '2023',
    title: 'Open-source launch',
    description: 'Initial IP intel, WHOIS, and DNS workflows shipped for learners under an MIT-friendly license.',
    icon: Code,
  },
  {
    year: '2024',
    title: 'Tooling expansion',
    description: 'Added SSL checks, breach lookups, password strength tooling, and Render/Vercel deployment docs.',
    icon: Zap,
  },
  {
    year: '2025',
    title: 'Firestore-first rewrite',
    description: 'Simplified reports, removed the dashboard clutter, and rebuilt UI spacing for privacy-safe storage.',
    icon: Shield,
  },
];

const valuesList = [
  { title: 'Transparency', desc: 'Open commits, readable APIs, and reproducible toolchains.' },
  { title: 'Education', desc: 'Guided UI flows help students learn recon without breaking things.' },
  { title: 'Trust', desc: 'Secure storage and auditable exports for every scan.' },
];

export default function About() {
  return (
    <>
      <SEO
        title="About - CyberSec Toolkit Pro"
        description="Learn about CyberSec Toolkit Pro, a comprehensive cybersecurity toolkit designed for security professionals and enthusiasts."
      />
      <PageWrapper>
        <div className="w-full py-12 relative overflow-x-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-12 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-cyan-400 glow-text text-center">
                About CyberSec Toolkit Pro
              </h1>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed text-center">
                An open-source learning project for cybersecurity enthusiasts.
              </p>
              <details className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-gray-300">
                <summary className="cursor-pointer text-cyan-200 mb-2">Read more</summary>
                <p className="mt-4">
                  The project documents recon workflows—IP intel, WHOIS, DNS, SSL, breach monitoring, and reporting—so students can
                  practice without touching production systems. Everything stays public so you can inspect how data flows before trusting it.
                </p>
              </details>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid gap-6 lg:grid-cols-2 mb-16 mt-10"
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left">
                <h2 className="text-2xl font-semibold text-cyan-300 mb-3">Our Mission</h2>
                <p className="text-gray-300">
                  An open-source learning project designed to help enthusiasts perform reconnaissance and
                  analysis with safe, privacy-first workflows. Every screen favors clarity so you can focus on technique.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold text-cyan-300 mb-3">Core Values</h2>
                <ul className="space-y-3">
                  {valuesList.map((value) => (
                    <li key={value.title} className="text-left">
                      <p className="text-white font-semibold">{value.title}</p>
                      <p className="text-gray-400 text-sm">{value.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8 mb-16"
            >
              <h2 className="text-3xl font-bold text-cyan-400 mb-8 text-center">Our Journey</h2>
              {timeline.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="hacker-card rounded-2xl p-6 flex items-start gap-4"
                  >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex-shrink-0 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-cyan-400 font-semibold">{item.year}</span>
                        <h3 className="text-xl font-semibold text-cyan-400">{item.title}</h3>
                      </div>
                      <p className="text-gray-400">{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Warning Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="hacker-card rounded-2xl p-6 border-2 border-yellow-500/30 bg-yellow-500/5 mb-12"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-yellow-400 mb-2">⚠️ Responsible Use</h3>
                  <p className="text-gray-300">
                    Use this toolkit responsibly and only on assets you own or have explicit written permission to test. 
                    Unauthorized scanning or testing of systems you do not own is illegal and unethical.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contributors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="hacker-card rounded-2xl p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-cyan-400">Maintained by the community</h3>
                <p className="text-gray-400 max-w-xl">
                  Maintained by the community. Contributors review pull requests, harden new tools, and document workflows for students
                  and professionals alike.
                </p>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm uppercase tracking-[0.3em] text-white"
                >
                  See contributors on GitHub
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
