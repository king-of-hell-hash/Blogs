import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  for await (const m of await ai.models.list()) {
    console.log(m.name);
  }
}
run();
