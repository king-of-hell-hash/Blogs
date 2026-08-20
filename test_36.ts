import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello",
    });
    console.log("Without tools: Success");
  } catch (e) {
    console.error("Without tools:", e.status);
  }

  try {
    await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log("With tools: Success");
  } catch (e) {
    console.error("With tools:", e.status);
  }
}
run();
