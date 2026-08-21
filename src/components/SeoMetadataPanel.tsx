import React, { useState } from 'react';
import { Copy, Check, Search, Code, Tag, ExternalLink, Globe, Smartphone, Monitor } from 'lucide-react';

interface SeoMetadataPanelProps {
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  focusKeyword: string;
  lsiKeywords: string[];
  schemaMarkup: string;
}

export default function SeoMetadataPanel({
  metaTitle,
  metaDescription,
  urlSlug,
  focusKeyword,
  lsiKeywords = [],
  schemaMarkup
}: SeoMetadataPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const copyText = (text: string, type: 'schema' | 'title' | 'desc') => {
    navigator.clipboard.writeText(text);
    if (type === 'schema') {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } else if (type === 'title') {
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } else {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    }
  };

  const titleLength = metaTitle?.length || 0;
  const descLength = metaDescription?.length || 0;

  return (
    <div className="space-y-6">
      {/* Google SERP Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-800">Google SERP Snippet Preview</h3>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setDevice('desktop')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${device === 'desktop' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${device === 'mobile' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
        </div>

        {/* Live Snippet Box */}
        <div className={`p-4 sm:p-5 rounded-xl border border-slate-200 bg-white font-sans ${device === 'mobile' ? 'max-w-md mx-auto shadow-sm' : 'w-full'}`}>
          <div className="flex items-center gap-2 text-xs text-slate-700 mb-1">
            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
              G
            </div>
            <span className="text-slate-800 font-medium">yourdomain.com</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-500 truncate">{urlSlug || 'article-slug'}</span>
          </div>

          <h4 className="text-blue-800 hover:underline cursor-pointer text-lg font-medium leading-snug line-clamp-2 mt-1">
            {metaTitle || 'Meta Title Not Set'}
          </h4>

          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
            {metaDescription || 'Meta description will be displayed here as it appears in Google search engine result pages.'}
          </p>
        </div>

        {/* Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600">Title Length</span>
              <span className={`text-xs font-bold ${titleLength >= 40 && titleLength <= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {titleLength} / 60 chars
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${titleLength <= 60 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (titleLength / 60) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600">Description Length</span>
              <span className={`text-xs font-bold ${descLength >= 120 && descLength <= 160 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {descLength} / 160 chars
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${descLength <= 160 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (descLength / 160) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Keywords Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-slate-800">Target & Semantic (LSI) Keywords</h3>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Focus Keyword</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              {focusKeyword}
            </span>
          </div>

          {lsiKeywords.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">LSI / Semantic Cluster</span>
              <div className="flex flex-wrap gap-2">
                {lsiKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schema JSON-LD */}
      {schemaMarkup && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-sm text-slate-800">JSON-LD Structured Schema Markup</h3>
            </div>
            <button
              onClick={() => copyText(schemaMarkup, 'schema')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSchema ? 'Copied' : 'Copy JSON-LD'}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
            {schemaMarkup}
          </pre>
        </div>
      )}
    </div>
  );
}
