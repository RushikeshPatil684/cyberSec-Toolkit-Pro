import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <>
      <SEO title="404 - CyberSec Toolkit Pro" description="Error 404: Page breached or not found." />
      <PageWrapper>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="terminal max-w-2xl w-full text-center"
          >
            <p className="text-sm text-cyan-400 uppercase tracking-[0.4em] mb-4">
              Error 404
            </p>
            <h1 className="text-3xl font-semibold mb-4">
              Page Breached or Not Found
            </h1>
            <p className="text-slate-400 mb-8">
              The resource you attempted to access has been quarantined or no longer exists.
              Return to the command center and resume operations.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10 transition tracking-[0.3em] text-xs uppercase"
            >
              Go Back Home
            </Link>
          </motion.div>
        </div>
      </PageWrapper>
    </>
  );
}

