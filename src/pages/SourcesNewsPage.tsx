import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Article, AppSettings } from '../types';
import { 
  Bookmark, ArrowLeft, Terminal, Newspaper,
  Car, Bus, Sun, Briefcase, Building2, ShieldAlert, Zap, Globe, RefreshCw, CheckCircle2,
  Clock, ExternalLink
} from 'lucide-react';

interface SourcesNewsPageProps {
  articles?: Article[];
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onBackToHome: () => void;
  language?: AppSettings['language'];
}

// --- HOOK AUTONOME DE CHARGEMENT DIRECT DE NEWS (LE MONDE + FRANCE 24) ---
function useInternalNewsFetcher() {
  const LOCAL_CACHE_KEY = 'news_lemonde_france24_mobile_v1';

  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Cache Read Warning]', e);
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(articles.length === 0);

  const fetchNews = async () => {
    setLoading(true);

    const fetchXML = async (targetUrl: string, viteProxyPath: string, sourceName: string, category: string) => {
      const proxies = import.meta.env.DEV
        ? [viteProxyPath]
        : [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
          ];

      let textData = '';

      for (const proxyUrl of proxies) {
        try {
          const res = await fetch(proxyUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && (text.includes('<item') || text.includes('<entry'))) {
              textData = text;
              break;
            }
          }
        } catch (err) {
          console.warn(`[Proxy Fail] ${sourceName} via ${proxyUrl}`, err);
        }
      }

      if (!textData) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}&_t=${Date.now()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'ok' && Array.isArray(json.items)) {
              return json.items.slice(0, 15).map((item: any, idx: number) => {
                const cleanDesc = (item.description || item.content || '').replace(/<[^>]*>?/gm, '').trim();
                const pubDate = item.pubDate || '';
                const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
                const formattedTime = pubDate && !isNaN(timestamp)
                  ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Récemment';

                return {
                  id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}-${timestamp}`,
                  title: item.title || '',
                  excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
                  content: cleanDesc || item.title,
                  category,
                  source: sourceName,
                  url: item.link || '',
                  publishedAt: formattedTime,
                  rawDate: isNaN(timestamp) ? Date.now() : timestamp,
                  imageUrl: item.thumbnail || item.enclosure?.link || undefined,
                  readTime: '3 min',
                  likes: Math.floor(Math.random() * 40) + 10,
                  commentsCount: Math.floor(Math.random() * 10) + 1,
                  author: { name: sourceName, avatar: `https://www.google.com/s2/favicons?domain=${sourceName}&sz=32` }
                };
              });
            }
          }
        } catch (e) {
          return [];
        }
      }

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, 'text/xml');
        const items = Array.from(xmlDoc.querySelectorAll('item, entry'));

        return items.slice(0, 15).map((item, idx) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description, summary, content')?.textContent || '';
          const pubDate = item.querySelector('pubDate, updated, published')?.textContent || '';

          let link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || '';
          if (!link) {
            const linkAttr = item.querySelector('link')?.getAttribute('href');
            if (linkAttr) link = linkAttr;
          }

          const enclosure = item.querySelector('enclosure')?.getAttribute('url');
          const mediaContent = item.getElementsByTagName('media:content')[0]?.getAttribute('url') ||
                               item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0]?.getAttribute('url');
          const mediaThumbnail = item.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') ||
                                 item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0]?.getAttribute('url');
          const imageFromHTML = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

          const imageUrl = enclosure || mediaContent || mediaThumbnail || imageFromHTML || undefined;

          const cleanDesc = description.replace(/<[^>]*>?/gm, '').trim();
          const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
          const formattedTime = pubDate && !isNaN(timestamp)
            ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Récemment';

          return {
            id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}-${timestamp}`,
            title,
            excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
            content: cleanDesc || title,
            category,
            source: sourceName,
            url: link,
            publishedAt: formattedTime,
            rawDate: isNaN(timestamp) ? Date.now() : timestamp,
            imageUrl,
            readTime: '3 min',
            likes: Math.floor(Math.random() * 40) + 10,
            commentsCount: Math.floor(Math.random() * 10) + 1,
            author: { name: sourceName, avatar: `https://www.google.com/s2/favicons?domain=${sourceName}&sz=32` }
          };
        });
      } catch (e) {
        return [];
      }
    };

    const [f24, monde] = await Promise.all([
      fetchXML('https://www.france24.com/fr/rss', '/proxy-france24/fr/rss', 'www.france24.com', 'Actualités'),
      fetchXML('https://www.lemonde.fr/rss/une.xml', '/proxy-lemonde/rss/une.xml', 'www.lemonde.fr', 'Actualités')
    ]);

    const total = [...f24, ...monde];

    if (total.length > 0) {
      total.sort((a: any, b: any) => b.rawDate - a.rawDate);
      setArticles(total as any);
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(total));
      } catch (e) {
        console.warn('[Cache Write Warning]', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return { articles, loading, refetch: fetchNews };
}

export const SourcesNewsPage: React.FC<SourcesNewsPageProps> = ({
  articles: propArticles = [],
  savedArticleIds,
  onToggleSave,
  onReadArticle,
  onBackToHome
}) => {
  const { articles: fetchedArticles, loading: isFetching, refetch } = useInternalNewsFetcher();
  const articles = propArticles && propArticles.length > 0 ? propArticles : fetchedArticles;

  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [newFetchedArticles, setNewFetchedArticles] = useState<Article[]>([]);
  const knownArticleIdsRef = useRef<Set<string>>(new Set(articles.map(a => a.id)));
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const availableSources = useMemo(() => {
    const sourcesSet = new Set<string>();
    articles.forEach(art => {
      if (art.source) sourcesSet.add(art.source);
    });
    return Array.from(sourcesSet);
  }, [articles]);

  const handleRefreshNews = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setActiveSourceFilter('all');
    setActiveCategory('all');
    setSearchFilter('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    await refetch();

    const brandNewArticles = articles.filter(art => !knownArticleIdsRef.current.has(art.id));
    articles.forEach(art => knownArticleIdsRef.current.add(art.id));

    setNewFetchedArticles(brandNewArticles);
    setShowPopup(true);

    setTimeout(() => setIsRefreshing(false), 600);
    setTimeout(() => setShowPopup(false), 5000);
  };

  const getCategoryIcon = (title = '', source = '') => {
    const text = (title + ' ' + source).toLowerCase();
    if (text.includes('trafic') || text.includes('bus') || text.includes('route') || text.includes('train')) return <Bus className="w-4 h-4 text-sky-300" />;
    if (text.includes('voiture') || text.includes('accident') || text.includes('radar')) return <Car className="w-4 h-4 text-teal-300" />;
    if (text.includes('meteo') || text.includes('temps') || text.includes('pluie') || text.includes('soleil')) return <Sun className="w-4 h-4 text-sky-200" />;
    if (text.includes('economie') || text.includes('bourse') || text.includes('prix') || text.includes('emploi')) return <Briefcase className="w-4 h-4 text-teal-300" />;
    if (text.includes('politique') || text.includes('gouvernement') || text.includes('commune')) return <Building2 className="w-4 h-4 text-cyan-300" />;
    if (text.includes('alerte') || text.includes('police') || text.includes('feu')) return <ShieldAlert className="w-4 h-4 text-sky-400" />;
    if (text.includes('tech') || text.includes('ia') || text.includes('innovation')) return <Zap className="w-4 h-4 text-teal-300" />;
    return <Globe className="w-4 h-4 text-sky-300" />;
  };

  const hasRealArticleImage = (url?: string) => {
    if (!url) return false;
    if (url.includes('images.unsplash.com')) return false;
    return true;
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchesSource = activeSourceFilter === 'all' || art.source === activeSourceFilter;
      const titleExcerpt = (art.title + ' ' + (art.excerpt || '')).toLowerCase();
      const matchesSearch = searchFilter === '' || titleExcerpt.includes(searchFilter.toLowerCase());

      const matchesCategory = 
        activeCategory === 'all' ? true :
        activeCategory === 'tech' ? (titleExcerpt.includes('tech') || titleExcerpt.includes('ia') || titleExcerpt.includes('innovation')) :
        activeCategory === 'mobility' ? (titleExcerpt.includes('trafic') || titleExcerpt.includes('bus') || titleExcerpt.includes('route') || titleExcerpt.includes('train')) :
        activeCategory === 'economy' ? (titleExcerpt.includes('bourse') || titleExcerpt.includes('prix') || titleExcerpt.includes('emploi') || titleExcerpt.includes('économie')) :
        true;

      return matchesSource && matchesSearch && matchesCategory;
    });
  }, [articles, activeSourceFilter, searchFilter, activeCategory]);

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-xl mx-auto pb-32 px-1 relative text-slate-100 font-sans">
      
      {/* POPUP REFRESH */}
      {showPopup && (
        <div className="fixed inset-x-0 top-6 z-[9999999] flex justify-center pointer-events-none px-4">
          <div className="bg-slate-900 border border-sky-400 text-sky-100 p-4 rounded-3xl shadow-2xl backdrop-blur-xl max-w-lg w-full font-mono space-y-2">
            <div className="flex items-center gap-2 border-b border-sky-400/30 pb-2">
              <CheckCircle2 className="w-4 h-4 text-sky-300 animate-pulse shrink-0" />
              <p className="font-bold uppercase text-xs">[FLUX_MIS_A_JOUR]</p>
            </div>
            <p className="text-[11px] text-sky-200">
              {newFetchedArticles.length > 0 
                ? `+${newFetchedArticles.length} nouveaux articles chargés` 
                : "Flux à jour, aucun nouvel article."}
            </p>
          </div>
        </div>
      )}

      {/* BOUTON REFRESH FLOTTANT */}
      <div 
        className="fixed right-3 z-[999999] pointer-events-auto"
        style={{ top: `calc(50vh + ${scrollY}px)` }}
      >
        <button
          onClick={handleRefreshNews}
          disabled={isRefreshing || isFetching}
          className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-sky-400 text-sky-300 shadow-2xl transition-all cursor-pointer flex items-center justify-center group active:scale-95"
          title="Rafraîchir les actualités"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing || isFetching ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {/* HEADER PRINCIPAL */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button 
            onClick={onBackToHome}
            className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-400/30 text-sky-300 transition-colors flex items-center gap-2 font-mono text-[11px] cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETOUR</span>
          </button>

          {/* FILTRES PAR SOURCE */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveSourceFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                activeSourceFilter === 'all' 
                  ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' 
                  : 'bg-slate-900/90 border-sky-400/30 text-slate-300 hover:text-white'
              }`}
            >
              TOUTES ({articles.length})
            </button>

            {availableSources.map((source) => {
              const cleanLabel = source.replace('www.', '').split('.')[0].toUpperCase();
              const isActive = activeSourceFilter === source;

              return (
                <button
                  key={source}
                  onClick={() => setActiveSourceFilter(source)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                    isActive 
                      ? 'bg-sky-500 border-sky-300 text-slate-950 shadow-md font-black' 
                      : 'bg-slate-900/90 border-sky-400/30 text-slate-300 hover:text-white'
                  }`}
                >
                  {cleanLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="relative">
          <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
          <input
            type="text"
            placeholder="Filtrer la timeline..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900/90 border border-sky-400/30 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-sky-200 placeholder-slate-400 focus:outline-none focus:border-sky-400 font-mono shadow-inner"
          />
        </div>
      </div>

      {/* --- TIMELINE DE NEWS --- */}
      {filteredArticles.length > 0 ? (
        <div className="relative pl-6 sm:pl-10 space-y-6 pt-2">
          
          {/* LIGNE BLEUE VERTICALE */}
          <div className="absolute left-6 sm:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-400 via-sky-600 to-sky-900 -translate-x-1/2 z-0" />

          {/* ENTÊTE "EN DIRECT" */}
          <div className="relative z-10 flex items-center gap-3 -ml-3">
            <div className="w-5 h-5 rounded-full bg-sky-400 border-4 border-slate-950 flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-sky-400 uppercase bg-slate-900/90 px-3 py-1 rounded-full border border-sky-400/30 shadow-sm">
              EN DIRECT • TODAY
            </span>
          </div>

          {/* LISTE DES ARTICLES */}
          {filteredArticles.map((art) => {
            const isSaved = savedArticleIds.includes(art.id);
            const cleanSource = art.source ? art.source.replace('www.', '') : 'News';
            const showImage = hasRealArticleImage(art.imageUrl);

            return (
              <div key={art.id} className="relative z-10 pl-5 sm:pl-8 group">
                
                {/* PUCE CIRCULAIRE SUR LA LIGNE */}
                <div className="absolute -left-3 sm:-left-3 top-1 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-sky-400 group-hover:border-sky-300 group-hover:scale-110 transition-all shadow-md flex items-center justify-center overflow-hidden">
                    {art.author?.avatar ? (
                      <img src={art.author.avatar} alt={cleanSource} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      getCategoryIcon(art.title, art.source)
                    )}
                  </div>
                </div>

                {/* CARTE DE L'ARTICLE */}
                <div 
                  onClick={() => onReadArticle(art)}
                  className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 hover:border-sky-400 rounded-3xl p-5 shadow-xl transition-all cursor-pointer space-y-3 backdrop-blur-md"
                >
                  {/* EN-TÊTE NODE */}
                  <div className="flex items-center justify-between border-b border-sky-400/30 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sky-300 text-xs tracking-wide bg-slate-900/90 px-2.5 py-1 rounded-xl border border-sky-400/30">
                        {cleanSource.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" /> {art.publishedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSave(art.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
                          isSaved ? 'bg-sky-500 text-slate-950 border-sky-300 font-bold shadow-md' : 'bg-slate-900/90 border-sky-400/30 text-slate-300 hover:text-white'
                        }`}
                        title={isSaved ? "Retirer" : "Sauvegarder"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

                      {art.url && (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-900/90 border border-sky-400/30 text-slate-300 hover:text-sky-300 transition-colors shadow-sm"
                          title="Ouvrir la source externe"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* CONTENU TEXTE */}
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white text-xs group-hover:text-sky-300 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    {art.excerpt && (
                      <p className="text-slate-300 text-[11px] line-clamp-3 leading-relaxed font-medium">
                        {art.excerpt}
                      </p>
                    )}
                  </div>

                  {/* IMAGE - S'AFFICHE UNIQUEMENT SI UNE VRAIE PHOTO EST DÉTECTÉE */}
                  {showImage && (
                    <div className="pt-1">
                      <div className="h-36 w-full max-w-sm rounded-2xl overflow-hidden border border-sky-400/30 shadow-inner">
                        <img 
                          src={art.imageUrl} 
                          alt={art.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-12 text-center space-y-3 font-mono shadow-xl backdrop-blur-md">
          <Newspaper className="w-10 h-10 text-sky-400 mx-auto animate-pulse" />
          <p className="text-xs text-sky-200">
            {isFetching ? "CHARGEMENT DE LA TIMELINE EN COURS..." : "AUCUN ARTICLE TROUVÉ DANS LA TIMELINE."}
          </p>
        </div>
      )}

    </div>
  );
};

export default SourcesNewsPage;