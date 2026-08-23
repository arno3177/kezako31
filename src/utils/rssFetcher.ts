import { Article, ArticleCategory } from '../types';

const liveImagesPool = [
  'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800'
];

function decodeEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#xE8;/g, 'è').replace(/&#xE9;/g, 'é').replace(/&#xEA;/g, 'ê')
    .replace(/&#xEB;/g, 'ë').replace(/&#xE0;/g, 'à').replace(/&#xE1;/g, 'á')
    .replace(/&#xE2;/g, 'â').replace(/&#xE4;/g, 'ä').replace(/&#xE7;/g, 'ç')
    .replace(/&#xEE;/g, 'î').replace(/&#xEF;/g, 'ï')
    .replace(/&#xF4;/g, 'ô').replace(/&#xF6;/g, 'ö').replace(/&#xFB;/g, 'û')
    .replace(/&#xFC;/g, 'ü').replace(/&#xF9;/g, 'ù').replace(/&#xFA;/g, 'ú')
    .replace(/&#xE6;/g, 'æ').replace(/&#x153;/g, 'œ').replace(/&#x27;/g, "'")
    .replace(/&#x2C6;/g, '^').replace(/&#x2019;/g, "'").replace(/&#x201C;/g, '"')
    .replace(/&#x201D;/g, '"').replace(/&#x2026;/g, '…').replace(/&#x2014;/g, '—')
    .replace(/&#xA0;/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseRSSWithRegex(xml: string, sourceName: string): any[] {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
    const block = match[1];
    
    const titleMatch = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) || block.match(/<link>([\s\S]*?)<\/link>/i);
    const descMatch = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || block.match(/<description>([\s\S]*?)<\/description>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || block.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    
    let imageMatch = block.match(/<media:content[^>]*url="([^"]+)"/i) || block.match(/<media:thumbnail[^>]*url="([^"]+)"/i) || block.match(/<enclosure[^>]*url="([^"]+)"/i);
    if (!imageMatch && descMatch) {
      const imgInDesc = descMatch[1].match(/<img[^>]*src="([^"]+)"/i);
      if (imgInDesc) imageMatch = imgInDesc;
    }

    const cleanDesc = descMatch ? decodeEntities(descMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300)) : '';
    const titleRaw = titleMatch ? titleMatch[1].trim() : '';
    let titleClean = titleRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
    titleClean = decodeEntities(titleClean);

    const guidMatch = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const linkRaw = linkMatch ? linkMatch[1].trim() : (guidMatch ? guidMatch[1].trim() : '');
    const linkClean = linkRaw.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');

    items.push({
      title: titleClean || 'Actualité en direct',
      link: decodeEntities(linkClean) || (sourceName.includes('franceinfo') ? 'https://www.franceinfo.fr' : 'https://www.lessentiel.lu'),
      description: cleanDesc,
      image: imageMatch ? imageMatch[1].trim() : null,
      date: dateMatch ? dateMatch[1].trim() : null
    });
  }
  return items;
}

export async function fetchLiveRSSFeed(url: string, sourceName: 'www.franceinfo.fr' | 'www.lessentiel.lu'): Promise<Article[]> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS via proxy: ${response.statusText}`);
    }

    const data = await response.json();
    const xmlText = data.contents;
    
    if (!xmlText) {
      throw new Error('Empty RSS response');
    }

    const rawItems = parseRSSWithRegex(xmlText, sourceName);
    const articles: Article[] = [];

    rawItems.forEach((item, index) => {
      const imageUrl = item.image || liveImagesPool[index % liveImagesPool.length];
      
      let publishedAt = "À l'instant";
      if (item.date) {
        try {
          const date = new Date(item.date);
          const now = new Date();
          const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
          if (diffHours < 1) publishedAt = "À l'instant";
          else if (diffHours < 24) publishedAt = `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
          else {
            const diffDays = Math.floor(diffHours / 24);
            publishedAt = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
          }
        } catch (e) {
          publishedAt = 'Aujourd’hui';
        }
      }

      const category: ArticleCategory = (sourceName === 'www.franceinfo.fr' ? 'Actualité France & Monde' : 'Actualité Luxembourg & Région') as any;

      const fullRichContent = `Dépêche d'actualité en direct :\n\n` +
        `${item.description || item.title}\n\n` +
        `--- 💡 Informations complémentaires ---\n` +
        `Cette actualité a été publiée en continu par la rédaction de ${sourceName === 'www.franceinfo.fr' ? 'France Info' : 'L\'Essentiel'}.\n` +
        `Pour consulter le reportage complet, vous pouvez accéder directement au site de l'éditeur via le lien officiel.`;

      articles.push({
        id: `${sourceName}-${index}-${Date.now()}`,
        title: item.title,
        excerpt: (item.description || item.title).substring(0, 160) + '...',
        content: fullRichContent,
        category,
        imageUrl,
        source: sourceName,
        url: item.link, // <-- Le lien direct et propre récupéré par Regex !
        author: {
          name: sourceName === 'www.franceinfo.fr' ? 'Rédaction France Info (franceinfo.fr)' : 'Rédaction L\'Essentiel (lessentiel.lu)',
          avatar: sourceName === 'www.franceinfo.fr' 
            ? 'https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&w=150' 
            : 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        publishedAt,
        readTime: `${Math.floor(Math.random() * 3) + 2} min de lecture`,
        likes: Math.floor(Math.random() * 250) + 30,
        commentsCount: Math.floor(Math.random() * 35) + 4,
        featured: index === 0
      } as any);
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching live RSS feed for ${sourceName}:`, error);
    return [];
  }
}