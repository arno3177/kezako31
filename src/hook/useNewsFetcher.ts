import { useState, useEffect } from 'react';
import { Article } from '../types';

export function useNewsFetcher() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchLocalXML(proxyEndpoint: string, sourceName: string) {
      try {
        const res = await fetch(proxyEndpoint);
        const textData = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, 'text/xml');
        const items = Array.from(xmlDoc.querySelectorAll('item'));

        return items.slice(0, 10).map((item, idx) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || '';
          const cleanDesc = description.replace(/<[^>]*>?/gm, '').trim();

          const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
          const formattedTime = pubDate ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Récemment';

          return {
            id: `${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${idx}-${timestamp}`,
            title,
            excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
            content: cleanDesc || title,
            category: sourceName.toLowerCase().includes('international') ? 'International' : 'Actualités',
            source: sourceName as any,
            url: link,
            publishedAt: formattedTime,
            rawDate: isNaN(timestamp) ? Date.now() : timestamp,
            imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
            readTime: '3 min',
            likes: 30,
            commentsCount: 4,
            author: { name: sourceName, avatar: `https://www.google.com/s2/favicons?domain=www.lemonde.fr&sz=32` }
          };
        });
      } catch (e) {
        console.warn(`Erreur proxy Vite pour ${sourceName}:`, e);
        return [];
      }
    }

    async function loadAll() {
      setLoading(true);
      const [f24, lemondeUne] = await Promise.all([
        fetchLocalXML('/proxy-france24/fr/rss', 'www.france24.com'),
        fetchLocalXML('/proxy-lemonde/rss/une.xml', 'www.lemonde.fr')
      ]);

      const total = [...f24, ...lemondeUne, ];
      if (isMounted) {
        if (total.length > 0) {
          total.sort((a: any, b: any) => b.rawDate - a.rawDate);
          setArticles(total as any);
        }
        setLoading(false);
      }
    }

    loadAll();

    return () => { isMounted = false; };
  }, []);

  return { articles, loading };
}