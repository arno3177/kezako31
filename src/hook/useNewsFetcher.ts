import { useState, useEffect } from 'react';
import { Article } from '../types';

export function useNewsFetcher() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchRSS(rssUrl: string, sourceName: string) {
      try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await res.json();
        if (data.status === 'ok' && data.items?.length > 0) {
          return data.items.map((item: any, idx: number) => parseItem(item, idx, sourceName));
        }
      } catch (e) {
        console.warn(`[rss2json ECHEC pour ${sourceName}] tentative via proxy AllOrigins...`);
      }

      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (data.contents) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
          const items = Array.from(xmlDoc.querySelectorAll('item'));

          if (items.length > 0) {
            return items.map((item, idx) => {
              const title = item.querySelector('title')?.textContent || '';
              const description = item.querySelector('description')?.textContent || '';
              const pubDate = item.querySelector('pubDate')?.textContent || '';
              const enclosure = item.querySelector('enclosure')?.getAttribute('url');

              return {
                title,
                description,
                pubDate,
                enclosure: { link: enclosure }
              };
            }).map((item: any, idx: number) => parseItem(item, idx, sourceName));
          }
        }
      } catch (e) {
        console.error(`[AllOrigins ECHEC pour ${sourceName}]`, e);
      }
      return [];
    }

    function parseItem(item: any, idx: number, sourceName: string): Article {
      const cleanDesc = (item.description || item.content || '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
      const imageFromDesc = (item.description || item.content || '').match(/src=["'](.*?)["']/)?.[1];
      const imageUrl = item.enclosure?.link || item.thumbnail || imageFromDesc || 
        (sourceName.includes('franceinfo')
          ? 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80');

      return {
        id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}-${Date.now()}`,
        title: item.title || 'Titre non disponible',
        excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
        content: cleanDesc || item.title,
        category: sourceName.includes('franceinfo') ? 'Technologie' : 'Monde',
        source: sourceName as any,
        publishedAt: item.pubDate ? new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récemment',
        imageUrl: imageUrl,
        readTime: '3 min',
        likes: 120,
        commentsCount: 12,
        author: {
          name: sourceName,
          avatar: sourceName.includes('franceinfo') 
            ? 'https://www.francetvinfo.fr/favicon.ico'
            : 'https://www.lessentiel.lu/favicon.ico'
        }
      };
    }

    async function loadAll() {
      setLoading(true);
      const [fiItems, lessentielItems] = await Promise.all([
        fetchRSS('https://www.francetvinfo.fr/titres.rss', 'www.franceinfo.fr'),
        fetchRSS('https://partner-feeds.lessentiel.lu/rss/lessentiel-fr', 'www.lessentiel.lu')
      ]);
      const total = [...fiItems, ...lessentielItems];

      if (total.length === 0) {
        setArticles(fallbackArticles);
      } else {
        setArticles(total);
      }
      setLoading(false);
    }

    loadAll();
  }, []);

  return { articles, loading };
}

const fallbackArticles: Article[] = [
  {
    id: 'fi-fallback-1',
    title: "En direct sur France Info : Suivez les dernières actualités",
    excerpt: "L'ensemble de la rédaction France Info se mobilise pour vous transmettre le fil d'actualité.",
    content: "Retrouvez l'actualité politique, économique et culturelle en direct.",
    category: 'Monde',
    source: 'www.franceinfo.fr',
    publishedAt: "À l'instant",
    imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    readTime: '3 min',
    likes: 45,
    commentsCount: 3,
    author: { name: 'France Info', avatar: 'https://www.francetvinfo.fr/favicon.ico' }
  }
];
