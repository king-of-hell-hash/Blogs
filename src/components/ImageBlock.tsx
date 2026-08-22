import React, { useState } from 'react';
import { 
  ImageIcon, 
  RefreshCw, 
  Download, 
  Sparkles, 
  AlertCircle, 
  Edit3, 
  Check, 
  Copy, 
  Grid, 
  Loader2, 
  SlidersHorizontal,
  Palette,
  Layers,
  Wand2
} from 'lucide-react';
import { ImagePlaceholder } from '../types';
import ImageEditorModal from './ImageEditorModal';

interface ImageBlockProps {
  image: ImagePlaceholder;
  onUpdateImage: (updated: ImagePlaceholder) => void;
}

export default function ImageBlock({ image, onUpdateImage }: ImageBlockProps) {
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectRatio = image.aspectRatio || '16:9';

  // Compute CSS filter string if filters are saved
  const f = image.filters;
  const cssFilter = f
    ? `brightness(${f.brightness || 100}%) contrast(${f.contrast || 100}%) saturate(${f.saturate || 100}%) grayscale(${f.grayscale || 0}%) sepia(${f.sepia || 0}%) blur(${f.blur || 0}px) hue-rotate(${f.hueRotate || 0}deg)`
    : 'none';

  const overlay = image.overlay;

  const handleGenerateAI = async () => {
    setGenerating(true);
    setError(null);
    try {
      const offset = image.placement === 'hero' ? 0 : Math.abs(image.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: image.prompt,
          aspectRatio: aspectRatio === '21:9' ? '16:9' : aspectRatio,
          style: 'Photorealistic',
          placementOffset: offset
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await res.json();
      if (data.image) {
        onUpdateImage({
          ...image,
          generatedUrl: data.image,
          isFallback: !!data.isFallback,
          fallbackReason: data.fallbackReason,
          isGenerating: false,
          error: undefined
        });
      } else {
        throw new Error('No image returned from server');
      }
    } catch (err: any) {
      setError(err.message || 'Image generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    const md = `![${image.altText || 'Blog Visual'}](${image.generatedUrl || image.prompt})`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!image.generatedUrl) return;
    const link = document.createElement('a');
    link.href = image.generatedUrl;
    link.download = `${image.placeholderId || 'blog-image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id={`image-container-${image.id}`} className="my-8">
      {image.generatedUrl ? (
        /* Rendered Image Card */
        <div id={`image-block-${image.id}`} className="rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-sm transition-all hover:shadow-md">
          <div className="relative group overflow-hidden rounded-xl bg-slate-950/5">
            <img
              src={image.generatedUrl}
              alt={image.altText || image.prompt}
              referrerPolicy="no-referrer"
              style={{ filter: cssFilter }}
              className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
            />

            {/* In-Image Text Overlay Banner if active */}
            {overlay && overlay.enabled && (
              <div
                className={`absolute left-0 right-0 p-4 pointer-events-none transition-all ${
                  overlay.position === 'top'
                    ? 'top-0'
                    : overlay.position === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-0'
                } ${
                  overlay.style === 'light_solid'
                    ? 'bg-white/95 text-slate-900'
                    : overlay.style === 'gradient_banner'
                    ? 'bg-gradient-to-t from-violet-950/95 via-violet-900/80 to-transparent text-white'
                    : 'bg-slate-950/85 backdrop-blur-md text-white border-t border-white/10'
                }`}
              >
                {overlay.badge && (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-violet-600 text-white font-bold text-[10px] uppercase tracking-wider mb-1">
                    {overlay.badge}
                  </span>
                )}
                {overlay.title && (
                  <h4 className="text-sm sm:text-base font-bold leading-snug line-clamp-2">
                    {overlay.title}
                  </h4>
                )}
                {overlay.subtitle && (
                  <p
                    className={`text-xs mt-0.5 line-clamp-1 ${
                      overlay.style === 'light_solid' ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {overlay.subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-4">
              <button
                onClick={() => setIsEditorModalOpen(true)}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Edit & Custom Topic
              </button>
              <button
                onClick={() => handleGenerateAI()}
                disabled={generating}
                className="px-3 py-2 bg-white/95 text-slate-800 rounded-xl text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerate AI
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-2 bg-white/95 text-slate-800 rounded-xl text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy MD'}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white/95 text-slate-800 rounded-xl text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white transition-all cursor-pointer"
                title="Download Image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-violet-300" />
                {image.placement === 'hero' ? 'Hero Banner' : 'Article Visual'} ({aspectRatio})
              </span>
              <button
                onClick={() => setIsEditorModalOpen(true)}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 text-[11px] font-semibold rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-violet-600" />
                Edit / Topic
              </button>
            </div>
          </div>

          {/* Caption & SEO Alt Text */}
          <div className="mt-3 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
            <p className="italic text-slate-600 font-medium">{image.caption || image.altText}</p>
            <span className="text-[11px] text-slate-400 font-mono">Alt: "{image.altText}"</span>
          </div>
        </div>
      ) : (
        /* Placeholder State (Not Yet Generated) */
        <div id={`image-placeholder-${image.id}`} className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all hover:border-violet-300">
          <div className="w-12 h-12 rounded-2xl bg-violet-100/80 flex items-center justify-center text-violet-600 mb-3 shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100/70 text-violet-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested {image.placement === 'hero' ? 'Hero Banner' : 'Article Visual'} ({aspectRatio})
          </div>

          <p className="text-slate-700 text-sm font-medium max-w-lg mb-2 leading-relaxed">
            "{image.prompt}"
          </p>

          {image.altText && (
            <p className="text-xs text-slate-400 mb-4">
              Suggested Alt Text: <span className="font-mono text-slate-500">{image.altText}</span>
            </p>
          )}

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-1.5 max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => handleGenerateAI()}
              disabled={generating}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-200" />}
              {generating ? 'Generating Visual...' : 'Generate Image with AI'}
            </button>

            <button
              onClick={() => setIsEditorModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-all hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Grid className="w-4 h-4 text-violet-600" />
              Choose Topic Photo / Edit Options
            </button>
          </div>
        </div>
      )}

      {/* Full Feature Image Editor & Topic Studio Modal */}
      {isEditorModalOpen && (
        <ImageEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => setIsEditorModalOpen(false)}
          image={image}
          onSave={(updated) => onUpdateImage(updated)}
        />
      )}
    </div>
  );
}
