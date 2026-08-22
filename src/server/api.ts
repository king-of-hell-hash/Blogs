import express from 'express';
import { handleGenerateBlogPost, handleGenerateImage, handleTranscribeAudio } from './core';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    engine: 'SEO Blog Studio AI'
  });
});

router.post('/generate', async (req, res) => {
  try {
    const result = await handleGenerateBlogPost(req.body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("=== Express /api/generate FATAL ERROR ===");
    console.error("Error Message:", error?.message);
    console.error("Error Stack:", error?.stack);
    console.error("Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=========================================");

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
      details: error?.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const result = await handleGenerateImage(req.body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("=== Express /api/generate-image ERROR ===");
    console.error("Error Message:", error?.message);
    console.error("Error Stack:", error?.stack);
    console.error("Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("=========================================");

    return res.status(500).json({
      error: error?.message || "Image generation failed",
      details: error?.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/transcribe', async (req, res) => {
  try {
    const result = await handleTranscribeAudio(req.body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("=== Express /api/transcribe ERROR ===");
    console.error("Error Message:", error?.message);
    console.error("Error Stack:", error?.stack);
    console.error("Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("======================================");

    return res.status(error?.status === 429 ? 429 : 500).json({
      error: error?.message || "Audio transcription failed.",
      details: error?.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as apiRouter };
