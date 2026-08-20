import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

function getCleanApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  const cleaned = key.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  
  // Guard against user pasting prompt text instead of a real API key
  if (cleaned.length > 0 && (cleaned.includes(' ') || cleaned.length > 100)) {
    throw new Error("Invalid GEMINI_API_KEY. It looks like you pasted a text prompt instead of a real API key in your Vercel Environment Variables.");
  }
  
  return cleaned;
}

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: getCleanApiKey(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword, audience, intent, tone, length, readingLevel } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
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
   - Insert dynamic image prompts like [Image Prompt: Contextual description] where images should be.
   - Auto-format external image links with SEO alt text if possible, or leave a markdown image placeholder ![keyword-optimized alt text](URL).
   - Insert contextual internal link placeholders like [Insert Internal Link: Related Topic].
4. **E-E-A-T & Quality**:
   - Include real-world examples, a step-by-step checklist, a FAQ section formatted for Google Featured Snippets, and a pros/cons table.
5. **Formatting**:
   - Output everything in clean, semantic Markdown with clear H1, H2, and H3 headers, bulleted lists, and blockquotes.
`;

    const response = await ai.models.generateContent({
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

    const resultJson = JSON.parse(response.text || '{}');
    return NextResponse.json(resultJson);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during generation." },
      { status: 500 }
    );
  }
}
