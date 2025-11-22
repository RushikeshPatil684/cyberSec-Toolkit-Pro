import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import SEO from '../components/SEO';
import Loader from '../components/Loader';
import ExpandableResult from '../components/ExpandableResult';
import { useReports } from '../contexts/ReportContext';

export default function Reports() {
  const { reports, loadingReports, deleteReport, saveReport } = useReports();
  const [filters, setFilters] = useState({ tool: 'all', search: '' });

  const toolOptions = useMemo(() => {
    return Array.from(new Set(reports.map((report) => report.tool).filter(Boolean)));
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const matchesTool = filters.tool === 'all' || report.tool === filters.tool;
        const search = filters.search.trim().toLowerCase();
        if (!search) return matchesTool;

        const haystack = `${report.tool || ''} ${JSON.stringify(report.result || {})}`.toLowerCase();
        return matchesTool && haystack.includes(search);
      })
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [reports, filters]);

  const handleDelete = async (reportId) => {
    if (!reportId) return;
    const confirmation = window.confirm('Delete this report? This cannot be undone.');
    if (!confirmation) return;
    await deleteReport(reportId);
  };

  return (
    <>
      <SEO title="Reports" description="Browse every recon run saved to Firestore." />
      <PageWrapper>
        <section className="rounded-3xl border border-white/10 bg-[#05060f] p-6 sm:p-10 shadow-[0_35px_120px_rgba(5,8,22,0.5)]">
          <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Saved output</p>
                <h1 className="mt-2 text-3xl font-bold text-white">Reports</h1>
                <p className="text-slate-400 max-w-2xl">
                  Every successful tool run saves a copy here. Filter by tool, search inside JSON, and export the results you need.
                </p>
              </div>
              {/* Dev-only debug button */}
              {process.env.NODE_ENV !== 'production' && (
                <button
                  onClick={async () => {
                    console.log('[Reports] [DEV] Debug save test triggered');
                    try {
                      const testId = await saveReport({
                        tool: 'debug-test',
                        input: 'test-input',
                        result: { test: true, timestamp: new Date().toISOString() }
                      });
                      console.log('[Reports] [DEV] Debug save returned:', testId);
                      if (testId) {
                        toast.success(`Debug save SUCCESS (ID: ${testId})`);
                      } else {
                        toast.error('Debug save FAILED (returned null)');
                      }
                    } catch (err) {
                      console.error('[Reports] [DEV] Debug save error:', err);
                      toast.error('Debug save FAILED: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold text-cyan-300 border border-cyan-400/40 rounded-lg hover:bg-cyan-500/10"
                >
                  [DEV] Debug Save
                </button>
              )}
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-sm text-slate-300">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Search</span>
                <input
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  placeholder="ip, domain, cve..."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-400/60 focus:outline-none"
                />
              </label>
              <label className="text-sm text-slate-300">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Tool</span>
                <select
                  value={filters.tool}
                  onChange={(e) => setFilters((prev) => ({ ...prev, tool: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400/60 focus:outline-none"
                >
                  <option value="all" className="bg-[#05060f] text-white">
                    All
                  </option>
                  {toolOptions.map((tool) => (
                    <option key={tool} value={tool} className="bg-[#05060f] text-white">
                      {tool}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Total</p>
                <p className="text-2xl font-semibold text-white">{reports.length}</p>
              </div>
            </div>

            {loadingReports ? (
              <div className="flex items-center gap-3 text-slate-300">
                <Loader size={24} />
                Syncing reports…
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-slate-400">
                No reports match the current filters.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredReports.map((report) => {
                  const createdLabel = report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Pending timestamp';

                  return (
                    <motion.article
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{report.tool || 'unknown'}</p>
                          <p className="text-sm text-slate-400">{createdLabel}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/5 bg-black/30 p-3">
                        <ExpandableResult data={report.result || {}} title="Result" maxPreviewLines={8} />
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </PageWrapper>
    </>
  );
}
