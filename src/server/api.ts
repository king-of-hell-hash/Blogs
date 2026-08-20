import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";

const router = express.Router();

function getCleanApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  const cleaned = key.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  
  // Guard against user pasting prompt text instead of a real API key
  if (cleaned.length > 0 && (cleaned.includes(' ') || cleaned.length > 100)) {
    throw new Error("Invalid GEMINI_API_KEY. It looks like you pasted a text prompt instead of a real API key in your Vercel Environment Variables.");
  }
  
  return cleaned;
}

router.post('/generate', async (req, res) => {
  try {
    const apiKey = getCleanApiKey();
    if (!apiKey) {
       return res.status(500).json({ error: "Missing GEMINI_API_KEY. Please set it in your environment variables." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { keyword, audience, intent, tone, length, readingLevel } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    const prompt = `
You are an Expert SEO Strategist and Principal Blog Writer. Generate a highly optimized SEO blog post.

Parameters:
- Target Keyword: ${keyword}
- Target Audience: ${audience || 'General Audience'}
- Content Intent: ${intent || 'Informational'}
- Tone: ${tone || 'Professional'}
- Target Length: ${length || 'Medium'} (Short ~800 words, Medium ~1200 words, Long-Form ~2000 words)
- Reading Level: ${readingLevel || 'Grade 8'}

Requirements:
1. **On-Page SEO**:
   - Write a high-CTR Meta Title (under 60 chars).
   - Write a Meta Description (under 160 chars).
   - Provide a recommended URL Slug.
   - Provide a Focus Keyword and a list of LSI keywords.
2. **Monetization (AdSense)**:
   - Insert placeholders like [AdSense Banner - Mid Article] and [AdSense In-Feed Responsive] naturally between sections.
3. **Multimedia**:
   - Insert dynamic image prompts exactly in this markdown format: \`![image_prompt](Your contextual description here)\` where images should be.
   - Auto-format external image links with SEO alt text if possible.
   - Insert contextual internal link placeholders like [Insert Internal Link: Related Topic].
4. **E-E-A-T & Quality**:
   - Include real-world examples, a step-by-step checklist, a FAQ section formatted for Google Featured Snippets, and a pros/cons table.
5. **Formatting**:
   - Output everything in clean, semantic Markdown with clear H1, H2, and H3 headers, bulleted lists, and blockquotes.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metaTitle: { type: Type.STRING, description: "The high-CTR Meta Title (under 60 chars)" },
              metaDescription: { type: Type.STRING, description: "The Meta Description (under 160 chars)" },
              urlSlug: { type: Type.STRING, description: "Recommended URL Slug" },
              focusKeyword: { type: Type.STRING },
              lsiKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              markdown: { type: Type.STRING, description: "The fully formatted blog post in Markdown" },
              schemaMarkup: { type: Type.STRING, description: "JSON-LD Schema Markup (Article / HowTo) as a string" }
            },
            required: ["metaTitle", "metaDescription", "urlSlug", "focusKeyword", "lsiKeywords", "markdown", "schemaMarkup"]
          }
        }
      });
    } catch (e: any) {
      if (e.status === 429 || (e.message && e.message.includes("429"))) {
        console.warn("Search grounding quota exceeded, falling back to standard generation...");
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                metaTitle: { type: Type.STRING, description: "The high-CTR Meta Title (under 60 chars)" },
                metaDescription: { type: Type.STRING, description: "The Meta Description (under 160 chars)" },
                urlSlug: { type: Type.STRING, description: "Recommended URL Slug" },
                focusKeyword: { type: Type.STRING },
                lsiKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                markdown: { type: Type.STRING, description: "The fully formatted blog post in Markdown" },
                schemaMarkup: { type: Type.STRING, description: "JSON-LD Schema Markup (Article / HowTo) as a string" }
              },
              required: ["metaTitle", "metaDescription", "urlSlug", "focusKeyword", "lsiKeywords", "markdown", "schemaMarkup"]
            }
          }
        });
      } else {
        throw e;
      }
    }

    // The response text is guaranteed to be a JSON string matching the schema
    const resultJson = JSON.parse(response.text || '{}');
    return res.status(200).json(resultJson);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "An unexpected error occurred during generation.";
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      errorMessage = "Gemini API Quota Exceeded. Please try again later or check your API key billing details.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(error.status === 429 ? 429 : 500).json({ error: errorMessage });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const apiKey = getCleanApiKey();
    if (!apiKey) {
       return res.status(500).json({ error: "Missing GEMINI_API_KEY. Please set it in your environment variables." });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Image prompt is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
    });
    
    // Check if the response contains inlineData (base64 image)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts && candidates[0].content.parts.length > 0) {
      const part = candidates[0].content.parts[0];
      if (part.inlineData) {
         const mimeType = part.inlineData.mimeType || 'image/jpeg';
         const base64 = part.inlineData.data;
         return res.status(200).json({
            image: `data:${mimeType};base64,${base64}`
         });
      }
    }
    
    // Fallback if SDK formats differently
    return res.status(500).json({ error: "Image data not found in response from model." });

  } catch (error: any) {
    console.error("Image Generation Error:", error);
    let errorMessage = "An unexpected error occurred during image generation.";
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      errorMessage = "Image Generation Quota Exceeded. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return res.status(error.status === 429 ? 429 : 500).json({ error: errorMessage });
  }
});

export { router as apiRouter };
