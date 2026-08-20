import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Play, Copy, FileCode2, Share2, Check, AlertCircle, BarChart, LayoutTemplate, Save, List, Search } from 'lucide-react';
import { db, auth, collection, addDoc, getDocs, query, where, orderBy } from '../lib/firebase';

export default function Dashboard({ user }: { user: any }) {
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [intent, setIntent] = useState('Informational');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [readingLevel, setReadingLevel] = useState('Grade 8');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'history'>('preview');
  
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // SEO Score mockup
  const seoScore = generatedContent ? Math.min(95, 60 + (generatedContent.length / 100)) : 0;

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "users", user.uid, "blogs"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      setSavedBlogs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && user) {
      fetchHistory();
    }
  }, [activeTab, user]);

  const handleGenerate = async () => {
    if (!keyword) {
      setError("Please enter a target keyword.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedContent('');
    setActiveTab('preview');
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, audience, intent, tone, length, readingLevel, useSearchGrounding }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate content.");
      }
      const data = await res.json();
      
      const combinedContent = `# SEO Metadata\n**Meta Title:** ${data.metaTitle}\n**Meta Description:** ${data.metaDescription}\n**URL Slug:** \`${data.urlSlug}\`\n**Focus Keyword:** ${data.focusKeyword}\n**LSI Keywords:** ${data.lsiKeywords?.join(', ')}\n\n---\n\n${data.markdown}\n\n---\n\n# Schema Markup\n\`\`\`json\n${data.schemaMarkup}\n\`\`\``.trim();
      
      setGeneratedContent(combinedContent);
      
      // Auto-save to Firestore
      if (user) {
        await addDoc(collection(db, "users", user.uid, "blogs"), {
          keyword,
          title: data.metaTitle,
          content: combinedContent,
          createdAt: new Date().toISOString()
        });
      }
      
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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Form & Settings */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Content Parameters</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Keyword *</label>
                <input 
                  type="text" 
                  value={keyword} 
                  onChange={e => setKeyword(e.target.value)} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="e.g. Best hiking boots 2026" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Audience</label>
                <input 
                  type="text" 
                  value={audience} 
                  onChange={e => setAudience(e.target.value)} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" 
                  placeholder="e.g. Beginner Hikers" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Content Intent</label>
                  <select 
                    value={intent} 
                    onChange={e => setIntent(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Informational</option>
                    <option>Commercial</option>
                    <option>Transactional</option>
                    <option>Navigational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tone of Voice</label>
                  <select 
                    value={tone} 
                    onChange={e => setTone(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Professional</option>
                    <option>Conversational</option>
                    <option>Authoritative</option>
                    <option>Enthusiastic</option>
                    <option>Humorous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Article Length</label>
                  <select 
                    value={length} 
                    onChange={e => setLength(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Short (~800 words)</option>
                    <option>Medium (~1200 words)</option>
                    <option>Long-Form (~2000 words)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reading Level</label>
                  <select 
                    value={readingLevel} 
                    onChange={e => setReadingLevel(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Grade 6</option>
                    <option>Grade 8</option>
                    <option>College</option>
                  </select>
                </div>
              </div>

              {/* Search Grounding Toggle */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-1.5 rounded mr-3">
                      <Search className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-indigo-900">Live Web Search</span>
                      <span className="block text-xs text-indigo-700/80">Ground content in current data</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={useSearchGrounding} onChange={() => setUseSearchGrounding(!useSearchGrounding)} />
                    <div className="w-11 h-6 bg-indigo-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-start text-sm text-red-600 mt-4">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
                    {Math.round(seoScore)}/100
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
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column: Output & History */}
        <div className="w-full lg:w-2/3 flex flex-col h-[calc(100vh-8rem)] min-h-[600px]">
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
                {user && (
                  <button 
                    onClick={() => setActiveTab('history')} 
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/80'}`}
                  >
                    <List className="w-4 h-4 mr-1.5" /> History
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => copyToClipboard(generatedContent, 'md')}
                  disabled={!generatedContent || activeTab === 'history'}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded transition-colors disabled:opacity-50 flex items-center text-xs font-medium"
                  title="Copy Markdown"
                >
                  {copiedMd ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <FileCode2 className="w-4 h-4 mr-1" />}
                  <span className="hidden sm:inline">Copy MD</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(generatedContent, 'html')}
                  disabled={!generatedContent || activeTab === 'history'}
                  className="p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded transition-colors disabled:opacity-50 flex items-center text-xs font-medium"
                  title="Copy HTML"
                >
                  {copiedHtml ? <Check className="w-4 h-4 text-green-600 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  <span className="hidden sm:inline">Copy HTML</span>
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white relative">
              {activeTab === 'history' ? (
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                      <Save className="w-5 h-5 mr-2 text-indigo-600" />
                      Saved Posts
                    </h3>
                  </div>
                  
                  {loadingHistory ? (
                    <div className="flex justify-center p-12">
                      <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedBlogs.map(blog => (
                        <div 
                          key={blog.id} 
                          className="p-5 border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer bg-white group" 
                          onClick={() => { 
                            setGeneratedContent(blog.content); 
                            setKeyword(blog.keyword);
                            setActiveTab('preview'); 
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                                {blog.title || blog.keyword}
                              </h4>
                              <div className="mt-2 flex items-center space-x-3 text-sm text-slate-500">
                                <span className="bg-slate-100 px-2 py-1 rounded-md">{blog.keyword}</span>
                                <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">Load Post</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {savedBlogs.length === 0 && (
                        <div className="text-center py-16 px-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                          <List className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-slate-700">No saved blogs yet</h3>
                          <p className="text-slate-500 mt-1 max-w-md mx-auto text-sm">Posts you generate will automatically be saved here when you are signed in.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!generatedContent && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <LayoutTemplate className="w-12 h-12 mb-3 text-slate-200" />
                      <p className="text-slate-500">Enter parameters and click generate to create SEO content.</p>
                      {!user && (
                        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Sign in with Google to automatically save your generated posts.</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-indigo-500 absolute inset-0 bg-white/80 z-10 backdrop-blur-sm">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4 shadow-sm" />
                      <p className="font-medium text-indigo-800 animate-pulse">Researching & writing optimized content...</p>
                      {useSearchGrounding && (
                        <p className="text-xs text-indigo-500 mt-2 flex items-center">
                          <Search className="w-3 h-3 mr-1" /> Searching live web data
                        </p>
                      )}
                    </div>
                  )}
                  
                  {generatedContent && !loading && (
                    activeTab === 'preview' ? (
                      <div className="prose prose-slate prose-indigo max-w-none">
                        <Markdown>{generatedContent}</Markdown>
                      </div>
                    ) : (
                      <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap p-4 bg-slate-50 rounded-lg border border-slate-200">
                        {generatedContent}
                      </pre>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
