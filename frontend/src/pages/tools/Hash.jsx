import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Save, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ExpandableResult from '../../components/ExpandableResult';
import { useReports } from '../../contexts/ReportContext';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { apiUrl } from '../../config/api';

const algorithms = ['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512'];

export default function Hash() {
  const [text, setText] = useState('');
  const [alg, setAlg] = useState('sha256');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const cacheRef = useRef(new Map()); // Local cache keeps recent {alg,text} combos ready for instant reuse.
  const { saveReport } = useReports();

  const handleRun = async () => {
    const sanitizedText = sanitizeInput(text, 'text');
    if (!sanitizedText) {
      setError('Enter the string you want to hash.');
      return;
    }

    const key = `${alg}:${sanitizedText}`;

    if (cacheRef.current.has(key)) {
      setResult(cacheRef.current.get(key));
      setFromCache(true);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setFromCache(false);

    try {
      const res = await axios.post(apiUrl('/api/tools/hash'), { text: sanitizedText, alg });
      const normalized = {
        algorithm: res.data?.algorithm || alg,
        digest: res.data?.hash || res.data?.digest || '',
        length: (res.data?.hash || '').length * 4,
        preview: sanitizedText.slice(0, 60),
        raw: res.data,
      };
      // Dataset hook: connect offline rainbow-tables here for future collision analysis.
      cacheRef.current.set(key, normalized);
      setResult(normalized);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Unable to generate hash.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `hash_${result.algorithm}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleSave = async () => {
    if (!result) {
      toast.info('Generate a hash before saving.');
      return;
    }
    try {
      await saveReport({ tool: `hash-${result.algorithm}`, result });
      toast.success('Report saved');
    } catch (err) {
      toast.error(err?.message || 'Unable to save right now.');
    }
  };

  return (
    <>
      <SEO title="Hash Generator" description="Generate cryptographic hashes using multiple algorithms." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <section className="rounded-3xl border border-white/10 bg-[#05060f]/95 p-6 sm:p-10 shadow-[0_35px_120px_rgba(5,8,22,0.8)] space-y-6">
            <header className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Digest utility</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Hash Generator</h1>
              <p className="text-slate-300 max-w-3xl">
                Produce hashes for payload validation or integrity checks. Choose the algorithm that matches your workflow.
              </p>
            </header>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="flex flex-col text-sm text-slate-300">
                  Algorithm
                  <select
                    value={alg}
                    onChange={(e) => setAlg(e.target.value)}
                    disabled={loading}
                    className="mt-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-white focus:border-cyan-400/60 focus:outline-none"
                  >
                    {algorithms.map((algo) => (
                      <option key={algo} value={algo}>
                        {algo.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-3 flex flex-col text-sm text-slate-300">
                  Value to hash
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleRun()}
                    placeholder="Paste or type the content you want to hash"
                    disabled={loading}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleRun}
                  disabled={loading || !text.trim()}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {loading ? 'Generating…' : 'Generate Hash'}
                </button>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

            {result && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-cyan-400/60"
                  >
                    <Download size={16} /> Export JSON
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300"
                  >
                    <Save size={16} /> Save Report
                  </button>
                  {fromCache && (
                    <span className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
                      Cached
                    </span>
                  )}
                </div>
                <ExpandableResult data={result} title="Hash Result" maxPreviewLines={10} />
              </div>
            )}
          </section>
        </div>
      </PageWrapper>
    </>
  );
}
