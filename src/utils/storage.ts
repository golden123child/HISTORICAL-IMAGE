import type { AppState } from '../types';

const STORAGE_KEY = 'historical-image-survey-demo-v1';

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // Quota exceeded or other storage issue - fail silently for demo,
    // but try to save without image data as fallback.
    console.warn('Failed to persist state, attempting without images', err);
    try {
      const light = {
        ...state,
        pictures: state.pictures.map((p) => ({ ...p, imageDataUrl: null })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(light));
    } catch {
      // ignore
    }
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
