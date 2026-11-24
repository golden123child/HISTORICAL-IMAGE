import { useMemo, useState } from 'react';
import type { ParticipantRecord, SurveyImage } from '../../../types';
import { HEAD_POSE_MAX, HEAD_POSE_MIN, HISTORICAL_CATEGORIES, HISTORICAL_MAX, HISTORICAL_MIN, NEUTRAL_MAX, NEUTRAL_MIN } from '../../../types';
import { countUploaded, getQualityChecks, hasConsent, isParticipantInfoComplete, logEvent } from '../../../utils/records';
import { nowIso } from '../../../utils/id';
import { formatFileSize, isAcceptedImage, readImageAsDataUrl } from '../../../utils/image';

type SectionId = 'consent' | 'about' | 'neutral' | 'headposes' | 'historical' | 'review';

interface Props {
  record: ParticipantRecord;
  adminUnlocked: boolean;
  readOnly: boolean;
  busy: boolean;
  saveMsg: string;
  qualityChecks: ReturnType<typeof getQualityChecks>;
  onSaveDraft: () => void;
  onUpdateRecord: (fn: (r: ParticipantRecord) => ParticipantRecord, msg?: string) => void;
  onUpdateImages: (updater: (imgs: SurveyImage[]) => SurveyImage[]) => void;
  onRequestAdmin: () => void;
  onApprove: () => void;
  onLock: () => void;
  onReopen: (forParticipant: boolean) => void;
  onRequestCorrections: (instructions: string) => void;
  onCloseLink: () => void;
  onReopenLink: () => void;
  onForward: () => void;
}

const SECTIONS: { id: SectionId; label: string; desc: string }[] = [
  { id: 'consent', label: 'Consent', desc: 'Participation consent' },
  { id: 'about', label: 'About You', desc: 'Participant information' },
  { id: 'neutral', label: 'Neutral Photos', desc: 'Neutral expression images' },
  { id: 'headposes', label: 'Head Poses', desc: 'Pose-based images' },
  { id: 'historical', label: 'Historical Photos', desc: 'Historical image collection' },
  { id: 'review', label: 'Review', desc: 'Quality check & submission' },
];

function statusLabel(s: ParticipantRecord['status']) {
  const map: Record<string, string> = {
    not_started: 'Not Started', in_progress: 'In Progress', draft_saved: 'Draft Saved',
    changes_requested: 'Changes Requested', reopened: 'Reopened', approved: 'Approved', locked: 'Locked', forwarded: 'Forwarded',
  };
  return map[s] || s;
}

function statusClass(s: ParticipantRecord['status']) {
  if (s === 'approved' || s === 'locked' || s === 'forwarded') return 'bg-olive-pale text-olive border-olive/15';
  if (s === 'changes_requested') return 'bg-[#FFF6E8] text-[#9A5A00] border-[#E8CFA8]';
  if (s === 'reopened' || s === 'in_progress' || s === 'draft_saved') return 'bg-[#F3F3F3] text-charcoal-soft border-border';
  return 'bg-[#F3F3F3] text-muted border-border';
}

export default function SurveyShell(props: Props) {
  const { record, adminUnlocked, readOnly, busy, saveMsg, onSaveDraft, onUpdateRecord, onUpdateImages, onRequestAdmin, onApprove, onLock, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward } = props;
  const [current, setCurrent] = useState<SectionId>('consent');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [correctionText, setCorrectionText] = useState(record.review.correctionInstructions || '');

  const neutralCount = countUploaded(record.images, 'neutral');
  const headCount = countUploaded(record.images, 'head_pose');
  const histCount = countUploaded(record.images, 'historical');
  const totalCount = neutralCount + headCount + histCount;

  const progress = useMemo(() => {
    let p = 0;
    if (hasConsent(record.consent)) p += 15;
    if (isParticipantInfoComplete(record.participantInfo)) p += 20;
    p += Math.min(15, Math.round((neutralCount / NEUTRAL_MIN) * 15));
    p += Math.min(15, Math.round((headCount / HEAD_POSE_MIN) * 15));
    p += Math.min(25, Math.round((histCount / HISTORICAL_MIN) * 25));
    if (record.status === 'approved' || record.status === 'locked' || record.status === 'forwarded') p = 100;
    return Math.min(100, p);
  }, [record, neutralCount, headCount, histCount]);

  const go = (id: SectionId) => { setCurrent(id); setMobileNavOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const sectionNode = () => {
    switch (current) {
      case 'consent': return <ConsentSection record={record} readOnly={readOnly} onUpdateRecord={onUpdateRecord} onNext={() => go('about')} />;
      case 'about': return <AboutSection record={record} readOnly={readOnly} onUpdateRecord={onUpdateRecord} onNext={() => go('neutral')} onPrev={() => go('consent')} />;
      case 'neutral': return <ImageGroupSection group="neutral" title="Neutral photographs" subtitle="Provide photographs showing a neutral facial expression." min={NEUTRAL_MIN} max={NEUTRAL_MAX} record={record} readOnly={readOnly} onUpdateImages={onUpdateImages} onUpdateRecord={onUpdateRecord} onNext={() => go('headposes')} onPrev={() => go('about')} />;
      case 'headposes': return <ImageGroupSection group="head_pose" title="Head poses" subtitle="Provide head pose photographs. Suggested poses are shown for each slot." min={HEAD_POSE_MIN} max={HEAD_POSE_MAX} record={record} readOnly={readOnly} onUpdateImages={onUpdateImages} onUpdateRecord={onUpdateRecord} onNext={() => go('historical')} onPrev={() => go('neutral')} />;
      case 'historical': return <ImageGroupSection group="historical" title="Historical photographs" subtitle="Upload historical photographs and provide context for each image. You do not need to fill all 16 slots." min={HISTORICAL_MIN} max={HISTORICAL_MAX} record={record} readOnly={readOnly} onUpdateImages={onUpdateImages} onUpdateRecord={onUpdateRecord} onNext={() => go('review')} onPrev={() => go('headposes')} />;
      case 'review': return <ReviewSection record={record} readOnly={readOnly} adminUnlocked={adminUnlocked} correctionText={correctionText} setCorrectionText={setCorrectionText} onGo={go} onRequestAdmin={onRequestAdmin} onApprove={onApprove} onLock={onLock} onReopen={onReopen} onRequestCorrections={onRequestCorrections} onCloseLink={onCloseLink} onReopenLink={onReopenLink} onForward={onForward} />;
    }
  };

  const lockedBanner = readOnly && (record.status === 'approved' || record.status === 'locked' || record.status === 'forwarded');
  const changesRequested = record.status === 'changes_requested' && !!record.review.correctionInstructions;

  return (
    <div className="min-h-screen bg-ivory">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[290px] xl:w-[320px] bg-cream border-r border-border-light flex-col z-30 no-print">
        <Sidebar record={record} current={current} progress={progress} totalCount={totalCount} onGo={go} onSaveDraft={onSaveDraft} readOnly={readOnly} busy={busy} adminUnlocked={adminUnlocked} onRequestAdmin={onRequestAdmin} />
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-border-light no-print">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-serif text-base text-charcoal leading-tight truncate">Fieldwork Africa</p>
            <p className="text-[10px] text-muted tracking-wide uppercase">{record.participantId} · {statusLabel(record.status)}</p>
          </div>
          <button type="button" onClick={() => setMobileNavOpen(v => !v)} className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-white text-sm text-charcoal" aria-expanded={mobileNavOpen}>
            <span>Menu</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={mobileNavOpen ? 'M6 6l12 12M18 6l-12 12' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] text-muted mb-1"><span>{progress}% complete</span><span>{totalCount} images</span></div>
          <div className="h-1 bg-ivory-deep rounded-full overflow-hidden"><div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>
        {mobileNavOpen && (
          <div className="border-t border-border-light bg-cream px-2 py-2 animate-fade-in">
            {SECTIONS.map((s, idx) => (
              <button key={s.id} type="button" onClick={() => go(s.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm ${current === s.id ? 'bg-olive-pale/70 text-olive font-medium' : 'text-charcoal'}`}>
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center border ${current === s.id ? 'bg-olive text-white border-olive' : 'border-border text-muted'}`}>{idx + 1}</span>
                <span>{s.label}</span>
              </button>
            ))}
            <div className="border-t border-border-light mt-2 pt-2 px-1 flex gap-2">
              {!readOnly && <button type="button" onClick={onSaveDraft} className="flex-1 text-xs text-olive py-2 font-medium">Save draft</button>}
              <button type="button" onClick={onRequestAdmin} className="flex-1 text-xs text-muted py-2">{adminUnlocked ? 'Admin unlocked' : 'Admin access'}</button>
            </div>
          </div>
        )}
      </div>

      <main className="lg:pl-[290px] xl:pl-[320px] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8 lg:py-12">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${statusClass(record.status)}`}>{statusLabel(record.status)}</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${record.linkStatus === 'active' ? 'bg-white text-charcoal-soft border-border' : 'bg-[#FFF6E8] text-[#9A5A00] border-[#E8CFA8]'}`}>Link {record.linkStatus}</span>
              {record.isDemo && <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-border text-xs font-medium bg-white text-muted">Demo record</span>}
            </div>
            <div className="flex items-center gap-2">
              {saveMsg && <span className="text-xs text-olive font-medium animate-fade-in">{saveMsg}</span>}
              {!readOnly && <button type="button" onClick={onSaveDraft} disabled={busy} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition disabled:opacity-60">Save Draft</button>}
              <button type="button" onClick={onRequestAdmin} className="hidden sm:inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">{adminUnlocked ? 'Admin unlocked' : 'Admin access'}</button>
            </div>
          </div>

          {changesRequested && (
            <div className="mb-6 rounded-lg border border-[#E8CFA8] bg-[#FFF9F1] px-5 py-4">
              <p className="font-medium text-[#9A5A00] mb-1">Corrections requested</p>
              <p className="text-sm text-charcoal-soft leading-relaxed whitespace-pre-wrap">{record.review.correctionInstructions}</p>
            </div>
          )}
          {lockedBanner && (
            <div className="mb-6 rounded-lg border border-olive/15 bg-olive-pale/40 px-5 py-4">
              <p className="font-medium text-olive mb-1">Submission approved</p>
              <p className="text-sm text-charcoal-soft leading-relaxed">This submission has been approved and is read-only for participants. {adminUnlocked ? 'You have administrative access and may reopen it if needed.' : 'Contact the Fieldwork Africa research team if changes are required.'}</p>
            </div>
          )}

          <div key={current} className="animate-fade-in">
            {sectionNode()}
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ record, current, progress, totalCount, onGo, onSaveDraft, readOnly, busy, adminUnlocked, onRequestAdmin }: { record: ParticipantRecord; current: SectionId; progress: number; totalCount: number; onGo: (s: SectionId) => void; onSaveDraft: () => void; readOnly: boolean; busy: boolean; adminUnlocked: boolean; onRequestAdmin: () => void }) {
  const idx = SECTIONS.findIndex(s => s.id === current);
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-7 pb-6 border-b border-border-light">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-olive text-ivory flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-4-4 3-2-1.5L3 17" /></svg>
          </div>
          <div>
            <p className="font-serif text-[17px] text-charcoal leading-tight">Fieldwork Africa</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted">Historical Image Collection</p>
          </div>
        </div>
        <div className="rounded-md bg-ivory-deep/50 border border-border-light px-3 py-2.5 mb-4">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Participant ID</p>
          <p className="font-mono text-sm text-charcoal">{record.participantId}</p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-muted mb-1.5"><span>Overall progress</span><span className="font-medium text-charcoal">{progress}%</span></div>
          <div className="h-1.5 bg-ivory-deep rounded-full overflow-hidden"><div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <p className="text-[11px] text-muted mt-2">{totalCount} images uploaded</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Survey sections">
        {SECTIONS.map((s, i) => {
          const active = current === s.id;
          const done = idx > i;
          return (
            <button key={s.id} type="button" onClick={() => onGo(s.id)} className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition ${active ? 'bg-olive-pale/70' : 'hover:bg-ivory-deep/60'}`} aria-current={active ? 'step' : undefined}>
              <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 border transition ${active ? 'bg-olive text-white border-olive' : done ? 'bg-olive/10 text-olive border-olive/20' : 'bg-white text-muted border-border'}`}>
                {done && !active ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> : i + 1}
              </span>
              <span className="min-w-0"><span className={`block text-sm font-medium ${active ? 'text-olive' : 'text-charcoal'}`}>{s.label}</span><span className="block text-xs text-muted mt-0.5">{s.desc}</span></span>
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border-light space-y-1">
        {!readOnly && <button type="button" onClick={onSaveDraft} disabled={busy} className="w-full text-left px-3 py-2 text-sm font-medium text-olive hover:bg-olive-pale/30 rounded-md transition disabled:opacity-60">Save draft</button>}
        <button type="button" onClick={onRequestAdmin} className="w-full text-left px-3 py-2 text-sm text-muted hover:text-charcoal hover:bg-ivory-deep/60 rounded-md transition">{adminUnlocked ? 'Admin unlocked' : 'Administrator access'}</button>
        <p className="px-3 pt-2 text-[11px] text-muted leading-relaxed">Prototype environment. Data is stored in this browser for demonstration.</p>
      </div>
    </div>
  );
}

/* ---------- Sections ---------- */

function SectionHeader({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-bronze font-medium mb-3"><span className="w-6 h-px bg-bronze/60" />{kicker}</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-charcoal leading-[1.1] mb-3">{title}</h1>
      <p className="text-[15px] sm:text-base text-muted max-w-2xl leading-relaxed">{desc}</p>
    </div>
  );
}

function NavButtons({ onPrev, onNext, nextLabel = 'Continue', prevLabel = 'Previous', nextDisabled }: { onPrev?: () => void; onNext?: () => void; nextLabel?: string; prevLabel?: string; nextDisabled?: boolean }) {
  return (
    <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
      {onPrev ? <button type="button" onClick={onPrev} className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-white text-charcoal px-6 py-3 font-medium text-[15px] hover:bg-ivory-deep/40 transition">{prevLabel}</button> : <span />}
      {onNext && <button type="button" onClick={onNext} disabled={nextDisabled} className="inline-flex items-center justify-center gap-2 rounded-md bg-olive text-white px-7 py-3 font-medium text-[15px] hover:bg-olive-light transition disabled:opacity-50">{nextLabel}</button>}
    </div>
  );
}

function ConsentSection({ record, readOnly, onUpdateRecord, onNext }: { record: ParticipantRecord; readOnly: boolean; onUpdateRecord: Props['onUpdateRecord']; onNext: () => void }) {
  const c = record.consent;
  const set = (k: keyof typeof c, v: boolean) => onUpdateRecord(r => ({ ...r, consent: { ...r.consent, [k]: v }, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
  const complete = hasConsent(c);
  return (
    <div className="max-w-4xl">
      <SectionHeader kicker="Section 1 of 6" title="Consent" desc="Please review and confirm the following statements before continuing. Consent is required to complete the survey." />
      <div className="bg-white border border-border-light rounded-lg p-6 sm:p-8 space-y-4">
        {[
          { k: 'ageEligible' as const, label: 'Age eligibility', text: 'I confirm that I meet the project’s age eligibility requirement (18 years or older).' },
          { k: 'consentResearch' as const, label: 'Research use consent', text: 'I consent to the use of my submitted photographs and information for the intended research purposes of the Fieldwork Africa Historical Image Collection project.' },
          { k: 'consentPermission' as const, label: 'Permission for subjects', text: 'I confirm that I have permission to submit photographs containing other people where applicable, or that I am authorised to share them for this purpose.' },
        ].map(item => (
          <label key={item.k} className={`flex items-start gap-3 p-4 rounded-lg border text-sm cursor-pointer transition ${c[item.k] ? 'border-olive/25 bg-olive-pale/30' : 'border-border bg-ivory/30'} ${readOnly ? 'cursor-default' : ''}`}>
            <input type="checkbox" checked={c[item.k]} disabled={readOnly} onChange={e => set(item.k, e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C62828]" />
            <span><span className="font-medium text-charcoal block mb-0.5">{item.label}</span><span className="text-charcoal-soft leading-relaxed">{item.text}</span></span>
          </label>
        ))}
        {!complete && <p className="text-xs text-muted pt-1">All consent confirmations are required before submission.</p>}
      </div>
      <NavButtons onNext={onNext} nextLabel="Continue to About You" />
    </div>
  );
}

function AboutSection({ record, readOnly, onUpdateRecord, onNext, onPrev }: { record: ParticipantRecord; readOnly: boolean; onUpdateRecord: Props['onUpdateRecord']; onNext: () => void; onPrev: () => void }) {
  const p = record.participantInfo;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof p, v: string) => {
    onUpdateRecord(r => ({ ...r, participantInfo: { ...r.participantInfo, [k]: v }, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };
  const validate = () => {
    const e: Record<string, string> = {};
    if (!p.ageGroup) e.ageGroup = 'Please select an age group.';
    if (!p.gender) e.gender = 'Please select a gender option.';
    if (!p.region) e.region = 'Please select a region.';
    if (!p.country) e.country = 'Please select a country.';
    if (!p.preferredContactMethod) e.preferredContactMethod = 'Please select a preferred contact method.';
    if (!p.contactValue.trim()) e.contactValue = 'Contact information is required.';
    else if (p.preferredContactMethod === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactValue.trim())) e.contactValue = 'Enter a valid email address.';
    else if (p.preferredContactMethod === 'WhatsApp' && p.contactValue.replace(/\D/g, '').length < 7) e.contactValue = 'Enter a valid WhatsApp number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const inputCls = (k: string) => `w-full rounded-md border px-3.5 py-2.5 text-[15px] bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${errors[k] ? 'border-danger/50' : 'border-border'} ${readOnly ? 'bg-[#FAFAFA]' : ''}`;
  const countries = ['Nigeria','Ghana','Kenya','South Africa','Ethiopia','Egypt','Morocco','Tanzania','Uganda','Senegal',"Côte d'Ivoire",'Cameroon','Rwanda','Zambia','Zimbabwe','United Kingdom','United States','Canada','France','Germany','United Arab Emirates','Saudi Arabia','India','Brazil','Other'];
  return (
    <div className="max-w-4xl">
      <SectionHeader kicker="Section 2 of 6" title="About the participant" desc="Tell us a little about yourself. Contact information is used for project follow-up and is not intended to appear in client-facing image exports." />
      <div className="bg-white border border-border-light rounded-lg p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Age group" required error={errors.ageGroup}>
            <select value={p.ageGroup} disabled={readOnly} onChange={e => set('ageGroup', e.target.value)} className={inputCls('ageGroup')}>
              <option value="">Select age group</option>
              {['18–24','25–34','35–44','45–54','55–64','65+'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <select value={p.gender} disabled={readOnly} onChange={e => set('gender', e.target.value)} className={inputCls('gender')}>
              <option value="">Select option</option>
              {['Female','Male','Non-binary','Prefer not to say'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Region" required error={errors.region}>
            <select value={p.region} disabled={readOnly} onChange={e => set('region', e.target.value)} className={inputCls('region')}>
              <option value="">Select region</option>
              {['Africa','Middle East','Europe','North America','South America','Asia','Australia/Oceania'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Country" required error={errors.country}>
            <select value={p.country} disabled={readOnly} onChange={e => set('country', e.target.value)} className={inputCls('country')}>
              <option value="">Select country</option>
              {countries.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Preferred contact method" required error={errors.preferredContactMethod}>
            <select value={p.preferredContactMethod} disabled={readOnly} onChange={e => set('preferredContactMethod', e.target.value)} className={inputCls('preferredContactMethod')}>
              <option value="">Select method</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </select>
          </Field>
          <Field label={p.preferredContactMethod === 'Email' ? 'Email address' : p.preferredContactMethod === 'WhatsApp' ? 'WhatsApp number' : 'Contact information'} required error={errors.contactValue}>
            <input value={p.contactValue} disabled={readOnly} onChange={e => set('contactValue', e.target.value)} className={inputCls('contactValue')} placeholder={p.preferredContactMethod === 'Email' ? 'name@example.com' : 'e.g. +234 801 234 5678'} />
          </Field>
        </div>
        <p className="text-xs text-muted mt-5 leading-relaxed">Contact information is collected for project follow-up only and is not intended for client-facing image exports.</p>
      </div>
      <NavButtons onPrev={onPrev} onNext={() => { if (validate()) onNext(); }} nextLabel="Continue to Neutral Photos" />
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">{label} {required && <span className="text-danger">*</span>}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}


/* ---------- Image Group Section ---------- */

function ImageGroupSection({ group, title, subtitle, min, max, record, readOnly, onUpdateImages, onUpdateRecord, onNext, onPrev }: {
  group: 'neutral' | 'head_pose' | 'historical';
  title: string; subtitle: string; min: number; max: number;
  record: ParticipantRecord; readOnly: boolean;
  onUpdateImages: Props['onUpdateImages']; onUpdateRecord: Props['onUpdateRecord'];
  onNext: () => void; onPrev: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const slots = record.images.filter(i => i.group === group);
  const uploaded = slots.filter(s => !!s.dataUrl && !s.reviewRejected).length;
  const pct = Math.round((uploaded / max) * 100);
  const minMet = uploaded >= min;
  const active = slots.find(s => s.id === editing) || null;
  const previewImg = slots.find(s => s.id === preview) || null;

  const handleFile = async (slot: SurveyImage, file: File | undefined) => {
    if (!file || readOnly) return;
    if (!isAcceptedImage(file)) { alert('Unsupported file format. Please upload JPG, PNG, or WEBP.'); return; }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl, fileName: file.name, mimeType: file.type, sizeBytes: file.size, uploadedAt: nowIso(), reviewRejected: false, reviewNote: '' } : i));
      onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), status: r.status === 'not_started' ? 'in_progress' : r.status, activity: [...r.activity, logEvent('participant', 'Photograph uploaded', `${slot.slotLabel} (${file.name})`)] }));
    } catch {
      alert('Could not read that image. Please try another file.');
    }
  };

  const removeImage = (slot: SurveyImage) => {
    if (readOnly) return;
    onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl: null, fileName: null, mimeType: null, sizeBytes: null, uploadedAt: null, reviewRejected: false, reviewNote: '' } : i));
    onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), activity: [...r.activity, logEvent('participant', 'Photograph removed', slot.slotLabel)] }));
  };

  const saveMeta = (slotId: string, meta: SurveyImage['metadata']) => {
    onUpdateImages(imgs => imgs.map(i => i.id === slotId ? { ...i, metadata: meta } : i));
    setEditing(null);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-8">
        <SectionHeader kicker={`Section ${group === 'neutral' ? '3' : group === 'head_pose' ? '4' : '5'} of 6`} title={title} desc={subtitle} />
        <div className="bg-white border border-border-light rounded-lg px-5 py-4 w-full xl:w-auto xl:min-w-[260px] shrink-0">
          <div className="flex items-end justify-between gap-4 mb-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Image count</p>
              <p className="font-serif text-3xl text-charcoal leading-none">{uploaded} <span className="text-lg text-muted font-sans font-normal">of {max}</span></p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${minMet ? 'text-olive' : 'text-bronze'}`}>{minMet ? 'Minimum met' : `${min - uploaded} more needed`}</p>
              <p className="text-[11px] text-muted">Min {min} required</p>
            </div>
          </div>
          <div className="h-2 bg-ivory-deep rounded-full overflow-hidden"><div className="h-full bg-olive rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {slots.map((slot, i) => (
          <ImageSlotCard key={slot.id} slot={slot} index={i} group={group} readOnly={readOnly}
            onUpload={(f) => void handleFile(slot, f)} onEdit={() => setEditing(slot.id)} onPreview={() => slot.dataUrl && setPreview(slot.id)} onRemove={() => removeImage(slot)} />
        ))}
      </div>

      {group === 'historical' && <p className="text-xs text-muted mt-4">Required slots are the first {HISTORICAL_MIN}. Remaining slots are optional. Add any historical photographs you are comfortable sharing.</p>}

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel={group === 'historical' ? 'Continue to Review' : 'Continue'} />

      {active && <ImageDetailModal slot={active} group={group} readOnly={readOnly} onClose={() => setEditing(null)} onSave={(meta) => saveMeta(active.id, meta)} onUpload={(f) => void handleFile(active, f)} onRemove={() => { removeImage(active); setEditing(null); }} />}
      {previewImg?.dataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-charcoal/75 backdrop-blur-sm" />
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl animate-fade-in-scale" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 border-b border-border-light">
              <div className="min-w-0"><p className="text-sm font-medium text-charcoal truncate">{previewImg.metadata.title || previewImg.slotLabel}</p><p className="text-xs text-muted">{previewImg.fileName || previewImg.slotLabel}</p></div>
              <button type="button" onClick={() => setPreview(null)} className="w-8 h-8 rounded-full border border-border text-muted hover:text-charcoal flex items-center justify-center" aria-label="Close preview"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg></button>
            </div>
            <div className="bg-[#F5F5F5] flex items-center justify-center max-h-[calc(90vh-60px)] overflow-auto"><img src={previewImg.dataUrl} alt={previewImg.metadata.title || previewImg.slotLabel} className="max-w-full max-h-[calc(90vh-60px)] object-contain" /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageSlotCard({ slot, index, group, readOnly, onUpload, onEdit, onPreview, onRemove }: { slot: SurveyImage; index: number; group: string; readOnly: boolean; onUpload: (f?: File) => void; onEdit: () => void; onPreview: () => void; onRemove: () => void }) {
  const has = !!slot.dataUrl;
  const required = (group === 'neutral' && index < NEUTRAL_MIN) || (group === 'head_pose' && index < HEAD_POSE_MIN) || (group === 'historical' && index < HISTORICAL_MIN);
  return (
    <div className={`group bg-white border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-sm ${has ? 'border-border-light' : 'border-border border-dashed'} ${slot.reviewRejected ? 'ring-2 ring-danger/30' : ''}`}>
      <div className={`relative aspect-[4/3] overflow-hidden ${has ? 'bg-[#F5F5F5]' : 'bg-ivory/60'}`}>
        {has ? (
          <button type="button" onClick={onPreview} className="w-full h-full block">
            <img src={slot.dataUrl!} alt={slot.metadata.title || slot.slotLabel} className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          </button>
        ) : (
          <label className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
            <div className="w-11 h-11 rounded-full border border-border bg-white text-muted flex items-center justify-center mb-2.5 group-hover:border-olive/30 group-hover:text-olive group-hover:bg-olive-pale/30 transition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <p className="text-[11px] font-medium tracking-wider uppercase text-muted">{slot.slotLabel}</p>
            <p className="text-xs text-muted/80 mt-1">{required ? 'Required' : 'Optional'}</p>
            {!readOnly && <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value=''; }} />}
          </label>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/92 backdrop-blur text-[10px] font-semibold tracking-wider text-charcoal uppercase">{String(index + 1).padStart(2,'0')}</span>
          {required && !has && <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/92 backdrop-blur text-[10px] font-medium text-bronze">Required</span>}
        </div>
        {has && <div className="absolute top-2.5 right-2.5"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-olive/90 text-white text-[10px] font-medium">Added</span></div>}
        {slot.reviewRejected && <div className="absolute bottom-2.5 left-2.5 right-2.5"><span className="inline-flex items-center px-2 py-1 rounded-md bg-danger/90 text-white text-[10px] font-medium">Rejected by reviewer</span></div>}
      </div>
      <div className="px-3.5 py-3.5">
        <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5 truncate">{group === 'head_pose' ? 'Head pose' : group === 'neutral' ? 'Neutral' : 'Historical'}</p>
        <p className="text-sm font-medium text-charcoal truncate" title={slot.metadata.title || slot.slotLabel}>{slot.metadata.title || slot.slotLabel}</p>
        {slot.fileName && <p className="text-[11px] text-muted truncate mt-0.5">{slot.fileName}</p>}
        <div className="flex items-center gap-2 mt-3">
          <button type="button" onClick={onEdit} className="flex-1 inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-ivory-deep/40 transition">{has ? 'Details' : 'Add photo'}</button>
          {has && !readOnly && <button type="button" onClick={onRemove} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-muted hover:text-danger hover:border-danger/20 hover:bg-danger-pale/30 transition">Remove</button>}
        </div>
      </div>
    </div>
  );
}


function ImageDetailModal({ slot, group, readOnly, onClose, onSave, onUpload, onRemove }: { slot: SurveyImage; group: string; readOnly: boolean; onClose: () => void; onSave: (meta: SurveyImage['metadata']) => void; onUpload: (f?: File) => void; onRemove: () => void }) {
  const [meta, setMeta] = useState({ ...slot.metadata });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const isHistorical = group === 'historical';
  const set = (k: keyof typeof meta, v: string) => { setMeta(m => ({ ...m, [k]: v })); if (errors[k as string]) setErrors(e => { const n={...e}; delete n[k as string]; return n; }); };
  const inputCls = (err?: boolean) => `w-full rounded-md border px-3.5 py-2.5 text-sm bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${err ? 'border-danger/50' : 'border-border'} ${readOnly ? 'bg-[#FAFAFA]' : ''}`;

  const save = () => {
    const e: Record<string,string> = {};
    if (isHistorical && slot.dataUrl) {
      if (!meta.title.trim()) e.title = 'Title or description is required.';
      if (!meta.approxYear.trim()) e.approxYear = 'Approximate year is required.';
      if (!meta.location.trim()) e.location = 'Location is required.';
      const cat = meta.category === 'Other' ? meta.customCategory.trim() : meta.category;
      if (!cat) e.category = 'Category is required.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(meta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label={`Details for ${slot.slotLabel}`}>
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-lg bg-ivory shadow-2xl border border-border-light animate-fade-in-scale flex flex-col">
        <div className="flex items-center justify-between gap-4 px-5 sm:px-7 py-4 border-b border-border-light bg-cream/80">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-bronze font-medium">{group === 'neutral' ? 'Neutral photograph' : group === 'head_pose' ? 'Head pose' : 'Historical photograph'}</p>
            <h2 className="font-serif text-2xl text-charcoal leading-tight">{slot.slotLabel}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full border border-border bg-white text-muted hover:text-charcoal flex items-center justify-center" aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <p className="text-sm font-medium text-charcoal mb-2">Photograph</p>
              {slot.dataUrl ? (
                <div className="rounded-lg border border-border bg-white overflow-hidden">
                  <div className="bg-[#F5F5F5] aspect-[4/3] flex items-center justify-center overflow-hidden"><img src={slot.dataUrl} alt={meta.title || slot.slotLabel} className="w-full h-full object-contain" /></div>
                  <div className="px-4 py-3 border-t border-border-light">
                    <p className="text-sm text-charcoal font-medium truncate">{slot.fileName || 'Uploaded image'}</p>
                    <p className="text-xs text-muted mt-0.5">{slot.sizeBytes ? formatFileSize(slot.sizeBytes) : 'Stored locally for prototype'}</p>
                    {!readOnly && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <label className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-white hover:bg-ivory-deep/40 text-charcoal transition cursor-pointer">Replace<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value=''; }} /></label>
                        <button type="button" onClick={onRemove} className="px-3 py-1.5 text-xs font-medium rounded-md border border-danger/20 bg-danger-pale/30 text-danger hover:bg-danger-pale transition">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <label className={`block rounded-lg border-2 border-dashed px-5 py-10 text-center ${readOnly ? 'border-border bg-white' : 'border-border bg-white hover:border-olive/40 hover:bg-ivory/40 cursor-pointer'}`}>
                  <p className="text-sm text-charcoal font-medium mb-1">Upload photograph</p>
                  <p className="text-xs text-muted mb-4">JPG, PNG, or WEBP</p>
                  {!readOnly && <span className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2 text-sm font-medium">Browse files</span>}
                  {!readOnly && <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value=''; }} />}
                </label>
              )}
              {slot.reviewRejected && <div className="rounded-md border border-danger/20 bg-danger-pale/30 px-3 py-2 text-xs text-danger"><span className="font-medium">Reviewer note:</span> {slot.reviewNote || 'This image was rejected during review.'}</div>}
            </div>
            <div className="lg:col-span-3 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-1.5">{isHistorical ? 'Photograph title or description' : 'Title / note'} {isHistorical && slot.dataUrl && <span className="text-danger">*</span>}</label>
                  <input value={meta.title} disabled={readOnly} onChange={e => set('title', e.target.value)} className={inputCls(!!errors.title)} placeholder={isHistorical ? 'e.g. Community gathering, 1974' : 'Optional title'} />
                  {errors.title && <p className="mt-1.5 text-xs text-danger">{errors.title}</p>}
                </div>
                {isHistorical && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">Approximate year {slot.dataUrl && <span className="text-danger">*</span>}</label>
                      <input value={meta.approxYear} disabled={readOnly} onChange={e => set('approxYear', e.target.value)} className={inputCls(!!errors.approxYear)} placeholder="e.g. 1968" />
                      {errors.approxYear && <p className="mt-1.5 text-xs text-danger">{errors.approxYear}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">Location {slot.dataUrl && <span className="text-danger">*</span>}</label>
                      <input value={meta.location} disabled={readOnly} onChange={e => set('location', e.target.value)} className={inputCls(!!errors.location)} placeholder="City, region, country" />
                      {errors.location && <p className="mt-1.5 text-xs text-danger">{errors.location}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">Category {slot.dataUrl && <span className="text-danger">*</span>}</label>
                      <select value={meta.category} disabled={readOnly} onChange={e => set('category', e.target.value)} className={inputCls(!!errors.category)}>
                        <option value="">Select category</option>
                        {HISTORICAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.category && <p className="mt-1.5 text-xs text-danger">{errors.category}</p>}
                    </div>
                    {meta.category === 'Other' && (
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1.5">Custom category {slot.dataUrl && <span className="text-danger">*</span>}</label>
                        <input value={meta.customCategory} disabled={readOnly} onChange={e => set('customCategory', e.target.value)} className={inputCls(!!errors.category)} placeholder="Enter your category" />
                      </div>
                    )}
                    <div className={meta.category === 'Other' ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label className="block text-sm font-medium text-charcoal mb-1.5">Additional contextual information</label>
                      <textarea value={meta.contextualInfo} disabled={readOnly} onChange={e => set('contextualInfo', e.target.value)} className={`${inputCls(false)} min-h-[96px] resize-y`} placeholder="What is happening in the photograph? Why is it significant?" />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Notes { !isHistorical && <span className="text-muted font-normal">(optional)</span>}</label>
                  <textarea value={meta.notes} disabled={readOnly} onChange={e => set('notes', e.target.value)} className={`${inputCls(false)} min-h-[72px] resize-y`} placeholder="Any additional notes" />
                </div>
              </div>
              {isHistorical && <p className="text-xs text-muted">For uploaded historical photographs, title/description, approximate year, location, and category are required for quality review.</p>}
            </div>
          </div>
        </div>
        <div className="px-5 sm:px-7 py-4 border-t border-border-light bg-cream/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Close</button>
          {!readOnly && <button type="button" onClick={save} className="inline-flex items-center justify-center rounded-md bg-olive px-5 py-2.5 text-sm font-medium text-white hover:bg-olive-light transition">Save details</button>}
        </div>
      </div>
    </div>
  );
}


/* ---------- Review Section ---------- */

function ReviewSection({ record, readOnly, adminUnlocked, correctionText, setCorrectionText, onGo, onRequestAdmin, onApprove, onLock, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward }: {
  record: ParticipantRecord; readOnly: boolean; adminUnlocked: boolean;
  correctionText: string; setCorrectionText: (v: string) => void;
  onGo: (s: SectionId) => void; onRequestAdmin: () => void; onApprove: () => void; onLock: () => void;
  onReopen: (forParticipant: boolean) => void; onRequestCorrections: (t: string) => void;
  onCloseLink: () => void; onReopenLink: () => void; onForward: () => void;
}) {
  const checks = getQualityChecks(record);
  const allOk = checks.every(c => c.ok);
  const neutral = record.images.filter(i => i.group==='neutral' && i.dataUrl && !i.reviewRejected);
  const head = record.images.filter(i => i.group==='head_pose' && i.dataUrl && !i.reviewRejected);
  const hist = record.images.filter(i => i.group==='historical' && i.dataUrl && !i.reviewRejected);
  const total = neutral.length + head.length + hist.length;
  const p = record.participantInfo;
  const canBeApproved = allOk && adminUnlocked && !['approved','locked','forwarded'].includes(record.status);

  return (
    <div className="max-w-5xl">
      <SectionHeader kicker="Section 6 of 6" title="Review & quality check" desc="Review the participant information, uploaded images, and quality checks. Administrative review actions are available after password verification." />

      <div className="space-y-6">
        <section className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light flex items-center justify-between gap-3 bg-ivory/30">
            <div><h2 className="font-serif text-2xl text-charcoal">Participant information</h2><p className="text-sm text-muted">Consent and contact details.</p></div>
            {!readOnly && <button type="button" onClick={() => onGo('about')} className="text-sm font-medium text-olive hover:text-olive-light">Edit</button>}
          </div>
          <dl className="divide-y divide-border-light">
            {[
              ['Consent', hasConsent(record.consent) ? 'Complete' : 'Incomplete'],
              ['Age group', p.ageGroup || '—'],
              ['Gender', p.gender || '—'],
              ['Region', p.region || '—'],
              ['Country', p.country || '—'],
              ['Preferred contact', p.preferredContactMethod || '—'],
              ['Contact', p.contactValue || '—'],
            ].map(([k,v]) => (
              <div key={k} className="px-6 py-3.5 sm:grid sm:grid-cols-3 gap-4"><dt className="text-sm text-muted">{k}</dt><dd className="text-sm sm:col-span-2 text-charcoal">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light flex items-center justify-between gap-3 bg-ivory/30">
            <div><h2 className="font-serif text-2xl text-charcoal">Quality check</h2><p className="text-sm text-muted">Required criteria for approval.</p></div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${allOk ? 'bg-olive-pale text-olive border-olive/15' : 'bg-[#FFF6E8] text-[#9A5A00] border-[#E8CFA8]'}`}>{allOk ? 'All checks passed' : 'Action needed'}</span>
          </div>
          <div className="divide-y divide-border-light">
            {checks.map(c => (
              <div key={c.label} className="px-6 py-3.5 flex items-start gap-3">
                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-olive/10 text-olive' : 'bg-[#FFF0E0] text-[#B45309]'}`}>
                  {c.ok ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 8v4m0 4h.01"/></svg>}
                </span>
                <div className="min-w-0"><p className="text-sm text-charcoal font-medium">{c.label}</p><p className="text-xs text-muted">{c.detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-ivory/30 flex items-center justify-between gap-3">
            <div><h2 className="font-serif text-2xl text-charcoal">Image summary</h2><p className="text-sm text-muted">{total} total images · {neutral.length} neutral · {head.length} head poses · {hist.length} historical.</p></div>
          </div>
          <div className="p-6 grid sm:grid-cols-3 gap-4">
            {[{label:'Neutral',count:neutral.length,min:NEUTRAL_MIN,max:NEUTRAL_MAX},{label:'Head poses',count:head.length,min:HEAD_POSE_MIN,max:HEAD_POSE_MAX},{label:'Historical',count:hist.length,min:HISTORICAL_MIN,max:HISTORICAL_MAX}].map(g => (
              <div key={g.label} className="rounded-lg border border-border-light bg-ivory/30 p-4">
                <p className="text-sm font-medium text-charcoal">{g.label}</p>
                <p className="font-serif text-2xl text-charcoal mt-1">{g.count}<span className="text-base text-muted font-sans"> / {g.max}</span></p>
                <p className={`text-xs mt-1 ${g.count>=g.min ? 'text-olive' : 'text-[#9A5A00]'}`}>{g.count>=g.min ? `Minimum ${g.min} met` : `Minimum ${g.min} required`}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-ivory/30">
            <h2 className="font-serif text-2xl text-charcoal">Administrative review</h2>
            <p className="text-sm text-muted">Protected actions for the project team.</p>
          </div>
          <div className="p-6 space-y-5">
            {!adminUnlocked ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-lg border border-border-light bg-ivory/30 p-4">
                <div><p className="text-sm font-medium text-charcoal">Administrator access required</p><p className="text-xs text-muted">Unlock to approve, request corrections, reopen, close links, or forward submissions.</p></div>
                <button type="button" onClick={onRequestAdmin} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2.5 text-sm font-medium hover:bg-olive-light transition">Unlock admin access</button>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-olive/15 bg-olive-pale/20 px-4 py-3 text-sm text-charcoal-soft">Administrative access is unlocked for this session.</div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1.5">Review notes / correction instructions</label>
                  <textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} className="w-full rounded-md border border-border px-3.5 py-2.5 text-sm bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 min-h-[96px] resize-y" placeholder="Enter notes for the participant or internal review..." />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={onApprove} disabled={!canBeApproved} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-4 py-2.5 text-sm font-medium hover:bg-olive-light transition disabled:opacity-50 disabled:cursor-not-allowed">Approve & Lock Submission</button>
                  <button type="button" onClick={() => onRequestCorrections(correctionText)} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Request corrections</button>
                  <button type="button" onClick={() => onReopen(true)} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Reopen for participant</button>
                  <button type="button" onClick={() => onReopen(false)} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Reopen (team only)</button>
                  {record.linkStatus === 'active' ? (
                    <button type="button" onClick={onCloseLink} className="inline-flex items-center justify-center rounded-md border border-[#E8CFA8] bg-[#FFF9F1] px-4 py-2.5 text-sm font-medium text-[#9A5A00] hover:bg-[#FFF3E0] transition">Close link</button>
                  ) : (
                    <button type="button" onClick={onReopenLink} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Reopen link</button>
                  )}
                  {['approved','locked','forwarded'].includes(record.status) && <button type="button" onClick={onForward} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Mark as forwarded</button>}
                  {record.status === 'approved' && <button type="button" onClick={onLock} className="inline-flex items-center justify-center rounded-md border border-border bg-white px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-ivory-deep/40 transition">Lock submission</button>}
                </div>
                {!allOk && <p className="text-xs text-[#9A5A00]">Approval is disabled until all quality checks pass.</p>}
              </>
            )}
          </div>
        </section>

        <section className="bg-white border border-border-light rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light bg-ivory/30"><h2 className="font-serif text-2xl text-charcoal">Activity history</h2><p className="text-sm text-muted">Recent actions for this participant record.</p></div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border-light">
            {[...record.activity].reverse().slice(0, 30).map(evt => (
              <div key={evt.id} className="px-6 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                <span className="text-[11px] text-muted sm:w-44 shrink-0">{new Date(evt.timestamp).toLocaleString()}</span>
                <span className="text-[11px] uppercase tracking-wider text-muted sm:w-28 shrink-0">{evt.actor}</span>
                <div className="min-w-0"><p className="text-sm text-charcoal">{evt.action}</p>{evt.details && <p className="text-xs text-muted">{evt.details}</p>}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <NavButtons onPrev={() => onGo('historical')} />
    </div>
  );
}
