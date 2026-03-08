import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { TrackDisplay } from './components/TrackDisplay';
import { GenerationParams, GeneratedTrack } from './types';
import { analyzeInspiration, generateVocalDemo, generateMelodyDemo } from './services/gemini';
import { Music2, History, Settings, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);
  const [history, setHistory] = useState<GeneratedTrack[]>([]);

  const handleGenerate = async (params: GenerationParams) => {
    setIsGenerating(true);
    try {
      const metadata = await analyzeInspiration(params);
      let audioUrl: string | undefined;
      let melodyAudioUrl: string | undefined;
      
      const lyricsToSing = params.customLyrics || metadata.lyrics;

      if (lyricsToSing && (params.vocals === 'AI Lyrics' || params.vocals === 'Vocal Textures Only')) {
        const url = await generateVocalDemo(lyricsToSing, params.vocalPreset);
        if (url) audioUrl = url;
      }

      if (metadata.leadMelody) {
        const url = await generateMelodyDemo(metadata.leadMelody);
        if (url) melodyAudioUrl = url;
      }

      const newTrack: GeneratedTrack = {
        ...metadata,
        lyrics: lyricsToSing,
        audioUrl,
        melodyAudioUrl,
        timestamp: Date.now(),
        genre: params.genre,
        energy: params.energy
      };

      setCurrentTrack(newTrack);
      setHistory(prev => [newTrack, ...prev]);
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate track. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Rail */}
      <nav className="fixed left-0 top-0 bottom-0 w-16 border-r border-white/10 flex flex-col items-center py-8 gap-8 bg-black/50 backdrop-blur-xl z-50">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black">
          <Music2 className="w-6 h-6" />
        </div>
        <div className="flex-1 flex flex-col gap-6 pt-12">
          <button className="text-white/40 hover:text-white transition-colors"><History className="w-5 h-5" /></button>
          <button className="text-white/40 hover:text-white transition-colors"><Settings className="w-5 h-5" /></button>
          <button className="text-white/40 hover:text-white transition-colors"><Info className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="flex-1 pl-16 p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
        <header className="mb-12 space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter"
          >
            SONIC <span className="text-emerald-500">LAB</span>
          </motion.h1>
          <p className="status-label">Powered by Lyria 3 // Neural Music Prototyping</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <ControlPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
          
          <div className="flex-1 w-full min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {currentTrack ? (
                <TrackDisplay key={currentTrack.timestamp} track={currentTrack} />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 opacity-20"
                >
                  <div className="w-24 h-24 border-2 border-dashed border-white rounded-full mx-auto flex items-center justify-center">
                    <Music2 className="w-10 h-10" />
                  </div>
                  <p className="status-label">Awaiting Input Signals</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History Section */}
        {history.length > 1 && (
          <section className="mt-24 space-y-8">
            <h3 className="status-label">Session History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(1).map((track) => (
                <button
                  key={track.timestamp}
                  onClick={() => setCurrentTrack(track)}
                  className="glass-panel p-4 text-left hover:bg-white/10 transition-all group"
                >
                  <p className="status-label text-[8px] mb-1">{new Date(track.timestamp).toLocaleTimeString()}</p>
                  <h4 className="font-bold uppercase truncate group-hover:text-emerald-400 transition-colors">{track.title}</h4>
                  <p className="text-xs text-white/40 truncate">{track.genre} // {track.energy}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="pl-16 p-8 border-t border-white/5 text-center">
        <p className="status-label text-[8px]">© 2026 Lyria 3 Neural Systems // All Rights Reserved</p>
      </footer>
    </div>
  );
}
