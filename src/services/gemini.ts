import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GenerationParams, TrackMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeInspiration(params: GenerationParams): Promise<TrackMetadata> {
  const model = "gemini-3-flash-preview";
  
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
    
    Output the following JSON:
    - title: A catchy track title
    - emotionalSummary: One-sentence emotional summary
    - emotionalArc: A detailed 30-second progression (0-5s: hook, 5-15s: groove, 15-25s: lift/drop, 25-30s: closing)
    - productionDescription: 2-3 lines of production details (mix, aesthetic, textures)
    - vocalTextures: Describe subtle vocal textures (e.g., atmospheric ad-libs, "oohs", "aahs") that complement the track.
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
          lyrics: { type: Type.STRING, nullable: true },
          albumArtVibe: { type: Type.STRING }
        },
        required: ["title", "emotionalSummary", "emotionalArc", "productionDescription", "vocalTextures", "albumArtVibe"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

function addWavHeader(base64Pcm: string, sampleRate: number = 24000): string {
  const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
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

  const wavBuffer = new Uint8Array(header.byteLength + pcmData.byteLength);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(pcmData, header.byteLength);

  let binary = '';
  for (let i = 0; i < wavBuffer.length; i++) {
    binary += String.fromCharCode(wavBuffer[i]);
  }
  return btoa(binary);
}

export async function generateVocalDemo(lyrics: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Sing or speak these lyrics with a musical cadence, stretching the vowels and adding pauses to fill approximately 20-30 seconds of audio. Repeat lines if necessary to reach the duration: ${lyrics}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Pcm = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Pcm) {
      const base64Wav = addWavHeader(base64Pcm, 24000);
      return `data:audio/wav;base64,${base64Wav}`;
    }
  } catch (error) {
    console.error("Audio generation failed:", error);
  }
  return null;
}
