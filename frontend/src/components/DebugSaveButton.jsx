
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useReports } from '../contexts/ReportContext';

export default function DebugSaveButton() {
  const { saveReport } = useReports();
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    if (saving) return;
    setSaving(true);
    console.log('[DebugSaveButton] saveReport called');
    toast.info('Debug save running…', { toastId: 'debug-save' });

    try {
      const id = await saveReport({
        tool: 'debug',
        result: { ok: true, message: 'Debug button data', ts: new Date().toISOString() },
      });
      console.log('[DebugSaveButton] saveReport returned id', id);
      toast.update('debug-save', {
        render: id ? `Debug report saved (${id})` : 'Debug report saved',
        type: 'success',
        autoClose: 2500,
      });
    } catch (err) {
      console.error('[DebugSaveButton] Save failed', err);
      toast.update('debug-save', {
        render: 'Debug save failed — check console',
        type: 'error',
        autoClose: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="px-3 py-1 rounded-md border border-dashed border-cyan-300 text-xs text-cyan-200 disabled:opacity-50"
    >
      {saving ? 'Saving…' : 'Debug Save'}
    </button>
  );
}
