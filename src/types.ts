export type Genre = string;
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type VocalPresence = 'Instrumental' | 'AI Lyrics' | 'Vocal Textures Only';

export interface TrackMetadata {
  title: string;
  emotionalSummary: string;
  productionDescription: string;
  lyrics?: string;
  albumArtVibe: string;
  emotionalArc?: string;
  vocalTextures?: string;
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
  emotionalArc?: string;
}

export interface GeneratedTrack extends TrackMetadata {
  audioUrl?: string;
  timestamp: number;
  genre: Genre;
  energy: EnergyLevel;
}
