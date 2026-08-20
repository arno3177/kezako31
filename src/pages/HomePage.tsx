import React from 'react';
import { Article, WeatherData } from '../types';
import { WeatherWidget } from '../components/WeatherWidget';
import { CitySearchAutocomplete } from '../components/CitySearchAutocomplete';
import { 
  Sparkles, Globe, Bookmark, Radio, ShieldCheck, ChevronRight 
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

export const HomePage: React.FC<HomePageProps> = ({
  articles = [],
  currentWeather,
  weatherDataMap,
  setWeatherDataMap,
  activeCity,
  setActiveCity,
  searchQuery,
  savedArticleIds = [],
  onToggleSave,
  onReadArticle,
  onViewWeatherDetail,
  onViewSourcesNews
}) => {
  const safeArticles = Array.isArray(articles) ? articles : [];
  const safeSavedIds = Array.isArray(savedArticleIds) ? savedArticleIds : [];

  const filteredArticles = safeArticles.filter(article => {
    if (!article) return false;
    const matchesSearch = searchQuery === '' || 
      (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const franceInfoArticles = filteredArticles
    .filter(a => a.source && a.source.includes('franceinfo'))
    .slice(0, 5);

  const lessentielArticles = filteredArticles
    .filter(a => a.source && a.source.includes('lessentiel'))
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-fade-in pb-16">
      
      {/* Immersive Editorial Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1e2a] via-[#151821] to-[#11131c] border border-gray-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Journalisme d'excellence & Météo Live</span>
            </div>
            <h1 className="font-['Playfair_Display'] text-3xl md:text-5xl font-extrabold text-white leading-tight">
              L'information éclairée, <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-pink-400 bg-clip-text text-transparent">
                la météo mondiale en direct.
              </span>
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-xl leading-relaxed">
              Sélection officielle des 5 premiers articles de nos sources partenaires (France Info et L'Essentiel), combinée aux prévisions météo en temps réel.
            </p>
            <div className="pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Recherche libre et instantanée de ville :
              </label>
              <CitySearchAutocomplete
                weatherDataMap={weatherDataMap}
                setWeatherDataMap={setWeatherDataMap}
                activeCity={activeCity}
                setActiveCity={setActiveCity}
              />
            </div>
          </div>

          <div className="lg:col-span-5">
            <WeatherWidget
              weather={currentWeather}
              activeCity={activeCity}
              setActiveCity={setActiveCity}
              onViewDetail={onViewWeatherDetail}
            />
          </div>

        </div>
      </div>

      {/* Quick Navigation bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Flux Directs par Source</h2>
            <p className="text-xs text-gray-400">Affichage horizontal compact des 5 premiers articles</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={onViewSourcesNews}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold transition-all flex items-center space-x-2 w-full md:w-auto justify-center cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Voir tous les flux détaillés</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: FRANCE INFO */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-white flex items-center space-x-2">
                <span>France Info</span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  www.franceinfo.fr
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Les 5 actualités phares en continu</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 bg-[#161923] px-3 py-1 rounded-xl border border-gray-800">
            {franceInfoArticles.length} / 5 articles
          </span>
        </div>

        {franceInfoArticles.length === 0 ? (
          <div className="p-6 text-center bg-[#161923] rounded-2xl border border-gray-800">
            <p className="text-xs text-gray-400">Aucun article trouvé pour France Info.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {franceInfoArticles.map((article) => {
              const isSaved = safeSavedIds.includes(article.id);
              return (
                <div 
                  key={article.id}
                  onClick={() => onReadArticle(article)}
                  className="group bg-[#161923] border border-blue-500/20 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 flex flex-row items-stretch p-3 gap-3.5"
                >
                  <div className="relative w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-black/40">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 min-h-[90px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-1.5 left-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[9px] font-bold backdrop-blur-md">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-semibold text-blue-400">France Info</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h4 className="font-['Playfair_Display'] text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mt-1">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-gray-400 truncate max-w-[80px]">{article.publishedAt}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                          className={`p-1 rounded-md border transition-all ${isSaved ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-gray-400 hover:text-white border-white/10'}`}
                          title={isSaved ? 'Retirer' : 'Enregistrer'}
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>
                        <span className="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                          <span>Lire</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: L'ESSENTIEL */}
      <div className="space-y-5 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-white flex items-center space-x-2">
                <span>L'Essentiel Luxembourg</span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  www.lessentiel.lu
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Les 5 actualités phares de la Grande Région</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-gray-400 bg-[#161923] px-3 py-1 rounded-xl border border-gray-800">
            {lessentielArticles.length} / 5 articles
          </span>
        </div>

        {lessentielArticles.length === 0 ? (
          <div className="p-6 text-center bg-[#161923] rounded-2xl border border-gray-800">
            <p className="text-xs text-gray-400">Aucun article trouvé pour L'Essentiel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessentielArticles.map((article) => {
              const isSaved = safeSavedIds.includes(article.id);
              return (
                <div 
                  key={article.id}
                  onClick={() => onReadArticle(article)}
                  className="group bg-[#161923] border border-pink-500/20 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 flex flex-row items-stretch p-3 gap-3.5"
                >
                  <div className="relative w-28 sm:w-32 flex-shrink-0 rounded-xl overflow-hidden bg-black/40">
                    <img 
                      src={article.imageUrl} 
                      alt={article.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 min-h-[90px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-1.5 left-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-pink-600/90 text-white text-[9px] font-bold backdrop-blur-md">
                        {article.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                        <span className="font-semibold text-pink-400">L'Essentiel</span>
                        <span>{article.readTime}</span>
                      </div>
                      <h4 className="font-['Playfair_Display'] text-xs font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mt-1">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-gray-400 truncate max-w-[80px]">{article.publishedAt}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(article.id); }}
                          className={`p-1 rounded-md border transition-all ${isSaved ? 'bg-pink-600 text-white border-pink-600' : 'bg-white/5 text-gray-400 hover:text-white border-white/10'}`}
                          title={isSaved ? 'Retirer' : 'Enregistrer'}
                        >
                          <Bookmark className="w-3 h-3" />
                        </button>
                        <span className="text-pink-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center space-x-0.5">
                          <span>Lire</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
