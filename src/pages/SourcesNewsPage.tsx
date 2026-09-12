import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Article, AppSettings } from '../types';
import { 
  Bookmark, ArrowLeft, Terminal, Newspaper,
  Car, Bus, Sun, Briefcase, Building2, ShieldAlert, Zap, Globe, RefreshCw, CheckCircle2,
  Clock, ExternalLink
} from 'lucide-react';

interface SourcesNewsPageProps {
  articles: Article[];
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onBackToHome: () => void;
  language?: AppSettings['language'];
}

export const SourcesNewsPage: React.FC<SourcesNewsPageProps> = ({
  articles,
  savedArticleIds,
  onToggleSave,
  onReadArticle,
  onBackToHome
}) => {
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

  const handleRefreshNews = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setActiveSourceFilter('all');
    setActiveCategory('all');
    setSearchFilter('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
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

  // Détermine si une vraie image d'article existe (exclut les placeholders unsplash par défaut)
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
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-4xl mx-auto pb-32 px-4 relative text-slate-100 font-sans">
      
      {/* POPUP REFRESH */}
      {showPopup && (
        <div className="fixed inset-x-0 top-6 z-[9999999] flex justify-center pointer-events-none px-4">
          <div className="bg-[#0b1d33] border border-sky-400 text-sky-100 p-4 rounded-2xl shadow-2xl backdrop-blur-xl max-w-lg w-full font-mono space-y-2">
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
        className="fixed right-5 z-[999999] pointer-events-auto"
        style={{ top: `calc(50vh + ${scrollY}px)` }}
      >
        <button
          onClick={handleRefreshNews}
          disabled={isRefreshing}
          className="p-3 rounded-full bg-[#0b192e] hover:bg-[#122b4f] border border-sky-400 text-sky-300 shadow-2xl transition-all cursor-pointer flex items-center justify-center group active:scale-95"
          title="Rafraîchir les actualités"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {/* HEADER PRINCIPAL */}
      <div className="bg-[#0b192e] border border-sky-900/50 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <button 
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-xl bg-[#071120] hover:bg-[#102442] border border-sky-800/60 text-sky-300 transition-colors flex items-center gap-2 font-mono text-[11px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETOUR</span>
          </button>

          {/* FILTRES PAR SOURCE */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSourceFilter('all')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                activeSourceFilter === 'all' 
                  ? 'bg-sky-500 border-sky-300 text-white shadow-md' 
                  : 'bg-[#071120] border-sky-900/60 text-slate-400 hover:text-white'
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
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                    isActive 
                      ? 'bg-sky-500 border-sky-300 text-white shadow-md' 
                      : 'bg-[#071120] border-sky-900/60 text-slate-400 hover:text-white'
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
            className="w-full bg-[#050c17] border border-sky-900/80 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-sky-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
          />
        </div>
      </div>

      {/* --- TIMELINE DE NEWS --- */}
      {filteredArticles.length > 0 ? (
        <div className="relative pl-6 md:pl-10 space-y-8 pt-4">
          
          {/* LIGNE BLEUE VERTICALE */}
          <div className="absolute left-6 md:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-400 via-sky-600 to-sky-900 -translate-x-1/2 z-0" />

          {/* ENTÊTE "EN DIRECT" */}
          <div className="relative z-10 flex items-center gap-3 -ml-3">
            <div className="w-6 h-6 rounded-full bg-sky-400 border-4 border-[#071120] flex items-center justify-center shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-sky-400 uppercase bg-[#071120] px-2.5 py-1 rounded-full border border-sky-800">
              EN DIRECT • TODAY
            </span>
          </div>

          {/* LISTE DES ARTICLES */}
          {filteredArticles.map((art) => {
            const isSaved = savedArticleIds.includes(art.id);
            const cleanSource = art.source ? art.source.replace('www.', '') : 'News';
            const showImage = hasRealArticleImage(art.imageUrl);

            return (
              <div key={art.id} className="relative z-10 pl-6 md:pl-10 group">
                
                {/* PUCE CIRCULAIRE SUR LA LIGNE */}
                <div className="absolute -left-3 md:-left-3 top-1 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#09182b] border-2 border-sky-400 group-hover:border-sky-200 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center justify-center overflow-hidden">
                    {art.author?.avatar ? (
                      <img src={art.author.avatar} alt={cleanSource} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      getCategoryIcon(art.title, art.source)
                    )}
                  </div>
                </div>

                {/* CARTE DE ARTICLE */}
                <div 
                  onClick={() => onReadArticle(art)}
                  className="bg-[#0b182b] border border-sky-900/60 hover:border-sky-400/80 rounded-2xl p-5 shadow-lg transition-all cursor-pointer space-y-3 group-hover:bg-[#0e2038]"
                >
                  {/* EN-TÊTE NODE */}
                  <div className="flex items-center justify-between border-b border-sky-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-300 text-xs tracking-wide">
                        {cleanSource.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" /> {art.publishedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleSave(art.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isSaved ? 'bg-sky-500 text-white border-sky-300' : 'bg-[#050e1a] border-sky-900 text-slate-400 hover:text-white'
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
                          className="p-1.5 rounded-lg bg-[#050e1a] border border-sky-900 text-slate-400 hover:text-sky-300 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* CONTENU TEXTE */}
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-white text-sm group-hover:text-sky-300 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    {art.excerpt && (
                      <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed font-normal">
                        {art.excerpt}
                      </p>
                    )}
                  </div>

                  {/* IMAGE - S'AICHE UNIQUEMENT SI UNE VRAIE PHOTO EST DÉTECTÉE */}
                  {showImage && (
                    <div className="pt-2">
                      <div className="h-36 w-full max-w-sm rounded-xl overflow-hidden border border-sky-950 shadow-inner">
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
        <div className="bg-[#0b182b] border border-sky-900/60 rounded-3xl p-12 text-center space-y-3 font-mono">
          <Newspaper className="w-10 h-10 text-sky-400 mx-auto animate-pulse" />
          <p className="text-sm text-sky-200">AUCUN ARTICLE TROUVÉ DANS LA TIMELINE.</p>
        </div>
      )}

    </div>
  );
};

export default SourcesNewsPage;