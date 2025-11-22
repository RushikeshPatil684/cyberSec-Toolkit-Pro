import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, BadgeCheck, Cpu, Fingerprint, Lock, Sparkles, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import { STRENGTH_LABELS, STRENGTH_COLORS, analyzePassword, generateStrongPassword } from '../utils/passwordMetrics';

const features = [
  { icon: Shield, title: 'Reconnaissance tools', desc: 'IP lookup, WHOIS, DNS, and subdomain discovery.' },
  { icon: Cpu, title: 'Security analysis', desc: 'SSL checks, header analysis, and CVE lookups.' },
  { icon: BadgeCheck, title: 'Password security', desc: 'Strength checking, entropy analysis, and secure generation.' },
  { icon: Fingerprint, title: 'Breach monitoring', desc: 'Email breach checks and risk assessment.' },
];


export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [passwordValue, setPasswordValue] = useState('');
  const [showHomePassword, setShowHomePassword] = useState(false);

  const handleCTAClick = (route) => {
    if (currentUser) {
      navigate(route);
    } else {
      navigate('/signup');
    }
  };


  const analysis = useMemo(() => analyzePassword(passwordValue), [passwordValue]);
  const score = analysis?.score ?? 0;
  const strengthPalette = STRENGTH_COLORS;
  const suggestions = analysis?.suggestions?.length ? analysis.suggestions : ['Use 14+ characters', 'Mix symbols & digits', 'Avoid reused phrases'];

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword(16);
    setPasswordValue(generated);
    toast.info('Generated a fresh password');
  };

  const handleCopyPassword = async () => {
    if (!passwordValue) {
      toast.info('Nothing to copy yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(passwordValue);
      toast.success('Copied');
    } catch {
      toast.error('Unable to copy, please try again.');
    }
  };

  return (
    <>
      <SEO
        title="CyberSec Toolkit Pro - Professional Cybersecurity Tools"
        description="Reconnaissance, password hygiene, and reporting tools for learners and community defenders."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'CyberSec Toolkit Pro',
          description: 'Professional cybersecurity toolkit',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
        }}
      />
      <PageWrapper>
        <div className="relative min-h-screen w-full bg-[#05060f]">
          <section className="pt-20 pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center sm:text-left"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70 mb-4">Open learner lab</p>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">CyberSec Toolkit Pro</h1>
                <p className="mt-3 text-base sm:text-lg text-slate-300/90">
                  Practical recon flows and clean UI so you can focus on analysis, not wrangling scripts.
                </p>
                <div className="mt-7 flex flex-wrap gap-4 justify-center sm:justify-start">
                  <button onClick={() => handleCTAClick('/tools')} className="primary-btn min-w-[180px]">
                    Explore tools
                  </button>
                  <a href="https://github.com/" target="_blank" rel="noreferrer" className="secondary-btn min-w-[180px]">
                    View GitHub
                  </a>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="pb-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      viewport={{ once: true }}
                      className="rounded-2xl border border-white/10 bg-[#060a1c] p-6 text-center sm:text-left"
                    >
                      <Icon aria-hidden="true" className="w-10 h-10 text-cyan-300 mb-4 mx-auto sm:mx-0" />
                      <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-400">{feature.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>


          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="neon-border rounded-3xl bg-[#060b1c]/80 p-6 sm:p-10">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Password helper</p>
                    <h2 className="text-2xl font-semibold text-white mt-2">Password strength preview</h2>
                    <p className="text-slate-400">
                      Quickly estimate how durable a password is before logging in. Nothing is stored or sent—this preview is for your eyes only.
                    </p>
                  </div>
                  <Lock className="w-12 h-12 text-cyan-300 hidden sm:block" />
                </header>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <input
                      type={showHomePassword ? 'text' : 'password'}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="Type a password to analyze"
                      className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHomePassword((prev) => !prev)}
                      className="p-2 rounded-full border border-white/10 text-slate-300 hover:text-white"
                      aria-label={showHomePassword ? 'Hide password' : 'Show password'}
                    >
                      {showHomePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Sparkles size={16} /> Generate
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"
                    >
                      <Copy size={16} /> Copy
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Strength: {STRENGTH_LABELS[score]}</span>
                      <span>{passwordValue.length} chars</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${((score + 1) / 5) * 100}%`, background: strengthPalette[score] }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Entropy</p>
                      <p className="mt-1 text-lg text-white">{analysis?.entropy ?? 0} bits</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Crack time</p>
                      <p className="mt-1 text-lg text-white">{analysis?.crackTime || '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Length</p>
                      <p className="mt-1 text-lg text-white">{passwordValue.length || '—'}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Suggestions</p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {suggestions.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Community & Trust</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Learning resources without hype.</h2>
                <p className="mt-3 text-slate-300">
                  Maintained by the community — every workflow, bug, and improvement request happens in the open on GitHub.
                </p>
                <div className="mt-6 flex flex-wrap gap-4 justify-center sm:justify-start">
                  <button onClick={() => handleCTAClick('/tools')} className="primary-btn min-w-[160px]">
                    Explore tools
                  </button>
                  <Link to="/about" className="secondary-btn min-w-[160px]">
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 sm:px-6 lg:px-8 pb-16">
            <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-[#050b1f] p-8 text-center sm:text-left space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Credits & transparency</p>
              <p className="text-slate-300">
                This project stays open and auditable so learners can understand every workflow from input to report.
              </p>
              <p className="text-xs text-slate-500">
                No filler stats or vanity numbers — just shipping practical tooling for learners and defenders.
              </p>
            </div>
          </section>
        </div>
      </PageWrapper>
    </>
  );
}


