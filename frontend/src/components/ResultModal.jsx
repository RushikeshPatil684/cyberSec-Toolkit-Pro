import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultModal({ isOpen, onClose, title, data }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 dark:bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 dark:bg-gray-800 bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        >
          <div className="sticky top-0 bg-gray-900 dark:bg-gray-900 bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-700 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-white dark:text-white text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white dark:hover:text-white transition text-2xl leading-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <pre className="text-sm text-gray-300 dark:text-gray-300 text-gray-700 whitespace-pre-wrap font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

