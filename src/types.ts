export interface ImagePlaceholder {
  id: string;
  placeholderId: string;
  prompt: string;
  altText: string;
  caption?: string;
  placement: 'hero' | 'section' | 'diagram' | 'comparison' | 'conclusion';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  generatedUrl?: string;
  isGenerating?: boolean;
  error?: string;
  isFallback?: boolean;
  fallbackReason?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GeneratedBlogResponse {
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  focusKeyword: string;
  lsiKeywords: string[];
  markdown: string;
  schemaMarkup: string;
  suggestedImages: ImagePlaceholder[];
  groundingSources?: GroundingSource[];
  researchSummary?: string;
  groundingFallback?: boolean;
  wordCount?: number;
  readingTimeMinutes?: number;
}

export type ArticleLengthOption = 
  | 'Quick Guide (~800 words)'
  | 'Standard Blog Post (~1,500 words)'
  | 'In-Depth Authority Guide (~2,500 words)'
  | 'Comprehensive Long-Form (~3,500 words)'
  | 'Ultimate Pillar Deep-Dive (~5,000+ words)';

export interface GenerateBlogRequest {
  keyword: string;
  audience?: string;
  intent?: string;
  tone?: string;
  length?: ArticleLengthOption;
  readingLevel?: string;
  enableOnlineResearch?: boolean;
  researchDepth?: 'Standard' | 'Deep' | 'Recent 2026 Updates';
  includeImages?: boolean;
  imageDensity?: 'Minimal (Hero only)' | 'Standard (Hero + 2-3 visuals)' | 'Rich (Visual for every major section)';
  imageStyle?: 'Photorealistic' | '3D Render / Modern' | 'Minimalist Vector Illustration' | 'Editorial Photography' | 'Infographic / Diagram';
  autoGenerateImages?: boolean;
}
