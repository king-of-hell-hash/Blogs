import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Settings, Play, Copy, FileCode2, Share2, Check, AlertCircle, BarChart, LayoutTemplate } from 'lucide-react';

export default function Dashboard() {
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [intent, setIntent] = useState('Informational');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [readingLevel, setReadingLevel] = useState('Grade 8');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview');
  
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleGenerate = async () => {
    if (!keyword) {
      setError("Please enter a target keyword.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedContent('');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, audience, intent, tone, length, readingLevel }),
      });
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = 'Failed to generate content';
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // If we receive an HTML error page (e.g. 404 or 502), extract a snippet
          const textData = await res.text();
          errorMessage = `Server Error (${res.status}): ${textData.replace(/<[^>]+>/g, ' ').substring(0, 100).trim()}...`;
        }
        
        throw new Error(errorMessage);
      }
      
      const contentType = res.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server on successful status code.");
      }
      
      const data = await res.json();
      setGeneratedContent(data.content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  const calculateSeoScore = (text: string) => {
    if (!text) return 0;
    let score = 50; // base score
    if (text.includes('# ')) score += 10;
    if (text.includes('## ')) score += 10;
    if (text.length > 500) score += 10;
    if (text.length > 2000) score += 10;
    if (keyword && text.toLowerCase().includes(keyword.toLowerCase())) score += 10;
    return Math.min(score, 100);
  };

  const seoScore = calculateSeoScore(generatedContent);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <LayoutTemplate className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              SEO Blog Engine
            </h1>
          </div>
          <div className="flex items-center text-sm font-medium text-slate-500">
            <BarChart className="w-4 h-4 mr-1.5" />
            Control Panel
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Controls */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
                <Settings className="w-4 h-4 text-slate-400 mr-2" />
                <h2 className="font-semibold text-slate-700">Generation Settings</h2>
              </div>
              
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Target Keyword *
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g., 'best hiking boots 2024'"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., 'Beginner hikers'"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Content Intent
                    </label>
                    <select
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
                    >
                      <option>Informational</option>
                      <option>Transactional</option>
                      <option>How-To</option>
                      <option>Viral News</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Tone
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
                    >
                      <option>Professional</option>
                      <option>Storytelling</option>
                      <option>Clickbait/Viral</option>
                      <option>Academic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Article Length
                    </label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
                    >
                      <option>Short (~800)</option>
                      <option>Medium (~1200)</option>
                      <option>Long-Form (~2000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Reading Level
                    </label>
                    <select
                      value={readingLevel}
                      onChange={(e) => setReadingLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
                    >
                      <option>Grade 6</option>
                      <option>Grade 8</option>
                      <option>College</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Generate SEO Post
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* SEO Score Card (Mocked based on length and keywords) */}
            {generatedContent && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-700 flex items-center">
                    <BarChart className="w-4 h-4 mr-2 text-indigo-500" />
                    SEO Score
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Optimization</span>
                    <span className={`text-sm font-bold ${seoScore > 80 ? 'text-green-600' : seoScore > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {seoScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${seoScore > 80 ? 'bg-green-500' : seoScore > 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${seoScore}%` }}
                    ></div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-green-500" /> Meta tags generated
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-green-500" /> Target keyword present
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-green-500" /> Semantic HTML structure
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 mr-2 text-green-500" /> E-E-A-T signals included
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-8rem)]">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
              
              {/* Toolbar */}
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex space-x-1 p-1 bg-slate-200/60 rounded-lg">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'}`}
                  >
                    HTML Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('markdown')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'markdown' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'}`}
                  >
                    Markdown
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => copyToClipboard(generatedContent, 'md')}
                    disabled={!generatedContent}
                    className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded transition-colors disabled:opacity-50 flex items-center text-xs font-medium"
                    title="Copy Markdown"
                  >
                    {copiedMd ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <FileCode2 className="w-4 h-4 mr-1" />}
                    <span className="hidden sm:inline">Copy MD</span>
                  </button>
                  
                  {/* Pseudo HTML copy */}
                  <button 
                    onClick={() => copyToClipboard(generatedContent, 'html')}
                    disabled={!generatedContent}
                    className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded transition-colors disabled:opacity-50 flex items-center text-xs font-medium"
                    title="Copy HTML"
                  >
                    {copiedHtml ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    <span className="hidden sm:inline">Copy HTML</span>
                  </button>

                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  
                  <button 
                    disabled={!generatedContent}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Export
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                {!generatedContent && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <LayoutTemplate className="w-12 h-12 mb-3 text-slate-200" />
                    <p>Enter parameters and click generate to create SEO content.</p>
                  </div>
                )}
                
                {loading && (
                  <div className="h-full flex flex-col items-center justify-center text-indigo-500">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="font-medium animate-pulse">Researching & writing optimized content...</p>
                  </div>
                )}
                
                {generatedContent && !loading && (
                  activeTab === 'preview' ? (
                    <div className="prose prose-slate prose-indigo max-w-none">
                      <Markdown>{generatedContent}</Markdown>
                    </div>
                  ) : (
                    <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap">
                      {generatedContent}
                    </pre>
                  )
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
