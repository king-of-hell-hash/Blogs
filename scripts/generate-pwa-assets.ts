import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// 1. Generate App Icon SVG
function getIconSvg(size: number, isMaskable: boolean = false): string {
  const padding = isMaskable ? size * 0.15 : size * 0.08;
  const innerSize = size - padding * 2;
  const cornerRadius = isMaskable ? 0 : size * 0.22;

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4c1d95" />
        <stop offset="50%" stop-color="#6d28d9" />
        <stop offset="100%" stop-color="#4338ca" />
      </linearGradient>
      <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#f59e0b" />
      </linearGradient>
      <linearGradient id="penGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e0e7ff" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${size * 0.02}" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#0f172a" flood-opacity="0.35"/>
      </filter>
    </defs>

    <!-- Background Base -->
    <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bgGrad)" />

    <!-- Subtle Background Grid/Pattern -->
    <circle cx="${size * 0.8}" cy="${size * 0.2}" r="${size * 0.35}" fill="#ffffff" fill-opacity="0.06" />
    <circle cx="${size * 0.2}" cy="${size * 0.8}" r="${size * 0.25}" fill="#000000" fill-opacity="0.12" />

    <!-- Icon Core Graphics Group -->
    <g transform="translate(${padding}, ${padding})" filter="url(#shadow)">
      <!-- Main Quill / Pen Body -->
      <path d="
        M ${innerSize * 0.72} ${innerSize * 0.18}
        C ${innerSize * 0.78} ${innerSize * 0.12}, ${innerSize * 0.88} ${innerSize * 0.22}, ${innerSize * 0.82} ${innerSize * 0.28}
        L ${innerSize * 0.44} ${innerSize * 0.66}
        L ${innerSize * 0.28} ${innerSize * 0.72}
        L ${innerSize * 0.34} ${innerSize * 0.56}
        Z
      " fill="url(#penGrad)" />

      <!-- Nib Tip Detail -->
      <polygon points="
        ${innerSize * 0.28},${innerSize * 0.72} 
        ${innerSize * 0.34},${innerSize * 0.66} 
        ${innerSize * 0.38},${innerSize * 0.70}
      " fill="#312e81" />

      <!-- Nib Split Line -->
      <line x1="${innerSize * 0.28}" y1="${innerSize * 0.72}" x2="${innerSize * 0.40}" y2="${innerSize * 0.60}" stroke="#6366f1" stroke-width="${innerSize * 0.025}" stroke-linecap="round" />

      <!-- SEO Chart Bars Underneath -->
      <rect x="${innerSize * 0.18}" y="${innerSize * 0.64}" width="${innerSize * 0.09}" height="${innerSize * 0.18}" rx="${innerSize * 0.02}" fill="#a78bfa" fill-opacity="0.9" />
      <rect x="${innerSize * 0.32}" y="${innerSize * 0.52}" width="${innerSize * 0.09}" height="${innerSize * 0.30}" rx="${innerSize * 0.02}" fill="#c4b5fd" fill-opacity="0.9" />
      <rect x="${innerSize * 0.46}" y="${innerSize * 0.38}" width="${innerSize * 0.09}" height="${innerSize * 0.44}" rx="${innerSize * 0.02}" fill="#ddd6fe" fill-opacity="0.95" />
      <rect x="${innerSize * 0.60}" y="${innerSize * 0.24}" width="${innerSize * 0.09}" height="${innerSize * 0.58}" rx="${innerSize * 0.02}" fill="#ffffff" />

      <!-- AI Sparkle 1 (Large) -->
      <path d="
        M ${innerSize * 0.75} ${innerSize * 0.58}
        Q ${innerSize * 0.75} ${innerSize * 0.68} ${innerSize * 0.85} ${innerSize * 0.68}
        Q ${innerSize * 0.75} ${innerSize * 0.68} ${innerSize * 0.75} ${innerSize * 0.78}
        Q ${innerSize * 0.75} ${innerSize * 0.68} ${innerSize * 0.65} ${innerSize * 0.68}
        Q ${innerSize * 0.75} ${innerSize * 0.68} ${innerSize * 0.75} ${innerSize * 0.58}
        Z
      " fill="url(#sparkleGrad)" filter="url(#glow)" />

      <!-- AI Sparkle 2 (Small) -->
      <path d="
        M ${innerSize * 0.24} ${innerSize * 0.28}
        Q ${innerSize * 0.24} ${innerSize * 0.34} ${innerSize * 0.30} ${innerSize * 0.34}
        Q ${innerSize * 0.24} ${innerSize * 0.34} ${innerSize * 0.24} ${innerSize * 0.40}
        Q ${innerSize * 0.24} ${innerSize * 0.34} ${innerSize * 0.18} ${innerSize * 0.34}
        Q ${innerSize * 0.24} ${innerSize * 0.34} ${innerSize * 0.24} ${innerSize * 0.28}
        Z
      " fill="url(#sparkleGrad)" />
    </g>
  </svg>
  `;
}

// 2. Generate Desktop Screenshot SVG (1280x720)
function getDesktopScreenshotSvg(): string {
  return `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="deskBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#4c1d95" />
        <stop offset="100%" stop-color="#6d28d9" />
      </linearGradient>
      <linearGradient id="accentBtn" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c3aed" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#f8fafc" />
      </linearGradient>
      <filter id="deskShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.12" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="1280" height="720" fill="url(#deskBg)" />

    <!-- App Window Container -->
    <g transform="translate(40, 30)" filter="url(#deskShadow)">
      <!-- Window Chrome Frame -->
      <rect width="1200" height="660" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      
      <!-- Top Navigation Header -->
      <path d="M 0 16 Q 0 0 16 0 L 1184 0 Q 1200 0 1200 16 L 1200 68 L 0 68 Z" fill="#ffffff" />
      <line x1="0" y1="68" x2="1200" y2="68" stroke="#e2e8f0" stroke-width="1" />

      <!-- Window Dot Controls -->
      <circle cx="28" cy="34" r="6" fill="#ef4444" />
      <circle cx="48" cy="34" r="6" fill="#f59e0b" />
      <circle cx="68" cy="34" r="6" fill="#10b981" />

      <!-- App Logo & Title in Header -->
      <rect x="100" y="18" width="34" height="34" rx="8" fill="url(#accentBtn)" />
      <text x="146" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#0f172a">SEO Blog Studio</text>
      <text x="300" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#7c3aed" letter-spacing="1">AI RESEARCH &amp; VISUALS</text>

      <!-- Header Search / URL Pill -->
      <rect x="520" y="18" width="380" height="34" rx="17" fill="#f1f5f9" stroke="#e2e8f0" />
      <text x="540" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#64748b">https://seoblogstudio.app/generator</text>

      <!-- Action Button -->
      <rect x="1030" y="17" width="140" height="36" rx="10" fill="url(#accentBtn)" />
      <text x="1055" y="39" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#ffffff">+ New Post</text>

      <!-- Main Layout Body -->
      <!-- Left Sidebar: Controls & Research Setup -->
      <rect x="0" y="68" width="340" height="592" fill="#f8fafc" />
      <line x1="340" y1="68" x2="340" y2="660" stroke="#e2e8f0" stroke-width="1" />

      <!-- Sidebar Form Elements -->
      <text x="24" y="105" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#1e293b">Target Topic &amp; Keywords</text>
      
      <!-- Input 1 -->
      <rect x="24" y="120" width="292" height="42" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <text x="38" y="146" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#0f172a">Future of Solar Energy 2026</text>

      <!-- Keyword Tags -->
      <text x="24" y="190" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#475569">Target SEO Keywords</text>
      <rect x="24" y="202" width="110" height="26" rx="13" fill="#ede9fe" />
      <text x="36" y="219" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#6d28d9">#perovskite</text>
      
      <rect x="142" y="202" width="130" height="26" rx="13" fill="#ede9fe" />
      <text x="154" y="219" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#6d28d9">#clean-energy</text>

      <!-- Web Grounding Toggle -->
      <rect x="24" y="248" width="292" height="52" rx="10" fill="#ffffff" stroke="#e2e8f0" />
      <circle cx="48" cy="274" r="12" fill="#10b981" fill-opacity="0.15" />
      <circle cx="48" cy="274" r="5" fill="#10b981" />
      <text x="70" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#0f172a">Google Search Grounding</text>
      <text x="70" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748b">Live fact retrieval &amp; citations</text>

      <!-- Generate Button -->
      <rect x="24" y="320" width="292" height="46" rx="12" fill="url(#accentBtn)" />
      <text x="88" y="348" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Generate Full Post</text>

      <!-- SEO Score Gauge Mini Card -->
      <rect x="24" y="390" width="292" height="230" rx="12" fill="#ffffff" stroke="#e2e8f0" />
      <text x="40" y="420" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0f172a">Live SEO Quality Audit</text>
      
      <circle cx="80" cy="480" r="36" fill="none" stroke="#e2e8f0" stroke-width="8" />
      <circle cx="80" cy="480" r="36" fill="none" stroke="#7c3aed" stroke-width="8" stroke-dasharray="190" stroke-dashoffset="30" stroke-linecap="round" />
      <text x="68" y="486" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" fill="#7c3aed">94</text>
      
      <text x="135" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#10b981">✓ Excellent SEO Rank</text>
      <text x="135" y="485" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b">Flesch Score: 68.4 (Easy)</text>
      <text x="135" y="502" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b">Density: 2.1% (Optimal)</text>

      <!-- Right Main Content Area: Article & Visuals Preview -->
      <g transform="translate(370, 90)">
        <!-- Post Title -->
        <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="#0f172a">The Next Generation of Solar: Perovskite &amp; Beyond</text>
        <text x="0" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#64748b">By AI Studio Research &#8226; 8 min read &#8226; Grounded with 6 sources</text>

        <!-- Hero Image Mockup -->
        <rect x="0" y="75" width="790" height="220" rx="14" fill="#1e1b4b" />
        <!-- Mock Hero Visual with solar grid & sun -->
        <path d="M 0 200 L 250 140 L 500 210 L 790 150 L 790 295 L 0 295 Z" fill="#4338ca" fill-opacity="0.4" />
        <circle cx="680" cy="130" r="45" fill="#fbbf24" fill-opacity="0.85" />
        <!-- Overlay Banner -->
        <rect x="20" y="220" width="750" height="60" rx="10" fill="#0f172a" fill-opacity="0.85" />
        <text x="40" y="245" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#a78bfa">FEATURED ANALYSIS</text>
        <text x="40" y="265" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Commercial Solar Efficiency Surpasses 33% in Next-Gen Tandem Cells</text>

        <!-- Body Paragraph Text Lines -->
        <rect x="0" y="320" width="780" height="12" rx="6" fill="#94a3b8" fill-opacity="0.6" />
        <rect x="0" y="342" width="740" height="12" rx="6" fill="#cbd5e1" />
        <rect x="0" y="364" width="760" height="12" rx="6" fill="#cbd5e1" />
        <rect x="0" y="386" width="520" height="12" rx="6" fill="#cbd5e1" />

        <!-- Subheading -->
        <rect x="0" y="420" width="340" height="18" rx="4" fill="#475569" />
        <rect x="0" y="450" width="770" height="12" rx="6" fill="#cbd5e1" />
        <rect x="0" y="472" width="710" height="12" rx="6" fill="#cbd5e1" />
      </g>
    </g>
  </svg>
  `;
}

// 3. Generate Mobile Screenshot SVG (750x1334)
function getMobileScreenshotSvg(): string {
  return `
  <svg width="750" height="1334" viewBox="0 0 750 1334" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mobBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <linearGradient id="mobAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c3aed" />
        <stop offset="100%" stop-color="#6366f1" />
      </linearGradient>
      <filter id="mobShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.15" />
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="750" height="1334" fill="url(#mobBg)" />

    <!-- Phone Frame -->
    <g transform="translate(35, 30)" filter="url(#mobShadow)">
      <rect width="680" height="1274" rx="44" fill="#0f172a" stroke="#334155" stroke-width="4" />
      
      <!-- Inner Screen -->
      <rect x="16" y="16" width="648" height="1242" rx="32" fill="#ffffff" />
      
      <!-- Notch / Dynamic Island -->
      <rect x="230" y="26" width="220" height="30" rx="15" fill="#000000" />
      <circle cx="410" cy="41" r="5" fill="#1e293b" />

      <!-- App Header -->
      <g transform="translate(36, 75)">
        <rect x="0" y="0" width="38" height="38" rx="10" fill="url(#mobAccent)" />
        <text x="50" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#0f172a">SEO Blog Studio</text>
        <circle cx="560" cy="20" r="18" fill="#f1f5f9" />
        <path d="M 552 20 L 568 20 M 560 12 L 560 28" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" />
      </g>

      <!-- Topic Card -->
      <g transform="translate(36, 135)">
        <rect width="608" height="160" rx="18" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="20" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#6d28d9">TOPIC &amp; RESEARCH PROMPT</text>
        <rect x="20" y="46" width="568" height="46" rx="10" fill="#ffffff" stroke="#cbd5e1" />
        <text x="35" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" fill="#0f172a">2026 AI Search Engine Optimization</text>
        
        <rect x="20" y="104" width="270" height="42" rx="10" fill="url(#mobAccent)" />
        <text x="65" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Generate Article</text>
      </g>

      <!-- Generated Article View -->
      <g transform="translate(36, 320)">
        <text x="0" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="800" fill="#0f172a">Mastering Generative Engine Optimization (GEO)</text>
        <text x="0" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#64748b">8 min read &#8226; SEO Score: 96/100</text>

        <!-- Mobile Hero Visual -->
        <rect x="0" y="75" width="608" height="320" rx="18" fill="#1e1b4b" />
        <circle cx="480" cy="180" r="90" fill="#7c3aed" fill-opacity="0.5" />
        <circle cx="180" cy="240" r="70" fill="#6366f1" fill-opacity="0.4" />
        
        <!-- Bottom Banner Overlay on Image -->
        <rect x="15" y="260" width="578" height="120" rx="12" fill="#0f172a" fill-opacity="0.9" />
        <rect x="30" y="275" width="60" height="20" rx="6" fill="#7c3aed" />
        <text x="38" y="289" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#ffffff">GUIDE</text>
        <text x="30" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#ffffff">How AI Chatbots Surface Content in 2026</text>
        <text x="30" y="338" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#cbd5e1">Key optimization factors for modern brand search ranking</text>

        <!-- Article Content Lines -->
        <rect x="0" y="420" width="608" height="14" rx="7" fill="#94a3b8" fill-opacity="0.7" />
        <rect x="0" y="445" width="580" height="14" rx="7" fill="#cbd5e1" />
        <rect x="0" y="470" width="595" height="14" rx="7" fill="#cbd5e1" />
        <rect x="0" y="495" width="420" height="14" rx="7" fill="#cbd5e1" />

        <!-- Interactive Visual Studio Pill -->
        <rect x="0" y="535" width="608" height="85" rx="16" fill="#faf5ff" stroke="#e9d5ff" />
        <circle cx="45" cy="577" r="22" fill="#7c3aed" fill-opacity="0.15" />
        <path d="M 37 577 L 53 577 M 45 569 L 45 585" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" />
        <text x="80" y="570" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#581c87">Image Studio &amp; Topic Browser</text>
        <text x="80" y="590" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#7e22ce">18+ topic photo galleries &amp; color filter presets</text>
      </g>

      <!-- Bottom Nav Bar -->
      <g transform="translate(16, 1160)">
        <rect width="648" height="80" fill="#ffffff" />
        <line x1="0" y1="0" x2="648" y2="0" stroke="#f1f5f9" stroke-width="1.5" />
        
        <!-- Nav Item 1 (Active) -->
        <circle cx="120" cy="30" r="16" fill="#ede9fe" />
        <text x="100" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#7c3aed">Create</text>

        <!-- Nav Item 2 -->
        <circle cx="324" cy="30" r="16" fill="#f8fafc" />
        <text x="306" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">Images</text>

        <!-- Nav Item 3 -->
        <circle cx="528" cy="30" r="16" fill="#f8fafc" />
        <text x="506" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#64748b">Settings</text>
      </g>
    </g>
  </svg>
  `;
}

async function main() {
  console.log('Generating valid PNG icons and screenshots with Sharp...');

  // 1. icon-192x192.png (any)
  const svg192 = getIconSvg(192, false);
  await sharp(Buffer.from(svg192))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ICONS_DIR, 'icon-192x192.png'));
  console.log('✓ Created /public/icons/icon-192x192.png');

  // 2. icon-512x512.png (any)
  const svg512 = getIconSvg(512, false);
  await sharp(Buffer.from(svg512))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('✓ Created /public/icons/icon-512x512.png');

  // 3. icon-512x512-maskable.png (maskable with safe area)
  const svg512Maskable = getIconSvg(512, true);
  await sharp(Buffer.from(svg512Maskable))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ICONS_DIR, 'icon-512x512-maskable.png'));
  console.log('✓ Created /public/icons/icon-512x512-maskable.png');

  // 4. apple-touch-icon.png (180x180)
  const svg180 = getIconSvg(180, false);
  await sharp(Buffer.from(svg180))
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ Created /public/apple-touch-icon.png');

  // 5. favicon.png (64x64)
  const svg64 = getIconSvg(64, false);
  await sharp(Buffer.from(svg64))
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
  console.log('✓ Created /public/favicon.png');

  // 6. desktop-1280x720.png (wide screenshot)
  const svgDesktop = getDesktopScreenshotSvg();
  await sharp(Buffer.from(svgDesktop))
    .png({ compressionLevel: 8 })
    .toFile(path.join(SCREENSHOTS_DIR, 'desktop-1280x720.png'));
  console.log('✓ Created /public/screenshots/desktop-1280x720.png');

  // 7. mobile-750x1334.png (narrow screenshot)
  const svgMobile = getMobileScreenshotSvg();
  await sharp(Buffer.from(svgMobile))
    .png({ compressionLevel: 8 })
    .toFile(path.join(SCREENSHOTS_DIR, 'mobile-750x1334.png'));
  console.log('✓ Created /public/screenshots/mobile-750x1334.png');

  console.log('All PWA assets generated successfully!');
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
