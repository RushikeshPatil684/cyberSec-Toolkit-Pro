import React, { useRef, useState } from 'react';
import { Download, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import ExpandableResult from './ExpandableResult';
import { useReports } from '../contexts/ReportContext';
import Breadcrumb from './Breadcrumb';

/**
 * Generic layout for dedicated tool pages. Handles input, caching, export, and save.
 */
export default function ToolPageLayout({
  title,
  subtitle,
  inputLabel,
  placeholder,
  example,
  runLabel = 'Run Scan',
  inputType = 'text',
  onRun,
  normalizeResult,
  toolKey,
  disabledHint,
}) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const cacheRef = useRef(new Map()); // Local cache keeps repeated runs instant; replace with dataset-backed cache later if needed.
  const { saveReport } = useReports();

  const sanitizedValue = inputValue.trim();

  const handleRun = async () => {
    if (!sanitizedValue) {
      setError('Enter a valid value first.');
      return;
    }

    if (cacheRef.current.has(sanitizedValue)) {
      setResult(cacheRef.current.get(sanitizedValue));
      setFromCache(true);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setFromCache(false);

    try {
      const raw = await onRun(sanitizedValue);
      const normalized = normalizeResult ? normalizeResult(raw, sanitizedValue) : raw;
      cacheRef.current.set(sanitizedValue, normalized);
      setResult(normalized);
    } catch (err) {
      setError(err?.message || 'Unable to run the tool right now.');
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
    link.download = `${toolKey || 'report'}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleSave = async () => {
    if (!result) {
      toast.info('Run the tool before saving.');
      return;
    }

    try {
      console.log('[ToolPageLayout] Manual save triggered', { tool: toolKey || title, hasResult: !!result });
      const docId = await saveReport({ tool: toolKey || title, result, input: inputValue });
      if (docId) {
        console.log('[ToolPageLayout] Report saved with ID:', docId);
        // Note: toast is already shown by saveReport
      } else {
        console.warn('[ToolPageLayout] saveReport returned null');
      }
    } catch (err) {
      console.error('[ToolPageLayout] Save error:', err);
      toast.error(err?.message || 'Unable to save right now.');
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#05060f]/95 p-6 sm:p-10 shadow-[0_35px_120px_rgba(5,8,22,0.8)]">
      <div className="space-y-6">
        <Breadcrumb toolName={title} />
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Recon utility</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{title}</h1>
          <p className="text-slate-300 max-w-3xl">{subtitle}</p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <label className="text-sm text-slate-300">
            {inputLabel}
            {example && <span className="text-xs text-slate-500 block">Example: {example}</span>}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type={inputType}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder={placeholder}
              className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={handleRun}
              disabled={loading || Boolean(disabledHint)}
              className="min-w-[160px] rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Running…' : runLabel}
            </button>
          </div>
          {disabledHint && (
            <p className="text-sm text-amber-300 flex items-center gap-2">
              <AlertCircle size={16} /> {disabledHint}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

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
            <ExpandableResult data={result} title="Result" maxPreviewLines={12} />
          </div>
        )}
      </div>
    </section>
  );
}

