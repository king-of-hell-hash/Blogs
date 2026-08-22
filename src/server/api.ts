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
    const result = await handleGenerateImage(req.body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("Image Generation Endpoint Error:", error);
    return res.status(500).json({ error: error.message || "Image generation failed" });
  }
});

router.post('/transcribe', async (req, res) => {
  try {
    const result = await handleTranscribeAudio(req.body);
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("Audio Transcription Endpoint Error:", error);
    return res.status(error.status === 429 ? 429 : 500).json({
      error: error.message || "Audio transcription failed."
    });
  }
});

export { router as apiRouter };

