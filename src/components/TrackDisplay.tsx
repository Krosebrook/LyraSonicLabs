import React from 'react';
import { GeneratedTrack } from '../types';
import { Play, Pause, Download, Share2, Music, Sparkles, Quote, Image as ImageIcon, Zap, Mic, Repeat } from 'lucide-react';
import { motion } from 'motion/react';

interface TrackDisplayProps {
  track: GeneratedTrack;
}

export const TrackDisplay: React.FC<TrackDisplayProps> = ({ track }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMelodyPlaying, setIsMelodyPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [activeLoop, setActiveLoop] = React.useState<{start: number, end: number, label: string} | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const melodyAudioRef = React.useRef<HTMLAudioElement>(null);

  const loopRegions = React.useMemo(() => {
    if (!track.emotionalArc) return [];
    const regex = /(\d+)-(\d+)s:\s*([^,]+)/g;
    const regions = [];
    let match;
    while ((match = regex.exec(track.emotionalArc)) !== null) {
      regions.push({
        start: parseInt(match[1], 10),
        end: parseInt(match[2], 10),
        label: match[3].trim()
      });
    }
    return regions;
  }, [track.emotionalArc]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        if (isMelodyPlaying) toggleMelodyPlay();
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMelodyPlay = () => {
    if (melodyAudioRef.current) {
      if (isMelodyPlaying) {
        melodyAudioRef.current.pause();
      } else {
        if (isPlaying) togglePlay();
        melodyAudioRef.current.play().catch(e => {
          console.error("Melody playback failed:", e);
          setIsMelodyPlaying(false);
        });
      }
      setIsMelodyPlaying(!isMelodyPlaying);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      
      if (activeLoop && current >= activeLoop.end) {
        audioRef.current.currentTime = activeLoop.start;
      }
    }
  };

  const toggleLoop = (region: {start: number, end: number, label: string}) => {
    if (activeLoop?.label === region.label) {
      setActiveLoop(null);
    } else {
      setActiveLoop(region);
      if (audioRef.current) {
        audioRef.current.currentTime = region.start;
        if (!isPlaying) {
          audioRef.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            setIsPlaying(false);
          });
          setIsPlaying(true);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="widget-container p-8 w-full max-w-2xl space-y-8"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase">{track.title}</h1>
          <p className="text-emerald-400 font-mono text-xs tracking-widest uppercase">Prototype Ready // {duration ? Math.round(duration) : 30}s</p>
        </div>
        <div className="flex gap-2">
          <button className="glass-panel p-2 hover:bg-white/10 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="glass-panel p-2 hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="status-label flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Emotional Summary
            </label>
            <p className="text-lg font-medium leading-tight italic text-white/90">
              "{track.emotionalSummary}"
            </p>
          </div>

          {track.emotionalArc && (
            <div className="space-y-2">
              <label className="status-label flex items-center gap-2">
                <Zap className="w-3 h-3" /> Emotional Arc
              </label>
              <div className="text-xs text-white/70 leading-relaxed font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                {track.emotionalArc.split(',').map((part, i) => (
                  <div key={i} className="mb-1 last:mb-0">{part.trim()}</div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="status-label flex items-center gap-2">
              <Music className="w-3 h-3" /> Production Notes
            </label>
            <p className="text-sm text-white/60 leading-relaxed">
              {track.productionDescription}
            </p>
          </div>

          {track.leadMelody && (
            <div className="space-y-2">
              <label className="status-label flex items-center gap-2">
                <Music className="w-3 h-3" /> Lead Melody
              </label>
              <div className="flex items-start gap-4">
                <p className="text-sm text-white/60 leading-relaxed font-mono flex-1">
                  {track.leadMelody}
                </p>
                {track.melodyAudioUrl && (
                  <button 
                    onClick={toggleMelodyPlay}
                    className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/40 transition-colors shrink-0"
                    title="Play Melody Demo"
                  >
                    {isMelodyPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {track.vocalTextures && (
            <div className="space-y-2">
              <label className="status-label flex items-center gap-2">
                <Mic className="w-3 h-3" /> Vocal Textures
              </label>
              <p className="text-sm text-white/60 italic leading-relaxed">
                {track.vocalTextures}
              </p>
            </div>
          )}

          {track.lyrics && (
            <div className="space-y-2">
              <label className="status-label flex items-center gap-2">
                <Quote className="w-3 h-3" /> Lyric Hook
              </label>
              <div className="glass-panel p-4 bg-white/5">
                <p className="text-sm font-mono whitespace-pre-line text-emerald-100/80 italic">
                  {track.lyrics}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="status-label flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Album Art Vibe
            </label>
            <p className="text-sm text-white/60">
              {track.albumArtVibe}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={togglePlay}
            disabled={!track.audioUrl}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-20"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end">
              <span className="status-label">Vocal Demo Stream</span>
              <span className="font-mono text-[10px] text-white/40">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-100"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            {loopRegions.length > 0 && track.audioUrl && (
              <div className="pt-4 space-y-2">
                <label className="status-label flex items-center gap-2">
                  <Repeat className="w-3 h-3" /> Loop Sections
                </label>
                <div className="flex flex-wrap gap-2">
                  {loopRegions.map((region, i) => (
                    <button
                      key={i}
                      onClick={() => toggleLoop(region)}
                      className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                        activeLoop?.label === region.label 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {region.start}-{region.end}s: {region.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {!track.audioUrl && (
          <p className="mt-4 text-[10px] font-mono text-white/20 text-center uppercase tracking-widest">
            Audio generation restricted to lyrics only in this build
          </p>
        )}
      </div>

      {track.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      {track.melodyAudioUrl && (
        <audio
          ref={melodyAudioRef}
          src={track.melodyAudioUrl}
          onEnded={() => setIsMelodyPlaying(false)}
          className="hidden"
        />
      )}
    </motion.div>
  );
};
