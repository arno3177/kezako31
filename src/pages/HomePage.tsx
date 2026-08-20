import React, { useState } from 'react';
import { Article, WeatherData } from '../types';
import { WeatherWidget } from '../components/WeatherWidget';
import { 
  Bookmark, ChevronRight, CloudSun, ShieldCheck, Radio, Split,
  Globe, Landmark, TrendingUp, Cpu, Leaf, Trophy, Film, Newspaper, Layers
} from 'lucide-react';

interface HomePageProps {
  articles: Article[];
  currentWeather: WeatherData;
  weatherDataMap: Record<string, WeatherData>;
  setWeatherDataMap: React.Dispatch<React.SetStateAction<Record<string, WeatherData>>>;
  activeCity: string;
  setActiveCity: (city: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onViewWeatherDetail: () => void;
  onViewSourcesNews: () => void;
}

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Toutes les catégories', icon: Layers },
  { id: 'politique', label: 'Politique & Société', icon: Landmark, keywords: ['politi', 'societ', 'gouv', 'justice'] },
  { id: 'monde', label: 'Monde & International', icon: Globe, keywords: ['monde', 'international', 'europe', 'luxembourg'] },
  { id: 'economie', label: 'Économie & Finance', icon: TrendingUp, keywords: ['econo', 'finan', 'bourse', 'march'] },
  { id: 'tech', label: 'Tech & Sciences', icon: Cpu, keywords: ['tech', 'ia', 'web', 'numerique', 'scien'] },
  { id: 'ecologie', label: 'Écologie & Climat', icon: Leaf, keywords: ['climat', 'eco', 'nature', 'environ'] },
  { id: 'sports', label: 'Sports', icon: Trophy, keywords: ['sport', 'foot', 'velo', 'match'] },
  { id: 'culture', label: 'Culture & Médias', icon: Film, keywords: ['cultur', 'cinema', 'art', 'musique'] },
];

export const HomePage: React.FC<HomePageProps> = ({
  articles = [],
  currentWeather,
  activeCity,
  setActiveCity,
  searchQuery,
  savedArticleIds = [],
  onToggleSave,
  onReadArticle,
  onViewWeatherDetail,
  onViewSourcesNews
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const safeArticles = Array.isArray(articles) ? articles : [];
  const safeSavedIds = Array.isArray(savedArticleIds) ? savedArticleIds : [];

  const baseFilteredArticles = safeArticles.filter(article => {
    if (!article) return false;
    return searchQuery === '' || 
      (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const availableCategories = CATEGORY_FILTERS.filter(cat => {
    if (cat.id === 'all') return true;
    return baseFilteredArticles.some(article => {
      const textToSearch = `${article.category || ''} ${article.title || ''}`.toLowerCase();
      return cat.keywords?.some(kw => textToSearch.includes(kw));
    });
  });

  const finalFilteredArticles = baseFilteredArticles.filter(article => {
    if (selectedCategory === 'all') return true;
    const currentFilterObj = CATEGORY_FILTERS.find(c => c.id === selectedCategory);
    if (!currentFilterObj || !currentFilterObj.keywords) return true;

    const textToSearch = `${article.category || ''} ${article.title || ''}`.toLowerCase();
    return currentFilterObj.keywords.some(kw => textToSearch.includes(kw));
  });

  const franceInfoArticles = finalFilteredArticles
    .filter(a => a.source && a.source.includes('franceinfo'))
    .slice(0, 3);

  const lessentielArticles = finalFilteredArticles
    .filter(a => a.source && a.source.includes('lessentiel'))
    .slice(0, 3);

  const renderCategoryIcon = (category = '', title = '') => {
    const text = `${category} ${title}`.toLowerCase();
    
    if (text.includes('monde') || text.includes('international') || text.includes('europe') || text.includes('luxembourg')) {
      return <Globe className="w-3.5 h-3.5" />;
    }
    if (text.includes('politi') || text.includes('societ') || text.includes('gouv') || text.includes('justice')) {
      return <Landmark className="w-3.5 h-3.5" />;
    }
    if (text.includes('econo') || text.includes('finan') || text.includes('bourse') || text.includes('march')) {
      return <TrendingUp className="w-3.5 h-3.5" />;
    }
    if (text.includes('tech') || text.includes('ia') || text.includes('web') || text.includes('numerique') || text.includes('scien')) {
      return <Cpu className="w-3.5 h-3.5" />;
    }
    if (text.includes('climat') || text.includes('eco') || text.includes('nature') || text.includes('environ')) {
      return <Leaf className="w-3.5 h-3.5" />;
    }
    if (text.includes('sport') || text.includes('foot') || text.includes('velo') || text.includes('match')) {
      return <Trophy className="w-3.5 h-3.5" />;
    }
    if (text.includes('cultur') || text.includes('cinema') || text.includes('art') || text.includes('musique')) {
      return <Film className="w-3.5 h-3.5" />;
    }
    return <Newspaper className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* 1. SECTION CADRE MÉTÉO & PRÉVISIONS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1e2a] via-[#151821] to-[#11131c] border border-gray-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-3 pb-1 border-b border-gray-800/60">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CloudSun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Météo & Prévisions Directes</h2>
              <p className="text-[11px] text-gray-400">Conditions actuelles et aperçu à court terme</p>
            </div>
          </div>

          <div>
            <WeatherWidget
              weather={currentWeather}
              activeCity={activeCity}
              setActiveCity={setActiveCity}
              onViewDetail={onViewWeatherDetail}
            />
          </div>
        </div>
      </div>

      {/* 2. SECTION CADRE DES INFORMATIONS (FOND NUANCÉ VIOLET/ROSE SOMBRE + AMBRE) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1829] via-[#151322] to-[#100e1a] border border-purple-900/40 p-6 md:p-8 shadow-2xl space-y-6">
        {/* HALOS LUMINEUX AMBIANTS : ROSE FONCÉ & AMBRE SOLEIL */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* EN-TÊTE ET FILTRES DE LA SECTION INFOS */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-purple-800/30 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/20 flex-shrink-0">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">Les Titres de la Presse</h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold">
                  Top 3 en Direct
                </span>
              </div>
              <p className="text-xs text-purple-300/70">Aperçu rapide des 3 titres principaux par média</p>
            </div>
          </div>

          {/* BARRE D'ACTIONS ET FILTRES D'ICÔNES */}
          <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1 lg:pb-0 scrollbar-thin">
            <button
              onClick={onViewSourcesNews}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 hover:text-white border border-purple-500/20 text-xs font-bold transition-all flex items-center space-x-1.5 flex-shrink-0 cursor-pointer shadow-sm"
            >
              <Radio className="w-4 h-4 text-pink-400" />
              <span>Voir les flux détaillés</span>
            </button>

            <div className="h-6 w-px bg-purple-800/40 flex-shrink-0 mx-1"></div>

            <div className="flex items-center space-x-1 bg-[#120f1c]/80 p-1 rounded-xl border border-purple-800/30 backdrop-blur-md">
              {availableCategories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={cat.label}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md scale-105' 
                        : 'text-purple-300/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRILLE DUEL FRANCE INFO / L'ESSENTIEL À L'INTÉRIEUR DU CADRE */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* COLONNE FRANCE INFO */}
          <div className="space-y-4 bg-[#111320]/80 border border-blue-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-400"></div>

            <div className="flex items-center justify-between pb-3 border-b border-purple-800/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-base font-extrabold text-white">
                    France Info
                  </h3>
                  <span className="text-[10px] text-blue-400 font-semibold">www.franceinfo.fr</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/30">
                {franceInfoArticles.length} / 3 Titres
              </span>
            </div>

            {franceInfoArticles.length === 0 ? (
              <div className="p-6 text-center text-purple-300/60 text-xs bg-[#0c0e18] rounded-2xl border border-purple-900/20">
                Aucun titre disponible dans cette catégorie.
              </div>
            ) : (
              <div className="space-y-2.5">
                {franceInfoArticles.map((article) => {
                  const isSaved = safeSavedIds.includes(article.id);
                  return (
                    <div
                      key={article.id}
                      onClick={() => onReadArticle(article)}
                      className="group bg-[#0c0e18]/90 hover:bg-[#131728] border border-purple-900/30 hover:border-blue-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div 
                          className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex-shrink-0"
                          title={article.category || 'Actualité'}
                        >
                          {renderCategoryIcon(article.category, article.title)}
                        </div>

                        <h4 className="font-['Playfair_Display'] text-xs md:text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSaved ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                          }`}
                          title={isSaved ? 'Retirer' : 'Enregistrer'}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLONNE L'ESSENTIEL */}
          <div className="space-y-4 bg-[#1b111e]/80 border border-pink-500/25 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-rose-400"></div>

            <div className="flex items-center justify-between pb-3 border-b border-purple-800/20">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-['Playfair_Display'] text-base font-extrabold text-white">
                    L'Essentiel Luxembourg
                  </h3>
                  <span className="text-[10px] text-pink-400 font-semibold">www.lessentiel.lu</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-pink-300 bg-pink-500/20 px-2.5 py-1 rounded-full border border-pink-500/30">
                {lessentielArticles.length} / 3 Titres
              </span>
            </div>

            {lessentielArticles.length === 0 ? (
              <div className="p-6 text-center text-purple-300/60 text-xs bg-[#140b17] rounded-2xl border border-purple-900/20">
                Aucun titre disponible dans cette catégorie.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lessentielArticles.map((article) => {
                  const isSaved = safeSavedIds.includes(article.id);
                  return (
                    <div
                      key={article.id}
                      onClick={() => onReadArticle(article)}
                      className="group bg-[#140b17]/90 hover:bg-[#1e1022] border border-purple-900/30 hover:border-pink-500/40 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div 
                          className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex-shrink-0"
                          title={article.category || 'Actualité'}
                        >
                          {renderCategoryIcon(article.category, article.title)}
                        </div>

                        <h4 className="font-['Playfair_Display'] text-xs md:text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isSaved ? 'bg-pink-600 text-white border-pink-600' : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
                          }`}
                          title={isSaved ? 'Retirer' : 'Enregistrer'}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};