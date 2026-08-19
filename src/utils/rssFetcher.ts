import { Article, ArticleCategory } from '../types';

// Curated pool of high quality Pexels images for live articles that lack media enclosures
const liveImagesPool = [
  'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3771089/pexels-photo-3771089.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800'
];

export async function fetchLiveRSSFeed(url: string, sourceName: 'www.franceinfo.fr' | 'www.lessentiel.lu'): Promise<Article[]> {
  try {
    // Fetch via CORS proxy
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

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = xmlDoc.querySelectorAll('item');
    const articles: Article[] = [];

    items.forEach((item, index) => {
      if (index >= 20) return; // fetch up to 20 live articles per feed

      const title = item.querySelector('title')?.textContent?.trim() || 'Actualité en direct';
      const link = item.querySelector('link')?.textContent?.trim() || '#';
      const description = item.querySelector('description')?.textContent?.trim() || '';
      
      // Clean HTML tags from description
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      const cleanExcerpt = tempDiv.textContent || tempDiv.innerText || description;

      const pubDateStr = item.querySelector('pubDate')?.textContent?.trim() || '';
      
      // Try to find image in enclosure or media content
      let imageUrl = '';
      const enclosure = item.querySelector('enclosure');
      if (enclosure) {
        imageUrl = enclosure.getAttribute('url') || '';
      }
      
      if (!imageUrl) {
        const mediaContent = item.querySelector('media\\:content, content');
        if (mediaContent) {
          imageUrl = mediaContent.getAttribute('url') || '';
        }
      }

      if (!imageUrl) {
        imageUrl = liveImagesPool[index % liveImagesPool.length];
      }

      // Format published date nicely
      let publishedAt = "À l'instant";
      if (pubDateStr) {
        try {
          const date = new Date(pubDateStr);
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

      const category: ArticleCategory = sourceName === 'www.franceinfo.fr' ? 'Actualité France & Monde' : 'Actualité Luxembourg & Région';

      articles.push({
        id: `${sourceName}-${index}-${Date.now()}`,
        title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
        excerpt: (cleanExcerpt || title).substring(0, 160) + '...',
        content: `Consultez l'article complet en direct et original sur le site officiel de notre partenaire :\n\nLien direct : ${link}\n\nRésumé du flux en direct :\n${cleanExcerpt}`,
        category,
        imageUrl,
        source: sourceName,
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
      });
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching live RSS feed for ${sourceName}:`, error);
    return [];
  }
}
