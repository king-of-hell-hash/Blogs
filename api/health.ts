export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: 'Vercel Serverless / AI Studio',
    hasKey: Boolean(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
  });
}
