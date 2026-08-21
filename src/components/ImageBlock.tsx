import React, { useState, useRef } from 'react';
import { 
  ImageIcon, 
  RefreshCw, 
  Download, 
  Sparkles, 
  AlertCircle, 
  Edit3, 
  Check, 
  Copy, 
  Link as LinkIcon, 
  Upload, 
  Grid, 
  X, 
  Loader2, 
  SlidersHorizontal 
} from 'lucide-react';
import { ImagePlaceholder } from '../types';
import { getCuratedGalleryPhotos } from '../utils/imageFallback';

interface ImageBlockProps {
  image: ImagePlaceholder;
  onUpdateImage: (updated: ImagePlaceholder) => void;
}

export default function ImageBlock({ image, onUpdateImage }: ImageBlockProps) {
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'ai' | 'url' | 'upload'>('gallery');
  const [customPrompt, setCustomPrompt] = useState(image.prompt);
  const [customAltText, setCustomAltText] = useState(image.altText);
  const [customCaption, setCustomCaption] = useState(image.caption || '');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '9:16'>(image.aspectRatio || '16:9');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Curated gallery options for this image's topic
  const galleryPhotos = getCuratedGalleryPhotos(image.prompt, aspectRatio);

  const handleGenerate = async (promptToUse?: string) => {
    setGenerating(true);
    setError(null);
    try {
      const offset = image.placement === 'hero' ? 0 : Math.abs(image.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10;
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse || customPrompt || image.prompt,
          aspectRatio: aspectRatio,
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
          prompt: promptToUse || customPrompt || image.prompt,
          altText: customAltText || image.altText,
          caption: customCaption || image.caption,
          aspectRatio: aspectRatio,
          generatedUrl: data.image,
          isFallback: !!data.isFallback,
          fallbackReason: data.fallbackReason,
          isGenerating: false,
          error: undefined
        });
        setIsChangeModalOpen(false);
      } else {
        throw new Error('No image returned from server');
      }
    } catch (err: any) {
      setError(err.message || 'Image generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectGalleryPhoto = (photoUrl: string) => {
    onUpdateImage({
      ...image,
      generatedUrl: photoUrl,
      altText: customAltText || image.altText,
      caption: customCaption || image.caption,
      aspectRatio: aspectRatio,
      isFallback: true,
      fallbackReason: 'Selected from Curated Gallery'
    });
    setIsChangeModalOpen(false);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    onUpdateImage({
      ...image,
      generatedUrl: customUrlInput.trim(),
      altText: customAltText || image.altText,
      caption: customCaption || image.caption,
      aspectRatio: aspectRatio,
      isFallback: false
    });
    setCustomUrlInput('');
    setIsChangeModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onUpdateImage({
        ...image,
        generatedUrl: result,
        altText: customAltText || file.name.replace(/\.[^/.]+$/, ''),
        caption: customCaption || image.caption,
        aspectRatio: aspectRatio,
        isFallback: false
      });
      setIsChangeModalOpen(false);
    };
    reader.readAsDataURL(file);
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
        <div id={`image-block-${image.id}`} className="rounded-2xl border border-slate-200/90 bg-slate-900/5 p-3 sm:p-4 shadow-sm transition-all hover:shadow-md">
          <div className="relative group overflow-hidden rounded-xl bg-slate-950/5">
            <img
              src={image.generatedUrl}
              alt={image.altText || image.prompt}
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
              style={{
                aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '4:3' ? '4/3' : aspectRatio === '1:1' ? '1/1' : 'auto'
              }}
            />

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-4">
              <button
                onClick={() => setIsChangeModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Change Image
              </button>
              <button
                onClick={() => handleGenerate()}
                disabled={generating}
                className="px-3 py-2 bg-white/95 text-slate-800 rounded-lg text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerate AI
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-2 bg-white/95 text-slate-800 rounded-lg text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy MD'}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white/95 text-slate-800 rounded-lg text-xs font-semibold shadow-md backdrop-blur-sm hover:bg-white transition-all cursor-pointer"
                title="Download Image"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                {image.placement === 'hero' ? 'Hero Banner' : 'Article Visual'} ({aspectRatio})
              </span>
              <button
                onClick={() => setIsChangeModalOpen(true)}
                className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 text-[11px] font-semibold rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-indigo-600" />
                Change
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
        <div id={`image-placeholder-${image.id}`} className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all hover:border-indigo-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
            <ImageIcon className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100/70 text-indigo-700 text-xs font-semibold mb-2">
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
              onClick={() => handleGenerate()}
              disabled={generating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-200" />}
              {generating ? 'Generating Visual...' : 'Generate Image with AI'}
            </button>

            <button
              onClick={() => setIsChangeModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-sm font-medium transition-all hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-indigo-600" />
              Choose Photo / Custom Image
            </button>
          </div>
        </div>
      )}

      {/* CHANGE IMAGE MODAL / DRAWER */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Change & Customize Image
                  </h3>
                  <p className="text-xs text-slate-500">
                    {image.placement === 'hero' ? 'Hero Banner' : 'Article Section Visual'} &bull; Choose from curated gallery, synthesize with AI, paste link, or upload.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-4 pt-2 bg-slate-50/30 gap-2">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Topic Gallery ({galleryPhotos.length})
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ai'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Prompt & Settings
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'url'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Custom URL
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* TAB 1: CURATED TOPIC GALLERY */}
              {activeTab === 'gallery' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">
                      Click any high-resolution photo below to instantly set it:
                    </p>
                    <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      HD Unsplash Curated
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectGalleryPhoto(photo.url)}
                        className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                          image.generatedUrl === photo.url ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={`Option ${idx + 1}`}
                          className="w-full h-28 object-cover group-hover:brightness-95 transition-all"
                        />
                        <div className="absolute inset-0 bg-indigo-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="px-2.5 py-1 bg-white text-indigo-700 font-bold text-[11px] rounded-lg shadow">
                            Select Photo
                          </span>
                        </div>
                        {image.generatedUrl === photo.url && (
                          <div className="absolute top-2 right-2 p-1 bg-indigo-600 text-white rounded-full shadow">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: AI PROMPT REFINEMENT */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      AI Visual Scene Prompt
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-slate-800"
                      placeholder="Describe what visual should appear here..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Aspect Ratio
                      </label>
                      <div className="flex gap-1.5">
                        {(['16:9', '4:3', '1:1', '9:16'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setAspectRatio(r)}
                            className={`flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                              aspectRatio === r
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        SEO Alt Text
                      </label>
                      <input
                        type="text"
                        value={customAltText}
                        onChange={(e) => setCustomAltText(e.target.value)}
                        placeholder="Keyword rich alt text..."
                        className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerate(customPrompt)}
                    disabled={generating}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-200" />}
                    {generating ? 'Generating Visual...' : 'Generate New AI Image'}
                  </button>
                </div>
              )}

              {/* TAB 3: CUSTOM URL */}
              {activeTab === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/my-custom-image.jpg"
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      />
                      <button
                        onClick={handleApplyCustomUrl}
                        disabled={!customUrlInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Apply URL
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Supports direct image links from Unsplash, Imgur, AWS S3, Cloudinary, or your website CDN.
                    </p>
                  </div>

                  {customUrlInput.trim() && (
                    <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Live Preview:</p>
                      <img
                        src={customUrlInput.trim()}
                        alt="Preview"
                        className="max-h-48 rounded-lg object-contain mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: UPLOAD LOCAL FILE */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-indigo-300"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      Click to Browse or Drag Image Here
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, WebP, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* Common Metadata Section: Alt Text & Caption */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Image Caption (Display in blog)
                  </label>
                  <input
                    type="text"
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    placeholder="Short descriptive caption..."
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    SEO Alt Text (Accessibility)
                  </label>
                  <input
                    type="text"
                    value={customAltText}
                    onChange={(e) => setCustomAltText(e.target.value)}
                    placeholder="Keyword optimized alt text..."
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
