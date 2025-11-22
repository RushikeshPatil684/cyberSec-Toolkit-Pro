import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader, Play } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import SEO from '../../components/SEO';
import ExpandableResult from '../../components/ExpandableResult';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../contexts/ReportContext';
import { sanitizeInput } from '../../utils/inputSanitizer';
import { apiUrl } from '../../config/api';

export default function ToolTemplate({ 
  title, 
  description, 
  icon: Icon, 
  iconColor,
  endpoint,
  method = 'POST',
  inputLabel,
  inputPlaceholder,
  inputType = 'text',
  scanType,
  buttonText = 'Scan Now'
}) {
  const { currentUser } = useAuth();
  const { saveReport } = useReports();
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validationType = () => {
    if (endpoint.includes('ipinfo')) return 'ip';
    if (endpoint.includes('whois') || endpoint.includes('dns') || endpoint.includes('subdomain') || endpoint.includes('ssl')) {
      return 'domain';
    }
    if (endpoint.includes('headers')) return 'url';
    if (endpoint.includes('breach')) return 'email';
    return 'text';
  };

  const handleScan = async () => {
    const sanitizedValue = sanitizeInput(input, validationType());
    if (!sanitizedValue) {
      setError(`Please enter a valid ${inputLabel.toLowerCase()}`);
      return;
    }

    if (sanitizedValue !== input) {
      setInput(sanitizedValue);
    }

    setLoading(true);
    setError('');
    setData(null);

    try {
      let res;
      const payload = method === 'POST' 
        ? (endpoint.includes('cve') ? { query: sanitizedValue } : 
           endpoint.includes('ipinfo') ? { ip: sanitizedValue } :
           endpoint.includes('whois') || endpoint.includes('dns') ? { domain: sanitizedValue } :
           endpoint.includes('subdomain') ? { domain: sanitizedValue } :
           endpoint.includes('ssl') ? { domain: sanitizedValue } :
           endpoint.includes('headers') ? { url: sanitizedValue } :
           endpoint.includes('breach') ? { email: sanitizedValue } :
           endpoint.includes('risk') ? { target: sanitizedValue } : { text: sanitizedValue })
        : { params: { query: sanitizedValue } };

      if (method === 'POST') {
        res = await axios.post(apiUrl(endpoint), payload);
      } else {
        res = await axios.get(apiUrl(endpoint), payload);
      }

      setData(res.data);

      // Auto-save report after successful scan (Firestore first, atomic UX)
      if (currentUser && res.data) {
        try {
          console.log('[ToolTemplate] Auto-saving report after scan...', { tool: scanType || 'tool', input: sanitizedValue });
          const docId = await saveReport({ tool: scanType || 'tool', result: res.data });
          if (docId) {
            console.log('[ToolTemplate] Report auto-saved with ID:', docId);
            // Note: UI will update automatically via onSnapshot in ReportContext
          } else {
            console.warn('[ToolTemplate] saveReport returned null (user may not be logged in)');
          }
        } catch (err) {
          console.error('[ToolTemplate] Auto-save failed:', err);
          // Don't show toast here - saveReport already handles user feedback
        }
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to perform scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={`${title} - CyberSec Toolkit Pro`} description={description} />
      <PageWrapper>
        <div className="min-h-[calc(100vh-4rem)] w-full py-8 relative overflow-x-hidden">
          <div className="absolute inset-0 cyber-grid opacity-20" />
          
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${iconColor} shadow-[0_0_20px_rgba(0,255,255,0.3)]`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 glow-text">{title}</h1>
                <p className="text-gray-400">{description}</p>
              </div>
            </div>

            <div className="hacker-card rounded-2xl p-6 mb-6">
              <label className="block text-sm font-medium text-cyan-400 mb-2">{inputLabel}</label>
              <div className="flex gap-3">
                <input
                  type={inputType}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  placeholder={inputPlaceholder}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#0F172A] border border-cyan-500/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                />
                <motion.button
                  onClick={handleScan}
                  disabled={loading || !input.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {buttonText}
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {(endpoint.includes('breach') || endpoint.includes('cve')) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300"
              >
                <p className="text-sm font-semibold mb-1">⚠️ Running in fallback mode</p>
                <p className="text-xs text-amber-200/80">
                  {endpoint.includes('breach') 
                    ? 'Using simplified breach check. For full email breach data, configure HIBP API v3 key in backend.'
                    : 'Using public NVD API (rate-limited). For production, configure NVD API key or use local dataset.'}
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400"
              >
                {error}
              </motion.div>
            )}

            {data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hacker-card rounded-2xl p-6"
              >
                <ExpandableResult
                  data={data}
                  title="Scan Result"
                  maxPreviewLines={10}
                />
              </motion.div>
            )}
          </motion.div>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

