import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const response = await ai.models.list();
  const names = Array.from(response).map(m => m.name);
  console.log(names.join('\n'));
}
run().catch(console.error);
