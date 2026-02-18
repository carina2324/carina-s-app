
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

export const analyzeFashionImage = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Extract only the base64 part if it includes the data URL prefix
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `Act as a professional fashion stylist and visual shopper. 
            Identify every item of clothing, accessory, and jewelry visible in this image.
            For each item:
            1. Describe its style, material, and key features.
            2. Suggest specific search terms to find this exact or very similar items.
            3. Use your search grounding capabilities to find real-world store links where these items can be purchased.
            Format your response in a clean, readable way with sections for each detected item.
            `
          }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const text = response.text || "No analysis generated.";
    
    // Extract grounding chunks if they exist
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        uri: chunk.web!.uri,
        title: chunk.web!.title,
      }));

    return {
      text,
      sources,
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to analyze image. Please try again.");
  }
};
