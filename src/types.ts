export type ParticipantStatus =
  | 'not_started'
  | 'in_progress'
  | 'draft_saved'
  | 'changes_requested'
  | 'reopened'
  | 'approved'
  | 'locked'
  | 'forwarded';

export type LinkStatus = 'active' | 'closed';

export type ActorType = 'participant' | 'administrator' | 'system';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: ActorType;
  action: string;
  details?: string;
}

export interface ConsentInfo {
  ageEligible: boolean;
  consentResearch: boolean;
  consentPermission: boolean;
}

export interface ParticipantInfo {
  ageGroup: '' | '18–24' | '25–34' | '35–44' | '45–54' | '55–64' | '65+';
  gender: '' | 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';
  region: '' | 'South / Southeast Asia' | 'Africa / Middle East' | 'Europe' | 'North / South America' | 'Australia';
  country: string;
  preferredContactMethod: '' | 'WhatsApp' | 'Email';
  contactValue: string;
}

export type ImageCategoryGroup = 'neutral' | 'head_pose' | 'historical';

export interface ImageMetadata {
  title: string;
  approxYear: string;
  location: string;
  category: string;
  customCategory: string;
  contextualInfo: string;
  notes: string;
}

export interface SurveyImage {
  id: string;
  group: ImageCategoryGroup;
  slotKey: string; // e.g. neutral-1, head-look-left, historical-1
  slotLabel: string;
  fileName: string | null;
  mimeType: string | null;
  dataUrl: string | null; // compressed preview/data for prototype
  sizeBytes: number | null;
  uploadedAt: string | null;
  metadata: ImageMetadata;
  reviewRejected: boolean;
  reviewNote: string;
}

export interface ReviewState {
  reviewNotes: string;
  correctionInstructions: string;
  reviewedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  reopenedAt: string | null;
  reopenedForParticipant: boolean;
  forwardedAt: string | null;
}

export interface ParticipantRecord {
  participantId: string; // HIC-00001
  token: string; // random
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  status: ParticipantStatus;
  linkStatus: LinkStatus;
  consent: ConsentInfo;
  participantInfo: ParticipantInfo;
  images: SurveyImage[];
  review: ReviewState;
  activity: ActivityEvent[];
  isDemo: boolean;
  importedName?: string; // optional from spreadsheet
  importedPhone?: string;
}

export interface AdminSession {
  unlocked: boolean;
  unlockedAt: string | null;
}

export const ADMIN_PASSWORD = 'Fieldwork2026';

export const NEUTRAL_MIN = 2;
export const NEUTRAL_MAX = 4;
export const HEAD_POSE_MIN = 2;
export const HEAD_POSE_MAX = 4;
export const HISTORICAL_MIN = 5;
export const HISTORICAL_MAX = 16;
export const TOTAL_MIN = NEUTRAL_MIN + HEAD_POSE_MIN + HISTORICAL_MIN; // 9

export const HEAD_POSE_SLOTS: { key: string; label: string }[] = [
  { key: 'head-look-left', label: 'Turn left' },
  { key: 'head-look-right', label: 'Turn right' },
  { key: 'head-look-up', label: 'Look up' },
  { key: 'head-look-down', label: 'Look down' },
];

export const HISTORICAL_CATEGORIES = [
  'Military',
  'Political',
  'Cultural',
  'Religious',
  'Historical events',
  'Family',
  'Education',
  'Architecture',
  'Community',
  'Traditional life',
  'Other',
];
