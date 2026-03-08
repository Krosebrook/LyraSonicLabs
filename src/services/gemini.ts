import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GenerationParams, TrackMetadata, VocalPreset } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GENRE_PATTERNS: Record<string, string> = {
  'Synthwave': 'Arpeggiated 16th-note basslines, syncopated lead melodies, and 4/4 four-on-the-floor drum patterns.',
  'Cinematic': 'Slow-building ostinatos, sweeping legato string melodies, and sparse, impactful percussion.',
  'Techno': 'Driving 4/4 kick drums, off-beat hi-hats, and repetitive, evolving synth stabs.',
  'Ambient': 'Long, sustained drone notes, lack of strict tempo, and slow-evolving harmonic textures.',
  'Hip Hop': 'Boom-bap or trap drum grooves with swung 16th notes, and repetitive, catchy melodic loops.',
  'Rock': 'Power chord progressions, driving 8th-note basslines, and syncopated drum fills.',
  'Jazz': 'Swung 8th notes, complex syncopation, walking basslines, and improvisational melodic phrasing.',
  'Lo-fi': 'Slightly swung, laid-back drum grooves, jazzy chord extensions, and simple, repetitive melodies.',
  'Ambient electronic': 'Slow, evolving pad chords, sparse glitchy percussion, and ethereal, floating melodies.',
  'Dream pop': 'Washed-out, reverb-heavy guitar chords, simple 4/4 drum beats, and breathy, floating vocal melodies.',
  'Melodic death metal': 'Fast double-kick drum patterns, tremolo-picked guitar riffs, and harmonized twin-guitar melodies.',
  'Bluegrass': 'Fast, driving 2/4 or 4/4 rhythms, alternating bass notes on the 1 and 3, and rapid, syncopated banjo or mandolin rolls.'
};

export async function analyzeInspiration(params: GenerationParams): Promise<TrackMetadata> {
  const model = "gemini-3-flash-preview";
  
  const genrePattern = GENRE_PATTERNS[params.genre] || 'Typical rhythmic and melodic conventions for this genre.';
  
  const prompt = `
    You are Lyria 3, a rapid music prototype engine.
    Generate a 30-second music track prototype based on the following signals:
    
    Use Case: ${params.useCase}
    Genre: ${params.genre}
    Energy Level: ${params.energy}
    Instrumentation: ${params.instrumentation}
    Vocal Presence: ${params.vocals}
    Emotional Arc: ${params.emotionalArc || "Not specified"}
    Inspiration: ${params.inspirationText || "Analyze the provided media"}
    
    Genre-Specific Musical Structure: Incorporate the following patterns into your generation: ${genrePattern}
    
    Output the following JSON:
    - title: A catchy track title
    - emotionalSummary: One-sentence emotional summary
    - emotionalArc: A detailed 30-second progression (0-5s: hook, 5-15s: groove, 15-25s: lift/drop, 25-30s: closing)
    - productionDescription: 2-3 lines of production details (mix, aesthetic, textures)
    - vocalTextures: Describe subtle vocal textures (e.g., atmospheric ad-libs, "oohs", "aahs") that complement the track.
    - leadMelody: A description of the lead melody or a sequence of notes/chords that fits the genre and mood, specifically utilizing the provided genre-specific musical structure.
    - lyrics: If vocals are enabled, provide a 30-second lyric block (under 4 lines, strong hook). Otherwise null.
    - albumArtVibe: One sentence describing the suggested album art vibe matching the mood.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (params.inspirationImage) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: params.inspirationImage.split(",")[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          emotionalSummary: { type: Type.STRING },
          emotionalArc: { type: Type.STRING },
          productionDescription: { type: Type.STRING },
          vocalTextures: { type: Type.STRING },
          leadMelody: { type: Type.STRING },
          lyrics: { type: Type.STRING, nullable: true },
          albumArtVibe: { type: Type.STRING }
        },
        required: ["title", "emotionalSummary", "emotionalArc", "productionDescription", "vocalTextures", "leadMelody", "albumArtVibe"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

function createWavUrl(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64Pcm);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }
  
  // Check if it's already a WAV file (starts with "RIFF")
  if (pcmData.length >= 4 && 
      pcmData[0] === 0x52 && // R
      pcmData[1] === 0x49 && // I
      pcmData[2] === 0x46 && // F
      pcmData[3] === 0x46)   // F
  {
    const blob = new Blob([pcmData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  
  // Ensure dataSize is even for 16-bit PCM
  const dataSize = pcmData.length % 2 === 0 ? pcmData.length : pcmData.length - 1;
  const chunkSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, chunkSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  const wavBuffer = new Uint8Array(header.byteLength + dataSize);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(pcmData.subarray(0, dataSize), header.byteLength);

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function generateVocalDemo(lyrics: string, preset: VocalPreset = 'Default'): Promise<string | null> {
  try {
    let voiceName = 'Zephyr';
    let promptPrefix = 'Sing the following lyrics slowly and melodically, stretching out the words and adding long pauses between lines:\n\n';

    if (preset === 'Male High') {
      voiceName = 'Fenrir';
      promptPrefix = 'Sing the following lyrics in a high-pitched male voice, slowly and melodically, stretching out the words and adding long pauses between lines:\n\n';
    } else if (preset === 'Female Low') {
      voiceName = 'Kore';
      promptPrefix = 'Sing the following lyrics in a low-pitched, deep female voice, slowly and melodically, stretching out the words and adding long pauses between lines:\n\n';
    } else if (preset === 'Choir') {
      voiceName = 'Charon';
      promptPrefix = 'Sing the following lyrics as if you are a large choir, with a grand and echoing voice, slowly and melodically:\n\n';
    } else if (preset === 'Robot') {
      voiceName = 'Puck';
      promptPrefix = 'Sing the following lyrics in a robotic, synthesized voice, slowly and mechanically, stretching out the words:\n\n';
    }

    // Manually repeat the lyrics to ensure the generated audio is long enough
    const repeatedLyrics = `${lyrics}\n\n(musical pause)\n\n${lyrics}\n\n(musical pause)\n\n${lyrics}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${promptPrefix}${repeatedLyrics}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData) {
      if (inlineData.mimeType && inlineData.mimeType.startsWith('audio/') && !inlineData.mimeType.includes('pcm')) {
        return `data:${inlineData.mimeType};base64,${inlineData.data}`;
      }
      return createWavUrl(inlineData.data, 24000);
    }
  } catch (error) {
    console.error("Audio generation failed:", error);
  }
  return null;
}

export async function generateMelodyDemo(melodyDescription: string): Promise<string | null> {
  try {
    const repeatedMelody = `${melodyDescription}\n\n(musical pause)\n\n${melodyDescription}\n\n(musical pause)\n\n${melodyDescription}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Hum or sing the following melody notes clearly and melodically, stretching them out:\n\n${repeatedMelody}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (inlineData) {
      if (inlineData.mimeType && inlineData.mimeType.startsWith('audio/') && !inlineData.mimeType.includes('pcm')) {
        return `data:${inlineData.mimeType};base64,${inlineData.data}`;
      }
      return createWavUrl(inlineData.data, 24000);
    }
  } catch (error) {
    console.error("Melody audio generation failed:", error);
  }
  return null;
}
