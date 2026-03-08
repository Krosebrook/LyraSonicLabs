export type Genre = string;
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type VocalPresence = 'Instrumental' | 'AI Lyrics' | 'Vocal Textures Only';
export type VocalPreset = 'Default' | 'Male High' | 'Female Low' | 'Choir' | 'Robot';

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
