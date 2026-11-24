import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import AdminPasswordModal from '../components/admin/AdminPasswordModal';
import type { ParticipantRecord } from '../types';
import { createParticipantRecord, logEvent } from '../utils/records';
import { buildSurveyLink, nowIso, recordToLinkSeed } from '../utils/id';
import { downloadCsv, imageMetadataRows, parseParticipantImport, participantRegistryRows, surveyDataRows } from '../utils/csv';
import { putParticipants, ensureCounterAtLeast, nextParticipantNumber } from '../utils/storage';

function statusLabel(s: string) {
  return ({ not_started: 'Not Started', in_progress: 'In Progress', draft_saved: 'Draft Saved', changes_requested: 'Changes Requested', reopened: 'Reopened', approved: 'Approved', locked: 'Locked', forwarded: 'Forwarded' } as Record<string,string>)[s] || s;
}
function statusClass(s: string) {
  if (s === 'approved' || s === 'locked' || s === 'forwarded') return 'bg-olive-pale text-olive border-olive/15';
  if (s === 'changes_requested') return 'bg-[#FFF6E8] text-[#9A5A00] border-[#E8CFA8]';
  return 'bg-[#F3F3F3] text-charcoal-soft border-border';
}

export default function ManagePage() {
  const { participants, loading, admin, unlockAdmin, lockAdmin, createParticipants, createImportedParticipants, saveParticipant, refresh, resetAllData } = useApp();
  const [pwOpen, setPwOpen] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState('all');
  const [bulkCount, setBulkCount] = useState('10');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [importRows, setImportRows] = useState<{ name?: string; phone?: string; email?: string; country?: string; region?: string; errors: string[] }[] | null>(null);
  const [recent, setRecent] = useState<ParticipantRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const baseUrl = window.location.origin;

  const flash = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 3500); };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return participants.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (linkFilter !== 'all' && p.linkStatus !== linkFilter) return false;
      if (!query) return true;
      const hay = [p.participantId, p.token, p.participantInfo.country, p.participantInfo.region, p.participantInfo.contactValue, p.importedName, p.importedPhone].join(' ').toLowerCase();
      return hay.includes(query);
    });
  }, [participants, q, statusFilter, linkFilter]);

  const stats = useMemo(() => {
    const total = participants.length;
    const by = (s: string) => participants.filter(p => p.status === s).length;
    const images = participants.reduce((acc, p) => acc + p.images.filter(i => i.dataUrl && !i.reviewRejected).length, 0);
    return { total, notStarted: by('not_started'), drafts: by('draft_saved') + by('in_progress'), changes: by('changes_requested'), approved: by('approved') + by('locked') + by('forwarded'), closed: participants.filter(p => p.linkStatus === 'closed').length, images };
  }, [participants]);

  const ensureAdmin = () => { if (!admin.unlocked) { setPwOpen(true); return false; } return true; };

  const onGenerateOne = async () => {
    if (!ensureAdmin()) return;
    setBusy('generate');
    try { const [r] = await createParticipants(1); setRecent(prev => [r, ...prev].slice(0, 20)); flash(`Generated ${r.participantId}.`); }
    finally { setBusy(''); }
  };

  const onGenerateBulk = async () => {
    if (!ensureAdmin()) return;
    const n = Math.max(1, Math.min(5000, parseInt(bulkCount || '0', 10) || 0));
    setBusy('bulk');
    try { const created = await createParticipants(n); setRecent(prev => [...created.reverse(), ...prev].slice(0, 20)); flash(`Generated ${n} participant link${n===1?'':'s'}.`); }
    finally { setBusy(''); }
  };

  const onImportFile = async (file?: File) => {
    if (!file || !ensureAdmin()) return;
    setBusy('import');
    try {
      const rows = await parseParticipantImport(file);
      setImportRows(rows);
    } catch (e: any) {
      alert(e?.message || 'Failed to parse file.');
    } finally { setBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };

  const confirmImport = async () => {
    if (!importRows || !ensureAdmin()) return;
    const valid = importRows.filter(r => r.errors.length === 0);
    if (valid.length === 0) { alert('No valid rows to import.'); return; }
    setBusy('import');
    try {
      const created = await createImportedParticipants(valid.map(r => ({ name: r.name, phone: r.phone, email: r.email, country: r.country, region: r.region })));
      setRecent(prev => [...created.reverse(), ...prev].slice(0, 20));
      flash(`Imported ${valid.length} participant record${valid.length===1?'':'s'}.`);
      setImportRows(null);
    } finally { setBusy(''); }
  };

  const copyText = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); flash(`${label} copied.`); } catch { alert('Copy failed. Please copy manually.'); }
  };

  const toggleLink = async (r: ParticipantRecord) => {
    if (!ensureAdmin()) return;
    const closing = r.linkStatus === 'active';
    await saveParticipant({ ...r, linkStatus: closing ? 'closed' : 'active', lastActivityAt: nowIso(), activity: [...r.activity, logEvent('administrator', closing ? 'Link closed' : 'Link reopened')] });
    flash(`${r.participantId} link ${closing ? 'closed' : 'reopened'}.`);
  };

  const exportRegistry = () => downloadCsv(participantRegistryRows(filtered, baseUrl), 'participant-registry.csv');
  const exportSurvey = () => downloadCsv(surveyDataRows(filtered), 'survey-data.csv');
  const exportImages = () => downloadCsv(imageMetadataRows(filtered), 'image-metadata.csv');

  const openPreviewSurvey = async () => {
    if (!ensureAdmin()) return;
    setBusy('preview');
    try {
      const [r] = await createParticipants(1, { isDemo: true });
      setRecent(prev => [r, ...prev].slice(0, 20));
      window.open(buildSurveyLink(r.token, recordToLinkSeed(r)), '_blank', 'noopener,noreferrer');
      flash(`Preview survey opened (${r.participantId}).`);
    } finally { setBusy(''); }
  };

  const createDemo = async (kind: 'complete' | 'incomplete' | 'new') => {
    if (!ensureAdmin()) return;
    setBusy('demo');
    try {
      if (kind === 'new') { await createParticipants(1, { isDemo: true }); flash('New demo participant created.'); return; }
      // create complete/incomplete demo manually
      const seq = await nextParticipantNumber();
      const rec = createParticipantRecord(seq, { isDemo: true });
      rec.importedName = kind === 'complete' ? 'Demo Complete Participant' : 'Demo Incomplete Participant';
      rec.participantInfo = {
        ageGroup: '25–34', gender: 'Female', region: 'Africa / Middle East', country: 'Nigeria',
        preferredContactMethod: 'Email', contactValue: kind === 'complete' ? 'demo.participant@example.com' : '',
      };
      rec.consent = { ageEligible: true, consentResearch: true, consentPermission: kind === 'complete' };
      rec.status = kind === 'complete' ? 'draft_saved' : 'in_progress';
      // add demo images as small SVG data urls
      const demoImg = (label: string, color: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='28'>${label}</text></svg>`)}`;
      const fill = (group: 'neutral'|'head_pose'|'historical', n: number) => {
        let c = 0;
        for (const img of rec.images) {
          if (img.group !== group || c >= n) continue;
          img.dataUrl = demoImg(img.slotLabel, group === 'neutral' ? '#C62828' : group === 'head_pose' ? '#991B1B' : '#444444');
          img.fileName = `${img.slotKey}.svg`;
          img.mimeType = 'image/svg+xml';
          img.sizeBytes = 1200;
          img.uploadedAt = nowIso();
          if (group === 'historical') {
            img.metadata = { ...img.metadata, title: `Historical photo ${c+1}`, approxYear: '1975', location: 'Lagos, Nigeria', category: 'Community', customCategory: '', contextualInfo: 'Demonstration historical image.', notes: '' };
          }
          c++;
        }
      };
      if (kind === 'complete') { fill('neutral', 2); fill('head_pose', 2); fill('historical', 5); }
      else { fill('neutral', 1); fill('head_pose', 1); fill('historical', 2); }
      rec.activity.push(logEvent('system', 'Demo record created', kind === 'complete' ? 'Complete demonstration participant.' : 'Incomplete demonstration participant.'));
      await putParticipants([rec]);
      await ensureCounterAtLeast(seq);
      await refresh();
      flash(kind === 'complete' ? 'Complete demo participant created.' : 'Incomplete demo participant created.');
    } finally { setBusy(''); }
  };

  if (!admin.unlocked) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-border-light rounded-lg p-8 text-center shadow-sm">
          <p className="text-[11px] tracking-[0.24em] uppercase text-bronze font-medium mb-2">Fieldwork Africa</p>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Management utility</h1>
          <p className="text-sm text-muted leading-relaxed mb-6">This area is protected. Enter the administrative password to manage participant links, records, and exports.</p>
          <button type="button" onClick={() => setPwOpen(true)} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-5 py-2.5 text-sm font-medium hover:bg-olive-light transition">Unlock management</button>
        </div>
        <AdminPasswordModal open={pwOpen} onClose={() => setPwOpen(false)} onUnlock={(pw) => { const ok = unlockAdmin(pw); if (ok) setPwOpen(false); return ok; }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="border-b border-border-light bg-cream/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.24em] uppercase text-bronze font-medium">Fieldwork Africa</p>
            <h1 className="font-serif text-2xl sm:text-3xl text-charcoal leading-tight">Survey management</h1>
          </div>
          <div className="flex items-center gap-2">
            {msg && <span className="text-xs text-olive font-medium">{msg}</span>}
            <button type="button" onClick={() => void openPreviewSurvey()} disabled={busy === 'preview'} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light transition disabled:opacity-60">Preview Participant Survey</button>
            <button type="button" onClick={lockAdmin} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Lock admin</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[['Participants', stats.total],['Not started', stats.notStarted],['Drafts/In progress', stats.drafts],['Changes requested', stats.changes],['Approved/Locked', stats.approved],['Closed links', stats.closed],['Images collected', stats.images]].map(([label, val]) => (
            <div key={String(label)} className="bg-white border border-border-light rounded-lg px-4 py-4">
              <p className="text-[11px] uppercase tracking-wider text-muted mb-1">{label}</p>
              <p className="font-serif text-2xl text-charcoal">{val}</p>
            </div>
          ))}
        </div>

        <div className="grid xl:grid-cols-3 gap-6">
          <div className="bg-white border border-border-light rounded-lg p-5 space-y-4">
            <h2 className="font-serif text-xl text-charcoal">Generate links</h2>
            <div className="flex gap-2">
              <button type="button" onClick={onGenerateOne} disabled={busy==='generate'} className="flex-1 inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2.5 text-sm font-medium hover:bg-olive-light transition disabled:opacity-60">Generate one</button>
            </div>
            <div className="flex gap-2">
              <input value={bulkCount} onChange={e => setBulkCount(e.target.value)} type="number" min={1} max={5000} className="w-28 rounded-md border border-border px-3 py-2.5 text-sm" />
              <button type="button" onClick={onGenerateBulk} disabled={busy==='bulk'} className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition disabled:opacity-60">Bulk generate</button>
            </div>
            <div className="border-t border-border-light pt-4">
              <p className="text-sm font-medium text-charcoal mb-2">Import spreadsheet</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-charcoal hover:file:bg-ivory-deep/40" onChange={e => void onImportFile(e.target.files?.[0])} />
              <p className="text-[11px] text-muted mt-2">CSV or Excel-compatible. Columns: name, phone/email, country, region (optional).</p>
            </div>
            {recent.length > 0 && (
              <div className="border-t border-border-light pt-4">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-charcoal">Recently generated</p><button type="button" onClick={()=>setRecent([])} className="text-xs text-muted hover:text-charcoal">Clear</button></div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {recent.map(r => (
                    <div key={r.participantId} className="flex items-center justify-between gap-2 text-xs border border-border-light rounded-md px-2.5 py-2 bg-ivory/30">
                      <div className="min-w-0"><p className="font-mono text-charcoal">{r.participantId}</p><p className="text-muted truncate">{buildSurveyLink(r.token, recordToLinkSeed(r), baseUrl)}</p></div>
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={() => void copyText(r.participantId,'ID')} className="px-2 py-1 rounded border border-border bg-white">ID</button>
                        <button type="button" onClick={() => void copyText(buildSurveyLink(r.token, recordToLinkSeed(r), baseUrl),'Link')} className="px-2 py-1 rounded border border-border bg-white">Link</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-border-light rounded-lg p-5 space-y-4">
            <h2 className="font-serif text-xl text-charcoal">Exports</h2>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => void copyText(filtered.map(r => `${r.participantId}\t${buildSurveyLink(r.token, recordToLinkSeed(r), baseUrl)}`).join('\n'), 'All links')} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Copy all filtered links</button>
              <button type="button" onClick={exportRegistry} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Export participant registry (CSV)</button>
              <button type="button" onClick={exportSurvey} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Export survey data (CSV)</button>
              <button type="button" onClick={exportImages} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Export image metadata (CSV)</button>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">Exports reflect the current filtered view. Image files are stored locally in the browser prototype; metadata export includes filenames and references.</p>
          </div>

          <div className="bg-white border border-border-light rounded-lg p-5 space-y-4">
            <h2 className="font-serif text-xl text-charcoal">Demo & tools</h2>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => void createDemo('new')} disabled={busy==='demo'} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Create new demo participant</button>
              <button type="button" onClick={() => void createDemo('incomplete')} disabled={busy==='demo'} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Create incomplete demo</button>
              <button type="button" onClick={() => void createDemo('complete')} disabled={busy==='demo'} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Create complete demo</button>
            </div>
            <div className="border-t border-border-light pt-4">
              <button type="button" onClick={async () => { if (confirm('Reset all local prototype data? This cannot be undone.')) { await resetAllData(); flash('All local data cleared.'); } }} className="text-sm text-danger hover:underline">Reset all local prototype data</button>
            </div>
          </div>
        </div>

        {importRows && (
          <div className="bg-white border border-border-light rounded-lg p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="font-serif text-xl text-charcoal">Import preview</h2><p className="text-sm text-muted">{importRows.length} row(s) found. {importRows.filter(r=>r.errors.length===0).length} valid.</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setImportRows(null)} className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium">Cancel</button>
                <button type="button" onClick={() => void confirmImport()} className="rounded-md bg-olive text-white px-4 py-2 text-sm font-medium hover:bg-olive-light">Import valid rows</button>
              </div>
            </div>
            <div className="overflow-auto max-h-64 border border-border-light rounded-md">
              <table className="w-full text-sm"><thead className="bg-ivory/50 text-muted"><tr><th className="text-left px-3 py-2 font-medium">Name</th><th className="text-left px-3 py-2 font-medium">Contact</th><th className="text-left px-3 py-2 font-medium">Country</th><th className="text-left px-3 py-2 font-medium">Errors</th></tr></thead>
                <tbody className="divide-y divide-border-light">{importRows.slice(0,100).map((r,i)=>(<tr key={i}><td className="px-3 py-2">{r.name||'—'}</td><td className="px-3 py-2">{r.email||r.phone||'—'}</td><td className="px-3 py-2">{r.country||'—'}</td><td className="px-3 py-2 text-danger">{r.errors.join(', ')||'—'}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}

        <div className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
            <div><h2 className="font-serif text-xl text-charcoal">Participant records</h2><p className="text-sm text-muted">{filtered.length} shown of {participants.length}.</p></div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ID, name, contact..." className="rounded-md border border-border px-3 py-2 text-sm w-full sm:w-56" />
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm"><option value="all">All statuses</option>{['not_started','in_progress','draft_saved','changes_requested','reopened','approved','locked','forwarded'].map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select>
              <select value={linkFilter} onChange={e=>setLinkFilter(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm"><option value="all">All links</option><option value="active">Active</option><option value="closed">Closed</option></select>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead className="bg-ivory/40 text-muted"><tr>
                <th className="text-left px-4 py-3 font-medium">Participant</th><th className="text-left px-4 py-3 font-medium">Region/Country</th><th className="text-left px-4 py-3 font-medium">Status</th><th className="text-left px-4 py-3 font-medium">Images</th><th className="text-left px-4 py-3 font-medium">Created</th><th className="text-left px-4 py-3 font-medium">Last activity</th><th className="text-left px-4 py-3 font-medium">Link</th><th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border-light">
                {loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">Loading...</td></tr> :
                 filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted">No participants found.</td></tr> :
                 filtered.map(r => {
                   const imgs = r.images.filter(i=>i.dataUrl && !i.reviewRejected).length;
                   const link = buildSurveyLink(r.token, recordToLinkSeed(r), baseUrl);
                   return (
                     <tr key={r.participantId} className="hover:bg-ivory/20">
                       <td className="px-4 py-3"><div className="font-medium text-charcoal font-mono text-xs">{r.participantId}</div><div className="text-xs text-muted truncate max-w-[220px]">{r.importedName || r.participantInfo.contactValue || '—'}</div></td>
                       <td className="px-4 py-3 text-charcoal-soft"><div>{r.participantInfo.country || '—'}</div><div className="text-xs text-muted">{r.participantInfo.region || '—'}</div></td>
                       <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-md border text-xs font-medium ${statusClass(r.status)}`}>{statusLabel(r.status)}</span></td>
                       <td className="px-4 py-3 text-charcoal-soft">{imgs}</td>
                       <td className="px-4 py-3 text-charcoal-soft text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                       <td className="px-4 py-3 text-charcoal-soft text-xs">{new Date(r.lastActivityAt).toLocaleDateString()}</td>
                       <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded-md border text-xs font-medium ${r.linkStatus==='active'?'bg-white text-charcoal-soft border-border':'bg-[#FFF6E8] text-[#9A5A00] border-[#E8CFA8]'}`}>{r.linkStatus}</span></td>
                       <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">
                         <a href={link} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Open</a>
                         <button type="button" onClick={() => void copyText(r.participantId, 'ID')} className="px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Copy ID</button>
                         <button type="button" onClick={() => void copyText(link, 'Link')} className="px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Copy link</button>
                         <button type="button" onClick={() => void toggleLink(r)} className="px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">{r.linkStatus==='active'?'Close':'Reopen'}</button>
                         <button type="button" onClick={() => downloadCsv(participantRegistryRows([r], baseUrl), `${r.participantId}.csv`)} className="px-2.5 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Export</button>
                       </div></td>
                     </tr>
                   );
                 })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">Prototype note: this management utility uses browser-local storage (IndexedDB). It is intended for demonstration and testing, not production data collection across devices.</p>
      </div>
      <AdminPasswordModal open={pwOpen && !admin.unlocked} onClose={() => setPwOpen(false)} onUnlock={(pw) => { const ok = unlockAdmin(pw); if (ok) setPwOpen(false); return ok; }} />
    </div>
  );
}
