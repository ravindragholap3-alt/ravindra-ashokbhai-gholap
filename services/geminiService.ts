
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GeminiResponse, GroundingSource, LLMSoul, AppMode } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getGroundedKnowledge = async (
  prompt: string, 
  category: AppMode,
  soul: LLMSoul = LLMSoul.GEMINI,
  location?: { latitude: number; longitude: number },
  language: string = "English",
  useThinking: boolean = false
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let personalityInstruction = `You are Maya, the Holistic Aurora Assistant. 
  You blend ancient wisdom with modern global technical analysis. 
  Stay in character: poetic, reliable, and slightly celestial.
  Respond in: ${language}.`;
  
  const config: any = {
    systemInstruction: `${personalityInstruction} Category: ${category}. Use the 'Hol' holistic principle.`,
    tools: [{ googleSearch: {} }],
  };

  let modelToUse = "gemini-3-flash-preview";

  if (useThinking) {
    modelToUse = "gemini-3-pro-preview";
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  if (location && (category === AppMode.ASSISTANT || category === AppMode.AGRICULTURE)) {
    config.tools.push({ googleMaps: {} });
    modelToUse = "gemini-2.5-flash"; 
    config.toolConfig = {
      retrievalConfig: {
        latLng: { latitude: location.latitude, longitude: location.longitude }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config,
    });

    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        if (chunk.maps) sources.push({ title: chunk.maps.title, uri: chunk.maps.uri });
      });
    }

    return {
      text: response.text || "The oracle is silent.",
      sources,
    };
  } catch (error) {
    console.error("Gemini grounding error:", error);
    return { text: "Error connecting to the Aurora.", sources: [] };
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
  });
  return response.text || "";
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const generateVideo = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || 'Animate the scene with cinematic motion',
    image: {
      imageBytes: base64Image,
      mimeType: 'image/jpeg',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const generateImage = async (prompt: string, aspectRatio: string, size: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const getAudioFeedback = async (text: string, soul: LLMSoul): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const voiceName = soul === LLMSoul.GPT ? "Puck" : soul === LLMSoul.DEEPSEEK ? "Charon" : "Kore";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};
