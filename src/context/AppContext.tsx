/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createInitialPictures, DEMO_ACCOUNT } from '../data/demoData';
import type { AppState, AuthUser, AuthView, ParticipantInfo, PictureMetadata, PictureSlot, SurveySection } from '../types';
import { clearState, loadState, saveState } from '../utils/storage';

function createDefaultParticipant(): ParticipantInfo {
  return {
    fullName: '',
    ageRange: '',
    country: '',
    stateRegion: '',
    cityTown: '',
    preferredLanguage: '',
    connectionToHistory: '',
    eraOfInterest: [],
    consentToShare: false,
  };
}

function createInitialState(): AppState {
  return {
    authView: 'login',
    isAuthenticated: false,
    currentUserEmail: null,
    registeredUsers: [],
    currentSection: 'introduction',
    participantInfo: createDefaultParticipant(),
    pictures: createInitialPictures(),
    submission: null,
    lastSavedAt: null,
  };
}

function mergeState(loaded: Partial<AppState> | null): AppState {
  const base = createInitialState();
  if (!loaded) return base;
  // Merge pictures carefully to preserve slot count/structure
  const loadedPictures = Array.isArray(loaded.pictures) ? loaded.pictures : [];
  const basePictures = base.pictures;
  const pictures: PictureSlot[] = basePictures.map((slot) => {
    const found = loadedPictures.find((p) => p && p.slotNumber === slot.slotNumber);
    if (!found) return slot;
    return {
      ...slot,
      ...found,
      metadata: { ...slot.metadata, ...(found.metadata || {}) },
    };
  });

  return {
    ...base,
    ...loaded,
    participantInfo: { ...base.participantInfo, ...(loaded.participantInfo || {}) },
    pictures,
    registeredUsers: Array.isArray(loaded.registeredUsers) ? loaded.registeredUsers : [],
  };
}

interface AppContextValue {
  state: AppState;
  // Auth
  setAuthView: (view: AuthView) => void;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (user: { fullName: string; email: string; phone: string; password: string }) => { ok: boolean; error?: string };
  logout: () => void;
  resetDemo: () => void;
  // Survey
  setSection: (section: SurveySection) => void;
  updateParticipantInfo: (patch: Partial<ParticipantInfo>) => void;
  updatePictureImage: (slotNumber: number, data: { imageDataUrl: string; fileName: string; fileSize: number }) => void;
  updatePictureMetadata: (slotNumber: number, patch: Partial<PictureMetadata>) => void;
  removePictureImage: (slotNumber: number) => void;
  clearPictureSlot: (slotNumber: number) => void;
  submitSurvey: () => { ok: boolean; errors: string[] };
  // Derived
  uploadedCount: number;
  overallProgress: number;
  questionnaireComplete: boolean;
  requiredQuestionnaireMissing: string[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => mergeState(loadState()));

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setAuthView = (view: AuthView) => setState((s) => ({ ...s, authView: view }));

  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    // Accept demo account
    if (normalizedEmail === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      setState((s) => ({
        ...s,
        isAuthenticated: true,
        currentUserEmail: normalizedEmail,
        lastSavedAt: new Date().toISOString(),
      }));
      return { ok: true };
    }
    // Accept any registered user
    const user = state.registeredUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (user && user.password === password) {
      setState((s) => ({
        ...s,
        isAuthenticated: true,
        currentUserEmail: user.email,
        participantInfo: {
          ...s.participantInfo,
          fullName: s.participantInfo.fullName || user.fullName,
        },
        lastSavedAt: new Date().toISOString(),
      }));
      return { ok: true };
    }
    // For demo convenience: allow any email/password that looks reasonable as a "simulated" login
    // only if password length >= 6. This keeps prototype usable during presentation.
    if (normalizedEmail && password.length >= 6) {
      const existing = state.registeredUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!existing) {
        const newUser: AuthUser = {
          fullName: normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          email: normalizedEmail,
          phone: '',
          password,
          createdAt: new Date().toISOString(),
        };
        setState((s) => ({
          ...s,
          registeredUsers: [...s.registeredUsers, newUser],
          isAuthenticated: true,
          currentUserEmail: normalizedEmail,
          participantInfo: {
            ...s.participantInfo,
            fullName: s.participantInfo.fullName || newUser.fullName,
          },
          lastSavedAt: new Date().toISOString(),
        }));
        return { ok: true };
      }
      return { ok: false, error: 'Incorrect password for this account. Please try again.' };
    }
    return { ok: false, error: 'Please enter a valid email and a password of at least 6 characters.' };
  };

  const register = (user: { fullName: string; email: string; phone: string; password: string }) => {
    const normalizedEmail = user.email.trim().toLowerCase();
    const exists = state.registeredUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists || normalizedEmail === DEMO_ACCOUNT.email) {
      return { ok: false, error: 'An account with this email already exists. Please log in instead.' };
    }
    const newUser: AuthUser = {
      fullName: user.fullName.trim(),
      email: normalizedEmail,
      phone: user.phone.trim(),
      password: user.password,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      registeredUsers: [...s.registeredUsers, newUser],
      isAuthenticated: true,
      currentUserEmail: normalizedEmail,
      participantInfo: { ...s.participantInfo, fullName: user.fullName.trim() },
      currentSection: 'introduction',
      lastSavedAt: new Date().toISOString(),
    }));
    return { ok: true };
  };

  const logout = () => {
    setState((s) => ({ ...s, isAuthenticated: false, authView: 'login' }));
  };

  const resetDemo = () => {
    clearState();
    setState(createInitialState());
  };

  const setSection = (section: SurveySection) => {
    setState((s) => ({ ...s, currentSection: section, lastSavedAt: new Date().toISOString() }));
  };

  const updateParticipantInfo = (patch: Partial<ParticipantInfo>) => {
    setState((s) => ({
      ...s,
      participantInfo: { ...s.participantInfo, ...patch },
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const updatePictureImage = (slotNumber: number, data: { imageDataUrl: string; fileName: string; fileSize: number }) => {
    setState((s) => ({
      ...s,
      pictures: s.pictures.map((p) =>
        p.slotNumber === slotNumber
          ? { ...p, imageDataUrl: data.imageDataUrl, fileName: data.fileName, fileSize: data.fileSize }
          : p,
      ),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const updatePictureMetadata = (slotNumber: number, patch: Partial<PictureMetadata>) => {
    setState((s) => ({
      ...s,
      pictures: s.pictures.map((p) =>
        p.slotNumber === slotNumber ? { ...p, metadata: { ...p.metadata, ...patch } } : p,
      ),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const removePictureImage = (slotNumber: number) => {
    setState((s) => ({
      ...s,
      pictures: s.pictures.map((p) =>
        p.slotNumber === slotNumber ? { ...p, imageDataUrl: null, fileName: null, fileSize: null } : p,
      ),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const submitSurvey = () => {
    const errors: string[] = [];
    const p = state.participantInfo;
    if (!p.fullName.trim()) errors.push('Full name is required.');
    if (!p.ageRange) errors.push('Age range is required.');
    if (!p.country) errors.push('Country is required.');
    if (!p.preferredLanguage) errors.push('Preferred language is required.');
    if (!p.connectionToHistory) errors.push('Connection to history is required.');
    if (!p.consentToShare) errors.push('Consent to share is required.');
    const uploadedCount = state.pictures.filter((pic) => pic.imageDataUrl).length;
    if (uploadedCount === 0) errors.push('Please contribute at least one photograph before submitting.');

    if (errors.length > 0) return { ok: false, errors };

    const ref = `HIC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    setState((s) => ({
      ...s,
      submission: {
        referenceNumber: ref,
        submittedAt,
        participantName: s.participantInfo.fullName,
        pictureCount: s.pictures.filter((pic) => pic.imageDataUrl).length,
        questionnaireComplete: true,
      },
      currentSection: 'confirmation',
      lastSavedAt: submittedAt,
    }));
    return { ok: true, errors: [] };
  };

  const uploadedCount = useMemo(() => state.pictures.filter((p) => p.imageDataUrl).length, [state.pictures]);

  const requiredQuestionnaireMissing = useMemo(() => {
    const p = state.participantInfo;
    const missing: string[] = [];
    if (!p.fullName.trim()) missing.push('Full name');
    if (!p.ageRange) missing.push('Age range');
    if (!p.country) missing.push('Country');
    if (!p.preferredLanguage) missing.push('Preferred language');
    if (!p.connectionToHistory) missing.push('Connection to history');
    if (!p.consentToShare) missing.push('Consent confirmation');
    return missing;
  }, [state.participantInfo]);

  const questionnaireComplete = requiredQuestionnaireMissing.length === 0;

  const overallProgress = useMemo(() => {
    // Weight: intro viewed (10%), questionnaire (35%), pictures (40%), review visited/submitted (15%)
    let progress = 0;
    // Intro: count as done if past intro or any interaction
    if (state.currentSection !== 'introduction' || state.participantInfo.fullName) progress += 10;
    // Questionnaire: 6 required fields
    const totalReq = 6;
    const filled = totalReq - requiredQuestionnaireMissing.length;
    progress += Math.round((filled / totalReq) * 35);
    // Pictures: proportion of 26, but count meaningfully; at least give credit for uploads
    progress += Math.round((uploadedCount / 26) * 40);
    // Review/submission
    if (state.submission) progress += 15;
    else if (state.currentSection === 'review') progress += 10;
    return Math.min(100, progress);
  }, [state.currentSection, state.participantInfo.fullName, state.submission, requiredQuestionnaireMissing.length, uploadedCount]);

  // Fix clearPictureSlot bug - I used wrong default; patch properly
  const clearPictureSlotFixed = (slotNumber: number) => {
    setState((s) => ({
      ...s,
      pictures: s.pictures.map((p) =>
        p.slotNumber === slotNumber
          ? {
              ...p,
              imageDataUrl: null,
              fileName: null,
              fileSize: null,
              metadata: {
                title: '',
                category: '',
                approxYear: '',
                yearIsApproximate: false,
                yearUnknown: false,
                country: '',
                stateRegion: '',
                cityTown: '',
                locationDetails: '',
                locationUnknown: false,
                description: '',
                historicalContext: '',
                peopleSubjects: '',
                additionalNotes: '',
              },
            }
          : p,
      ),
      lastSavedAt: new Date().toISOString(),
    }));
  };

  const value: AppContextValue = {
    state,
    setAuthView,
    login,
    register,
    logout,
    resetDemo,
    setSection,
    updateParticipantInfo,
    updatePictureImage,
    updatePictureMetadata,
    removePictureImage,
    clearPictureSlot: clearPictureSlotFixed,
    submitSurvey,
    uploadedCount,
    overallProgress,
    questionnaireComplete,
    requiredQuestionnaireMissing,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
