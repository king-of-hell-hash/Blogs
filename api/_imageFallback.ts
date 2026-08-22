// Curated contextual Unsplash photography for instant, guaranteed visual delivery
export function getCuratedImageUrl(keyword: string, aspectRatio: '16:9' | '4:3' | '1:1' = '16:9', offset: number = 0): string {
  const kw = (keyword || '').toLowerCase();
  
  let w = 1200;
  let h = 675;
  if (aspectRatio === '4:3') {
    w = 1200;
    h = 900;
  } else if (aspectRatio === '1:1') {
    w = 1000;
    h = 1000;
  }

  const collections: Record<string, string[]> = {
    tech: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b',
    ],
    seo: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    ],
    business: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
      'https://images.unsplash.com/photo-1497366216548-37526070297c',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
    ],
    ai: [
      'https://images.unsplash.com/photo-1677442136019-21780ecad995',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
    ],
    default: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
      'https://images.unsplash.com/photo-1432821596592-e2c18b78144f',
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e',
    ]
  };

  let chosenCategory = 'default';
  if (kw.includes('ai') || kw.includes('gpt') || kw.includes('llm') || kw.includes('intelligence') || kw.includes('machine learning')) {
    chosenCategory = 'ai';
  } else if (kw.includes('seo') || kw.includes('marketing') || kw.includes('traffic') || kw.includes('rank') || kw.includes('keyword') || kw.includes('google')) {
    chosenCategory = 'seo';
  } else if (kw.includes('code') || kw.includes('software') || kw.includes('developer') || kw.includes('cloud') || kw.includes('app') || kw.includes('tech')) {
    chosenCategory = 'tech';
  } else if (kw.includes('finance') || kw.includes('business') || kw.includes('startup') || kw.includes('money') || kw.includes('freelanc')) {
    chosenCategory = 'business';
  }

  const list = collections[chosenCategory] || collections.default;
  const rawUrl = list[Math.abs(offset) % list.length];
  return `${rawUrl}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}
