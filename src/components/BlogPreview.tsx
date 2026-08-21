import React, { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import { DollarSign, Copy, Check, Eye, Code, ListFilter, Sparkles, BookOpen, Clock, Layers } from 'lucide-react';
import ImageBlock from './ImageBlock';
import { ImagePlaceholder } from '../types';

interface BlogPreviewProps {
  markdown: string;
  suggestedImages: ImagePlaceholder[];
  onUpdateImage: (updated: ImagePlaceholder) => void;
  wordCount?: number;
  readingTimeMinutes?: number;
}

export default function BlogPreview({
  markdown,
  suggestedImages = [],
  onUpdateImage,
  wordCount,
  readingTimeMinutes
}: BlogPreviewProps) {
  const [showAdPreviews, setShowAdPreviews] = useState(true);
  const [copiedAdIndex, setCopiedAdIndex] = useState<number | null>(null);

  // Extract table of contents from markdown headers
  const tableOfContents = useMemo(() => {
    const lines = markdown.split('\n');
    const headings: { text: string; level: number; id: string }[] = [];
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_`]/g, '').trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headings.push({ text, level, id });
      }
    });
    return headings;
  }, [markdown]);

  const copyAdCode = (index: number) => {
    const code = `<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;
    navigator.clipboard.writeText(code);
    setCopiedAdIndex(index);
    setTimeout(() => setCopiedAdIndex(null), 2000);
  };

  // Custom Markdown Component Renderers
  const customComponents = {
    // Custom Image handler
    img: (props: any) => {
      const { alt, src } = props;
      const cleanAlt = alt || '';
      const cleanSrc = src || '';

      // Check if this matches a suggested image
      const foundImage = suggestedImages.find((img) =>
        img.placeholderId === cleanSrc ||
        cleanAlt.toLowerCase().includes('image_prompt') ||
        cleanSrc.toLowerCase().includes('hero') ||
        cleanSrc.toLowerCase().includes('section') ||
        img.prompt === cleanAlt ||
        img.id === cleanSrc
      );

      if (foundImage) {
        return <ImageBlock image={foundImage} onUpdateImage={onUpdateImage} />;
      }

      // If alt indicates image prompt
      if (cleanAlt.toLowerCase().includes('image_prompt') || cleanSrc.toLowerCase().includes('image_prompt')) {
        const fallbackImage: ImagePlaceholder = {
          id: `img-${Math.random().toString(36).substring(2, 7)}`,
          placeholderId: cleanSrc || 'article-visual',
          prompt: cleanAlt.replace(/image_prompt(_hero|_section)?:\s*/i, '').trim() || cleanSrc,
          altText: cleanSrc || 'Visual Illustration',
          placement: cleanSrc.includes('hero') ? 'hero' : 'section',
          aspectRatio: cleanSrc.includes('hero') ? '16:9' : '4:3',
          generatedUrl: undefined
        };
        return <ImageBlock image={fallbackImage} onUpdateImage={onUpdateImage} />;
      }

      // Default standard image
      return (
        <div className="my-6">
          <img
            src={cleanSrc}
            alt={cleanAlt}
            referrerPolicy="no-referrer"
            className="w-full rounded-2xl border border-slate-200/80 shadow-sm"
          />
          {cleanAlt && <p className="text-xs text-center text-slate-500 mt-2 italic">{cleanAlt}</p>}
        </div>
      );
    },

    // Custom Paragraph to intercept AdSense Placeholders & prevent invalid <p> nesting with <div>
    p: ({ children }: any) => {
      const text = typeof children === 'string' ? children : '';

      if (text.includes('[AdSense') || text.includes('[Google AdSense') || text.includes('[Ad Placement')) {
        const adLabel = text.replace(/[\[\]]/g, '');
        return (
          <div className="my-8 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 sm:p-5 transition-all">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <DollarSign className="w-4 h-4" />
                </span>
                <div>
                  <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider">{adLabel}</h5>
                  <p className="text-[11px] text-amber-700">Monetization Ad Placement Slot</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAdPreviews(!showAdPreviews)}
                  className="px-2.5 py-1 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showAdPreviews ? 'Hide Visual' : 'Show Banner'}
                </button>
                <button
                  onClick={() => copyAdCode(Math.floor(Math.random() * 1000))}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                >
                  {copiedAdIndex !== null ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                  {copiedAdIndex !== null ? 'Code Copied' : 'Get Responsive Ad Unit'}
                </button>
              </div>
            </div>

            {showAdPreviews && (
              <div className="w-full py-8 px-4 rounded-xl bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/60 border border-amber-200 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1">Advertisement</span>
                <span className="text-sm font-semibold text-amber-800">Responsive High-CTR Display Banner (728x90 / Auto)</span>
                <span className="text-xs text-amber-600 mt-1">Google AdSense Auto-Optimized In-Feed Placement</span>
              </div>
            )}
          </div>
        );
      }

      return <div className="leading-relaxed text-slate-700 mb-4">{children}</div>;
    },

    // Custom Blockquote styling
    blockquote: ({ children }: any) => (
      <blockquote className="my-6 border-l-4 border-indigo-500 bg-indigo-50/40 p-4 sm:p-5 rounded-r-2xl italic text-slate-800 shadow-xs font-serif text-base leading-relaxed">
        {children}
      </blockquote>
    ),

    // Custom Table styling
    table: ({ children }: any) => (
      <div className="my-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
        <table className="w-full border-collapse bg-white text-left text-xs sm:text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-100 text-slate-700 font-semibold">{children}</thead>,
    th: ({ children }: any) => <th className="p-3.5 border-b border-slate-200">{children}</th>,
    td: ({ children }: any) => <td className="p-3.5 border-b border-slate-100 text-slate-600">{children}</td>,
  };

  return (
    <div className="space-y-8">
      {/* Blog Article Meta Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 border border-indigo-100/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>{wordCount || 1200} words</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>{readingTimeMinutes || 6} min read</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>{suggestedImages.length} Visual Placements</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            SEO Ready
          </span>
        </div>
      </div>

      {/* Table of Contents (if more than 2 headers) */}
      {tableOfContents.length >= 2 && (
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ListFilter className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Table of Contents</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {tableOfContents.map((h, i) => (
              <div key={i} className={`flex items-center gap-2 ${h.level === 3 ? 'pl-4 text-slate-500' : 'font-medium text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="truncate">{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered Markdown Body */}
      <div className="prose prose-slate prose-indigo lg:prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg sm:prose-h3:text-xl prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700">
        <Markdown components={customComponents}>
          {markdown}
        </Markdown>
      </div>
    </div>
  );
}
