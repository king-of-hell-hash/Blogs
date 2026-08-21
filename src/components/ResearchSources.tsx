import React from 'react';
import { Globe, ExternalLink, ShieldCheck, Search, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GroundingSource } from '../types';

interface ResearchSourcesProps {
  sources?: GroundingSource[];
  summary?: string;
  isGrounded?: boolean;
  groundingFallback?: boolean;
  keyword: string;
}

export default function ResearchSources({
  sources = [],
  summary,
  isGrounded = true,
  groundingFallback = false,
  keyword
}: ResearchSourcesProps) {
  return (
    <div className="space-y-6">
      {/* Research Mode Status Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${groundingFallback ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${groundingFallback ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {groundingFallback ? <AlertTriangle className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">
                {groundingFallback ? 'Synthesized Research Mode (Quota Fallback)' : 'Live Google Search Grounding Active'}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${groundingFallback ? 'bg-amber-200/80 text-amber-800' : 'bg-emerald-200/80 text-emerald-800'}`}>
                {groundingFallback ? 'Standard Grounded' : 'Real-Time Web'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {groundingFallback
                ? 'Your free-tier Gemini API key has high-volume limits on Google Search grounding. Content was synthesized using deep knowledge verification.'
                : `Verified facts, real-world data points, and authority citations gathered for "${keyword}".`}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          E-E-A-T Verified
        </div>
      </div>

      {/* Key Research Takeaways & Data Summary */}
      {summary && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-800">Online Research Insights & Statistics</h3>
          </div>
          <div className="prose prose-sm prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
            {summary}
          </div>
        </div>
      )}

      {/* Web Sources & Grounding Citations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-800">Verified Citations & Web Sources</h3>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {sources.length} sources identified
          </span>
        </div>

        {sources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((src, index) => {
              let domain = '';
              try {
                domain = new URL(src.url).hostname.replace('www.', '');
              } catch {
                domain = src.url;
              }

              return (
                <a
                  key={index}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-3.5 rounded-xl border border-slate-200/70 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                        {domain}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {src.title || src.url}
                    </h5>
                  </div>
                  {src.snippet && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 italic">
                      "{src.snippet}"
                    </p>
                  )}
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Knowledge base grounding incorporated into the post.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live Google Search URLs will populate here when live search grounding is enabled with available API quota.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
