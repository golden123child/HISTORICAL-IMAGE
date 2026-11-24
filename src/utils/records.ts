import {
  HEAD_POSE_SLOTS,
  HISTORICAL_MAX,
  NEUTRAL_MAX,
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
    images.push(makeImage('neutral', `neutral-${i}`, `Neutral photo ${i}`));
  }
  for (const slot of HEAD_POSE_SLOTS) {
    images.push(makeImage('head_pose', slot.key, slot.label));
  }
  for (let i = 1; i <= HISTORICAL_MAX; i++) {
    images.push(makeImage('historical', `historical-${i}`, `Historical photograph ${i}`));
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
  // WhatsApp - basic sanity check
  return p.contactValue.replace(/\D/g, '').length >= 7;
}

export function historicalMetadataComplete(images: SurveyImage[]): boolean {
  const uploaded = images.filter((i) => i.group === 'historical' && !!i.dataUrl && !i.reviewRejected);
  return uploaded.every((i) => {
    const m = i.metadata;
    const cat = m.category === 'Other' ? m.customCategory.trim() : m.category;
    return !!(m.title.trim() && m.approxYear.trim() && m.location.trim() && cat);
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
      : false;
  const metaOk = historicalMetadataComplete(record.images);
  return [
    { label: 'Consent completed', ok: hasConsent(record.consent), detail: hasConsent(record.consent) ? 'All consent confirmations provided.' : 'Consent is incomplete.' },
    { label: 'Participant information complete', ok: !!(info.ageGroup && info.gender && info.region && info.country && info.preferredContactMethod), detail: 'Required demographic fields completed.' },
    { label: 'Contact information valid', ok: contactValid, detail: contactValid ? `${info.preferredContactMethod} contact provided.` : 'Valid contact information required.' },
    { label: 'Neutral photos', ok: neutral >= 2, detail: `${neutral}/2 minimum (${neutral} of 4 uploaded).` },
    { label: 'Head poses', ok: head >= 2, detail: `${head}/2 minimum (${head} of 4 uploaded).` },
    { label: 'Historical photos', ok: hist >= 5, detail: `${hist}/5 minimum (${hist} of 16 uploaded).` },
    { label: 'Total images', ok: total >= 9, detail: `${total}/9 minimum.` },
    { label: 'Historical image metadata', ok: metaOk, detail: metaOk ? 'Required metadata provided for uploaded historical images.' : 'Some uploaded historical images are missing required metadata.' },
  ];
}

export function canApprove(record: ParticipantRecord): boolean {
  return getQualityChecks(record).every((c) => c.ok);
}
