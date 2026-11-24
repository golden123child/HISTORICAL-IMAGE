/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminSession, ParticipantRecord } from '../types';
import { ADMIN_PASSWORD } from '../types';
import {
  clearAllParticipants,
  getAllParticipants,
  getParticipantByToken,
  nextParticipantNumber,
  putParticipant,
  putParticipants,
} from '../utils/storage';
import { createParticipantRecord, logEvent } from '../utils/records';
import { nowIso } from '../utils/id';

interface AppContextValue {
  participants: ParticipantRecord[];
  loading: boolean;
  refresh: () => Promise<void>;
  admin: AdminSession;
  unlockAdmin: (password: string) => boolean;
  lockAdmin: () => void;
  getByToken: (token: string) => Promise<ParticipantRecord | undefined>;
  saveParticipant: (record: ParticipantRecord) => Promise<void>;
  saveMany: (records: ParticipantRecord[]) => Promise<void>;
  createParticipants: (count: number, meta?: { isDemo?: boolean }) => Promise<ParticipantRecord[]>;
  createImportedParticipants: (rows: { name?: string; phone?: string; email?: string; country?: string; region?: string }[]) => Promise<ParticipantRecord[]>;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const ADMIN_SESSION_KEY = 'fwa_admin_unlocked';

export function AppProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminSession>(() => {
    try {
      const v = sessionStorage.getItem(ADMIN_SESSION_KEY);
      return v === '1' ? { unlocked: true, unlockedAt: nowIso() } : { unlocked: false, unlockedAt: null };
    } catch {
      return { unlocked: false, unlockedAt: null };
    }
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllParticipants();
      all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      setParticipants(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const unlockAdmin = useCallback((password: string) => {
    if (password === ADMIN_PASSWORD) {
      const sess = { unlocked: true, unlockedAt: nowIso() };
      setAdmin(sess);
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, '1'); } catch { /* ignore */ }
      return true;
    }
    return false;
  }, []);

  const lockAdmin = useCallback(() => {
    setAdmin({ unlocked: false, unlockedAt: null });
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
  }, []);

  const getByToken = useCallback(async (token: string) => {
    return getParticipantByToken(token);
  }, []);

  const saveParticipant = useCallback(async (record: ParticipantRecord) => {
    const next = { ...record, updatedAt: nowIso() };
    await putParticipant(next);
    setParticipants((prev) => {
      const idx = prev.findIndex((p) => p.participantId === next.participantId);
      if (idx === -1) return [...prev, next].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });
  }, []);

  const saveMany = useCallback(async (records: ParticipantRecord[]) => {
    const stamped = records.map((r) => ({ ...r, updatedAt: nowIso() }));
    await putParticipants(stamped);
    await refresh();
  }, [refresh]);

  const createParticipants = useCallback(async (count: number, meta?: { isDemo?: boolean }) => {
    const created: ParticipantRecord[] = [];
    for (let i = 0; i < count; i++) {
      const seq = await nextParticipantNumber();
      created.push(createParticipantRecord(seq, { isDemo: meta?.isDemo }));
    }
    await putParticipants(created);
    await refresh();
    return created;
  }, [refresh]);

  const createImportedParticipants = useCallback(async (rows: { name?: string; phone?: string; email?: string; country?: string; region?: string }[]) => {
    const created: ParticipantRecord[] = [];
    for (const row of rows) {
      const seq = await nextParticipantNumber();
      const rec = createParticipantRecord(seq, { importedName: row.name, importedPhone: row.phone || row.email });
      if (row.country) rec.participantInfo.country = row.country;
      if (row.region && ['Africa','Middle East','Europe','North America','South America','Asia','Australia/Oceania'].includes(row.region)) {
        rec.participantInfo.region = row.region as ParticipantRecord['participantInfo']['region'];
      }
      // prefill contact if provided
      if (row.email) { rec.participantInfo.preferredContactMethod = 'Email'; rec.participantInfo.contactValue = row.email; }
      else if (row.phone) { rec.participantInfo.preferredContactMethod = 'WhatsApp'; rec.participantInfo.contactValue = row.phone; }
      rec.activity.push(logEvent('system', 'Imported from spreadsheet', row.name ? `Imported record for ${row.name}.` : 'Imported record.'));
      created.push(rec);
    }
    await putParticipants(created);
    await refresh();
    return created;
  }, [refresh]);

  const resetAllData = useCallback(async () => {
    await clearAllParticipants();
    setParticipants([]);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    participants, loading, refresh, admin, unlockAdmin, lockAdmin,
    getByToken, saveParticipant, saveMany, createParticipants, createImportedParticipants, resetAllData,
  }), [participants, loading, refresh, admin, unlockAdmin, lockAdmin, getByToken, saveParticipant, saveMany, createParticipants, createImportedParticipants, resetAllData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
