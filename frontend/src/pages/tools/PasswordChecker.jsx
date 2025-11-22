import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Copy, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import { useReports } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';
import { STRENGTH_LABELS, STRENGTH_COLORS, generateStrongPassword, generateMemorablePassphrase, analyzePassword, detectSets } from '../../utils/passwordMetrics';

export default function PasswordChecker() {
  const { currentUser } = useAuth();
  const { saveReport } = useReports();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const analysis = useMemo(() => analyzePassword(password), [password]);
  const entropy = analysis?.entropy || 0;

  const handleGenerate = () => {
    const generated = generateStrongPassword(18);
    setPassword(generated);
    toast.info('Generated a secure password');
  };

  const handleGeneratePassphrase = () => {
    const generated = generateMemorablePassphrase();
    setPassword(generated);
    toast.info('Generated a memorable passphrase');
  };

  const handleCopy = async () => {
    if (!password) {
      toast.warn('Nothing to copy yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard');
    } catch (error) {
      toast.error('Copy failed. Try manually.');
    }
  };

  const handleSaveSummary = async () => {
    if (!analysis) {
      toast.warn('Enter a password first');
      return;
    }
    if (!currentUser) {
      toast.info('Login to store summaries');
      return;
    }

    try {
      const id = await saveReport({
        tool: 'password-checker',
        result: {
          score: analysis.score,
          entropyBits: entropy,
          crackTime: analysis.crackTime,
          warning: analysis.warning || 'n/a',
          suggestions: analysis.suggestions || [],
          length: password.length,
          characterSets: analysis.characterSets,
        },
      });
      console.log('saveReport returned id', id);
      toast.success('Summary saved (password excluded)');
    } catch (error) {
      toast.error('Unable to save summary');
      console.error('[PasswordChecker] saveReport error', error);
    }
  };

  const score = analysis?.score || 0;
  const strengthLabel = STRENGTH_LABELS[score];
  const progressPercent = ((score + 1) / 5) * 100;
  const color = STRENGTH_COLORS[score];

  return (
    <>
      <SEO title="Password Strength Checker" description="Review strength, entropy, and crack-time estimates for any password." />
      <PageWrapper>
        <div className="min-h-[calc(100vh-4rem)] w-full py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-white/10 bg-[#040818]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <header className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Password health</p>
                <h1 className="text-3xl font-bold text-white">Password Strength Checker</h1>
                <p className="text-slate-400 max-w-2xl">
                  Evaluate length, character diversity, and estimated crack times. Generate new suggestions and save anonymized
                  summaries for your notes.
                </p>
              </header>

              <div className="space-y-3">
                <label htmlFor="password-input" className="text-sm font-medium text-slate-200">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                    placeholder="Enter a password or generate one"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-2 rounded-full border border-white/10 text-slate-300 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-semibold"
                  >
                    <Sparkles size={16} /> Generate strong password
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePassphrase}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold"
                  >
                    <Sparkles size={16} /> Generate passphrase
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
              </div>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Strength</p>
                    <p className="text-2xl font-semibold text-white">{strengthLabel}</p>
                  </div>
                  <ShieldCheck size={32} style={{ color }} />
                </div>
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: color }} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard label="Entropy (bits)" value={`${entropy} bits`} />
                  <InfoCard label="Estimated crack time" value={analysis?.crackTime || '—'} />
                  <InfoCard label="Length" value={`${password.length} chars`} />
                  <InfoCard
                    label="Character sets"
                    value={
                      password
                        ? Object.entries(detectSets(password))
                            .filter(([, enabled]) => enabled)
                            .map(([key]) => key)
                            .join(', ') || 'lowercase only'
                        : '—'
                    }
                  />
                </div>
                {analysis?.crackTimeEstimates && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Time-to-crack scenarios</p>
                    <div className="grid gap-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Offline (slow):</span>
                        <span className="text-white">{analysis.crackTimeEstimates.offline_slow}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Offline (fast):</span>
                        <span className="text-white">{analysis.crackTimeEstimates.offline_fast}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Online (no throttle):</span>
                        <span className="text-white">{analysis.crackTimeEstimates.online_no_throttling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Online (throttled):</span>
                        <span className="text-white">{analysis.crackTimeEstimates.online_throttling}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Feedback & Suggestions</p>
                {analysis?.warning ? (
                  <p className="text-sm text-amber-300">{analysis.warning}</p>
                ) : (
                  <p className="text-sm text-slate-400">No warnings detected.</p>
                )}
                {analysis?.suggestionsByCategory && (
                  <div className="space-y-3">
                    {Object.entries(analysis.suggestionsByCategory).map(([category, tips]) => {
                      if (tips.length === 0) return null;
                      return (
                        <div key={category}>
                          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-1">
                            {category === 'length' ? 'Length' : category === 'complexity' ? 'Complexity' : category === 'patterns' ? 'Patterns' : 'Dictionary'}
                          </p>
                          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                            {tips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!analysis?.suggestionsByCategory || Object.values(analysis.suggestionsByCategory).every(arr => arr.length === 0)) && (
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {(analysis?.suggestions || ['Password looks strong!']).map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-wrap gap-3 justify-between items-center">
                <p className="text-xs text-slate-500">
                  Summaries can be saved (without the actual password) if you are logged in.
                </p>
                <button
                  type="button"
                  onClick={handleSaveSummary}
                  className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 disabled:opacity-40"
                  disabled={!analysis || !currentUser}
                >
                  Save sanitized summary
                </button>
              </div>

              <footer className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-400">
                Saved summaries only include metrics, never the password itself.
              </footer>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value || '—'}</p>
    </div>
  );
}

