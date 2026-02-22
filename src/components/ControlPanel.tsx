import React, { useState, useRef } from 'react';
import { Genre, EnergyLevel, VocalPresence, GenerationParams } from '../types';
import { Music, Zap, Mic, Image as ImageIcon, Video, Send, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ControlPanelProps {
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
}

const GENRES: Genre[] = [
  'Lo-fi', 'Synthwave', 'Cinematic', 'Techno', 'Ambient', 'Hip Hop', 'Rock', 'Jazz',
  'Ambient electronic', 'Dream pop', 'Melodic death metal', 'Bluegrass'
];
const ENERGIES: EnergyLevel[] = ['Low', 'Medium', 'High'];
const VOCALS: VocalPresence[] = ['Instrumental', 'AI Lyrics', 'Vocal Textures Only'];

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isGenerating }) => {
  const [params, setParams] = useState<Partial<GenerationParams>>({
    genre: 'Synthwave',
    energy: 'Medium',
    vocals: 'AI Lyrics',
    useCase: 'Promo video for a new tech gadget',
    instrumentation: 'Analog synths, drum machines',
    emotionalArc: 'Start calm and introspective, build to a hopeful and uplifting climax, and end with a sense of resolution'
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        setParams(prev => ({ ...prev, inspirationImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (params.useCase && params.genre && params.energy && params.vocals && params.instrumentation) {
      onGenerate(params as GenerationParams);
    }
  };

  return (
    <div className="widget-container p-6 w-full max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">LYRIA 3</h2>
          <p className="status-label">Rapid Music Prototype Engine</p>
        </div>
        <div className={cn("w-3 h-3 rounded-full bg-green-500", isGenerating && "animate-pulse shadow-[0_0_10px_#22c55e]")} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="status-label">Use Case</label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="e.g. Social short for a luxury watch"
            value={params.useCase}
            onChange={e => setParams(prev => ({ ...prev, useCase: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="status-label">Genre</label>
            <input
              list="genre-suggestions"
              className="input-field w-full"
              placeholder="e.g. Cinematic Orchestral"
              value={params.genre}
              onChange={e => setParams(prev => ({ ...prev, genre: e.target.value }))}
            />
            <datalist id="genre-suggestions">
              {GENRES.map(g => <option key={g} value={g} />)}
              <option value="Cinematic Orchestral" />
              <option value="Upbeat Electronic" />
              <option value="Chill Lo-fi Hip Hop" />
              <option value="Energetic Rock Anthem" />
              <option value="Smooth Jazz" />
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="status-label">Energy</label>
            <select
              className="input-field w-full bg-[#1a1b1e]"
              value={params.energy}
              onChange={e => setParams(prev => ({ ...prev, energy: e.target.value as EnergyLevel }))}
            >
              {ENERGIES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="status-label">Emotional Arc</label>
          <textarea
            className="input-field w-full min-h-[60px] text-sm resize-none"
            placeholder="Describe the 30-second journey..."
            value={params.emotionalArc}
            onChange={e => setParams(prev => ({ ...prev, emotionalArc: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="status-label">Inspiration Source</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-white/60" />
              <span className="text-xs font-medium">Upload Image</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="flex-[2] space-y-2">
              <textarea
                className="input-field w-full h-full min-h-[80px] text-sm resize-none"
                placeholder="Describe the mood or narrative tension..."
                value={params.inspirationText}
                onChange={e => setParams(prev => ({ ...prev, inspirationText: e.target.value }))}
              />
            </div>
          </div>
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/20"
              >
                <img src={preview} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setParams(prev => ({ ...prev, inspirationImage: undefined })); }}
                  className="absolute top-1 right-1 bg-black/50 p-1 rounded-full hover:bg-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label className="status-label">Instrumentation & Vocals</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              className="input-field w-full text-sm"
              placeholder="e.g. Heavy bass, airy pads"
              value={params.instrumentation}
              onChange={e => setParams(prev => ({ ...prev, instrumentation: e.target.value }))}
            />
            <select
              className="input-field w-full bg-[#1a1b1e] text-sm"
              value={params.vocals}
              onChange={e => setParams(prev => ({ ...prev, vocals: e.target.value as VocalPresence }))}
            >
              {VOCALS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="btn-primary w-full flex items-center justify-center gap-2 group"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              <span>Generate Prototype</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
