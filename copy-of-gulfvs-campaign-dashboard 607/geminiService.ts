
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const draftEmailNote = async (companyName: string, tags: string[], type: string): Promise<string> => {
  if (!process.env.API_KEY) return `Professional ${type} email sent to ${companyName}. Focused on ${tags.join(', ')}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a very short, professional internal log note (max 30 words) for a ${type} email sent to a client called "${companyName}" who is tagged with "${tags.join(', ')}". The note should summarize what was likely discussed based on GulfVS services (HR, Admin, Finance).`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });
    return response.text || "Email sent successfully.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Sent ${type} email to ${companyName}.`;
  }
};
