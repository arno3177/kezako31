import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Article, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Bookmark, Clock, ChevronRight, 
  ArrowLeft, ExternalLink, Terminal, Newspaper,
  Car, Bus, Sun, Briefcase, Building2, ShieldAlert, Zap, Globe, RefreshCw, CheckCircle2
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
  onBackToHome,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeSourceFilter, setActiveSourceFilter] = useState<'all' | 'franceinfo' | 'essentiel'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // État pour la popup et les titres des NOUVEAUX articles uniquement
  const [showPopup, setShowPopup] = useState(false);
  const [newFetchedArticles, setNewFetchedArticles] = useState<Article[]>([]);

  // Garde en mémoire les IDs des articles déjà connus au chargement initial
  const knownArticleIdsRef = useRef<Set<string>>(new Set(articles.map(a => a.id)));

  // État pour suivre la position exacte du scroll
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Action de rafraîchissement : isole uniquement les articles jamais vus/chargés auparavant
  const handleRefreshNews = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setActiveSourceFilter('all');
    setActiveCategory('all');
    setSearchFilter('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Détecte les articles présents dans le state global qui ne sont PAS dans la liste des connus
    const brandNewArticles = articles.filter(art => !knownArticleIdsRef.current.has(art.id));

    // Met à jour la liste des connus avec les nouveaux articles trouvés
    articles.forEach(art => knownArticleIdsRef.current.add(art.id));

    setNewFetchedArticles(brandNewArticles);
    setShowPopup(true);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);

    // Masque la popup après 5 secondes exactes
    setTimeout(() => {
      setShowPopup(false);
    }, 5000);
  };

  // Attribuer un thème de couleur subtil selon la source
  const getSourceTheme = (source = '') => {
    const src = source.toLowerCase();
    if (src.includes('franceinfo') || src.includes('france')) {
      return {
        badge: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
        border: 'border-indigo-500/40 hover:border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]',
        accentText: 'text-indigo-400',
        glow: 'from-indigo-950/60 via-[#070b14] to-[#05080f]'
      };
    }
    if (src.includes('essentiel')) {
      return {
        badge: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
        border: 'border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        accentText: 'text-emerald-400',
        glow: 'from-emerald-950/60 via-[#070b14] to-[#05080f]'
      };
    }
    return {
      badge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
      border: 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      accentText: 'text-cyan-400',
      glow: 'from-cyan-950/60 via-[#070b14] to-[#05080f]'
    };
  };

  // Déterminer l'icône selon la thématique de l'article
  const getCategoryIcon = (title = '', source = '') => {
    const text = (title + ' ' + source).toLowerCase();
    if (text.includes('trafic') || text.includes('bus') || text.includes('route') || text.includes('train')) return <Bus className="w-3.5 h-3.5 text-sky-400" />;
    if (text.includes('voiture') || text.includes('accident') || text.includes('radar')) return <Car className="w-3.5 h-3.5 text-amber-400" />;
    if (text.includes('meteo') || text.includes('temps') || text.includes('pluie') || text.includes('soleil')) return <Sun className="w-3.5 h-3.5 text-amber-300" />;
    if (text.includes('economie') || text.includes('bourse') || text.includes('prix') || text.includes('emploi')) return <Briefcase className="w-3.5 h-3.5 text-emerald-400" />;
    if (text.includes('politique') || text.includes('gouvernement') || text.includes('commune')) return <Building2 className="w-3.5 h-3.5 text-emerald-300" />;
    if (text.includes('alerte') || text.includes('police') || text.includes('feu')) return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
    if (text.includes('tech') || text.includes('ia') || text.includes('innovation')) return <Zap className="w-3.5 h-3.5 text-cyan-300" />;
    return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
  };

  // Filtrage global des articles
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const sourceStr = (art.source || '').toLowerCase();
      const matchesSource = 
        activeSourceFilter === 'all' ? true :
        activeSourceFilter === 'franceinfo' ? sourceStr.includes('franceinfo') :
        sourceStr.includes('essentiel');
      
      const titleExcerpt = (art.title + ' ' + (art.excerpt || '')).toLowerCase();
      const matchesSearch = 
        searchFilter === '' || titleExcerpt.includes(searchFilter.toLowerCase());

      const matchesCategory = 
        activeCategory === 'all' ? true :
        activeCategory === 'tech' ? (titleExcerpt.includes('tech') || titleExcerpt.includes('ia') || titleExcerpt.includes('innovation')) :
        activeCategory === 'mobility' ? (titleExcerpt.includes('trafic') || titleExcerpt.includes('bus') || titleExcerpt.includes('route') || titleExcerpt.includes('train')) :
        activeCategory === 'economy' ? (titleExcerpt.includes('bourse') || titleExcerpt.includes('prix') || titleExcerpt.includes('emploi') || titleExcerpt.includes('économie')) :
        true;

      return matchesSource && matchesSearch && matchesCategory;
    });
  }, [articles, activeSourceFilter, searchFilter, activeCategory]);

  const leftArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const centerArticle = filteredArticles.length > 1 ? filteredArticles[1] : null;
  const rightArticle = filteredArticles.length > 2 ? filteredArticles.slice(2, 4) : [];
  const bottomArticles = filteredArticles.length > 4 ? filteredArticles.slice(4) : [];

  const leftTheme = leftArticle ? getSourceTheme(leftArticle.source) : null;
  const centerTheme = centerArticle ? getSourceTheme(centerArticle.source) : null;

  return (
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-7xl mx-auto pb-32 px-4 relative">
      
      {/* POPUP DE NOTIFICATION (5 SECONDES - UNIQUEMENT LES NOUVEAUX ARTICLES) */}
      {showPopup && (
        <div className="fixed inset-x-0 top-6 z-[9999999] flex justify-center pointer-events-none px-4 animate-fade-in">
          <div className="bg-[#090d16]/95 border-2 border-cyan-400 text-cyan-200 p-5 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.8)] backdrop-blur-xl max-w-lg w-full font-mono space-y-3">
            <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-white text-xs">[REFRESH_DONE]</p>
                <p className="text-[10px] text-cyan-300">
                  {newFetchedArticles.length > 0 
                    ? `+${newFetchedArticles.length} nouveaux articles détectés :` 
                    : "Aucun nouvel article pour le moment."}
                </p>
              </div>
            </div>
            {newFetchedArticles.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {newFetchedArticles.map((art) => (
                  <div key={art.id} className="text-[11px] text-slate-300 bg-cyan-950/40 border border-cyan-500/20 rounded-lg p-2 flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">&gt;</span>
                    <span className="line-clamp-1 font-serif text-white">{art.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOUTON DE REFRESH RÉDUIT ET FLOTTANT AU RYTHME DU SCROLL */}
      <div 
        className="fixed right-5 z-[999999] pointer-events-auto"
        style={{ 
          top: `calc(50vh + ${scrollY}px)` 
        }}
      >
        <button
          onClick={handleRefreshNews}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-[#090d16]/95 hover:bg-cyan-950 border border-cyan-400/80 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] backdrop-blur-2xl transition-all duration-300 cursor-pointer flex items-center justify-center group active:scale-95"
          title="Rafraîchir le flux d'actualités"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {/* 1. HEADER HUD / EN-TÊTE ÉPURÉ */}
      <div className="relative bg-gradient-to-r from-[#090d16] via-[#0d1527] to-[#090d16] border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden text-center">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 mb-4">
          <button 
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 transition-colors flex items-center gap-2 cursor-pointer font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[RETOUR_BASE]</span>
          </button>

          {/* FILTRES PAR SOURCE */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSourceFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeSourceFilter === 'all' 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; TOUS [{articles.length}]
            </button>
            <button
              onClick={() => setActiveSourceFilter('franceinfo')}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeSourceFilter === 'franceinfo' 
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; FRANCE_INFO
            </button>
            <button
              onClick={() => setActiveSourceFilter('essentiel')}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold transition-all cursor-pointer border ${
                activeSourceFilter === 'essentiel' 
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              &gt; L_ESSENTIEL
            </button>
          </div>
        </div>

        {/* TITRE PRINCIPAL : NEWS FEED + DATE */}
        <div className="space-y-2 border-y-2 border-cyan-500/40 py-4 my-2 relative z-10">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
            <span>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase font-serif">
            NEWS FEED
          </h1>
        </div>

        {/* BARRE DE RECHERCHE & CATÉGORIES */}
        <div className="mt-6 flex flex-col md:flex-row gap-3 relative z-10">
          <div className="relative flex-1">
            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="rechercher dans le flux d'actualités..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#05080f]/90 border border-cyan-500/30 rounded-2xl pl-11 pr-4 py-3 text-xs md:text-sm text-cyan-200 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 font-mono transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Toutes rubriques' },
              { id: 'mobility', label: 'Transport' },
              { id: 'tech', label: 'Tech' },
              { id: 'economy', label: 'Économie' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 rounded-xl font-mono text-[11px] whitespace-nowrap transition-all cursor-pointer border ${
                  activeCategory === cat.id 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MISE EN PAGE 3 COLONNES STYLE "DAILY CHRONICLE" */}
      {filteredArticles.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLONNE DE GAUCHE : PORTRAIT / ARTICLE FOCUS */}
            {leftArticle && leftTheme && (
              <div 
                onClick={() => onReadArticle(leftArticle)}
                className={`lg:col-span-3 group relative bg-gradient-to-b ${leftTheme.glow} border-2 ${leftTheme.border} rounded-3xl p-5 shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className="text-center border-b border-slate-800 pb-3">
                    <div className={`w-12 h-12 mx-auto rounded-full bg-slate-900 border ${leftTheme.border} flex items-center justify-center mb-2 shadow-md`}>
                      {getCategoryIcon(leftArticle.title, leftArticle.source)}
                    </div>
                    <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${leftTheme.badge}`}>
                      [{leftArticle.source}]
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-white text-base md:text-lg group-hover:text-cyan-300 transition-colors leading-snug text-center">
                    {leftArticle.title}
                  </h3>

                  <p className="text-slate-300 text-xs font-serif leading-relaxed line-clamp-6 italic border-l-2 border-slate-700 pl-2">
                    "{leftArticle.excerpt}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-800 text-xs font-mono">
                  <span className={`${leftTheme.accentText} font-bold`}>[LIRE]</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(leftArticle.id);
                      }}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        savedArticleIds.includes(leftArticle.id) ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(leftArticle.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COLONNE CENTRALE : LE GRAND ARTICLE EN VEDETTE */}
            {centerArticle && centerTheme && (
              <div 
                onClick={() => onReadArticle(centerArticle)}
                className={`lg:col-span-6 group relative bg-gradient-to-b ${centerTheme.glow} border-2 ${centerTheme.border} rounded-3xl p-6 md:p-8 shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-slate-900 border ${centerTheme.border}`}>
                        {getCategoryIcon(centerArticle.title, centerArticle.source)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-widest border ${centerTheme.badge}`}>
                        [{centerArticle.source}]
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" /> {centerArticle.publishedAt}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-cyan-300 transition-colors font-serif leading-tight text-center pt-2">
                    {centerArticle.title}
                  </h2>

                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-serif text-center px-2">
                    {centerArticle.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800 text-xs font-mono">
                  <span className={`${centerTheme.accentText} font-bold flex items-center gap-1 group-hover:translate-x-1.5 transition-transform`}>
                    <span>[CONSULTER L'ARTICLE COMPLET]</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(centerArticle.id);
                      }}
                      className={`p-2 rounded-xl border transition-colors ${
                        savedArticleIds.includes(centerArticle.id) ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds.includes(centerArticle.id) ? 'fill-current' : ''}`} />
                    </button>
                    {centerArticle.url && (
                      <a
                        href={centerArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* COLONNE DE DROITE : ENCADRÉ TYPE FLASH */}
            <div className="lg:col-span-3 space-y-4">
              {rightArticle.map((art) => {
                const isSaved = savedArticleIds.includes(art.id);
                const artTheme = getSourceTheme(art.source);

                return (
                  <div
                    key={art.id}
                    onClick={() => onReadArticle(art)}
                    className={`group relative bg-gradient-to-b ${artTheme.glow} border-2 ${artTheme.border} rounded-3xl p-5 shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${artTheme.badge}`}>
                          [{art.source}]
                        </span>
                        <div className={`p-1 rounded bg-slate-900 border ${artTheme.border}`}>
                          {getCategoryIcon(art.title, art.source)}
                        </div>
                      </div>

                      <h3 className="font-serif font-black text-white text-sm group-hover:text-cyan-300 transition-colors leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3">
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs font-mono">
                      <span className={`${artTheme.accentText} font-bold`}>[LIRE]</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(art.id);
                        }}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isSaved ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* 3. GRILLE COMPLÉMENTAIRE EN DESSOUS */}
          {bottomArticles.length > 0 && (
            <div className="pt-4 space-y-3">
              <div className="border-b border-cyan-500/30 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  // ARCHIVES SUPPLÉMENTAIRES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bottomArticles.map((art) => {
                  const isSaved = savedArticleIds.includes(art.id);
                  const artTheme = getSourceTheme(art.source);

                  return (
                    <div
                      key={art.id}
                      onClick={() => onReadArticle(art)}
                      className={`group bg-gradient-to-br ${artTheme.glow} border ${artTheme.border} rounded-2xl p-4 shadow-lg cursor-pointer transition-all flex flex-col justify-between`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${artTheme.badge} uppercase`}>
                            [{art.source}]
                          </span>
                          <div className={`p-1 rounded bg-slate-900 border ${artTheme.border}`}>
                            {getCategoryIcon(art.title, art.source)}
                          </div>
                        </div>
                        <h4 className="font-serif font-bold text-white text-xs group-hover:text-cyan-300 line-clamp-2">
                          {art.title}
                        </h4>
                      </div>
                      <div className={`flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[10px] font-mono ${artTheme.accentText}`}>
                        <span>[ACCÉDER]</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#090d16] border border-cyan-500/30 rounded-3xl p-12 text-center space-y-3 font-mono">
          <Newspaper className="w-10 h-10 text-cyan-500 mx-auto animate-pulse" />
          <p className="text-sm text-cyan-300">[!] AUCUN ARTICLE DISPONIBLE.</p>
        </div>
      )}

    </div>
  );
};