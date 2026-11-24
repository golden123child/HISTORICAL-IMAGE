import { useRef, useState } from 'react';
import type { ParticipantRecord, SurveyImage } from '../../types';
import { HEAD_POSE_MAX, HEAD_POSE_MIN, HISTORICAL_MAX, HISTORICAL_MIN, NEUTRAL_MAX, NEUTRAL_MIN } from '../../types';
import { canApprove, countUploaded, getQualityChecks, logEvent } from '../../utils/records';
import { buildSurveyLink, nowIso, recordToLinkSeed } from '../../utils/id';
import { isAcceptedImage, readImageAsDataUrl } from '../../utils/image';

interface Props {
  record: ParticipantRecord;
  adminUnlocked: boolean;
  busy: boolean;
  saveMsg: string;
  onSaveDraft: () => void;
  onUpdateRecord: (fn: (r: ParticipantRecord) => ParticipantRecord, msg?: string) => void;
  onUpdateImages: (updater: (imgs: SurveyImage[]) => SurveyImage[]) => void;
  onRequestAdmin: () => void;
  onApprove: () => void;
  onReopen: (forParticipant: boolean) => void;
  onRequestCorrections: (instructions: string) => void;
  onCloseLink: () => void;
  onReopenLink: () => void;
  onForward: () => void;
  onFillDemo: (kind: 'full' | 'incomplete' | 'new') => void;
}

function statusBadge(status: ParticipantRecord['status']) {
  const map: Record<string, string> = { not_started:'Not Started', in_progress:'In Progress', draft_saved:'Draft', changes_requested:'Changes Requested', reopened:'Reopened', approved:'Approved', locked:'Locked', forwarded:'Forwarded' };
  return map[status] || status;
}

export default function ParticipantSurveyForm(props: Props) {
  const { record, adminUnlocked, busy, saveMsg, onSaveDraft, onUpdateRecord, onUpdateImages, onRequestAdmin, onApprove, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward, onFillDemo } = props;
  const [correctionText, setCorrectionText] = useState(record.review.correctionInstructions || '');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const neutral = record.images.filter(i => i.group === 'neutral');
  const head = record.images.filter(i => i.group === 'head_pose');
  const oldPhotos = record.images.filter(i => i.group === 'historical');
  const neutralCount = countUploaded(record.images, 'neutral');
  const headCount = countUploaded(record.images, 'head_pose');
  const oldCount = countUploaded(record.images, 'historical');

  const readOnly = (record.status === 'approved' || record.status === 'locked' || record.status === 'forwarded') && !adminUnlocked;
  const isReopenedTeamOnly = record.status === 'reopened' && !record.review.reopenedForParticipant && !adminUnlocked;
  const formReadOnly = readOnly || isReopenedTeamOnly || record.linkStatus === 'closed';

  const setConsent = (k: 'ageEligible'|'consentResearch'|'consentPermission', v: boolean) => {
    if (formReadOnly) return;
    onUpdateRecord(r => ({ ...r, consent: { ...r.consent, [k]: v }, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
  };
  const setInfo = (k: string, v: string) => {
    if (formReadOnly) return;
    setErrors(e => { const n={...e}; delete n[k]; return n; });
    onUpdateRecord(r => ({ ...r, participantInfo: { ...r.participantInfo, [k]: v } as any, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
  };

  const handleUpload = async (slot: SurveyImage, file?: File) => {
    if (!file || formReadOnly) return;
    if (!isAcceptedImage(file)) { alert('Unsupported file format. Please upload JPEG, PNG, or WEBP.'); return; }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl, fileName: file.name, mimeType: file.type, sizeBytes: file.size, uploadedAt: nowIso(), reviewRejected: false, reviewNote: '' } : i));
      onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), status: r.status === 'not_started' ? 'in_progress' : r.status, activity: [...r.activity, logEvent('participant','Photograph uploaded', `${slot.slotLabel} (${file.name})`)] }));
    } catch { alert('Could not read that image. Please try another file.'); }
  };

  const removeImage = (slot: SurveyImage) => {
    if (formReadOnly) return;
    onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl:null, fileName:null, mimeType:null, sizeBytes:null, uploadedAt:null, reviewRejected:false, reviewNote:'' } : i));
    onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), activity: [...r.activity, logEvent('participant','Photograph removed', slot.slotLabel)] }));
  };

  const setMeta = (slotId: string, patch: Partial<SurveyImage['metadata']>) => {
    if (formReadOnly) return;
    onUpdateImages(imgs => imgs.map(i => i.id === slotId ? { ...i, metadata: { ...i.metadata, ...patch } } : i));
  };

  const validateForSave = () => {
    // Drafts can be incomplete; only show soft validation on obvious contact format issues
    const e: Record<string,string> = {};
    const p = record.participantInfo;
    if (p.contactValue.trim()) {
      if (p.preferredContactMethod === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactValue.trim())) e.contactValue = 'Enter a valid email address.';
      if (p.preferredContactMethod === 'WhatsApp' && p.contactValue.replace(/\D/g,'').length < 7) e.contactValue = 'Enter a valid WhatsApp number.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => { if (validateForSave()) onSaveDraft(); };

  const qualityChecks = getQualityChecks(record);
  const canApproveNow = adminUnlocked && canApprove(record) && !['approved','locked','forwarded'].includes(record.status);
  const surveyUrl = buildSurveyLink(record.token, recordToLinkSeed(record));

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <header className="border-b border-border pb-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold tracking-wide text-olive">Fieldwork Africa</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-charcoal leading-tight mt-1">Photo Collection Form</h1>
            </div>
            <div className="sm:text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-border bg-[#F5F5F5] text-xs font-medium text-charcoal-soft">{statusBadge(record.status)}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted break-all">
            <div><span className="font-medium text-charcoal-soft">Participant reference:</span> {record.participantId}</div>
            <div><span className="font-medium text-charcoal-soft">Your private link:</span> {surveyUrl}</div>
          </div>
        </header>

        {/* Demo tools */}
        <div className="mb-6 rounded-md border border-border bg-[#FAFAFA] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-muted mb-2">Prototype demo tools</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onFillDemo('full')} className="px-3 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Fill with full set</button>
            <button type="button" onClick={() => onFillDemo('incomplete')} className="px-3 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Fill with incomplete set</button>
            <button type="button" onClick={() => onFillDemo('new')} className="px-3 py-1.5 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">New respondent</button>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Counter label="Neutral" count={neutralCount} max={NEUTRAL_MAX} min={NEUTRAL_MIN} />
          <Counter label="Head poses" count={headCount} max={HEAD_POSE_MAX} min={HEAD_POSE_MIN} />
          <Counter label="Old photos" count={oldCount} max={HISTORICAL_MAX} min={HISTORICAL_MIN} />
        </div>

        {saveMsg && <div className="mb-6 rounded-md border border-olive/20 bg-olive-pale/40 px-4 py-3 text-sm text-olive font-medium">{saveMsg}</div>}
        {record.status === 'changes_requested' && record.review.correctionInstructions && (
          <div className="mb-6 rounded-md border border-[#E8CFA8] bg-[#FFF9F1] px-4 py-3">
            <p className="text-sm font-medium text-[#9A5A00] mb-1">Corrections requested</p>
            <p className="text-sm text-charcoal-soft whitespace-pre-wrap">{record.review.correctionInstructions}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-10">
          {/* 1. Consent */}
          <section>
            <SectionTitle n="1" title="Consent" />
            <div className="space-y-3">
              <CheckRow checked={record.consent.ageEligible} disabled={formReadOnly} onChange={v => setConsent('ageEligible', v)} text="I am 18 or older and I agree that my photos and answers may be used to train and test machine-learning models." />
              <CheckRow checked={record.consent.consentPermission} disabled={formReadOnly} onChange={v => { setConsent('consentPermission', v); setConsent('consentResearch', v || record.consent.consentResearch); }} text="Every photo shows me, and I have permission from anyone else who appears in my old photos." />
              <label className={`flex items-start gap-3 text-sm ${formReadOnly?'opacity-70':''}`}>
                <input type="checkbox" checked={record.consent.consentResearch} disabled={formReadOnly} onChange={e => setConsent('consentResearch', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C62828]" />
                <span className="text-charcoal-soft leading-relaxed">I consent to the use of my submitted photos and answers for the intended research purposes.</span>
              </label>
            </div>
          </section>

          {/* 2. About you */}
          <section>
            <SectionTitle n="2" title="About you" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Age group" required>
                <select value={record.participantInfo.ageGroup} disabled={formReadOnly} onChange={e => setInfo('ageGroup', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select</option>
                  {['18–24','25–34','35–44','45–54','55–64','65+'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Gender" required>
                <select value={record.participantInfo.gender} disabled={formReadOnly} onChange={e => setInfo('gender', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select</option>
                  {['Female','Male','Non-binary','Prefer not to say'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Region" required>
                <select value={record.participantInfo.region} disabled={formReadOnly} onChange={e => setInfo('region', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select</option>
                  {['South / Southeast Asia','Africa / Middle East','Europe','North / South America','Australia'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Country" required>
                <input value={record.participantInfo.country} disabled={formReadOnly} onChange={e => setInfo('country', e.target.value)} className={inputCls(formReadOnly)} placeholder="Country" />
              </Field>
              <Field label="If a photo needs retaking, reach me by">
                <div className="flex gap-4 pt-1">
                  {['WhatsApp','Email'].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm text-charcoal-soft">
                      <input type="radio" name="contactMethod" checked={record.participantInfo.preferredContactMethod===opt} disabled={formReadOnly} onChange={() => setInfo('preferredContactMethod', opt)} className="accent-[#C62828]" /> {opt}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label={record.participantInfo.preferredContactMethod === 'Email' ? 'Email' : 'WhatsApp number or email'} required error={errors.contactValue}>
                <input
                  value={record.participantInfo.contactValue}
                  disabled={formReadOnly}
                  onChange={e => setInfo('contactValue', e.target.value)}
                  className={inputCls(formReadOnly, !!errors.contactValue)}
                  type={record.participantInfo.preferredContactMethod === 'Email' ? 'email' : 'text'}
                  inputMode={record.participantInfo.preferredContactMethod === 'Email' ? 'email' : 'tel'}
                  placeholder={record.participantInfo.preferredContactMethod === 'Email' ? 'name@example.com' : '+234 801 234 5678'}
                />
              </Field>
            </div>
            <p className="text-xs text-muted mt-3">Used only to send you a reminder. It is never shared with the client.</p>
          </section>

          {/* 3. Selfies */}
          <section>
            <SectionTitle n="3" title="Selfies" />
            <p className="text-sm text-muted mb-5">Take these now in good light, no filters. JPEG only, shortest side 1000 px or more.</p>

            <div className="mb-8">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-charcoal">Neutral face</h3>
                <span className="text-xs text-muted">{neutralCount} / 4 · min 2</span>
              </div>
              <p className="text-xs text-muted mb-3">Look straight at the camera, mouth closed. Add 2 to 4.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {neutral.map((slot, i) => <PhotoSlot key={slot.id} slot={slot} required={i < 2} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} />)}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h3 className="text-sm font-semibold text-charcoal">Head poses</h3>
                <span className="text-xs text-muted">{headCount} / 4 · min 2</span>
              </div>
              <p className="text-xs text-muted mb-3">Keep your whole face in frame as you turn. Add 2 to 4.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {head.map((slot, i) => <PhotoSlot key={slot.id} slot={slot} required={i < 2} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} />)}
              </div>
            </div>
          </section>

          {/* 4. Old photos */}
          <section>
            <SectionTitle n="4" title="Old photos" />
            <p className="text-sm text-muted mb-5">Add 5 to 16 older photos of you from different years. Shortest side 800 px or more.</p>
            <div className="space-y-3">
              {oldPhotos.map((slot, i) => (
                <OldPhotoRow key={slot.id} slot={slot} index={i} required={i < 5} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} onMeta={(patch) => setMeta(slot.id, patch)} />
              ))}
            </div>
          </section>

          {/* 5. Save */}
          <section>
            <SectionTitle n="5" title="Save" />
            <p className="text-sm text-muted mb-4">Save your draft and come back to this link any time. Our team will review it and close it when it is ready. Photos and answers are stored locally in your browser on this device.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={busy || formReadOnly} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-5 py-2.5 text-sm font-medium hover:bg-olive-light transition disabled:opacity-50">Save draft</button>
              {formReadOnly && <span className="text-xs text-muted">This submission is currently read-only.</span>}
            </div>
          </section>
        </form>

        {/* Admin sign-in - discreet, below Save Draft */}
        <div className="mt-8">
          {!adminUnlocked ? (
            <button
              type="button"
              onClick={onRequestAdmin}
              className="text-[11px] text-muted hover:text-charcoal-soft underline underline-offset-2"
            >
              Admin sign-in
            </button>
          ) : (
            <div className="pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-wider text-muted mb-3">Staff area</p>
              <StaffPanel record={record} qualityChecks={qualityChecks} canApproveNow={canApproveNow} correctionText={correctionText} setCorrectionText={setCorrectionText} onApprove={onApprove} onReopen={onReopen} onRequestCorrections={onRequestCorrections} onCloseLink={onCloseLink} onReopenLink={onReopenLink} onForward={onForward} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Counter({ label, count, max, min }: { label: string; count: number; max: number; min: number }) {
  const met = count >= min;
  return (
    <div className="rounded-md border border-border bg-[#FAFAFA] px-3 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted mb-1">{label}</p>
      <p className="font-serif text-2xl text-charcoal leading-none">{count} <span className="text-sm font-sans text-muted">/ {max}</span></p>
      <p className={`text-[11px] mt-1 ${met ? 'text-olive' : 'text-muted'}`}>{met ? `Min ${min} met` : `min ${min}`}</p>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return <h2 className="font-serif text-2xl text-charcoal mb-4 pb-2 border-b border-border-light">{n}. {title}</h2>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal mb-1.5">{label} {required && <span className="text-olive">*</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function inputCls(disabled?: boolean, err?: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm bg-white outline-none transition focus:border-olive focus:ring-1 focus:ring-olive/20 ${err ? 'border-danger/50' : 'border-border'} ${disabled ? 'bg-[#FAFAFA] text-charcoal-soft' : ''}`;
}

function CheckRow({ checked, disabled, onChange, text }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; text: string }) {
  return (
    <label className={`flex items-start gap-3 text-sm ${disabled?'opacity-70':''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C62828]" />
      <span className="text-charcoal-soft leading-relaxed">{text}</span>
    </label>
  );
}

function PhotoSlot({ slot, required, readOnly, onUpload, onRemove }: { slot: SurveyImage; required: boolean; readOnly: boolean; onUpload: (f?: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!slot.dataUrl;
  return (
    <div className="border border-border rounded-md bg-white overflow-hidden">
      <div className="aspect-square bg-[#F5F5F5] flex items-center justify-center relative">
        {has ? (
          <img src={slot.dataUrl!} alt={slot.slotLabel} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-2">
            <svg className="w-8 h-8 mx-auto text-[#BBBBBB] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>
            <p className="text-[11px] text-muted">{required ? 'Required' : 'Optional'}</p>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-charcoal truncate">{slot.slotLabel}</p>
          <span className={`text-[10px] ${has ? 'text-olive' : 'text-muted'}`}>{has ? 'Added' : 'Empty'}</span>
        </div>
        {!readOnly && (
          <div className="flex gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 px-2 py-1.5 rounded border border-border text-[11px] font-medium hover:bg-ivory-deep/40">{has ? 'Replace' : 'Take photo'}</button>
            {has && <button type="button" onClick={onRemove} className="px-2 py-1.5 rounded border border-border text-[11px] text-muted hover:text-danger">Remove</button>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" capture="environment" className="hidden" onChange={e => { onUpload(e.target.files?.[0]); e.target.value=''; }} />
      </div>
    </div>
  );
}

function OldPhotoRow({ slot, required, readOnly, onUpload, onRemove, onMeta }: { slot: SurveyImage; index: number; required: boolean; readOnly: boolean; onUpload: (f?: File) => void; onRemove: () => void; onMeta: (patch: Partial<SurveyImage['metadata']>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!slot.dataUrl;
  return (
    <div className={`rounded-md border ${required ? 'border-border' : 'border-border-light'} bg-white p-3 sm:p-4`}>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="w-full sm:w-28 h-28 shrink-0 rounded border border-border-light bg-[#F5F5F5] overflow-hidden flex items-center justify-center">
          {has ? <img src={slot.dataUrl!} alt={slot.slotLabel} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-[#BBBBBB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-4-4 3-2-1.5L3 17"/></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-medium text-charcoal">{slot.slotLabel} {required ? <span className="text-olive">*</span> : <span className="text-muted font-normal">(optional)</span>}</p>
              <p className="text-[11px] text-muted">{has ? (slot.fileName || 'Photo added') : 'Empty'}</p>
            </div>
            {!readOnly && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => inputRef.current?.click()} className="px-2.5 py-1.5 rounded border border-border text-xs font-medium hover:bg-ivory-deep/40">{has ? 'Replace photo' : 'Add photo'}</button>
                {has && <button type="button" onClick={onRemove} className="px-2.5 py-1.5 rounded border border-border text-xs text-muted hover:text-danger">Remove</button>}
              </div>
            )}
          </div>
          {has && (
            <div className="grid sm:grid-cols-3 gap-2 mt-3">
              <input value={slot.metadata.approxYear} disabled={readOnly} onChange={e => onMeta({ approxYear: e.target.value })} className={inputCls(readOnly)} placeholder="Approximate year" />
              <input value={slot.metadata.location} disabled={readOnly} onChange={e => onMeta({ location: e.target.value })} className={inputCls(readOnly)} placeholder="Location" />
              <input value={slot.metadata.contextualInfo || slot.metadata.title} disabled={readOnly} onChange={e => onMeta({ contextualInfo: e.target.value, title: e.target.value })} className={inputCls(readOnly)} placeholder="Description/context" />
            </div>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { onUpload(e.target.files?.[0]); e.target.value=''; }} />
    </div>
  );
}

function StaffPanel({ record, qualityChecks, canApproveNow, correctionText, setCorrectionText, onApprove, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward }: { record: ParticipantRecord; qualityChecks: ReturnType<typeof getQualityChecks>; canApproveNow: boolean; correctionText: string; setCorrectionText: (v: string) => void; onApprove: () => void; onReopen: (forParticipant: boolean) => void; onRequestCorrections: (t: string) => void; onCloseLink: () => void; onReopenLink: () => void; onForward: () => void }) {
  return (
    <div className="rounded-md border border-border bg-[#FAFAFA] p-4 space-y-4">
      <p className="text-sm font-medium text-charcoal">Staff review (unlocked)</p>
      <div className="space-y-1.5">
        {qualityChecks.map(c => (
          <div key={c.label} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 ${c.ok ? 'text-olive' : 'text-[#9A5A00]'}`}>{c.ok ? '✓' : '•'}</span>
            <span className="text-charcoal-soft"><span className="text-charcoal">{c.label}:</span> {c.detail}</span>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal mb-1">Correction instructions / review notes</label>
        <textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white min-h-[72px]" placeholder="Notes for the participant or team..." />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onApprove} disabled={!canApproveNow} className="px-3 py-2 rounded-md bg-olive text-white text-xs font-medium hover:bg-olive-light disabled:opacity-50">Approve & Lock Submission</button>
        <button type="button" onClick={() => onRequestCorrections(correctionText)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium">Request corrections</button>
        <button type="button" onClick={() => onReopen(true)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium">Reopen for participant</button>
        <button type="button" onClick={() => onReopen(false)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium">Reopen (team only)</button>
        {record.linkStatus === 'active'
          ? <button type="button" onClick={onCloseLink} className="px-3 py-2 rounded-md border border-[#E8CFA8] bg-[#FFF9F1] text-xs font-medium text-[#9A5A00]">Close link</button>
          : <button type="button" onClick={onReopenLink} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium">Reopen link</button>}
        {['approved','locked','forwarded'].includes(record.status) && <button type="button" onClick={onForward} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium">Mark forwarded</button>}
      </div>
    </div>
  );
}
