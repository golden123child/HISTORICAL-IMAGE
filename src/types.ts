export type AuthView = 'login' | 'register' | 'forgot';

export type SurveySection = 'introduction' | 'about' | 'collection' | 'details' | 'review' | 'confirmation';

export interface AuthUser {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
}

export interface ParticipantInfo {
  fullName: string;
  ageRange: string;
  country: string;
  stateRegion: string;
  cityTown: string;
  preferredLanguage: string;
  connectionToHistory: string;
  eraOfInterest: string[];
  consentToShare: boolean;
}

export interface PictureMetadata {
  title: string;
  category: string;
  approxYear: string;
  yearIsApproximate: boolean;
  yearUnknown: boolean;
  country: string;
  stateRegion: string;
  cityTown: string;
  locationDetails: string;
  locationUnknown: boolean;
  description: string;
  historicalContext: string;
  peopleSubjects: string;
  additionalNotes: string;
}

export interface PictureSlot {
  id: string;
  slotNumber: number;
  suggestedLabel: string;
  imageDataUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  metadata: PictureMetadata;
}

export interface SubmissionRecord {
  referenceNumber: string;
  submittedAt: string;
  participantName: string;
  pictureCount: number;
  questionnaireComplete: boolean;
}

export interface AppState {
  authView: AuthView;
  isAuthenticated: boolean;
  currentUserEmail: string | null;
  registeredUsers: AuthUser[];
  currentSection: SurveySection;
  participantInfo: ParticipantInfo;
  pictures: PictureSlot[];
  submission: SubmissionRecord | null;
  lastSavedAt: string | null;
}

export const TOTAL_PICTURE_SLOTS = 26;
