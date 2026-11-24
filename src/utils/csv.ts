import * as XLSX from 'xlsx';
import type { ParticipantRecord } from '../types';
import { countTotalUploaded } from './records';

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) lines.push(headers.map((h) => escapeCsv(row[h])).join(','));
  return lines.join('\n');
}

export function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  downloadBlob(toCsv(rows), filename, 'text/csv;charset=utf-8;');
}

export function participantRegistryRows(records: ParticipantRecord[], baseUrl: string) {
  return records.map((r) => ({
    participant_id: r.participantId,
    token: r.token,
    survey_link: `${baseUrl}/survey/${r.token}`,
    country: r.participantInfo.country,
    region: r.participantInfo.region,
    status: r.status,
    link_status: r.linkStatus,
    image_count: countTotalUploaded(r.images),
    created_at: r.createdAt,
    last_activity: r.lastActivityAt,
    forwarded_at: r.review.forwardedAt || '',
    imported_name: r.importedName || '',
    imported_phone: r.importedPhone || '',
  }));
}

export function surveyDataRows(records: ParticipantRecord[]) {
  return records.map((r) => {
    const neutral = r.images.filter((i) => i.group === 'neutral' && i.dataUrl && !i.reviewRejected).length;
    const head = r.images.filter((i) => i.group === 'head_pose' && i.dataUrl && !i.reviewRejected).length;
    const hist = r.images.filter((i) => i.group === 'historical' && i.dataUrl && !i.reviewRejected).length;
    return {
      participant_id: r.participantId,
      status: r.status,
      link_status: r.linkStatus,
      consent_age_eligible: r.consent.ageEligible,
      consent_research: r.consent.consentResearch,
      consent_permission: r.consent.consentPermission,
      age_group: r.participantInfo.ageGroup,
      gender: r.participantInfo.gender,
      region: r.participantInfo.region,
      country: r.participantInfo.country,
      preferred_contact_method: r.participantInfo.preferredContactMethod,
      contact_value: r.participantInfo.contactValue,
      neutral_count: neutral,
      head_pose_count: head,
      historical_count: hist,
      total_count: neutral + head + hist,
      review_notes: r.review.reviewNotes,
      correction_instructions: r.review.correctionInstructions,
      approved_at: r.review.approvedAt || '',
      forwarded_at: r.review.forwardedAt || '',
    };
  });
}

export function imageMetadataRows(records: ParticipantRecord[]) {
  const rows: Record<string, unknown>[] = [];
  for (const r of records) {
    for (const img of r.images) {
      if (!img.dataUrl) continue;
      const cat = img.metadata.category === 'Other' ? img.metadata.customCategory : img.metadata.category;
      rows.push({
        participant_id: r.participantId,
        image_group: img.group,
        slot_key: img.slotKey,
        slot_label: img.slotLabel,
        file_name: img.fileName || '',
        title: img.metadata.title,
        approx_year: img.metadata.approxYear,
        location: img.metadata.location,
        category: cat,
        contextual_info: img.metadata.contextualInfo,
        notes: img.metadata.notes,
        review_rejected: img.reviewRejected,
        review_note: img.reviewNote,
      });
    }
  }
  return rows;
}

export interface ImportedParticipantRow {
  name?: string;
  phone?: string;
  email?: string;
  country?: string;
  region?: string;
  raw: Record<string, unknown>;
  errors: string[];
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export async function parseParticipantImport(file: File): Promise<ImportedParticipantRow[]> {
  const name = file.name.toLowerCase();
  let rows: Record<string, unknown>[] = [];
  if (name.endsWith('.csv')) {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
  } else {
    throw new Error('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
  }

  return rows.map((raw) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) normalized[normalizeHeader(k)] = v;
    const pick = (...keys: string[]) => {
      for (const k of keys) {
        const v = normalized[k];
        if (v != null && String(v).trim()) return String(v).trim();
      }
      return '';
    };
    const errors: string[] = [];
    const email = pick('email', 'email_address', 'contact_email');
    const phone = pick('phone', 'phone_number', 'whatsapp', 'contact', 'contact_number', 'mobile');
    const nameVal = pick('name', 'participant_name', 'full_name');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
    return {
      name: nameVal || undefined,
      phone: phone || undefined,
      email: email || undefined,
      country: pick('country') || undefined,
      region: pick('region') || undefined,
      raw,
      errors,
    };
  });
}
