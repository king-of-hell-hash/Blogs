import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Grid,
  Search,
  Type,
  Check,
  RotateCcw,
  Download,
  Link as LinkIcon,
  Upload,
  Loader2,
  Wand2,
  Layers,
  Palette,
  Eye,
  Bookmark,
  Sun,
  Contrast,
  CircleDot
} from 'lucide-react';
import { ImagePlaceholder, ImageFilterSettings, ImageOverlaySettings } from '../types';
import {
  TOPIC_PHOTO_POOLS,
  getPhotosForCategory,
  searchAllTopicPhotos,
  getDimensionsForRatio
} from '../utils/imageFallback';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: ImagePlaceholder;
  onSave: (updated: ImagePlaceholder) => void;
}

const FILTER_PRESETS: Array<{ id: string; name: string; settings: ImageFilterSettings }> = [
  {
    id: 'original',
    name: 'Original',
    settings: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0 }
  },
  {
    id: 'vibrant',
    name: 'Vibrant & Punchy',
    settings: { brightness: 105, contrast: 115, saturate: 135, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0 }
  },
  {
    id: 'cinematic',
    name: 'Cinematic Warm',
    settings: { brightness: 98, contrast: 118, saturate: 110, grayscale: 0, sepia: 25, blur: 0, hueRotate: 345 }
  },
  {
    id: 'cyber',
    name: 'Cyber Cool',
    settings: { brightness: 102, contrast: 120, saturate: 125, grayscale: 0, sepia: 0, blur: 0, hueRotate: 180 }
  },
  {
    id: 'bw_dramatic',
    name: 'Dramatic B&W',
    settings: { brightness: 105, contrast: 130, saturate: 0, grayscale: 100, sepia: 0, blur: 0, hueRotate: 0 }
  },
  {
    id: 'vintage',
    name: 'Vintage Film',
    settings: { brightness: 100, contrast: 95, saturate: 90, grayscale: 0, sepia: 40, blur: 0, hueRotate: 10 }
  },
  {
    id: 'soft_editorial',
    name: 'Soft Editorial',
    settings: { brightness: 108, contrast: 95, saturate: 95, grayscale: 0, sepia: 10, blur: 0, hueRotate: 0 }
  }
];

export default function ImageEditorModal({ isOpen, onClose, image, onSave }: ImageEditorModalProps) {
  if (!isOpen) return null;

  // Active Tab in Editor
  const [activeTab, setActiveTab] = useState<'topics' | 'filters' | 'overlay' | 'ai' | 'url_upload' | 'meta'>('topics');

  // Working state for the image
  const [currentUrl, setCurrentUrl] = useState(image.generatedUrl || '');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '9:16' | '21:9'>(image.aspectRatio || '16:9');
  const [prompt, setPrompt] = useState(image.prompt);
  const [altText, setAltText] = useState(image.altText);
  const [caption, setCaption] = useState(image.caption || '');
  const [placement, setPlacement] = useState(image.placement);

  // Filters State
  const [filters, setFilters] = useState<ImageFilterSettings>(
    image.filters || { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, preset: 'original' }
  );

  // Overlay State
  const [overlay, setOverlay] = useState<ImageOverlaySettings>(
    image.overlay || {
      enabled: false,
      title: image.altText || 'Featured Topic Overview',
      subtitle: 'Complete Guide & Key Insights',
      badge: 'GUIDE',
      position: 'bottom',
      style: 'dark_glass'
    }
  );

  // Topic Browser State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute CSS filter string
  const cssFilter = `brightness(${filters.brightness || 100}%) contrast(${filters.contrast || 100}%) saturate(${filters.saturate || 100}%) grayscale(${filters.grayscale || 0}%) sepia(${filters.sepia || 0}%) blur(${filters.blur || 0}px) hue-rotate(${filters.hueRotate || 0}deg)`;

  // Filtered photos for topic selector
  const photosToDisplay = searchQuery.trim()
    ? searchAllTopicPhotos(searchQuery, aspectRatio)
    : selectedCategory === 'all'
    ? searchAllTopicPhotos('', aspectRatio)
    : getPhotosForCategory(selectedCategory, aspectRatio);

  // Apply a filter preset
  const handleApplyPreset = (preset: typeof FILTER_PRESETS[0]) => {
    setFilters({
      ...preset.settings,
      preset: preset.id
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0, hueRotate: 0, preset: 'original' });
  };

  // Generate with AI
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt || image.prompt,
          aspectRatio: aspectRatio === '21:9' ? '16:9' : aspectRatio,
          style: 'Photorealistic',
          placementOffset: Math.floor(Math.random() * 10)
        })
      });

      if (!res.ok) throw new Error('Image generation server error');
      const data = await res.json();
      if (data.image) {
        setCurrentUrl(data.image);
      } else {
        throw new Error('No image was returned');
      }
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate image');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAiError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Bake image onto Canvas to export with permanent filters and text overlay
  const handleBakeAndSave = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const { width, height } = getDimensionsForRatio(aspectRatio);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        saveDirect();
        return;
      }

      // Apply CSS Filters directly to Canvas context
      ctx.filter = cssFilter;
      ctx.drawImage(img, 0, 0, width, height);

      // Reset filter for text overlays
      ctx.filter = 'none';

      // Draw overlay if enabled
      if (overlay.enabled && (overlay.title || overlay.subtitle)) {
        drawOverlayOnCanvas(ctx, width, height, overlay);
      }

      try {
        const bakedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onSave({
          ...image,
          generatedUrl: bakedDataUrl,
          prompt,
          altText,
          caption,
          aspectRatio,
          placement,
          filters,
          overlay,
          isFallback: false
        });
        onClose();
      } catch (err) {
        // In case of CORS canvas taint from external domain, save state directly
        saveDirect();
      }
    };

    img.onerror = () => {
      saveDirect();
    };
  };

  const saveDirect = () => {
    onSave({
      ...image,
      generatedUrl: currentUrl,
      prompt,
      altText,
      caption,
      aspectRatio,
      placement,
      filters,
      overlay,
      isFallback: false
    });
    onClose();
  };

  const drawOverlayOnCanvas = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    ov: ImageOverlaySettings
  ) => {
    const isBottom = ov.position === 'bottom';
    const isTop = ov.position === 'top';
    const isCenter = ov.position === 'center';

    const bannerH = h * 0.28;
    const bannerY = isBottom ? h - bannerH : isTop ? 0 : (h - bannerH) / 2;

    // Background gradient/glass
    const grad = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerH);
    if (ov.style === 'light_solid') {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(1, 'rgba(245, 245, 250, 0.95)');
    } else {
      grad.addColorStop(0, isTop ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.85)');
      grad.addColorStop(1, isTop ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.98)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, bannerY, w, bannerH);

    // Badge
    const textColor = ov.style === 'light_solid' ? '#0f172a' : '#ffffff';
    const subColor = ov.style === 'light_solid' ? '#475569' : '#cbd5e1';

    let currentTextY = bannerY + 40;

    if (ov.badge) {
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(40, currentTextY - 18, 100, 26, [6]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(ov.badge.toUpperCase(), 52, currentTextY);
      currentTextY += 34;
    }

    if (ov.title) {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(ov.title.slice(0, 60), 40, currentTextY);
      currentTextY += 30;
    }

    if (ov.subtitle) {
      ctx.fillStyle = subColor;
      ctx.font = '16px sans-serif';
      ctx.fillText(ov.subtitle.slice(0, 80), 40, currentTextY);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Visual Studio & Topic Customizer
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold uppercase">
                  {image.placement}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Choose topic visuals, customize color filters, add headline overlays, or regenerate with AI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Live Visual Canvas Preview */}
          <div className="lg:col-span-5 p-6 bg-slate-900 flex flex-col justify-between items-center text-white border-r border-slate-800">
            <div className="w-full">
              <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                  Live Preview
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-violet-300 font-mono text-[11px]">
                  {aspectRatio} &bull; {filters.preset || 'Custom'}
                </span>
              </div>

              {/* Aspect Ratio Box */}
              <div
                className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 flex items-center justify-center ${
                  aspectRatio === '16:9'
                    ? 'aspect-video'
                    : aspectRatio === '4:3'
                    ? 'aspect-4/3'
                    : aspectRatio === '1:1'
                    ? 'aspect-square max-h-[300px]'
                    : aspectRatio === '21:9'
                    ? 'aspect-21/9'
                    : 'aspect-[9/16] max-h-[380px]'
                }`}
              >
                {currentUrl ? (
                  <>
                    <img
                      src={currentUrl}
                      alt={altText}
                      style={{ filter: cssFilter }}
                      className="w-full h-full object-cover transition-all duration-200"
                    />

                    {/* Text Overlay Preview */}
                    {overlay.enabled && (
                      <div
                        className={`absolute left-0 right-0 p-4 transition-all ${
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
                  </>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No image selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Aspect Ratio Selector */}
            <div className="w-full mt-4 pt-4 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Aspect Ratio Crop
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['16:9', '4:3', '1:1', '21:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-1.5 rounded-xl text-xs font-semibold text-center transition-all ${
                      aspectRatio === ratio
                        ? 'bg-violet-600 text-white shadow-sm ring-2 ring-violet-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Controls & Topic Browser */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/50">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-white overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
              <button
                onClick={() => setActiveTab('topics')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'topics' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-violet-600" />
                Browse Topics
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'filters' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-violet-600" />
                Edit Filters
              </button>
              <button
                onClick={() => setActiveTab('overlay')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'overlay' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Type className="w-3.5 h-3.5 text-violet-600" />
                Text Overlay
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'ai' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                AI Generator
              </button>
              <button
                onClick={() => setActiveTab('url_upload')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'url_upload' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-violet-600" />
                Custom URL / File
              </button>
              <button
                onClick={() => setActiveTab('meta')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'meta' ? 'bg-violet-50 text-violet-700 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                SEO Alt & Tags
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* TAB 1: BROWSE EVERY TOPIC */}
              {activeTab === 'topics' && (
                <div className="space-y-4">
                  {/* Category Pills & Search */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search any topic (e.g. solar panels, AI, coding, nutrition, crypto)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9.5 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none shadow-xs"
                      />
                    </div>

                    {/* Topic Category Dropdown / Pill Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === 'all' && !searchQuery
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        All Categories
                      </button>
                      {TOPIC_PHOTO_POOLS.map((pool) => (
                        <button
                          key={pool.category}
                          onClick={() => {
                            setSelectedCategory(pool.category);
                            setSearchQuery('');
                          }}
                          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                            selectedCategory === pool.category && !searchQuery
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pool.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photosToDisplay.map((photo, idx) => (
                      <div
                        key={photo.id + idx}
                        onClick={() => setCurrentUrl(photo.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          currentUrl === photo.url
                            ? 'border-violet-600 ring-2 ring-violet-500/30 shadow-md scale-[1.02]'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-white font-medium truncate">{photo.label}</span>
                        </div>
                        {currentUrl === photo.url && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGE FILTERS & ADJUSTMENTS */}
              {activeTab === 'filters' && (
                <div className="space-y-5">
                  {/* Preset Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Color Presets
                      </label>
                      <button
                        onClick={handleResetFilters}
                        className="text-xs text-slate-500 hover:text-violet-600 flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {FILTER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyPreset(preset)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                            filters.preset === preset.id
                              ? 'border-violet-600 bg-violet-50/70 text-violet-800 ring-1 ring-violet-500'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Sliders */}
                  <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-violet-600" />
                      Fine-Tune Adjustments
                    </h3>

                    {/* Brightness */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Brightness</span>
                        <span>{filters.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={filters.brightness || 100}
                        onChange={(e) =>
                          setFilters({ ...filters, brightness: Number(e.target.value), preset: undefined })
                        }
                        className="w-full accent-violet-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Contrast</span>
                        <span>{filters.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="150"
                        value={filters.contrast || 100}
                        onChange={(e) =>
                          setFilters({ ...filters, contrast: Number(e.target.value), preset: undefined })
                        }
                        className="w-full accent-violet-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Saturation */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Saturation / Vibrance</span>
                        <span>{filters.saturate}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={filters.saturate || 100}
                        onChange={(e) =>
                          setFilters({ ...filters, saturate: Number(e.target.value), preset: undefined })
                        }
                        className="w-full accent-violet-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Grayscale */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Black & White (Grayscale)</span>
                        <span>{filters.grayscale}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.grayscale || 0}
                        onChange={(e) =>
                          setFilters({ ...filters, grayscale: Number(e.target.value), preset: undefined })
                        }
                        className="w-full accent-violet-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Sepia */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Vintage Warmth (Sepia)</span>
                        <span>{filters.sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.sepia || 0}
                        onChange={(e) =>
                          setFilters({ ...filters, sepia: Number(e.target.value), preset: undefined })
                        }
                        className="w-full accent-violet-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEXT OVERLAY & BANNER */}
              {activeTab === 'overlay' && (
                <div className="space-y-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Enable Headline Banner Overlay</h4>
                      <p className="text-[11px] text-slate-500">
                        Overlay bold title & topic badges directly onto the image.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overlay.enabled}
                        onChange={(e) => setOverlay({ ...overlay, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {overlay.enabled && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Category / Badge Tag
                        </label>
                        <input
                          type="text"
                          value={overlay.badge || ''}
                          onChange={(e) => setOverlay({ ...overlay, badge: e.target.value })}
                          placeholder="e.g. GUIDE, KEY TAKEAWAY, 2026 INSIGHT"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Main Headline
                        </label>
                        <input
                          type="text"
                          value={overlay.title || ''}
                          onChange={(e) => setOverlay({ ...overlay, title: e.target.value })}
                          placeholder="Article title or section summary"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Subtitle / Sub-header
                        </label>
                        <input
                          type="text"
                          value={overlay.subtitle || ''}
                          onChange={(e) => setOverlay({ ...overlay, subtitle: e.target.value })}
                          placeholder="Short secondary sentence"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Banner Position
                          </label>
                          <select
                            value={overlay.position || 'bottom'}
                            onChange={(e) => setOverlay({ ...overlay, position: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                          >
                            <option value="bottom">Bottom Banner</option>
                            <option value="center">Center Badge</option>
                            <option value="top">Top Header</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Theme Style
                          </label>
                          <select
                            value={overlay.style || 'dark_glass'}
                            onChange={(e) => setOverlay({ ...overlay, style: e.target.value as any })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                          >
                            <option value="dark_glass">Dark Frosted Glass</option>
                            <option value="light_solid">Crisp White Solid</option>
                            <option value="gradient_banner">Violet Ambient Gradient</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: AI PROMPT GENERATOR */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-100">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5 text-violet-600" />
                        AI Generation Prompt
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what to generate..."
                      className="w-full p-3 bg-white border border-violet-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    />

                    {aiError && (
                      <p className="text-xs text-rose-600 mt-2 font-medium">{aiError}</p>
                    )}

                    <button
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="mt-3 w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating with Gemini & Imagen...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate New Visual with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: CUSTOM URL & FILE UPLOAD */}
              {activeTab === 'url_upload' && (
                <div className="space-y-4">
                  {/* URL Input */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-violet-600" />
                      Paste Direct Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          if (customUrlInput.trim()) {
                            setCurrentUrl(customUrlInput.trim());
                            setCustomUrlInput('');
                          }
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-300 hover:border-violet-500 rounded-2xl bg-white text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-violet-500" />
                    <p className="text-xs font-bold text-slate-800">Upload Image File</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Supports PNG, JPG, WebP, SVG</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: SEO METADATA & TAGS */}
              {activeTab === 'meta' && (
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SEO Alt Text (Accessibility & Search Ranking)
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="Descriptive keywords for search crawlers"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      In-Article Caption
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Figure caption displayed beneath image"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Article Section Placement
                    </label>
                    <select
                      value={placement}
                      onChange={(e) => setPlacement(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                    >
                      <option value="hero">Hero Header Banner</option>
                      <option value="section">In-Body Section Visual</option>
                      <option value="diagram">Diagram / Comparison Matrix</option>
                      <option value="conclusion">Conclusion & Takeaways</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBakeAndSave}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save & Apply to Article
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
