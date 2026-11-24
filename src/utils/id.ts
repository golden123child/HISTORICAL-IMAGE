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
