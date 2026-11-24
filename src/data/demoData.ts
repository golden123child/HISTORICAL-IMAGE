import type { PictureMetadata, PictureSlot } from '../types';
import { TOTAL_PICTURE_SLOTS } from '../types';

export const DEMO_ACCOUNT = {
  email: 'participant@archive.demo',
  password: 'history2024',
};

export const SUGGESTED_LABELS: string[] = [
  'Portrait',
  'Family Photograph',
  'Community Gathering',
  'Street Scene',
  'Place or Landmark',
  'School or Education',
  'Work or Trade',
  'Celebration or Ceremony',
  'Military or Service',
  'Travel or Journey',
  'Home or Daily Life',
  'Religious or Cultural Event',
  'Market or Commerce',
  'Sport or Recreation',
  'Art or Performance',
  'Transportation',
  'Agriculture or Rural Life',
  'Historic Building',
  'Document or Artifact',
  'Childhood Memory',
  'Neighbourhood Scene',
  'Public Figure or Leader',
  'Natural Landscape',
  'Family Heirloom',
  'Group Photograph',
  'Other Historical Moment',
];

export const PICTURE_CATEGORIES = [
  'Portrait',
  'Family',
  'Community',
  'Place / Landmark',
  'Event / Ceremony',
  'Work / Daily Life',
  'Military / Service',
  'Education',
  'Culture / Religion',
  'Other',
];

export const AGE_RANGES = [
  'Under 18',
  '18–24',
  '25–34',
  '35–44',
  '45–54',
  '55–64',
  '65–74',
  '75+',
  'Prefer not to say',
];

export const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Canada',
  'France',
  'Germany',
  'Brazil',
  'India',
  'Jamaica',
  'Trinidad and Tobago',
  'Barbados',
  'Other',
];

export const LANGUAGES = [
  'English',
  'French',
  'Portuguese',
  'Spanish',
  'Arabic',
  'Yoruba',
  'Igbo',
  'Hausa',
  'Swahili',
  'Other',
];

export const ERA_OPTIONS = [
  'Before 1900',
  '1900–1929',
  '1930–1949',
  '1950–1969',
  '1970–1989',
  '1990–2009',
  '2010–Present',
  'Not sure / Mixed',
];

export const CONNECTION_OPTIONS = [
  'Personal or family history',
  'Community or local history',
  'Academic or research interest',
  'Cultural or heritage preservation',
  'Professional / archival work',
  'Other',
];

export function createEmptyMetadata(): PictureMetadata {
  return {
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
  };
}

export function createInitialPictures(): PictureSlot[] {
  return Array.from({ length: TOTAL_PICTURE_SLOTS }, (_, i) => ({
    id: `slot-${i + 1}`,
    slotNumber: i + 1,
    suggestedLabel: SUGGESTED_LABELS[i] || `Picture ${i + 1}`,
    imageDataUrl: null,
    fileName: null,
    fileSize: null,
    metadata: createEmptyMetadata(),
  }));
}
