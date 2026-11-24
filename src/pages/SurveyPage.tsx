import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { ParticipantRecord, SurveyImage } from '../types';
import AdminPasswordModal from '../components/admin/AdminPasswordModal';
import { canApprove, countTotalUploaded, getQualityChecks, logEvent } from '../utils/records';
import { nowIso } from '../utils/id';
import SurveyShell from '../components/survey/flow/SurveyShell';

export default function SurveyPage() {
  const { token = '' } = useParams();
  const { getByToken, saveParticipant, admin, unlockAdmin } = useApp();
  const [record, setRecord] = useState<ParticipantRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [adminModal, setAdminModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getByToken(token);
      if (!r) { setNotFound(true); setRecord(null); }
      else {
        setNotFound(false);
        // mark opened
        let next = r;
        if (r.status === 'not_started') {
          next = { ...r, status: 'in_progress', lastActivityAt: nowIso(), activity: [...r.activity, logEvent('participant', 'Participant opened survey')] };
          await saveParticipant(next);
        }
        setRecord(next);
      }
    } finally {
      setLoading(false);
    }
  }, [token, getByToken, saveParticipant]);

  useEffect(() => { void load(); }, [load]);

  const persist = useCallback(async (next: ParticipantRecord, msg?: string) => {
    setBusy(true);
    try {
      await saveParticipant(next);
      setRecord(next);
      if (msg) { setSaveMsg(msg); window.setTimeout(() => setSaveMsg(''), 3500); }
    } finally {
      setBusy(false);
    }
  }, [saveParticipant]);

  const isLockedForParticipant = useMemo(() => {
    if (!record) return false;
    const lockedStatus = record.status === 'approved' || record.status === 'locked' || record.status === 'forwarded';
    const reopenedTeamOnly = record.status === 'reopened' && !record.review.reopenedForParticipant;
    if (lockedStatus || reopenedTeamOnly) return !admin.unlocked;
    return false;
  }, [record, admin.unlocked]);

  const effectiveReadOnly = useMemo(() => {
    if (!record) return true;
    if (record.linkStatus === 'closed') return true;
    if (isLockedForParticipant) return true;
    return false;
  }, [record, isLockedForParticipant]);

  const saveDraft = useCallback(async () => {
    if (!record) return;
    if (record.linkStatus === 'closed') return;
    if (isLockedForParticipant) return;
    const next: ParticipantRecord = {
      ...record,
      status: record.status === 'not_started' || record.status === 'in_progress' ? 'draft_saved' : record.status === 'changes_requested' ? 'changes_requested' : record.status === 'reopened' ? 'reopened' : record.status,
      lastActivityAt: nowIso(),
      updatedAt: nowIso(),
      activity: [...record.activity, logEvent('participant', 'Draft saved', `Total images: ${countTotalUploaded(record.images)}.`)],
    };
    await persist(next, 'Draft saved successfully.');
  }, [record, isLockedForParticipant, persist]);

  const adminApprove = useCallback(async () => {
    if (!record || !admin.unlocked) return;
    if (!canApprove(record)) return;
    const next: ParticipantRecord = {
      ...record,
      status: 'approved',
      lastActivityAt: nowIso(),
      review: { ...record.review, approvedAt: nowIso(), approvedBy: 'Administrator', reviewedAt: nowIso() },
      activity: [...record.activity, logEvent('administrator', 'Submission approved and locked', 'Submission passed quality checks and was approved.')],
    };
    await persist(next, 'Submission approved and locked.');
  }, [record, admin.unlocked, persist]);

  const adminLock = useCallback(async () => {
    if (!record || !admin.unlocked) return;
    const next: ParticipantRecord = {
      ...record,
      status: 'locked',
      lastActivityAt: nowIso(),
      activity: [...record.activity, logEvent('administrator', 'Submission locked')],
    };
    await persist(next, 'Submission locked.');
  }, [record, admin.unlocked, persist]);

  const adminReopen = useCallback(async (forParticipant: boolean) => {
    if (!record || !admin.unlocked) return;
    const next: ParticipantRecord = {
      ...record,
      status: 'reopened',
      lastActivityAt: nowIso(),
      review: { ...record.review, reopenedAt: nowIso(), reopenedForParticipant: forParticipant },
      activity: [...record.activity, logEvent('administrator', 'Submission reopened', forParticipant ? 'Reopened for participant editing.' : 'Reopened for team-only editing.')],
    };
    await persist(next, forParticipant ? 'Submission reopened for participant editing.' : 'Submission reopened for team editing.');
  }, [record, admin.unlocked, persist]);

  const adminRequestCorrections = useCallback(async (instructions: string) => {
    if (!record || !admin.unlocked) return;
    const next: ParticipantRecord = {
      ...record,
      status: 'changes_requested',
      lastActivityAt: nowIso(),
      review: { ...record.review, correctionInstructions: instructions, reviewedAt: nowIso() },
      activity: [...record.activity, logEvent('administrator', 'Corrections requested', instructions ? instructions.slice(0, 160) : undefined)],
    };
    next.review.reopenedForParticipant = true;
    await persist(next, 'Corrections requested. Participant can update the survey.');
  }, [record, admin.unlocked, persist]);

  const adminCloseLink = useCallback(async () => {
    if (!record || !admin.unlocked) return;
    const next: ParticipantRecord = {
      ...record,
      linkStatus: 'closed',
      lastActivityAt: nowIso(),
      activity: [...record.activity, logEvent('administrator', 'Link closed')],
    };
    await persist(next, 'Participant link closed.');
  }, [record, admin.unlocked, persist]);

  const adminReopenLink = useCallback(async () => {
    if (!record || !admin.unlocked) return;
    const next: ParticipantRecord = {
      ...record,
      linkStatus: 'active',
      lastActivityAt: nowIso(),
      activity: [...record.activity, logEvent('administrator', 'Link reopened')],
    };
    await persist(next, 'Participant link reopened.');
  }, [record, admin.unlocked, persist]);

  const adminForward = useCallback(async () => {
    if (!record || !admin.unlocked) return;
    if (record.status !== 'approved' && record.status !== 'locked' && record.status !== 'forwarded') return;
    const next: ParticipantRecord = {
      ...record,
      status: 'forwarded',
      lastActivityAt: nowIso(),
      review: { ...record.review, forwardedAt: nowIso() },
      activity: [...record.activity, logEvent('administrator', 'Marked as forwarded')],
    };
    await persist(next, 'Submission marked as forwarded.');
  }, [record, admin.unlocked, persist]);

  const updateImages = useCallback((updater: (imgs: SurveyImage[]) => SurveyImage[]) => {
    if (!record) return;
    if (effectiveReadOnly) return;
    const next: ParticipantRecord = {
      ...record,
      images: updater(record.images),
      updatedAt: nowIso(),
      lastActivityAt: nowIso(),
      status: record.status === 'not_started' ? 'in_progress' : record.status,
    };
    void persist(next);
  }, [record, effectiveReadOnly, persist]);

  const updateRecord = useCallback((fn: (r: ParticipantRecord) => ParticipantRecord, msg?: string) => {
    if (!record) return;
    // allow admin edits even if locked for participant, but not if link closed (admin can still edit? spec: link closed -> participant cannot access; admin on same link - better allow admin? "When a link is closed: participant cannot access..." doesn't explicitly forbid admin, but simplest: allow admin when unlocked)
    if (record.linkStatus === 'closed' && !admin.unlocked) return;
    if (effectiveReadOnly && !admin.unlocked) return;
    const next = fn(record);
    void persist(next, msg);
  }, [record, effectiveReadOnly, admin.unlocked, persist]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-border border-t-olive animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-border-light rounded-lg p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-olive-pale text-olive flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          </div>
          <p className="text-[11px] tracking-[0.24em] uppercase text-bronze font-medium mb-2">Fieldwork Africa</p>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Survey link not found</h1>
          <p className="text-sm text-muted leading-relaxed">This survey link is invalid or no longer available. Please check the link you received or contact the Fieldwork Africa research team for assistance.</p>
        </div>
      </div>
    );
  }

  if (record.linkStatus === 'closed' && !admin.unlocked) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white border border-border-light rounded-lg p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-olive-pale text-olive flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></svg>
          </div>
          <p className="text-[11px] tracking-[0.24em] uppercase text-bronze font-medium mb-2">Fieldwork Africa</p>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Survey link unavailable</h1>
          <p className="text-sm text-muted leading-relaxed mb-6">This survey link is currently unavailable. Please contact the Fieldwork Africa research team if you need assistance.</p>
          <button type="button" onClick={() => setAdminModal(true)} className="text-sm text-olive hover:text-olive-light font-medium">Administrator access</button>
        </div>
        <AdminPasswordModal open={adminModal} onClose={() => setAdminModal(false)} onUnlock={(pw) => { const ok = unlockAdmin(pw); if (ok) setAdminModal(false); return ok; }} />
      </div>
    );
  }

  const qualityChecks = getQualityChecks(record);

  return (
    <>
      <SurveyShell
        record={record}
        adminUnlocked={admin.unlocked}
        readOnly={effectiveReadOnly}
        busy={busy}
        saveMsg={saveMsg}
        qualityChecks={qualityChecks}
        onSaveDraft={saveDraft}
        onUpdateRecord={updateRecord}
        onUpdateImages={updateImages}
        onRequestAdmin={() => setAdminModal(true)}
        onApprove={adminApprove}
        onLock={adminLock}
        onReopen={adminReopen}
        onRequestCorrections={adminRequestCorrections}
        onCloseLink={adminCloseLink}
        onReopenLink={adminReopenLink}
        onForward={adminForward}
      />
      <AdminPasswordModal
        open={adminModal}
        onClose={() => setAdminModal(false)}
        onUnlock={(pw) => { const ok = unlockAdmin(pw); if (ok) setAdminModal(false); return ok; }}
      />
    </>
  );
}
