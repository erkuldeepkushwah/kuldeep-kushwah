import { GoogleGenAI } from "@google/genai";

// Initialize strictly according to guidelines: assume API_KEY is valid and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAssistantResponse = async (userQuery: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const systemInstruction = `You are the helpful support assistant for SparkPe, a B2B financial platform for retailers. 
    The platform offers services like Mobile Recharge, BBPS (Bill Payment), DMT (Money Transfer), AEPS, and Travel Booking.
    Answer user queries about how to use these services briefly and professionally.
    If asked about technical errors, suggest checking their internet connection or contacting support at support@sparkpe.in.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the support server right now.";
  }
};