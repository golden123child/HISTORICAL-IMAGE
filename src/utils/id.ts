export function randomToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export function uid(prefix = ''): string {
  const r = randomToken(10);
  return prefix ? `${prefix}_${r}` : r;
}

export function formatParticipantId(n: number): string {
  return `HIC-${String(n).padStart(5, '0')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface LinkSeed {
  pid: string; // participantId
  n?: string; // imported name
  ph?: string; // imported phone
  c?: string; // country
  r?: string; // region
  cm?: '' | 'WhatsApp' | 'Email';
  cv?: string; // contact value
  d?: number; // isDemo 1/0
}

export function encodeLinkSeed(seed: LinkSeed): string {
  const json = JSON.stringify(seed);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeLinkSeed(s: string): LinkSeed | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const bin = atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    if (!obj || typeof obj.pid !== 'string' || !/^HIC-\d{5}$/.test(obj.pid)) return null;
    return obj as LinkSeed;
  } catch {
    return null;
  }
}

export function buildSurveyLink(token: string, seed: LinkSeed, origin?: string): string {
  const base = origin || window.location.origin;
  return `${base}/survey/${token}?s=${encodeLinkSeed(seed)}`;
}

export function recordToLinkSeed(r: { participantId: string; importedName?: string; importedPhone?: string; participantInfo: { country: string; region: string; preferredContactMethod: string; contactValue: string }; isDemo?: boolean }): LinkSeed {
  const seed: LinkSeed = { pid: r.participantId };
  if (r.importedName) seed.n = r.importedName;
  if (r.importedPhone) seed.ph = r.importedPhone;
  if (r.participantInfo.country) seed.c = r.participantInfo.country;
  if (r.participantInfo.region) seed.r = r.participantInfo.region;
  if (r.participantInfo.preferredContactMethod) seed.cm = r.participantInfo.preferredContactMethod as any;
  if (r.participantInfo.contactValue) seed.cv = r.participantInfo.contactValue;
  if (r.isDemo) seed.d = 1;
  return seed;
}
