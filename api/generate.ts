import { handleGenerateBlogPost } from './_core';

// Set maximum allowed duration on Vercel (60 seconds for Hobby, up to 300s on Pro)
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export default async function handler(req: any, res: any) {
  // Set CORS and Content-Type headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // use raw body as-is
      }
    }
    const result = await handleGenerateBlogPost(body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    // Log FULL error details so they appear in Vercel Deployment Function Logs
    console.error("=== Vercel Serverless /api/generate FATAL ERROR ===");
    console.error("Error Message:", error?.message || "Unknown error");
    console.error("Error Stack:", error?.stack);
    console.error("Error Status Code:", error?.status || error?.statusCode || 500);
    if (error?.response) {
      console.error("Error Response Data:", JSON.stringify(error.response.data || error.response));
    }
    console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=================================================");

    let errorMessage = "An error occurred while generating the blog post.";
    const statusCode = error?.status === 429 ? 429 : (error?.status === 400 ? 400 : 500);

    if (error?.status === 429 || (error?.message && error.message.includes("429"))) {
      errorMessage = "Gemini API rate limit reached. Please try again in a moment.";
    } else if (error?.status === 503 || (error?.message && error.message.includes("503"))) {
      errorMessage = "The AI service is currently experiencing high demand. Please try again in a moment.";
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      error: errorMessage,
      details: error?.message || "Internal serverless function error",
      timestamp: new Date().toISOString()
    });
  }
}
