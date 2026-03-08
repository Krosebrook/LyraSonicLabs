export type Genre = string;
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type VocalPresence = 'Instrumental' | 'AI Lyrics' | 'Vocal Textures Only';
export type VocalPreset = 'Default' | 'Male High' | 'Female Low' | 'Choir' | 'Robot' | 'Ethereal Whisper' | 'Gritty Rock' | 'Pop Diva' | 'Spoken Word';

export interface TrackMetadata {
  title: string;
  emotionalSummary: string;
  productionDescription: string;
  lyrics?: string;
  albumArtVibe: string;
  emotionalArc?: string;
  vocalTextures?: string;
  leadMelody?: string;
}

export type PitchLevel = 'Low' | 'Normal' | 'High';
export type SpeedLevel = 'Slow' | 'Normal' | 'Fast';
export type IntonationLevel = 'Flat' | 'Expressive' | 'Melodic';

export interface GenerationParams {
  useCase: string;
  inspirationText?: string;
  inspirationImage?: string; // base64
  inspirationVideo?: string; // base64 (first frame or similar)
  genre: Genre;
  energy: EnergyLevel;
  instrumentation: string;
  vocals: VocalPresence;
  vocalPreset?: VocalPreset;
  pitch?: PitchLevel;
  speed?: SpeedLevel;
  intonation?: IntonationLevel;
  emotionalArc?: string;
  customLyrics?: string;
}

export interface GeneratedTrack extends TrackMetadata {
  audioUrl?: string;
  melodyAudioUrl?: string;
  timestamp: number;
  genre: Genre;
  energy: EnergyLevel;
}
