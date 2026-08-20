import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Hello world, output a JSON with a single key 'message'.",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          message: { type: Type.STRING }
        }
      }
    }
  });
  console.log(response.text);
}
run().catch(console.error);
