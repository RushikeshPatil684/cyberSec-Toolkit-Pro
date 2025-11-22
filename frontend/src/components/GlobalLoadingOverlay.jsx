import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalLoadingOverlay() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 backdrop-blur-md bg-[#050816]/75 flex flex-col items-center justify-center text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-14 h-14 rounded-full border-2 border-cyan-400 border-t-transparent"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Initializing Secure Environment…</p>
            <p className="text-xs text-slate-500 mt-2">Syncing telemetry & verifying session integrity</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

