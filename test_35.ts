import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log("3.5-flash With tools: Success");
  } catch (e) {
    console.error("3.5-flash With tools:", e.status, e.message);
  }
}
run();
