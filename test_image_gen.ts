import { GoogleGenAI, Type } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: "A beautiful sunset over the mountains",
    });
    console.log(response.text ? 'Success text' : 'No text');
    console.log(response);
  } catch (e) {
    console.error("Error:", e.status, e.message);
  }
}
run();
