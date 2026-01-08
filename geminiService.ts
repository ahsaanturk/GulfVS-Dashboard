
/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

// Access Vite environment variables safely
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const draftEmailNote = async (companyName: string, tags: string[], type: string): Promise<string> => {
  if (!apiKey) return `Professional ${type} email sent to ${companyName}. Focused on ${tags.join(', ')}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Draft a very short, professional internal log note (max 30 words) for a ${type} email sent to a client called "${companyName}" who is tagged with "${tags.join(', ')}". The note should summarize what was likely discussed based on GulfVS services (HR, Admin, Finance).`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    // @ts-ignore - The types might be slightly off depending on specific version, safe fallback
    return response.text ? (typeof response.text === 'function' ? response.text() : response.text) : "Email sent successfully.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Sent ${type} email to ${companyName}.`;
  }
};
