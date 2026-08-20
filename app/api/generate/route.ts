import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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
   - Write a high-CTR Meta Title (under 60 chars) at the top.
   - Write a Meta Description (under 160 chars) below the title.
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

Output only the Markdown content. Do not include introductory/outro chat text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return NextResponse.json({ content: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during generation." },
      { status: 500 }
    );
  }
}
