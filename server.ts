import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./src/server/api";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes
  app.use("/api", apiRouter);

  // Dedicated PWA Service Worker handler with root scope permissions
  app.get("/service-worker.js", (req, res) => {
    const swPublic = path.join(process.cwd(), "public", "service-worker.js");
    const swDist = path.join(process.cwd(), "dist", "service-worker.js");
    const swPath = fs.existsSync(swDist) ? swDist : swPublic;

    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(swPath);
  });

  // Dedicated PWA Manifest handler
  app.get("/manifest.json", (req, res) => {
    const manifestPublic = path.join(process.cwd(), "public", "manifest.json");
    const manifestDist = path.join(process.cwd(), "dist", "manifest.json");
    const manifestPath = fs.existsSync(manifestDist) ? manifestDist : manifestPublic;

    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(manifestPath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
