import React from 'react';
import DebugSaveButton from '../components/DebugSaveButton';

const DEV_DEBUG =
  process.env.REACT_APP_ENABLE_DEBUG_SAVE === 'true' || process.env.NODE_ENV !== 'production';

export default function Debug() {
  if (!DEV_DEBUG) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-400">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Debug Tools</p>
        <h1 className="text-3xl font-semibold text-white mt-4">Debug route disabled</h1>
        <p className="mt-3 text-slate-400">
          Set <code className="bg-black/40 px-2 py-1 rounded">REACT_APP_ENABLE_DEBUG_SAVE=true</code> to enable this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="rounded-3xl border border-white/10 bg-[#050b1f]/80 p-8 backdrop-blur-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Developer</p>
          <h1 className="text-3xl font-bold">Debug Save Sandbox</h1>
          <p className="text-slate-400 mt-2">
            Use this surface to ensure Firestore + backend fallbacks behave correctly. Watch the console for logs.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DebugSaveButton />
          <code className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-200">
            console logs &amp; toast notifications enabled
          </code>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-100">
          <p>Tip: keep the browser console open and watch for:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-left">
            <li><code>ReportContext</code> mount/unmount</li>
            <li><code>ReportContext</code> snapshot updates</li>
            <li>Toast “New report received” messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

