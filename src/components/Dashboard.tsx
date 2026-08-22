import React, { useState, useEffect } from 'react';
import {
  Settings, Play, Copy, FileCode2, Share2, Check, AlertCircle, BarChart,
  LayoutTemplate, Image as ImageIcon, Loader2, Globe, Sparkles, Download,
  RefreshCw, Search, ShieldCheck, CheckCircle2, FileText, ArrowRight,
  HelpCircle, Sliders, ExternalLink, Zap, SlidersHorizontal, Grid, Bell
} from 'lucide-react';
import BlogPreview from './BlogPreview';
import ResearchSources from './ResearchSources';
import SeoMetadataPanel from './SeoMetadataPanel';
import ImageBlock from './ImageBlock';
import { GeneratedBlogResponse, ImagePlaceholder, ArticleLengthOption } from '../types';
import {
  subscribeToPushNotifications,
  notifyBlogGenerationComplete,
  registerBackgroundSync,
  registerPeriodicSync
} from '../utils/pwaPush';

export default function Dashboard() {
  // Generation Parameters
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [intent, setIntent] = useState('Informational & How-To');
  const [tone, setTone] = useState('Authoritative & Engaging');
  const [length, setLength] = useState<ArticleLengthOption>('Standard Blog Post (~1,500 words)');
  const [readingLevel, setReadingLevel] = useState('Grade 8');

  // Online Research & Image Toggles
  const [enableOnlineResearch, setEnableOnlineResearch] = useState(true);
  const [researchDepth, setResearchDepth] = useState<'Standard' | 'Deep' | 'Recent 2026 Updates'>('Deep');
  const [includeImages, setIncludeImages] = useState(true);
  const [imageDensity, setImageDensity] = useState<'Minimal (Hero only)' | 'Standard (Hero + 2-3 visuals)' | 'Rich (Visual for every major section)'>('Standard (Hero + 2-3 visuals)');
  const [imageStyle, setImageStyle] = useState<'Photorealistic' | '3D Render / Modern' | 'Minimalist Vector Illustration' | 'Editorial Photography' | 'Infographic / Diagram'>('Photorealistic');
  const [autoGenerateImages, setAutoGenerateImages] = useState(true);

  // App Execution States
  const [loading, setLoading] = useState(false);
  const [batchGeneratingImages, setBatchGeneratingImages] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Result State
  const [blogData, setBlogData] = useState<GeneratedBlogResponse | null>(null);
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'images' | 'research' | 'seo' | 'markdown'>('preview');

  // Copy States
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Initialize PWA Handlers (Share Target, Protocol Handler, File Handler, Background Sync)
  useEffect(() => {
    // 1. Process URL query parameters (Share Target, Protocol Handlers, Shortcuts)
    const params = new URLSearchParams(window.location.search);
    const sharedTopic = params.get('topic') || params.get('share_text') || params.get('share_title') || params.get('share_url');
    if (sharedTopic) {
      setKeyword(sharedTopic);
    }
    const tabParam = params.get('tab');
    if (tabParam === 'images' || tabParam === 'preview' || tabParam === 'research' || tabParam === 'seo' || tabParam === 'markdown') {
      setActiveTab(tabParam);
    }

    // 2. W3C File Handlers (Launch Queue for .md and .txt files)
    if ('launchQueue' in window && typeof (window as any).launchQueue.setConsumer === 'function') {
      (window as any).launchQueue.setConsumer(async (launchParams: any) => {
        if (!launchParams.files || !launchParams.files.length) return;
        for (const fileHandle of launchParams.files) {
          const file = await fileHandle.getFile();
          const text = await file.text();
          if (text) {
            setEditableMarkdown(text);
            setActiveTab('markdown');
            setKeyword(file.name.replace(/\.[^/.]+$/, ''));
          }
        }
      });
    }

    // 3. Register Periodic Sync (if supported & allowed)
    registerPeriodicSync('refresh-trending-topics');
  }, []);

  // Request Notification permission
  const handleEnableNotifications = async () => {
    const res = await subscribeToPushNotifications();
    if (res.success) {
      setNotificationsEnabled(true);
    }
  };

  // Keyword inspiration chips
  const inspirationKeywords = [
    'Best AI Tools 2026 for Productivity',
    'How to Start a High-Income Blog in 2026',
    'Cybersecurity Best Practices for Small Business',
    'Clean Energy & Solar Power Buyer Guide'
  ];

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('Please enter a target keyword or topic.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          audience,
          intent,
          tone,
          length,
          readingLevel,
          enableOnlineResearch,
          researchDepth,
          includeImages,
          imageDensity,
          imageStyle,
          autoGenerateImages
        })
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errMsg = 'Failed to generate blog post';
        if (contentType && contentType.includes('application/json')) {
          const errJson = await res.json();
          errMsg = errJson.error || errMsg;
        } else if (res.status === 404) {
          errMsg = 'Server API endpoint returned 404. If you recently deployed to Vercel, ensure the project includes the /api directory and that GEMINI_API_KEY is set in Vercel Project Settings > Environment Variables.';
        } else {
          errMsg = `Server error (${res.status}): ${res.statusText || 'Unable to connect to AI generation API'}`;
        }
        throw new Error(errMsg);
      }

      const data: GeneratedBlogResponse = await res.json();
      setBlogData(data);
      setEditableMarkdown(data.markdown || '');
      setActiveTab('preview');

      // Send Push / System Notification when generation is finished
      notifyBlogGenerationComplete(data.metaTitle || keyword, data.wordCount);

      // If auto-generate images is checked, trigger image generation for placeholders
      if (autoGenerateImages && data.suggestedImages && data.suggestedImages.length > 0) {
        handleBatchGenerateImages(data.suggestedImages);
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      // If offline, register background sync so request can sync when restored
      if (!navigator.onLine) {
        registerBackgroundSync('sync-blog-posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateImage = (updated: ImagePlaceholder) => {
    if (!blogData) return;
    const newImages = (blogData.suggestedImages || []).map((img) =>
      img.id === updated.id || img.placeholderId === updated.placeholderId ? updated : img
    );
    setBlogData({
      ...blogData,
      suggestedImages: newImages
    });
  };

  const handleBatchGenerateImages = async (imagesToProcess?: ImagePlaceholder[]) => {
    const list = imagesToProcess || blogData?.suggestedImages || [];
    if (list.length === 0) return;

    setBatchGeneratingImages(true);
    setBatchProgress({ current: 0, total: list.length });

    const updatedList = [...list];

    for (let i = 0; i < updatedList.length; i++) {
      setBatchProgress({ current: i + 1, total: updatedList.length });
      const img = updatedList[i];
      if (img.generatedUrl) continue; // Already generated

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: img.prompt,
            aspectRatio: img.aspectRatio || '16:9',
            style: imageStyle,
            placementOffset: i
          })
        });

        if (res.ok) {
          const imgData = await res.json();
          if (imgData.image) {
            updatedList[i] = {
              ...img,
              generatedUrl: imgData.image,
              isFallback: !!imgData.isFallback,
              fallbackReason: imgData.fallbackReason
            };
          }
        }
      } catch (e) {
        console.warn('Batch image generation item error:', e);
      }
    }

    if (blogData) {
      setBlogData({
        ...blogData,
        suggestedImages: updatedList
      });
    }

    setBatchGeneratingImages(false);
  };

  const copyToClipboard = (text: string, type: 'md' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'md') {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const downloadMarkdownFile = () => {
    if (!editableMarkdown) return;
    const blob = new Blob([editableMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blogData?.urlSlug || 'seo-blog-post'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateSeoScore = (data: GeneratedBlogResponse | null) => {
    if (!data || !data.markdown) return 0;
    let score = 55;
    if (data.metaTitle && data.metaTitle.length <= 60) score += 10;
    if (data.metaDescription && data.metaDescription.length <= 160) score += 10;
    if (data.markdown.includes('## ')) score += 10;
    if (data.suggestedImages && data.suggestedImages.length >= 2) score += 10;
    if (data.schemaMarkup) score += 5;
    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore(blogData);
  const generatedImageCount = (blogData?.suggestedImages || []).filter((i) => !!i.generatedUrl).length;
  const totalImageCount = blogData?.suggestedImages?.length || 0;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans selection:bg-indigo-100 flex flex-col">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-xl text-white shadow-sm">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-tight">
                SEO Blog Studio
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Online Web Research & AI Visuals Engine</p>
            </div>
          </div>

          {/* Quick Metrics Bar if post is loaded */}
          {blogData && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/70 rounded-full text-xs font-semibold text-slate-700">
                <span className={`w-2 h-2 rounded-full ${seoScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                SEO Score: {seoScore}/100
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/70 rounded-full text-xs font-semibold text-slate-700">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Images: {generatedImageCount}/{totalImageCount}
              </div>
              {enableOnlineResearch && (
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200/70 rounded-full text-xs font-semibold text-emerald-800">
                  <Globe className="w-3.5 h-3.5" />
                  {blogData.groundingFallback ? 'Research Grounded' : 'Live Google Search'}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnableNotifications}
              title={notificationsEnabled ? 'Push notifications active' : 'Enable notifications for background generation'}
              className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                notificationsEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Bell className={`w-4 h-4 ${notificationsEnabled ? 'fill-emerald-500 text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{notificationsEnabled ? 'Alerts On' : 'Alerts'}</span>
            </button>
            {blogData && (
              <button
                onClick={() => {
                  setBlogData(null);
                  setKeyword('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                New Post
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Left Column: Generation Settings & Parameters */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center">
                  <Sliders className="w-4 h-4 text-indigo-600 mr-2" />
                  <h2 className="font-bold text-sm text-slate-800">Generation Controls</h2>
                </div>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                  Gemini 3.7
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Keyword Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Keyword or Topic *
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. 'best electric vehicles 2026'"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm placeholder:text-slate-400 font-medium text-slate-800"
                  />

                  {/* Topic Suggestions */}
                  {!keyword && (
                    <div className="mt-2.5">
                      <span className="text-[11px] font-medium text-slate-400 block mb-1">Try trending topic:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {inspirationKeywords.map((ik, idx) => (
                          <button
                            key={idx}
                            onClick={() => setKeyword(ik)}
                            className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-1 rounded-md transition-colors text-left"
                          >
                            + {ik}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 1: Online Web Research Control */}
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Online Web Research</h4>
                        <p className="text-[11px] text-slate-500">Google Search fact-grounding</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableOnlineResearch}
                        onChange={(e) => setEnableOnlineResearch(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {enableOnlineResearch && (
                    <div className="pt-2 border-t border-indigo-100/80">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Research Depth & Scope:
                      </label>
                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        {(['Standard', 'Deep', 'Recent 2026 Updates'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setResearchDepth(mode)}
                            className={`py-1 px-1.5 rounded-lg font-medium transition-all text-center ${researchDepth === mode ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: Multimedia & Images In Blog Control */}
                <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Add Images in Blogs</h4>
                        <p className="text-[11px] text-slate-500">Insert visuals where needed</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeImages}
                        onChange={(e) => setIncludeImages(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                  </div>

                  {includeImages && (
                    <div className="space-y-2.5 pt-2 border-t border-violet-100/80">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Visual Density & Frequency:
                        </label>
                        <select
                          value={imageDensity}
                          onChange={(e: any) => setImageDensity(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-violet-500 outline-none"
                        >
                          <option>Minimal (Hero only)</option>
                          <option>Standard (Hero + 2-3 visuals)</option>
                          <option>Rich (Visual for every major section)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Image Visual Style:
                        </label>
                        <select
                          value={imageStyle}
                          onChange={(e: any) => setImageStyle(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-violet-500 outline-none"
                        >
                          <option>Photorealistic</option>
                          <option>3D Render / Modern</option>
                          <option>Minimalist Vector Illustration</option>
                          <option>Editorial Photography</option>
                          <option>Infographic / Diagram</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="autoGenCheck"
                          checked={autoGenerateImages}
                          onChange={(e) => setAutoGenerateImages(e.target.checked)}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <label htmlFor="autoGenCheck" className="text-[11px] font-medium text-slate-600 cursor-pointer">
                          Auto-generate all images on creation
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. 'Beginner Creators, Freelancers'"
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Intent & Tone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Intent
                    </label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    >
                      <option>Informational & How-To</option>
                      <option>Commercial Buyer Guide</option>
                      <option>Trend Breakdown & News</option>
                      <option>Ultimate Tutorial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    >
                      <option>Authoritative & Engaging</option>
                      <option>Conversational & Friendly</option>
                      <option>Data-Driven & Analytical</option>
                      <option>Action-Oriented & Direct</option>
                    </select>
                  </div>
                </div>

                {/* Length & Reading Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Article Length</span>
                    </label>
                    <select
                      value={length}
                      onChange={(e: any) => setLength(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    >
                      <option value="Quick Guide (~800 words)">Quick Guide (~800 words)</option>
                      <option value="Standard Blog Post (~1,500 words)">Standard Blog Post (~1,500 words)</option>
                      <option value="In-Depth Authority Guide (~2,500 words)">In-Depth Guide (~2,500 words)</option>
                      <option value="Comprehensive Long-Form (~3,500 words)">Comprehensive Long-Form (~3,500 words)</option>
                      <option value="Ultimate Pillar Deep-Dive (~5,000+ words)">Ultimate Pillar Deep-Dive (~5,000+ words)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Reading Level
                    </label>
                    <select
                      value={readingLevel}
                      onChange={(e) => setReadingLevel(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-medium text-slate-800"
                    >
                      <option>Grade 8 (High Readability)</option>
                      <option>Grade 10</option>
                      <option>College / Professional</option>
                    </select>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start text-xs text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {enableOnlineResearch ? 'Conducting Web Research & Writing...' : 'Synthesizing SEO Blog...'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Generate SEO Blog Post
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* SEO Optimization Checklist */}
            {blogData && (
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BarChart className="w-4 h-4 text-indigo-600" /> SEO Ranking Factors
                  </h3>
                  <span className="text-xs font-bold text-emerald-600">{seoScore}/100</span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>CTR Meta Tags & URL Slug</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>E-E-A-T Checklist & FAQ Snippets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{blogData.suggestedImages?.length || 0} In-Article Image Placements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Structured JSON-LD Schema</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Tabbed Workspace */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 flex-1 flex flex-col overflow-hidden min-h-[750px]">

              {/* Workspace Navigation Toolbar */}
              <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                {/* Navigation Tabs */}
                <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Article Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'images' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
                    Images & Visuals ({totalImageCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('research')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'research' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    Online Research
                  </button>
                  <button
                    onClick={() => setActiveTab('seo')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'seo' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    SEO & SERP
                  </button>
                  <button
                    onClick={() => setActiveTab('markdown')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'markdown' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    Markdown Editor
                  </button>
                </div>

                {/* Actions (Image Batch, Export, Copy) */}
                {blogData && (
                  <div className="flex items-center flex-wrap gap-2">
                    {/* Batch Generate All Images */}
                    {totalImageCount > 0 && generatedImageCount < totalImageCount && (
                      <button
                        onClick={() => handleBatchGenerateImages()}
                        disabled={batchGeneratingImages}
                        className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {batchGeneratingImages ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating {batchProgress.current}/{batchProgress.total}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>Generate All Images ({totalImageCount})</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => copyToClipboard(editableMarkdown, 'md')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                      title="Copy Markdown Content"
                    >
                      {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedMd ? 'Copied' : 'Copy MD'}
                    </button>

                    <button
                      onClick={downloadMarkdownFile}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all shadow-xs"
                      title="Download Markdown (.md)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport Content */}
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
                {!blogData && !loading && (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                      <LayoutTemplate className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 mb-1.5">
                      Ready to Generate High-CTR SEO Content
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                      Enter your topic or keyword, enable live Google Search research, and customize image placement options to craft ranking-ready blog articles.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-left">
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-700">
                          <Globe className="w-4 h-4 text-indigo-600" /> Live Web Research
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Researches recent 2026 statistics, benchmarks, and authority sources.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-1 text-xs font-bold text-slate-700">
                          <ImageIcon className="w-4 h-4 text-violet-600" /> Contextual Visuals
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Strategically places hero banners and in-article diagrams where images are needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">
                      {enableOnlineResearch ? 'Conducting Deep Web Research & Synthesizing Post...' : 'Generating Optimized SEO Blog...'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Formulating E-E-A-T sections, placing multimedia visuals, structuring metadata, and optimizing schema.
                    </p>
                  </div>
                )}

                {blogData && !loading && (
                  <>
                    {activeTab === 'preview' && (
                      <BlogPreview
                        markdown={editableMarkdown}
                        suggestedImages={blogData.suggestedImages || []}
                        onUpdateImage={handleUpdateImage}
                        wordCount={blogData.wordCount}
                        readingTimeMinutes={blogData.readingTimeMinutes}
                      />
                    )}

                    {activeTab === 'images' && (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-violet-50/50 border border-violet-100">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-violet-600" />
                              In-Article Visuals & Media Manager ({blogData.suggestedImages?.length || 0})
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Customize, replace, or regenerate every visual individually using curated photos, AI prompts, custom URLs, or file uploads.
                            </p>
                          </div>

                          {totalImageCount > 0 && generatedImageCount < totalImageCount && (
                            <button
                              onClick={() => handleBatchGenerateImages()}
                              disabled={batchGeneratingImages}
                              className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Generate All Visuals
                            </button>
                          )}
                        </div>

                        <div className="space-y-6">
                          {(blogData.suggestedImages || []).map((img, idx) => (
                            <div key={img.id || idx} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                                  #{idx + 1} &bull; {img.placement === 'hero' ? 'Hero Banner' : `Section Visual (${img.placeholderId || 'Contextual'})`}
                                </span>
                                <span className="text-xs font-medium text-slate-400 font-mono">
                                  Ratio: {img.aspectRatio || '16:9'}
                                </span>
                              </div>
                              <ImageBlock image={img} onUpdateImage={handleUpdateImage} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'research' && (
                      <ResearchSources
                        sources={blogData.groundingSources || []}
                        summary={blogData.researchSummary}
                        groundingFallback={blogData.groundingFallback}
                        keyword={blogData.focusKeyword || keyword}
                      />
                    )}

                    {activeTab === 'seo' && (
                      <SeoMetadataPanel
                        metaTitle={blogData.metaTitle}
                        metaDescription={blogData.metaDescription}
                        urlSlug={blogData.urlSlug}
                        focusKeyword={blogData.focusKeyword}
                        lsiKeywords={blogData.lsiKeywords}
                        schemaMarkup={blogData.schemaMarkup}
                      />
                    )}

                    {activeTab === 'markdown' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Raw Markdown (Editable)
                          </span>
                          <span className="text-xs text-slate-400">
                            Updates reflect in real-time
                          </span>
                        </div>
                        <textarea
                          value={editableMarkdown}
                          onChange={(e) => setEditableMarkdown(e.target.value)}
                          rows={24}
                          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
