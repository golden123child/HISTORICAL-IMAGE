import { useEffect, useMemo, useRef, useState } from 'react';
import type { ParticipantRecord, SurveyImage } from '../../types';
import { HEAD_POSE_MAX, HEAD_POSE_MIN, HISTORICAL_MAX, HISTORICAL_MIN, NEUTRAL_MAX, NEUTRAL_MIN } from '../../types';
import { canApprove, countUploaded, getQualityChecks, logEvent } from '../../utils/records';
import { buildSurveyLink, nowIso, recordToLinkSeed } from '../../utils/id';
import { formatFileSize, isAcceptedImage, readImageAsDataUrl } from '../../utils/image';

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

function statusLabel(status: ParticipantRecord['status']) {
  const map: Record<string, string> = {
    not_started: 'Not started', in_progress: 'In progress', draft_saved: 'Draft saved',
    changes_requested: 'Changes requested', reopened: 'Reopened', approved: 'Approved', locked: 'Locked', forwarded: 'Forwarded',
  };
  return map[status] || status;
}

function completionPercent(record: ParticipantRecord) {
  const checks = [
    record.consent.ageEligible && record.consent.consentResearch && record.consent.consentPermission,
    !!record.participantInfo.fullName.trim(),
    !!record.participantInfo.ageGroup,
    !!record.participantInfo.gender,
    !!record.participantInfo.region,
    !!record.participantInfo.country.trim(),
    !!record.participantInfo.preferredContactMethod && !!record.participantInfo.contactValue.trim(),
    countUploaded(record.images, 'neutral') >= NEUTRAL_MIN,
    countUploaded(record.images, 'head_pose') >= HEAD_POSE_MIN,
    countUploaded(record.images, 'historical') >= HISTORICAL_MIN,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function ParticipantSurveyForm(props: Props) {
  const { record, adminUnlocked, busy, saveMsg, onSaveDraft, onUpdateRecord, onUpdateImages, onRequestAdmin, onApprove, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward, onFillDemo } = props;
  const [correctionText, setCorrectionText] = useState(record.review.correctionInstructions || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => { if (saveMsg) { setJustSaved(true); const t = setTimeout(() => setJustSaved(false), 2500); return () => clearTimeout(t); } }, [saveMsg]);

  const neutral = record.images.filter(i => i.group === 'neutral');
  const head = record.images.filter(i => i.group === 'head_pose');
  const oldPhotos = record.images.filter(i => i.group === 'historical');
  const neutralCount = countUploaded(record.images, 'neutral');
  const headCount = countUploaded(record.images, 'head_pose');
  const oldCount = countUploaded(record.images, 'historical');
  const progress = useMemo(() => completionPercent(record), [record]);

  const readOnly = (record.status === 'approved' || record.status === 'locked' || record.status === 'forwarded') && !adminUnlocked;
  const isReopenedTeamOnly = record.status === 'reopened' && !record.review.reopenedForParticipant && !adminUnlocked;
  const formReadOnly = readOnly || isReopenedTeamOnly || record.linkStatus === 'closed';
  const surveyUrl = buildSurveyLink(record.token, recordToLinkSeed(record));
  const qualityChecks = getQualityChecks(record);
  const canApproveNow = adminUnlocked && canApprove(record) && !['approved', 'locked', 'forwarded'].includes(record.status);

  const setConsent = (k: 'ageEligible' | 'consentResearch' | 'consentPermission', v: boolean) => {
    if (formReadOnly) return;
    setErrors(e => { const n = { ...e }; delete n.consent; return n; });
    onUpdateRecord(r => ({ ...r, consent: { ...r.consent, [k]: v }, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
  };
  const setInfo = (k: string, v: string) => {
    if (formReadOnly) return;
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
    onUpdateRecord(r => ({ ...r, participantInfo: { ...r.participantInfo, [k]: v } as any, status: r.status === 'not_started' ? 'in_progress' : r.status, lastActivityAt: nowIso() }));
  };

  const handleUpload = async (slot: SurveyImage, file?: File) => {
    if (!file || formReadOnly) return;
    if (!isAcceptedImage(file)) { alert('Unsupported file format. Please upload JPEG, JPG, PNG, or WEBP.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('This file is too large. Please use an image under 20 MB.'); return; }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl, fileName: file.name, mimeType: file.type, sizeBytes: file.size, uploadedAt: nowIso(), reviewRejected: false, reviewNote: '' } : i));
      onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), status: r.status === 'not_started' ? 'in_progress' : r.status, activity: [...r.activity, logEvent('participant', 'Photo uploaded', `${slot.slotLabel} (${file.name})`)] }));
    } catch { alert('Could not read that image. Please try another file.'); }
  };

  const removeImage = (slot: SurveyImage) => {
    if (formReadOnly) return;
    onUpdateImages(imgs => imgs.map(i => i.id === slot.id ? { ...i, dataUrl: null, fileName: null, mimeType: null, sizeBytes: null, uploadedAt: null, reviewRejected: false, reviewNote: '' } : i));
    onUpdateRecord(r => ({ ...r, lastActivityAt: nowIso(), activity: [...r.activity, logEvent('participant', 'Photo removed', slot.slotLabel)] }));
  };

  const setMeta = (slotId: string, patch: Partial<SurveyImage['metadata']>) => {
    if (formReadOnly) return;
    onUpdateImages(imgs => imgs.map(i => i.id === slotId ? { ...i, metadata: { ...i.metadata, ...patch } } : i));
  };

  const onSave = () => {
    const e: Record<string, string> = {};
    const p = record.participantInfo;
    if (p.contactValue.trim()) {
      if (p.preferredContactMethod === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactValue.trim())) e.contactValue = 'Enter a valid email address.';
      if (p.preferredContactMethod === 'WhatsApp' && p.contactValue.replace(/\D/g, '').length < 7) e.contactValue = 'Enter a valid WhatsApp number.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0) onSaveDraft();
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-charcoal">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-olive">Fieldwork Africa</p>
              <h1 className="font-serif text-3xl sm:text-[2.6rem] text-charcoal leading-[1.1] mt-2">Photo Collection Form</h1>
              <p className="text-sm text-charcoal-soft mt-2 max-w-2xl">Help us build a historical image collection. Save your draft anytime and return to this private link on the same device.</p>
            </div>
            <div className="sm:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white text-xs font-medium text-charcoal-soft">
                <span className={`w-1.5 h-1.5 rounded-full ${progress === 100 ? 'bg-olive' : 'bg-[#C62828]'}`} />
                {statusLabel(record.status)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="bg-white border border-border rounded-lg px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Completion</span><span className="font-medium text-charcoal-soft">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#EFEFEF] rounded-full overflow-hidden">
                <div className="h-full bg-olive rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg px-4 py-3 text-xs text-muted">
              <div><span className="font-medium text-charcoal-soft">Participant reference:</span> {record.participantId}</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted break-all"><span className="font-medium text-charcoal-soft">Private link:</span> {surveyUrl}</div>
        </header>

        <div className="mb-6 rounded-lg border border-border bg-white px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">Prototype demo tools</p>
              <p className="text-xs text-charcoal-soft mt-0.5">For testing only — not shown as normal participant functionality in production.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onFillDemo('full')} className="px-3 py-1.5 rounded-md border border-border bg-[#FAFAFA] text-xs font-medium hover:bg-ivory-deep/40">Fill full set</button>
              <button type="button" onClick={() => onFillDemo('incomplete')} className="px-3 py-1.5 rounded-md border border-border bg-[#FAFAFA] text-xs font-medium hover:bg-ivory-deep/40">Fill incomplete</button>
              <button type="button" onClick={() => onFillDemo('new')} className="px-3 py-1.5 rounded-md border border-border bg-[#FAFAFA] text-xs font-medium hover:bg-ivory-deep/40">New respondent</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Counter label="Neutral selfies" count={neutralCount} max={NEUTRAL_MAX} min={NEUTRAL_MIN} />
          <Counter label="Head poses" count={headCount} max={HEAD_POSE_MAX} min={HEAD_POSE_MIN} />
          <Counter label="Old photos" count={oldCount} max={HISTORICAL_MAX} min={HISTORICAL_MIN} />
        </div>

        {saveMsg && <div className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${justSaved ? 'border-olive/20 bg-olive-pale/40 text-olive' : 'border-border bg-white text-charcoal-soft'}`}>{saveMsg}</div>}
        {record.status === 'changes_requested' && record.review.correctionInstructions && (
          <div className="mb-6 rounded-lg border border-[#E8CFA8] bg-[#FFF9F1] px-4 py-3">
            <p className="text-sm font-medium text-[#9A5A00] mb-1">Corrections requested</p>
            <p className="text-sm text-charcoal-soft whitespace-pre-wrap">{record.review.correctionInstructions}</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-6">
          <Section n="1" title="Consent" subtitle="Please confirm the following before continuing.">
            <div className="space-y-3">
              <CheckRow checked={record.consent.ageEligible} disabled={formReadOnly} onChange={v => setConsent('ageEligible', v)} text="I am 18 or older and I agree that my photos and answers may be used to train and test machine-learning models." />
              <CheckRow checked={record.consent.consentPermission} disabled={formReadOnly} onChange={v => { setConsent('consentPermission', v); setConsent('consentResearch', v || record.consent.consentResearch); }} text="Every photo shows me, and I have permission from anyone else who appears in my old photos." />
              <CheckRow checked={record.consent.consentResearch} disabled={formReadOnly} onChange={v => setConsent('consentResearch', v)} text="I consent to the use of my submitted photos and answers for the intended research purposes." />
            </div>
            {errors.consent && <p className="mt-3 text-xs text-danger">{errors.consent}</p>}
          </Section>

          <Section n="2" title="About you" subtitle="This helps us understand who is represented in the collection.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required error={errors.fullName} className="sm:col-span-2">
                <input value={record.participantInfo.fullName} disabled={formReadOnly} onChange={e => setInfo('fullName', e.target.value)} className={inputCls(formReadOnly, !!errors.fullName)} placeholder="Your full name" autoComplete="name" />
              </Field>
              <Field label="Age group" required>
                <select value={record.participantInfo.ageGroup} disabled={formReadOnly} onChange={e => setInfo('ageGroup', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select age group</option>
                  {['18–24', '25–34', '35–44', '45–54', '55–64', '65+'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Gender" required>
                <select value={record.participantInfo.gender} disabled={formReadOnly} onChange={e => setInfo('gender', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select gender</option>
                  {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Region" required>
                <select value={record.participantInfo.region} disabled={formReadOnly} onChange={e => setInfo('region', e.target.value)} className={inputCls(formReadOnly)}>
                  <option value="">Select region</option>
                  {['South / Southeast Asia', 'Africa / Middle East', 'Europe', 'North / South America', 'Australia'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Country" required>
                <input value={record.participantInfo.country} disabled={formReadOnly} onChange={e => setInfo('country', e.target.value)} className={inputCls(formReadOnly)} placeholder="e.g. Nigeria" autoComplete="country-name" />
              </Field>
              <Field label="If a photo needs retaking, reach me by">
                <div className="flex gap-4 pt-2">
                  {['WhatsApp', 'Email'].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm text-charcoal-soft cursor-pointer">
                      <input type="radio" name="contactMethod" checked={record.participantInfo.preferredContactMethod === opt} disabled={formReadOnly} onChange={() => setInfo('preferredContactMethod', opt)} className="accent-[#C62828]" /> {opt}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label={record.participantInfo.preferredContactMethod === 'Email' ? 'Email address' : 'WhatsApp number or email'} required error={errors.contactValue}>
                <input
                  value={record.participantInfo.contactValue}
                  disabled={formReadOnly}
                  onChange={e => setInfo('contactValue', e.target.value)}
                  className={inputCls(formReadOnly, !!errors.contactValue)}
                  type={record.participantInfo.preferredContactMethod === 'Email' ? 'email' : 'text'}
                  inputMode={record.participantInfo.preferredContactMethod === 'Email' ? 'email' : 'tel'}
                  placeholder={record.participantInfo.preferredContactMethod === 'Email' ? 'name@example.com' : '+234 801 234 5678'}
                  autoComplete={record.participantInfo.preferredContactMethod === 'Email' ? 'email' : 'tel'}
                />
              </Field>
            </div>
            <p className="text-xs text-muted mt-4">Used only to send you a reminder. It is never shared with the client.</p>
          </Section>

          <Section n="3" title="Selfies" subtitle="Take these now in good light, no filters. JPEG, PNG, or WEBP accepted; shortest side 1000 px or more recommended.">
            <div className="space-y-8">
              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold text-charcoal">Neutral face</h3>
                  <span className={`text-xs ${neutralCount >= NEUTRAL_MIN ? 'text-olive font-medium' : 'text-muted'}`}>{neutralCount} / {NEUTRAL_MAX} · min {NEUTRAL_MIN}</span>
                </div>
                <p className="text-xs text-muted mb-3">Look straight at the camera, mouth closed. Add 2 to 4.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {neutral.map((slot, i) => <PhotoSlot key={slot.id} slot={slot} required={i < 2} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} />)}
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-semibold text-charcoal">Head poses</h3>
                  <span className={`text-xs ${headCount >= HEAD_POSE_MIN ? 'text-olive font-medium' : 'text-muted'}`}>{headCount} / {HEAD_POSE_MAX} · min {HEAD_POSE_MIN}</span>
                </div>
                <p className="text-xs text-muted mb-3">Keep your whole face in frame as you turn. Add 2 to 4.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {head.map((slot, i) => <PhotoSlot key={slot.id} slot={slot} required={i < 2} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} />)}
                </div>
              </div>
            </div>
          </Section>

          <Section n="4" title="Old photos" subtitle="Add 5 to 16 older photos of you from different years. Shortest side 800 px or more recommended. Add details only after uploading a photo.">
            <div className="space-y-3">
              {oldPhotos.map((slot, i) => (
                <OldPhotoRow key={slot.id} slot={slot} index={i} required={i < 5} readOnly={formReadOnly} onUpload={f => void handleUpload(slot, f)} onRemove={() => removeImage(slot)} onMeta={patch => setMeta(slot.id, patch)} />
              ))}
            </div>
          </Section>

          <Section n="5" title="Save" subtitle="Save your draft and come back to this link any time. Our team will review it when ready.">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button type="submit" disabled={busy || formReadOnly} className="inline-flex items-center justify-center rounded-md bg-olive text-white px-6 py-2.5 text-sm font-medium hover:bg-olive-light transition disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? 'Saving...' : 'Save draft'}
              </button>
              {saveMsg && <span className="text-sm text-olive">{saveMsg}</span>}
              {formReadOnly && <span className="text-xs text-muted">This submission is currently read-only.</span>}
            </div>
            <p className="text-xs text-muted mt-4">Photos and answers are stored locally in your browser on this device. They are not uploaded to a server by this prototype.</p>
          </Section>
        </form>

        <div className="mt-8">
          {!adminUnlocked ? (
            <button type="button" onClick={onRequestAdmin} className="text-[11px] text-muted hover:text-charcoal-soft underline underline-offset-2">Admin sign-in</button>
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
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
        <span className={`text-[11px] font-medium ${met ? 'text-olive' : 'text-muted'}`}>{met ? 'Min met' : `Min ${min}`}</span>
      </div>
      <p className="text-charcoal"><span className="font-serif text-2xl">{count}</span> <span className="text-sm text-muted">/ {max}</span></p>
    </div>
  );
}

function Section({ n, title, subtitle, children }: { n: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-xl p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-olive">{n}.</span>
          <h2 className="font-serif text-2xl text-charcoal">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-muted mt-1.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, error, children, className = '' }: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-charcoal mb-1.5">{label} {required && <span className="text-olive">*</span>}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function inputCls(disabled?: boolean, err?: boolean) {
  return `w-full rounded-md border px-3 py-2.5 text-sm bg-white outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10 ${err ? 'border-danger/50 bg-[#FFF8F8]' : 'border-border'} ${disabled ? 'bg-[#FAFAFA] text-charcoal-soft cursor-not-allowed' : ''}`;
}

function CheckRow({ checked, disabled, onChange, text }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; text: string }) {
  return (
    <label className={`flex items-start gap-3 text-sm rounded-md px-3 py-2.5 border ${checked ? 'border-olive/20 bg-olive-pale/20' : 'border-border-light bg-[#FCFCFC]'} ${disabled ? 'opacity-75' : 'cursor-pointer hover:border-olive/20'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C62828]" />
      <span className="text-charcoal-soft leading-relaxed">{text}</span>
    </label>
  );
}

function PhotoSlot({ slot, required, readOnly, onUpload, onRemove }: { slot: SurveyImage; required: boolean; readOnly: boolean; onUpload: (f?: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!slot.dataUrl;
  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${has ? 'border-olive/20' : 'border-border'}`}>
      <div className="aspect-square bg-[#F7F7F7] flex items-center justify-center relative">
        {has ? (
          <img src={slot.dataUrl!} alt={slot.slotLabel} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-white border border-border flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-[#BBBBBB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <p className="text-[11px] text-muted">{required ? 'Required' : 'Optional'}</p>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-charcoal truncate">{slot.slotLabel}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${has ? 'bg-olive-pale/50 text-olive' : 'bg-[#F3F3F3] text-muted'}`}>{has ? 'Added' : 'Empty'}</span>
        </div>
        {!readOnly && (
          <div className="flex gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 px-2 py-1.5 rounded-md border border-border text-[11px] font-medium hover:bg-ivory-deep/40 transition">{has ? 'Replace' : 'Take photo'}</button>
            {has && <button type="button" onClick={onRemove} className="px-2 py-1.5 rounded-md border border-border text-[11px] text-muted hover:text-danger hover:border-danger/30 transition">Remove</button>}
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" capture="environment" className="hidden" onChange={e => { onUpload(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}

function OldPhotoRow({ slot, required, readOnly, onUpload, onRemove, onMeta }: { slot: SurveyImage; index: number; required: boolean; readOnly: boolean; onUpload: (f?: File) => void; onRemove: () => void; onMeta: (patch: Partial<SurveyImage['metadata']>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const has = !!slot.dataUrl;
  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${has ? 'border-olive/15 bg-white' : required ? 'border-border bg-white' : 'border-border-light bg-[#FCFCFC]'}`}>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="w-full sm:w-28 h-32 sm:h-28 shrink-0 rounded-md border border-border-light bg-[#F7F7F7] overflow-hidden flex items-center justify-center">
          {has ? <img src={slot.dataUrl!} alt={slot.slotLabel} className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-[#C4C4C4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-4-4 3-2-1.5L3 17" /></svg>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-medium text-charcoal">{slot.slotLabel} {required ? <span className="text-olive">*</span> : <span className="text-muted font-normal">(optional)</span>}</p>
              <p className="text-[11px] text-muted mt-0.5">{has ? `${slot.fileName || 'Photo added'}${slot.sizeBytes ? ` · ${formatFileSize(slot.sizeBytes)}` : ''}` : 'No photo added yet'}</p>
            </div>
            {!readOnly && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => inputRef.current?.click()} className="px-2.5 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-ivory-deep/40 transition">{has ? 'Replace' : 'Add photo'}</button>
                {has && <button type="button" onClick={onRemove} className="px-2.5 py-1.5 rounded-md border border-border text-xs text-muted hover:text-danger hover:border-danger/30 transition">Remove</button>}
              </div>
            )}
          </div>
          {has && (
            <div className="grid sm:grid-cols-3 gap-2 mt-3">
              <label className="block">
                <span className="block text-[11px] font-medium text-charcoal-soft mb-1">Approximate year</span>
                <input value={slot.metadata.approxYear} disabled={readOnly} onChange={e => onMeta({ approxYear: e.target.value })} className={inputCls(readOnly)} placeholder="e.g. 1998" inputMode="numeric" />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-charcoal-soft mb-1">Location</span>
                <input value={slot.metadata.location} disabled={readOnly} onChange={e => onMeta({ location: e.target.value })} className={inputCls(readOnly)} placeholder="City, country" />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-charcoal-soft mb-1">Description / context</span>
                <input value={slot.metadata.contextualInfo || slot.metadata.title} disabled={readOnly} onChange={e => onMeta({ contextualInfo: e.target.value, title: e.target.value })} className={inputCls(readOnly)} placeholder="What is happening in this photo?" />
              </label>
            </div>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { onUpload(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function StaffPanel({ record, qualityChecks, canApproveNow, correctionText, setCorrectionText, onApprove, onReopen, onRequestCorrections, onCloseLink, onReopenLink, onForward }: { record: ParticipantRecord; qualityChecks: ReturnType<typeof getQualityChecks>; canApproveNow: boolean; correctionText: string; setCorrectionText: (v: string) => void; onApprove: () => void; onReopen: (forParticipant: boolean) => void; onRequestCorrections: (t: string) => void; onCloseLink: () => void; onReopenLink: () => void; onForward: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-[#FAFAFA] p-4 sm:p-5 space-y-4">
      <p className="text-sm font-medium text-charcoal">Staff review (unlocked)</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {qualityChecks.map(c => (
          <div key={c.label} className="flex items-start gap-2 text-xs">
            <span className={`mt-0.5 ${c.ok ? 'text-olive' : 'text-[#9A5A00]'}`}>{c.ok ? '✓' : '•'}</span>
            <span className="text-charcoal-soft"><span className="text-charcoal">{c.label}:</span> {c.detail}</span>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-charcoal mb-1.5">Correction instructions / review notes</label>
        <textarea value={correctionText} onChange={e => setCorrectionText(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white min-h-[80px] outline-none focus:border-olive focus:ring-2 focus:ring-olive/10" placeholder="Notes for the participant or team..." />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onApprove} disabled={!canApproveNow} className="px-3 py-2 rounded-md bg-olive text-white text-xs font-medium hover:bg-olive-light disabled:opacity-50">Approve &amp; Lock Submission</button>
        <button type="button" onClick={() => onRequestCorrections(correctionText)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Request corrections</button>
        <button type="button" onClick={() => onReopen(true)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Reopen for participant</button>
        <button type="button" onClick={() => onReopen(false)} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Reopen (team only)</button>
        {record.linkStatus === 'active'
          ? <button type="button" onClick={onCloseLink} className="px-3 py-2 rounded-md border border-[#E8CFA8] bg-[#FFF9F1] text-xs font-medium text-[#9A5A00] hover:bg-[#FFF3E0]">Close link</button>
          : <button type="button" onClick={onReopenLink} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Reopen link</button>}
        {['approved', 'locked', 'forwarded'].includes(record.status) && <button type="button" onClick={onForward} className="px-3 py-2 rounded-md border border-border bg-white text-xs font-medium hover:bg-ivory-deep/40">Mark forwarded</button>}
      </div>
    </div>
  );
}
