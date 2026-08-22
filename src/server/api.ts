import express from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import { getCuratedImageUrl } from '../utils/imageFallback';

const router = express.Router();

function getCleanApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  const cleaned = key.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  
  if (cleaned.length > 0 && (cleaned.includes(' ') || cleaned.length > 100)) {
    throw new Error("Invalid GEMINI_API_KEY. It looks like you pasted a text prompt instead of a real API key.");
  }
  
  return cleaned;
}

// Resilient helper to execute generation with automatic model fallback & retries
async function executeGenerationWithFallbacks(
  ai: GoogleGenAI,
  params: {
    prompt: string;
    responseSchema: any;
    trySearchGrounding: boolean;
  }
): Promise<{ text: string; groundingSources: any[]; groundingFallback: boolean }> {
  const candidateModels = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];
  let groundingSources: any[] = [];
  let groundingFallback = false;

  // Step 1: If search grounding is requested, attempt it
  if (params.trySearchGrounding) {
    for (const model of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model: model,
          contents: params.prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: params.responseSchema
          }
        });

        if (res.text) {
          const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            groundingSources = chunks
              .filter((c: any) => c.web?.uri)
              .map((c: any) => ({
                title: c.web.title || new URL(c.web.uri).hostname,
                url: c.web.uri,
                snippet: c.web.title || ''
              }));
          }
          return { text: res.text, groundingSources, groundingFallback: false };
        }
      } catch (err: any) {
        // Search tool limit or quota reached on free tier - transition smoothly to deep AI knowledge synthesis
        groundingFallback = true;
        break;
      }
    }
  }

  // Step 2: Standard JSON generation across candidate models with retry
  let lastError: any = null;
  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: model,
          contents: params.prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: params.responseSchema
          }
        });

        if (res.text) {
          return { text: res.text, groundingSources, groundingFallback };
        }
      } catch (err: any) {
        lastError = err;
        // If 503 (high demand) or 429, wait 350ms before retrying or switching models
        if (err.status === 503 || err.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 350));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error("All model endpoints are currently experiencing high demand. Please try again in a few moments.");
}

function parseGeneratedJson(rawText: string): any {
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // Try cleaning markdown json fences if any
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Find outermost JSON object
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(cleaned.substring(start, end + 1));
      }
      throw new Error("Unable to parse model JSON response");
    }
  }
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

    const {
      keyword,
      audience,
      intent,
      tone,
      length,
      readingLevel,
      enableOnlineResearch = true,
      researchDepth = 'Deep',
      includeImages = true,
      imageDensity = 'Standard (Hero + 2-3 visuals)',
      imageStyle = 'Photorealistic'
    } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: "Keyword or Topic is required" });
    }

    const imageInstruction = includeImages ? `
**Multimedia & Image Placement Rules**:
- Include rich, highly descriptive visual image placements where visual comprehension is highest.
- Insert a Hero Image placeholder immediately below the H1 title: \`![image_prompt_hero: A stunning hero banner illustration/photo representing ${keyword} in ${imageStyle} style](hero)\`
- Insert contextual section visuals at 2 to 4 crucial points in the article (e.g. after complex explanations, step-by-step guides, comparison charts, or statistics):
  Format each as: \`![image_prompt_section: Detailed scene description in ${imageStyle} style](section-slug)\`
- Provide full entries for each suggested image in the \`suggestedImages\` array with clear prompt, alt text, and caption.
` : `Do not include image placeholders.`;

    const researchInstruction = enableOnlineResearch ? `
**Online Research & Fact Grounding**:
- Conduct in-depth research on "${keyword}" with focus on "${researchDepth}".
- Provide the latest real-world 2026 data points, industry statistics, benchmark comparisons, expert insights, and credible reference sources.
- Ground your blog arguments in factual data and provide a concise researchSummary.
` : `Generate based on general foundational knowledge without web search.`;

    let lengthInstruction = `**Target Length**: Standard Blog Post (~1,500 words). Provide 6-8 well-developed sections, 1 comparison table, and 4 FAQs.`;
    if (length?.includes('800')) {
      lengthInstruction = `**Target Length**: Quick Guide (~800-1,000 words). Provide 4-5 focused, high-impact sections, key bullet points, and 3 quick FAQs.`;
    } else if (length?.includes('2,500') || length?.includes('2500')) {
      lengthInstruction = `**Target Length**: In-Depth Authority Guide (~2,500-3,000 words). Provide 8-12 deep sections with thorough explanations, multiple sub-sections (H3), 2 detailed markdown tables, real-world case studies, actionable checklists, and 6 FAQs.`;
    } else if (length?.includes('3,500') || length?.includes('3500')) {
      lengthInstruction = `**Target Length**: Comprehensive Long-Form (~3,500-4,000 words). Provide 12-16 exhaustive sections, complete technical breakdown, step-by-step implementation roadmap, multiple data tables/matrices, expert insights, and 8 thorough FAQs.`;
    } else if (length?.includes('5,000') || length?.includes('5000')) {
      lengthInstruction = `**Target Length**: Ultimate Pillar Deep-Dive (~4,500-5,500+ words). Write an exhaustive, encyclopedia-grade definitive pillar post. Provide 15-20 expansive sections, in-depth sub-chapters, exhaustive historical & 2026 future trends, multiple deep comparative tables, troubleshooting guides, actionable workflows, and 10 detailed FAQ answers.`;
    }

    const prompt = `
You are an Elite SEO Strategist and Principal Content Writer. Write an exceptional, ranking-ready, authoritative SEO blog post.

**Input Parameters**:
- Target Keyword / Topic: ${keyword}
- Target Audience: ${audience || 'General Industry Professionals & Readers'}
- Content Intent: ${intent || 'Informational & Practical Guide'}
- Tone of Voice: ${tone || 'Authoritative yet Accessible & Engaging'}
- Reading Level: ${readingLevel || 'Grade 8'}
- Image Density: ${imageDensity}
- Visual Style: ${imageStyle}

${lengthInstruction}

${researchInstruction}

${imageInstruction}

**Structure & Quality Standards**:
1. **On-Page SEO**:
   - High-CTR Meta Title (50-60 characters, keyword placed near beginning).
   - Compelling Meta Description (140-155 characters with clear value proposition and CTA).
   - Clean, SEO-friendly URL Slug.
   - 1 Focus Keyword and 5-8 LSI / semantic keywords.
2. **Content Architecture (E-E-A-T Optimized)**:
   - Clear H1, H2, H3 hierarchy (and H4 for deep sub-sections).
   - Engaging Hook in the intro + "Quick Takeaways / TL;DR" highlight box.
   - Deep dive core sections with real-world scenarios, statistics, and actionable examples.
   - Comprehensive Comparison Tables and Pros/Cons breakdowns (using clean markdown tables).
   - Step-by-Step Actionable Checklist / Implementation Roadmap.
   - Google Featured Snippet FAQ Section (formatted with Q&A blocks).
   - Strong Conclusion with clear next steps / Call to Action.
3. **Monetization & Ad Placements**:
   - Insert natural ad placement tags: \`[AdSense Banner - High-CTR Placement]\` and \`[AdSense In-Feed Responsive]\`.
4. **Formatting**:
   - Semantic Markdown with bolding on key takeaways, bullet points, blockquotes, and tables.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        metaTitle: { type: Type.STRING, description: "The high-CTR Meta Title (under 60 chars)" },
        metaDescription: { type: Type.STRING, description: "The Meta Description (under 160 chars)" },
        urlSlug: { type: Type.STRING, description: "Recommended clean URL slug" },
        focusKeyword: { type: Type.STRING, description: "Primary focus keyword" },
        lsiKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Secondary & LSI keywords" },
        markdown: { type: Type.STRING, description: "The complete, fully formatted blog post in Markdown with image tags and ad placeholders" },
        schemaMarkup: { type: Type.STRING, description: "Valid JSON-LD Schema Markup (Article / BlogPosting / FAQPage) as a string" },
        researchSummary: { type: Type.STRING, description: "Brief bulleted summary of key online research findings and statistics used" },
        referenceSources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              snippet: { type: Type.STRING }
            },
            required: ["title", "url", "snippet"]
          },
          description: "Authoritative reference sources and industry citations"
        },
        suggestedImages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              placeholderId: { type: Type.STRING },
              prompt: { type: Type.STRING, description: "Detailed, high-quality image generation prompt" },
              altText: { type: Type.STRING, description: "SEO optimized alt text for accessibility and ranking" },
              caption: { type: Type.STRING, description: "Contextual caption to display below the image" },
              placement: { type: Type.STRING, description: "hero | section | diagram | comparison | conclusion" },
              aspectRatio: { type: Type.STRING, description: "16:9 | 4:3 | 1:1" }
            },
            required: ["id", "placeholderId", "prompt", "altText", "placement", "aspectRatio"]
          },
          description: "List of all images strategically placed in the blog"
        }
      },
      required: ["metaTitle", "metaDescription", "urlSlug", "focusKeyword", "lsiKeywords", "markdown", "schemaMarkup", "suggestedImages"]
    };

    const { text, groundingSources, groundingFallback } = await executeGenerationWithFallbacks(ai, {
      prompt,
      responseSchema,
      trySearchGrounding: Boolean(enableOnlineResearch)
    });

    const resultJson = parseGeneratedJson(text);
    
    // Calculate word count & reading time
    const rawMarkdown = resultJson.markdown || '';
    const wordCount = rawMarkdown.replace(/[#*`_\[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    // Ensure suggestedImages is populated
    let suggestedImages = resultJson.suggestedImages || [];
    if (includeImages && suggestedImages.length === 0) {
      suggestedImages = [
        {
          id: 'img-hero',
          placeholderId: 'hero',
          prompt: `High-resolution hero banner for ${keyword}, ${imageStyle} style, clean composition, professional lighting`,
          altText: `${keyword} comprehensive overview`,
          caption: `A comprehensive visual breakdown of ${keyword}.`,
          placement: 'hero',
          aspectRatio: '16:9'
        },
        {
          id: 'img-sec-1',
          placeholderId: 'section-1',
          prompt: `Detailed conceptual infographic diagram illustrating ${keyword} workflow, ${imageStyle} style`,
          altText: `How ${keyword} works step by step`,
          caption: `Visual workflow and key dynamics.`,
          placement: 'section',
          aspectRatio: '16:9'
        }
      ];
    }

    // If search grounding sources are empty, use synthesized reference sources
    let finalSources = groundingSources;
    if (finalSources.length === 0 && Array.isArray(resultJson.referenceSources) && resultJson.referenceSources.length > 0) {
      finalSources = resultJson.referenceSources;
    }

    return res.status(200).json({
      ...resultJson,
      suggestedImages,
      groundingSources: finalSources,
      groundingFallback,
      wordCount,
      readingTimeMinutes
    });

  } catch (error: any) {
    console.error("Gemini Generate API Error:", error);
    
    let errorMessage = "An error occurred while generating the blog post.";
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      errorMessage = "Gemini API rate limit reached. Please try again in a moment.";
    } else if (error.status === 503 || (error.message && error.message.includes("503"))) {
      errorMessage = "The AI service is currently experiencing high demand. Please try again in a moment.";
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

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { prompt, aspectRatio = '16:9', style = 'photorealistic', placementOffset = 0 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Image prompt is required" });
    }

    const enhancedPrompt = `${prompt}, high detail, ${style} aesthetic, 4k resolution, clean lighting`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [{ text: enhancedPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any || "16:9"
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            const base64 = part.inlineData.data;
            return res.status(200).json({
              image: `data:${mimeType};base64,${base64}`,
              isFallback: false
            });
          }
        }
      }
    } catch (imageModelError: any) {
      const isQuota = imageModelError.status === 429 || (imageModelError.message && imageModelError.message.includes('429'));
      if (isQuota) {
        console.info("Gemini image synthesis quota limit reached; providing high-res contextual visual fallback.");
      } else {
        console.warn("Image model generation warning:", imageModelError.message || imageModelError);
      }
      
      const fallbackUrl = getCuratedImageUrl(prompt, aspectRatio as any, Number(placementOffset) || 0);
      return res.status(200).json({
        image: fallbackUrl,
        isFallback: true,
        fallbackReason: isQuota
          ? "API quota limit on AI image synthesis. Contextual HD visual provided."
          : "Contextual visual provided."
      });
    }

    const fallbackUrl = getCuratedImageUrl(prompt, aspectRatio as any, Number(placementOffset) || 0);
    return res.status(200).json({
      image: fallbackUrl,
      isFallback: true
    });

  } catch (error: any) {
    console.error("Image Generation Endpoint Error:", error);
    const fallbackUrl = getCuratedImageUrl(req.body.prompt || 'technology', req.body.aspectRatio || '16:9');
    return res.status(200).json({
      image: fallbackUrl,
      isFallback: true,
      fallbackReason: "Service error. Provided curated fallback visual."
    });
  }
});

export { router as apiRouter };
