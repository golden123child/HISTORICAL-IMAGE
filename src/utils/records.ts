import {
  HEAD_POSE_MAX,
  HEAD_POSE_MIN,
  HEAD_POSE_SLOTS,
  HISTORICAL_MAX,
  HISTORICAL_MIN,
  NEUTRAL_MAX,
  NEUTRAL_MIN,
  type ActivityEvent,
  type ActorType,
  type ImageMetadata,
  type ParticipantRecord,
  type SurveyImage,
} from '../types';
import { formatParticipantId, nowIso, randomToken, uid } from './id';

export function emptyMetadata(): ImageMetadata {
  return {
    title: '',
    approxYear: '',
    location: '',
    category: '',
    customCategory: '',
    contextualInfo: '',
    notes: '',
  };
}

export function makeImage(group: SurveyImage['group'], slotKey: string, slotLabel: string): SurveyImage {
  return {
    id: uid('img'),
    group,
    slotKey,
    slotLabel,
    fileName: null,
    mimeType: null,
    dataUrl: null,
    sizeBytes: null,
    uploadedAt: null,
    metadata: emptyMetadata(),
    reviewRejected: false,
    reviewNote: '',
  };
}

export function createDefaultImages(): SurveyImage[] {
  const images: SurveyImage[] = [];
  for (let i = 1; i <= NEUTRAL_MAX; i++) {
    images.push(makeImage('neutral', `neutral-${i}`, `Neutral ${i}`));
  }
  for (const slot of HEAD_POSE_SLOTS) {
    images.push(makeImage('head_pose', slot.key, slot.label));
  }
  for (let i = 1; i <= HISTORICAL_MAX; i++) {
    images.push(makeImage('historical', `historical-${i}`, `Old photo ${i}`));
  }
  return images;
}

export function logEvent(actor: ActorType, action: string, details?: string): ActivityEvent {
  return { id: uid('evt'), timestamp: nowIso(), actor, action, details };
}

export function createParticipantRecord(seq: number, overrides?: Partial<Pick<ParticipantRecord, 'importedName' | 'importedPhone' | 'isDemo'>>): ParticipantRecord {
  const ts = nowIso();
  return {
    participantId: formatParticipantId(seq),
    token: randomToken(18),
    createdAt: ts,
    updatedAt: ts,
    lastActivityAt: ts,
    status: 'not_started',
    linkStatus: 'active',
    consent: { ageEligible: false, consentResearch: false, consentPermission: false },
    participantInfo: {
      ageGroup: '',
      gender: '',
      region: '',
      country: '',
      preferredContactMethod: '',
      contactValue: '',
    },
    images: createDefaultImages(),
    review: {
      reviewNotes: '',
      correctionInstructions: '',
      reviewedAt: null,
      approvedAt: null,
      approvedBy: null,
      reopenedAt: null,
      reopenedForParticipant: false,
      forwardedAt: null,
    },
    activity: [logEvent('system', 'Participant record created', `Participant ${formatParticipantId(seq)} generated.`)],
    isDemo: overrides?.isDemo ?? false,
    importedName: overrides?.importedName,
    importedPhone: overrides?.importedPhone,
  };
}

/** Normalize legacy records so existing participant links continue to work. */
export function normalizeRecord(input: any): ParticipantRecord {
  const base = createParticipantRecord(1);
  const r: any = { ...base, ...input };
  r.consent = { ...base.consent, ...(input?.consent || {}) };
  r.participantInfo = { ...base.participantInfo, ...(input?.participantInfo || {}) };
  r.review = { ...base.review, ...(input?.review || {}) };
  r.activity = Array.isArray(input?.activity) ? input.activity : base.activity;
  r.linkStatus = input?.linkStatus === 'closed' ? 'closed' : 'active';
  r.status = input?.status || 'not_started';
  r.isDemo = !!input?.isDemo;
  r.createdAt = input?.createdAt || base.createdAt;
  r.updatedAt = input?.updatedAt || base.updatedAt;
  r.lastActivityAt = input?.lastActivityAt || input?.updatedAt || base.lastActivityAt;

  // Map legacy regions to new reference values.
  const regionMap: Record<string, ParticipantRecord['participantInfo']['region'] | string> = {
    'Africa': 'Africa / Middle East',
    'Middle East': 'Africa / Middle East',
    'Asia': 'South / Southeast Asia',
    'North America': 'North / South America',
    'South America': 'North / South America',
    'Australia/Oceania': 'Australia',
  };
  if (r.participantInfo.region && regionMap[r.participantInfo.region]) {
    r.participantInfo.region = regionMap[r.participantInfo.region];
  }

  // Normalize images by group+slotKey while preserving uploaded content.
  const oldImages: any[] = Array.isArray(input?.images) ? input.images : [];
  const byKey = new Map<string, any>();
  for (const img of oldImages) {
    if (img?.group && img?.slotKey) byKey.set(`${img.group}:${img.slotKey}`, img);
  }
  // Legacy head pose keys mapped to new keys by index.
  const legacyHead = oldImages.filter(i => i?.group === 'head_pose');
  const legacyNeutral = oldImages.filter(i => i?.group === 'neutral');
  const legacyHist = oldImages.filter(i => i?.group === 'historical');

  const defaults = createDefaultImages();
  r.images = defaults.map((def) => {
    let old = byKey.get(`${def.group}:${def.slotKey}`);
    if (!old) {
      if (def.group === 'head_pose') {
        const idx = HEAD_POSE_SLOTS.findIndex(s => s.key === def.slotKey);
        old = legacyHead[idx];
      } else if (def.group === 'neutral') {
        const idx = parseInt(def.slotKey.split('-')[1], 10) - 1;
        old = legacyNeutral[idx];
      } else if (def.group === 'historical') {
        const idx = parseInt(def.slotKey.split('-')[1], 10) - 1;
        old = legacyHist[idx];
      }
    }
    if (!old) return def;
    return {
      ...def,
      id: old.id || def.id,
      fileName: old.fileName ?? null,
      mimeType: old.mimeType ?? null,
      dataUrl: old.dataUrl ?? null,
      sizeBytes: old.sizeBytes ?? null,
      uploadedAt: old.uploadedAt ?? null,
      metadata: { ...emptyMetadata(), ...(old.metadata || {}) },
      reviewRejected: !!old.reviewRejected,
      reviewNote: old.reviewNote || '',
    };
  });
  return r as ParticipantRecord;
}

export function normalizeRecords(records: any[]): ParticipantRecord[] {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeRecord);
}

export function countUploaded(images: SurveyImage[], group: SurveyImage['group']): number {
  return images.filter((i) => i.group === group && !!i.dataUrl && !i.reviewRejected).length;
}

export function countTotalUploaded(images: SurveyImage[]): number {
  return images.filter((i) => !!i.dataUrl && !i.reviewRejected).length;
}

export function hasConsent(c: ParticipantRecord['consent']): boolean {
  return c.ageEligible && c.consentResearch && c.consentPermission;
}

export function isParticipantInfoComplete(p: ParticipantRecord['participantInfo']): boolean {
  const base = !!(p.ageGroup && p.gender && p.region && p.country && p.preferredContactMethod && p.contactValue.trim());
  if (!base) return false;
  if (p.preferredContactMethod === 'Email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.contactValue.trim());
  return p.contactValue.replace(/\D/g, '').length >= 7;
}

export function historicalMetadataComplete(images: SurveyImage[]): boolean {
  const uploaded = images.filter((i) => i.group === 'historical' && !!i.dataUrl && !i.reviewRejected);
  return uploaded.every((i) => {
    const m = i.metadata;
    return !!(m.approxYear.trim() && m.location.trim() && (m.contextualInfo || m.title || '').trim());
  });
}

export interface QualityCheck {
  label: string;
  ok: boolean;
  detail: string;
}

export function getQualityChecks(record: ParticipantRecord): QualityCheck[] {
  const neutral = countUploaded(record.images, 'neutral');
  const head = countUploaded(record.images, 'head_pose');
  const hist = countUploaded(record.images, 'historical');
  const total = neutral + head + hist;
  const info = record.participantInfo;
  const contactValid = info.preferredContactMethod === 'Email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.contactValue.trim())
    : info.preferredContactMethod === 'WhatsApp'
      ? info.contactValue.replace(/\D/g, '').length >= 7
      : !!info.contactValue.trim();
  const metaOk = historicalMetadataComplete(record.images);
  return [
    { label: 'Consent completed', ok: hasConsent(record.consent), detail: hasConsent(record.consent) ? 'All consent confirmations provided.' : 'Consent is incomplete.' },
    { label: 'Participant information complete', ok: isParticipantInfoComplete(record.participantInfo), detail: isParticipantInfoComplete(record.participantInfo) ? 'Required participant information provided.' : 'Required participant information is incomplete.' },
    { label: 'Contact information valid', ok: contactValid, detail: contactValid ? `${info.preferredContactMethod || 'Contact'} provided.` : 'Valid contact information required.' },
    { label: 'Neutral photos', ok: neutral >= NEUTRAL_MIN, detail: `${neutral}/${NEUTRAL_MIN} minimum (${neutral} of ${NEUTRAL_MAX} uploaded).` },
    { label: 'Head poses', ok: head >= HEAD_POSE_MIN, detail: `${head}/${HEAD_POSE_MIN} minimum (${head} of ${HEAD_POSE_MAX} uploaded).` },
    { label: 'Old photos', ok: hist >= HISTORICAL_MIN, detail: `${hist}/${HISTORICAL_MIN} minimum (${hist} of ${HISTORICAL_MAX} uploaded).` },
    { label: 'Old photo metadata', ok: metaOk, detail: metaOk ? 'Required metadata provided for uploaded old photos.' : 'Some uploaded old photos are missing year, location, or description.' },
    { label: 'Total images', ok: total >= (NEUTRAL_MIN + HEAD_POSE_MIN + HISTORICAL_MIN), detail: `${total}/${NEUTRAL_MIN + HEAD_POSE_MIN + HISTORICAL_MIN} minimum.` },
  ];
}

export function canApprove(record: ParticipantRecord): boolean {
  return getQualityChecks(record).every((c) => c.ok);
}
