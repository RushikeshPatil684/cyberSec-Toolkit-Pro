import React, { useState } from 'react';
import axios from 'axios';
import { Copy, Download, Save, AlertCircle, CheckCircle, XCircle, Clock, TestTube } from 'lucide-react';
import { toast } from 'react-toastify';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import { apiUrl } from '../../config/api';
import { useReports } from '../../contexts/ReportContext';

const HOST_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}:\d+$/;

export default function SslCheck() {
  const { saveReport } = useReports();
  const [host, setHost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const validateHost = (input) => {
    if (!input.trim()) {
      return { valid: false, message: 'Please enter a hostname' };
    }
    // Allow host:port format
    const parts = input.split(':');
    const hostPart = parts[0];
    if (parts.length > 1) {
      const portPart = parts[1];
      if (!/^\d+$/.test(portPart) || parseInt(portPart) < 1 || parseInt(portPart) > 65535) {
        return { valid: false, message: 'Invalid port number (1-65535)' };
      }
    }
    // Basic hostname validation
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9\-\.]{0,61}[a-zA-Z0-9])?$/.test(hostPart) && !/^\d+\.\d+\.\d+\.\d+$/.test(hostPart)) {
      return { valid: false, message: 'Invalid hostname format' };
    }
    return { valid: true };
  };

  const handleRun = async () => {
    const validation = validateHost(host);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parse host:port
      const parts = host.split(':');
      const hostname = parts[0];
      const port = parts.length > 1 ? parseInt(parts[1]) : 443;

      const res = await axios.post(apiUrl('/api/ssl/check'), {
        host: hostname,
        port: port,
      });

      setResult(res.data);
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 504) {
          setError('Connection timed out — try again or check host/port');
        } else if (status === 422) {
          setError('Certificate parsing failed — check host or try different port');
          // Still show partial result if available
          if (data && !data.error) {
            setResult(data);
          }
        } else if (status === 400) {
          setError(data?.error || 'Invalid input');
        } else {
          setError(data?.error || 'SSL check failed');
        }
      } else {
        setError('Network error — check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestExpired = () => {
    setHost('expired.badssl.com');
    setTimeout(() => handleRun(), 100);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      toast.success('Results copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExport = () => {
    if (!result) return;
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ssl_check_${result.domain}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Results exported');
    } catch {
      toast.error('Failed to export');
    }
  };

  const handleSave = async () => {
    if (!result) {
      toast.info('Run a check before saving');
      return;
    }
    try {
      const id = await saveReport({
        tool: 'ssl-check',
        result: result,
      });
      if (id) {
        console.log('[SslCheck] Report saved with ID:', id);
        toast.success('Report saved');
      } else {
        toast.info('Login to save reports');
      }
    } catch (err) {
      console.error('[SslCheck] saveReport error:', err);
      toast.error('Failed to save report');
    }
  };

  const getDaysRemainingColor = (days) => {
    if (days === null || days === undefined) return 'text-slate-400';
    if (days <= 0) return 'text-red-400';
    if (days < 30) return 'text-amber-400';
    return 'text-green-400';
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString();
    } catch {
      return isoStr;
    }
  };

  return (
    <>
      <SEO title="SSL Certificate Checker" description="Validate TLS certificates, chains, and expiration dates." />
      <PageWrapper>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
          <section className="rounded-3xl border border-white/10 bg-[#05060f]/95 p-6 sm:p-10 shadow-[0_35px_120px_rgba(5,8,22,0.8)]">
            <header className="space-y-2 mb-6">
              <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">TLS Certificate Inspector</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">SSL Certificate Checker</h1>
              <p className="text-slate-300 max-w-3xl">
                Validate certificate chains, check expiration dates, and inspect certificate details with full error handling.
              </p>
            </header>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
              <label className="text-sm text-slate-300">
                Host (domain or IP, optional :port)
                <span className="text-xs text-slate-500 block">Example: example.com or example.com:8443</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={host}
                  onChange={(e) => {
                    setHost(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleRun()}
                  placeholder="example.com"
                  disabled={loading}
                  className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none disabled:opacity-50"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleRun}
                    disabled={loading || !host.trim()}
                    className="min-w-[160px] rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {loading ? 'Checking…' : 'Check SSL'}
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={handleTestExpired}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 px-4 py-3 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-40"
                      title="Test with expired certificate"
                    >
                      <TestTube size={16} /> Test cert
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {result && (
              <div className="space-y-4 mt-6">
                {/* Status Badges */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Validity</p>
                    <div className="flex items-center gap-2">
                      {result.valid ? (
                        <>
                          <CheckCircle size={20} className="text-green-400" />
                          <span className="text-green-400 font-semibold">Valid</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={20} className="text-red-400" />
                          <span className="text-red-400 font-semibold">Expired</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Chain</p>
                    <div className="flex items-center gap-2">
                      {result.chain_valid === true ? (
                        <>
                          <CheckCircle size={20} className="text-green-400" />
                          <span className="text-green-400 font-semibold">Valid</span>
                        </>
                      ) : result.chain_valid === false ? (
                        <>
                          <XCircle size={20} className="text-red-400" />
                          <span className="text-red-400 font-semibold">Invalid</span>
                        </>
                      ) : (
                        <>
                          <Clock size={20} className="text-amber-400" />
                          <span className="text-amber-400 font-semibold">Not checked</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Days Remaining</p>
                    <p className={`text-lg font-semibold ${getDaysRemainingColor(result.days_remaining)}`}>
                      {result.days_remaining !== null && result.days_remaining !== undefined
                        ? `${result.days_remaining} days`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Domain</p>
                    <p className="text-white">{result.domain}:{result.port}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Serial</p>
                    <p className="text-white font-mono text-sm">{result.serial || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Issued</p>
                    <p className="text-white text-sm">{formatDate(result.issued)}</p>
                    {result.issued && <p className="text-xs text-slate-400 mt-1">{result.issued}</p>}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Expires</p>
                    <p className="text-white text-sm">{formatDate(result.expires)}</p>
                    {result.expires && <p className="text-xs text-slate-400 mt-1">{result.expires}</p>}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Issuer</p>
                    <p className="text-white text-sm break-words">{result.issuer || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Subject</p>
                    <p className="text-white text-sm break-words">{result.subject || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-2">Signature Algorithm</p>
                    <p className="text-white font-mono text-sm">{result.signature_algorithm || '—'}</p>
                  </div>
                </div>

                {/* SANs */}
                {result.san && result.san.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-3">Subject Alternative Names</p>
                    <div className="flex flex-wrap gap-2">
                      {result.san.map((name, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-sm border border-cyan-400/30"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.4em] text-amber-300 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Warnings
                    </p>
                    <ul className="space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx} className="text-sm text-amber-200">• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    {showRaw ? 'Hide' : 'Show'} Raw JSON
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    <Copy size={16} /> Copy
                  </button>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                  >
                    <Download size={16} /> Export JSON
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/10"
                  >
                    <Save size={16} /> Save Report
                  </button>
                </div>

                {/* Raw JSON */}
                {showRaw && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </PageWrapper>
    </>
  );
}

