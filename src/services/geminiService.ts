import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function transcribeAudio(base64Audio: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType,
          },
        },
        { text: "Transcribe this audio message accurately. Return only the transcription." },
      ],
    },
  });
  return response.text || "";
}

export async function convertMessage(text: string, transformation: string) {
  const prompts: Record<string, string> = {
    summarize: "Summarize the following message briefly:",
    formalize: "Rewrite the following message in a professional, formal tone:",
    casual: "Rewrite the following message in a friendly, casual tone:",
    translate_es: "Translate the following message to Spanish:",
    translate_fr: "Translate the following message to French:",
  };

  const prompt = prompts[transformation] || "Rewrite the following message:";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${prompt}\n\n${text}`,
  });
  return response.text || "";
}

export async function generateSpeech(text: string, voice: string = "Kore") {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");
  
  return base64Audio;
}
