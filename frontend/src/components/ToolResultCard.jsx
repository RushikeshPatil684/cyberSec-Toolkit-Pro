import React, { useState } from 'react';
import { Copy, Download, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useReports } from '../contexts/ReportContext';

/**
 * Shared component for displaying normalized tool results
 * @param {Object} props
 * @param {string} props.title - Result title
 * @param {string} props.subtitle - Optional subtitle
 * @param {Object} props.normalized - Normalized result data
 * @param {Object} props.raw - Raw API response
 * @param {string} props.toolKey - Tool identifier for saving reports
 */
export default function ToolResultCard({ title, subtitle, normalized, raw, toolKey }) {
  const { saveReport } = useReports();
  const [showRaw, setShowRaw] = useState(false);
  const [isEnriched, setIsEnriched] = useState(false);

  // Check if result is enriched (has enrichment markers)
  React.useEffect(() => {
    if (normalized?.enriched || raw?.enriched) {
      setIsEnriched(true);
    }
  }, [normalized, raw]);

  const handleCopy = async () => {
    try {
      const text = JSON.stringify(normalized || raw, null, 2);
      await navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(normalized || raw, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${toolKey || 'result'}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Results exported');
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  const handleSaveReport = async () => {
    if (!saveReport) {
      toast.info('Login to save reports');
      return;
    }

    try {
      const id = await saveReport({
        tool: toolKey || 'unknown',
        result: normalized || raw,
      });
      if (id) {
        console.log('[ToolResultCard] Report saved with ID:', id);
        toast.success('Report saved');
      } else {
        console.warn('[ToolResultCard] saveReport returned null');
        toast.info('Login to save reports');
      }
    } catch (error) {
      console.error('[ToolResultCard] saveReport error:', error);
      toast.error('Failed to save report');
    }
  };

  // Convert normalized object to key-value pairs for display
  const formatDataForDisplay = (data) => {
    if (!data || typeof data !== 'object') return [];
    const pairs = [];
    const skipKeys = ['raw', 'normalized', 'enriched', 'error'];

    const processValue = (value) => {
      if (value === null || value === undefined) return '—';
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '—';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    for (const [key, value] of Object.entries(data)) {
      if (skipKeys.includes(key)) continue;
      pairs.push({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value: processValue(value),
      });
    }
    return pairs;
  };

  const displayData = formatDataForDisplay(normalized || raw);

  if (!normalized && !raw) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#060a1c]/90 backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          {isEnriched && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded">
              Enriched
            </span>
          )}
        </div>
      </div>

      {normalized?.error || raw?.error ? (
        <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          ⚠ {normalized?.error || raw?.error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {displayData.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-sm text-white break-words">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showRaw ? 'Hide' : 'Show'} Raw JSON
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              <Copy size={16} /> Copy Results
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              <Download size={16} /> Export JSON
            </button>
            <button
              onClick={handleSaveReport}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10"
            >
              <Save size={16} /> Save Report
            </button>
          </div>

          {showRaw && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <pre className="text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(raw || normalized, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

