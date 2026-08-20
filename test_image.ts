import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const response = await ai.models.generateImages({
      model: "gemini-3.1-flash-image-preview",
      prompt: "A beautiful sunset over the mountains",
      config: { numberOfImages: 1 }
    });
    console.log(response.generatedImages?.[0]?.image?.imageBytes ? 'Success' : 'No bytes');
  } catch (e) {
    console.error("Error:", e.status, e.message);
  }
}
run();
