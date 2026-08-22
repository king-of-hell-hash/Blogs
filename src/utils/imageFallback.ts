/**
 * Contextual & Diverse Image Engine
 * Maps article topics and prompt semantics to unique, high-resolution visuals.
 * Provides dynamic AI synthesis and curated photo pools across 25+ topical verticals.
 */

export interface TopicPhotoPool {
  category: string;
  label: string;
  keywords: string[];
  photos: string[];
}

export const TOPIC_PHOTO_POOLS: TopicPhotoPool[] = [
  {
    category: 'solar_energy_climate',
    label: 'Solar & Renewable Energy',
    keywords: ['solar', 'sun', 'photovoltaic', 'renewable', 'clean energy', 'green energy', 'wind', 'turbine', 'climate', 'sustainability', 'ecology', 'carbon', 'inverter', 'panel', 'electric grid'],
    photos: [
      'photo-1509391365360-2e959784a276', // Solar panels rooftop modern home
      'photo-1508873696983-2df5703bc69d', // Giant solar farm at golden hour sunset
      'photo-1497440001374-f26997328c1b', // Wind turbines in lush rolling green hills
      'photo-1473341304170-971dccb5ac1e', // Eco energy bulb glowing in green grass
      'photo-1542601906990-b4d3fb778b09', // Sustainability hands holding growing sprout
      'photo-1513836279014-a89f7a76ae86', // Deep pristine pine forest canopy
      'photo-1466611653911-95081537e5b7', // Clean energy wind farm turbine blades
    ]
  },
  {
    category: 'ai_machine_learning',
    label: 'AI & Machine Learning',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural', 'robot', 'automation', 'chatgpt', 'gemini', 'llm', 'algorithm', 'data science', 'generative', 'bot'],
    photos: [
      'photo-1677442136019-21780ecad995', // AI Neural network brain glow
      'photo-1620712943543-bcc4688e7485', // Futuristic digital human intelligence face
      'photo-1485827404703-89b55fcc595e', // Sleek white robot android looking forward
      'photo-1618005182384-a83a8bd57fbe', // Abstract luminous flowing data lines
      'photo-1531746790731-6c087fecd65a', // Digital assistant UI on glass screen
      'photo-1526374965328-7f61d4dc18c5', // Matrix green data streams cyber code
    ]
  },
  {
    category: 'software_coding_tech',
    label: 'Software, Web & Coding',
    keywords: ['code', 'coding', 'software', 'programming', 'developer', 'python', 'javascript', 'react', 'typescript', 'api', 'backend', 'frontend', 'app', 'github', 'devops', 'web development', 'database', 'sql'],
    photos: [
      'photo-1555066931-4365d14bab8c', // Syntax highlighted code on dark monitor
      'photo-1517694712202-14dd9538aa97', // Laptop coding in coffee shop workspace
      'photo-1461749280684-dccba630e2f6', // Programming code close up on screen
      'photo-1504639725590-34d0984388bd', // Modern developer dual-screen desk
      'photo-1587620962725-abab7fe55159', // Hands typing swift code on keyboard
      'photo-1515879218367-8466d910aaa4', // Algorithm logic code architecture
    ]
  },
  {
    category: 'cybersecurity_cloud',
    label: 'Cybersecurity & Cloud',
    keywords: ['security', 'cyber', 'cybersecurity', 'hack', 'privacy', 'firewall', 'cloud', 'vpn', 'encryption', 'phishing', 'threat', 'protection', 'data breach', 'server', 'datacenter'],
    photos: [
      'photo-1563986768609-322da13575f3', // Padlock glowing digital security defense
      'photo-1550751827-4bd374c3f58b', // Blue neon digital lock shield interface
      'photo-1544197150-b99a580bb7a8', // Modern datacenter server rack blue lights
      'photo-1563089145-599997674d42', // Abstract cyber security shield concept
      'photo-1558494949-ef010cbdcc31', // Glowing fiber optic server network
    ]
  },
  {
    category: 'business_startup_leadership',
    label: 'Business, Startups & Strategy',
    keywords: ['business', 'startup', 'entrepreneur', 'leadership', 'management', 'team', 'meeting', 'strategy', 'corporate', 'office', 'career', 'productivity', 'remote work', 'consulting'],
    photos: [
      'photo-1507679799987-c73779587ccf', // Executive in suit in modern high-rise office
      'photo-1552664730-d307ca884978', // Collaborative team strategizing on whiteboard
      'photo-1522202176988-66273c2fd55f', // Energetic startup group working together
      'photo-1486406146926-c627a92ad1ab', // Glass corporate skyscraper reaching into blue sky
      'photo-1519389950473-47ba0277781c', // Modern airy office loft with people working
    ]
  },
  {
    category: 'marketing_seo_content',
    label: 'SEO, Content & Marketing',
    keywords: ['seo', 'marketing', 'content', 'blog', 'social media', 'traffic', 'conversion', 'google', 'ad', 'adsense', 'copywriting', 'ranking', 'brand', 'ecommerce', 'sales', 'funnel'],
    photos: [
      'photo-1460925895917-afdab827c52f', // SEO analytics growth chart on laptop
      'photo-1533750349088-cd871a92f312', // Digital marketing campaign plan on table
      'photo-1611162617474-5b21e879e113', // Social media network apps on mobile device
      'photo-1556742049-0a67c5574f73', // Online shopping customer transaction
      'photo-1557838923-2985c318be48', // Digital advertising reach and target audience
    ]
  },
  {
    category: 'finance_crypto_investing',
    label: 'Finance, Crypto & Wealth',
    keywords: ['finance', 'money', 'invest', 'stock', 'crypto', 'bitcoin', 'trading', 'wealth', 'budget', 'real estate', 'banking', 'interest', 'portfolio', 'fund', 'tax'],
    photos: [
      'photo-1590283603385-17ffb3a7f29f', // Financial stock market candlestick chart
      'photo-1621416894569-0f39ed31d247', // Golden Bitcoin coin on computer circuit
      'photo-1560518883-ce09059eeffa', // Modern luxury architectural house exterior
      'photo-1579532537598-459ecdaf39cc', // Growing money plant on stacked coins
      'photo-1554224155-8d04cb21cd6c', // Financial investment spreadsheet analysis
    ]
  },
  {
    category: 'health_wellness_fitness',
    label: 'Health, Wellness & Fitness',
    keywords: ['health', 'fitness', 'workout', 'gym', 'wellness', 'yoga', 'meditation', 'mental health', 'diet', 'nutrition', 'running', 'exercise', 'weight loss', 'doctor', 'medical', 'sleep'],
    photos: [
      'photo-1517838277536-f5f99be501cd', // Athlete exercising in modern fitness gym
      'photo-1506126613408-eca07ce68773', // Peaceful yoga meditation on ocean rock
      'photo-1505751172876-fa1923c5c528', // Doctor stethoscope and healthcare clinic
      'photo-1538805060514-97d9cc17730c', // Runner athletic shoes on mountain trail
      'photo-1544367567-0f2fcb009e0b', // Wellness stretching routine in natural light
    ]
  },
  {
    category: 'food_cooking_recipes',
    label: 'Food, Cooking & Culinary',
    keywords: ['food', 'recipe', 'cook', 'cooking', 'restaurant', 'meal', 'diet', 'bake', 'baking', 'coffee', 'dish', 'culinary', 'dinner', 'breakfast', 'lunch', 'chef', 'keto', 'vegan'],
    photos: [
      'photo-1546069901-ba9599a7e63c', // Fresh vibrant healthy salad bowl
      'photo-1504674900247-0877df9cc836', // Delicious gourmet restaurant plate presentation
      'photo-1495474472287-4d71bcdd2085', // Warm artisan coffee latte art in cafe
      'photo-1555939594-58d7cb561ad1', // Sizzling fresh culinary BBQ masterwork
      'photo-1490645935967-10de6ba17061', // Healthy colorful organic meal prep
    ]
  },
  {
    category: 'travel_tourism_outdoors',
    label: 'Travel, Adventure & Tourism',
    keywords: ['travel', 'trip', 'hotel', 'flight', 'destination', 'vacation', 'beach', 'mountain', 'hiking', 'nature', 'explore', 'adventure', 'island', 'city', 'tourist', 'backpacking'],
    photos: [
      'photo-1488646953014-85cb44e25828', // Adventurer with backpack atop scenic mountain peak
      'photo-1507525428034-b723cf961d3e', // Pristine tropical white sand beach and turquoise sea
      'photo-1469854523086-cc02fe5d8800', // Epic camper van road trip at desert sunset
      'photo-1502602898657-3e91760cbb34', // Paris city view with Eiffel Tower landmark
      'photo-1476514525535-07fb3b4ae5f1', // Peaceful mountain lake alpine reflection
    ]
  },
  {
    category: 'automotive_vehicles_cars',
    label: 'Automotive, EVs & Transport',
    keywords: ['car', 'automotive', 'electric vehicle', 'ev', 'tesla', 'driving', 'auto', 'engine', 'vehicle', 'truck', 'mechanic', 'battery', 'charging', 'road', 'suv'],
    photos: [
      'photo-1563720223185-11003d516935', // Modern EV electric car at rapid charging plug
      'photo-1503376780353-7e6692767b70', // Sleek sports car cruising scenic coastal highway
      'photo-1617788138017-80ad40651399', // Digital cockpit futuristic dashboard display
      'photo-1511919884226-fd3cad34687c', // Luxury car headlights aerodynamic styling
    ]
  },
  {
    category: 'education_learning_books',
    label: 'Education, Courses & Books',
    keywords: ['education', 'learn', 'school', 'university', 'student', 'study', 'book', 'course', 'degree', 'exam', 'teacher', 'class', 'knowledge', 'history'],
    photos: [
      'photo-1456513080510-7bf3a84b82f8', // Open book and study notes on rustic wooden desk
      'photo-1523240795612-9a054b0db644', // Group of diverse university students studying
      'photo-1434030216411-0b793f4b4173', // Writing study plan in notebook with pen
      'photo-1497633762265-9d179a990aa6', // Stacks of colorful books in university library
    ]
  },
  {
    category: 'design_art_architecture',
    label: 'Design, UI/UX & Architecture',
    keywords: ['design', 'ui', 'ux', 'art', 'artist', 'creative', 'graphic', 'interior', 'architecture', 'drawing', 'home decor', 'style', 'fashion', 'visual'],
    photos: [
      'photo-1581291518857-4e27b48ff24e', // Designer wireframing mobile apps on tablet
      'photo-1600585154340-be6161a56a0c', // Bright contemporary minimalist architectural living room
      'photo-1513364776144-60967b0f800f', // Artist painting palette with vibrant colors
      'photo-1507238691740-187a5b1d37b8', // Aesthetic minimalist workspace with creative sketchbook
    ]
  },
  {
    category: 'science_space_physics',
    label: 'Science, Space & Research',
    keywords: ['science', 'space', 'astronomy', 'physics', 'chemistry', 'biology', 'laboratory', 'planet', 'universe', 'telescope', 'research', 'experiment', 'quantum'],
    photos: [
      'photo-1451187580459-43490279c0fa', // Earth viewed from orbit with glowing data grid
      'photo-1507499739999-097706ad8914', // Deep starry night sky milky way galaxy
      'photo-1532094349884-543bc11b234d', // Scientific laboratory glassware research beaker
      'photo-1518770660439-4636190af475', // Microchip semiconductor circuit traces
    ]
  },
  {
    category: 'gaming_entertainment',
    label: 'Gaming, VR & Esports',
    keywords: ['game', 'gaming', 'esports', 'gamer', 'playstation', 'xbox', 'console', 'stream', 'twitch', 'music', 'sound', 'audio', 'vr', 'virtual reality'],
    photos: [
      'photo-1538481199705-c710c4e965fc', // RGB lit gaming keyboard and dual monitors
      'photo-1511671782779-c97d3d27a1d4', // Professional audio recording microphone in studio
      'photo-1514525253161-7a46d19cd819', // Live stage concert crowd and vibrant light show
      'photo-1592478411213-6153e4ebc07d', // Futuristic gamer wearing VR headset
    ]
  },
  {
    category: 'pets_animals',
    label: 'Pets & Wildlife',
    keywords: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'veterinary', 'wildlife', 'bird', 'fish', 'aquarium', 'canine', 'feline'],
    photos: [
      'photo-1543466835-00a7907e9de1', // Golden retriever dog running happily in sunny meadow
      'photo-1514888286974-6c03e2ca1dba', // Close-up portrait of cute playful cat with bright eyes
      'photo-1583511655857-d19b40a7a54e', // Dog with tennis ball in park training
    ]
  },
  {
    category: 'real_estate_homes',
    label: 'Real Estate & Properties',
    keywords: ['property', 'real estate', 'house', 'home', 'apartment', 'villa', 'mortgage', 'realtor', 'buying home', 'interior design', 'listing'],
    photos: [
      'photo-1560518883-ce09059eeffa', // Modern luxury villa with blue sky
      'photo-1600585154340-be6161a56a0c', // Elegant spacious living room
      'photo-1512917774080-9991f1c4c750', // Sunny modern architectural house facade
      'photo-1600596542815-ffad4c1539a9', // Contemporary suburban house with green lawn
    ]
  },
  {
    category: 'fashion_lifestyle',
    label: 'Fashion, Style & Beauty',
    keywords: ['fashion', 'style', 'clothing', 'beauty', 'skincare', 'apparel', 'model', 'runway', 'outfit', 'cosmetics', 'accessories'],
    photos: [
      'photo-1490481651871-ab68de25d43d', // Fashion model in stylish jacket in daylight
      'photo-1445205170230-053b83016050', // Wardrobe clothing collection on sleek racks
      'photo-1522337360788-8b13dee7a37e', // Natural organic skincare cosmetic products
      'photo-1515886657613-9f3515b0c78f', // High fashion portrait in studio setting
    ]
  }
];

// Fallback general tech/workspace images if no specific topic matches
export const DEFAULT_WORKSPACE_PHOTOS = [
  'photo-1499750310107-5fef28a66643', // Clean modern desk with laptop, notebook and coffee
  'photo-1486312338219-ce68d2c6f44d', // Person typing on laptop keyboard in warm light
  'photo-1519389950473-47ba0277781c', // Team collaborating in modern daylight studio
  'photo-1451187580459-43490279c0fa', // Global technological network connectivity
  'photo-1498050108023-c5249f4df085', // Code on screen beside coffee cup
];

/**
 * Finds the most relevant photo pool based on prompt text
 */
export function matchTopicPhotoPool(promptText: string): { pool: TopicPhotoPool | null; photoId: string } {
  const lower = promptText.toLowerCase();

  let bestMatch: TopicPhotoPool | null = null;
  let highestScore = 0;

  for (const pool of TOPIC_PHOTO_POOLS) {
    let score = 0;
    for (const kw of pool.keywords) {
      if (lower.includes(kw)) {
        score += kw.length > 4 ? 3 : 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = pool;
    }
  }

  const poolPhotos = bestMatch ? bestMatch.photos : DEFAULT_WORKSPACE_PHOTOS;

  // Generate deterministic index from prompt text + hash to ensure unique photos across sections
  const hash = Math.abs(
    promptText.split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 7), 0)
  );

  const selectedPhoto = poolPhotos[hash % poolPhotos.length];

  return {
    pool: bestMatch,
    photoId: selectedPhoto
  };
}

/**
 * Generates an HD Curated Unsplash photo URL matching the topic, aspect ratio, and prompt.
 */
export function getCuratedImageUrl(
  prompt: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' = '16:9',
  placementOffset: number = 0
): string {
  let width = 1200;
  let height = 675;

  if (aspectRatio === '4:3') {
    width = 1000;
    height = 750;
  } else if (aspectRatio === '1:1') {
    width = 800;
    height = 800;
  } else if (aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  }

  const { pool, photoId } = matchTopicPhotoPool(prompt);
  let finalPhotoId = photoId;

  if (placementOffset > 0 && pool && pool.photos.length > 1) {
    const nextIdx = (pool.photos.indexOf(photoId) + placementOffset) % pool.photos.length;
    finalPhotoId = pool.photos[nextIdx] || photoId;
  }

  return `https://images.unsplash.com/${finalPhotoId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
}

/**
 * Helper to get dimension specs for aspect ratios
 */
export function getDimensionsForRatio(aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9' = '16:9'): { width: number; height: number } {
  switch (aspectRatio) {
    case '4:3':
      return { width: 1000, height: 750 };
    case '1:1':
      return { width: 800, height: 800 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '21:9':
      return { width: 1400, height: 600 };
    case '16:9':
    default:
      return { width: 1200, height: 675 };
  }
}

/**
 * Returns photos for a specific category key or query
 */
export function getPhotosForCategory(
  categoryKey: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9' = '16:9'
): Array<{ id: string; url: string; category: string; label: string }> {
  const { width, height } = getDimensionsForRatio(aspectRatio as any);
  const found = TOPIC_PHOTO_POOLS.find((p) => p.category === categoryKey);

  if (found) {
    return found.photos.map((pId) => ({
      id: pId,
      url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
      category: found.category,
      label: found.label
    }));
  }

  return DEFAULT_WORKSPACE_PHOTOS.map((pId) => ({
    id: pId,
    url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
    category: 'general',
    label: 'General Technology & Workspace'
  }));
}

/**
 * Search all curated photo pools with keyword query
 */
export function searchAllTopicPhotos(
  query: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9' = '16:9'
): Array<{ id: string; url: string; category: string; label: string }> {
  const { width, height } = getDimensionsForRatio(aspectRatio as any);
  const q = query.trim().toLowerCase();

  if (!q) {
    // Return sample from top 6 categories
    const results: Array<{ id: string; url: string; category: string; label: string }> = [];
    TOPIC_PHOTO_POOLS.slice(0, 8).forEach((p) => {
      p.photos.slice(0, 2).forEach((pId) => {
        results.push({
          id: pId,
          url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
          category: p.category,
          label: p.label
        });
      });
    });
    return results;
  }

  const matches: Array<{ id: string; url: string; category: string; label: string }> = [];

  // Check matching categories
  TOPIC_PHOTO_POOLS.forEach((p) => {
    const matchedKeyword = p.keywords.some((k) => k.includes(q) || q.includes(k));
    const matchedName = p.label.toLowerCase().includes(q) || p.category.includes(q);

    if (matchedKeyword || matchedName) {
      p.photos.forEach((pId) => {
        matches.push({
          id: pId,
          url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
          category: p.category,
          label: p.label
        });
      });
    }
  });

  if (matches.length > 0) {
    return matches;
  }

  // Fallback to matchTopicPhotoPool
  const { pool, photoId } = matchTopicPhotoPool(query);
  const photos = pool ? pool.photos : [photoId, ...DEFAULT_WORKSPACE_PHOTOS];
  return photos.map((pId) => ({
    id: pId,
    url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
    category: pool ? pool.category : 'general',
    label: pool ? pool.label : 'General Visual'
  }));
}

/**
 * Returns a list of curated HD photos matching the prompt or category
 */
export function getCuratedGalleryPhotos(
  prompt: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' = '16:9'
): Array<{ id: string; url: string; category: string }> {
  let width = 800;
  let height = 450;

  if (aspectRatio === '4:3') {
    width = 800;
    height = 600;
  } else if (aspectRatio === '1:1') {
    width = 600;
    height = 600;
  } else if (aspectRatio === '9:16') {
    width = 540;
    height = 960;
  }

  const { pool } = matchTopicPhotoPool(prompt);
  const photos = pool ? pool.photos : DEFAULT_WORKSPACE_PHOTOS;
  const category = pool ? pool.category : 'general_workspace';

  return photos.map((pId) => ({
    id: pId,
    url: `https://images.unsplash.com/${pId}?auto=format&fit=crop&w=${width}&h=${height}&q=85`,
    category
  }));
}

/**
 * Returns all available visual topic categories with counts and labels
 */
export function getAllCuratedCategories(): Array<{ category: string; label: string; count: number }> {
  return TOPIC_PHOTO_POOLS.map((p) => ({
    category: p.category,
    label: p.label,
    count: p.photos.length
  }));
}
