import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * ExpandableResult Component
 * Displays large JSON/data outputs in a collapsible card with copy/download functionality
 */
export default function ExpandableResult({ data, title = 'Result', maxPreviewLines = 3 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const dataString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const lines = dataString.split('\n');
  const previewLines = lines.slice(0, maxPreviewLines);
  const hasMore = lines.length > maxPreviewLines;
  const previewText = previewLines.join('\n') + (hasMore ? '\n...' : '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dataString);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started');
  };

  return (
    <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-white/10 rounded transition"
            aria-label="Copy to clipboard"
            title="Copy"
          >
            <Copy size={16} className={isCopied ? 'text-green-400' : ''} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white/10 rounded transition"
            aria-label="Download JSON"
            title="Download"
          >
            <Download size={16} />
          </button>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/10 rounded transition flex items-center gap-1"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="text-xs">{isExpanded ? 'Collapse' : 'Show More'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.pre
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 text-green-400 text-xs overflow-x-auto max-h-[600px] overflow-y-auto break-words whitespace-pre-wrap"
            >
              {dataString}
            </motion.pre>
          ) : (
            <motion.pre
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-4 text-green-400 text-xs overflow-x-auto break-words whitespace-pre-wrap"
            >
              {previewText}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

