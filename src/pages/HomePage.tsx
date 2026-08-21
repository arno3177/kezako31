import React, { useState } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, ArrowRight, Bookmark,
  Newspaper, ExternalLink, ChevronRight,
  Car, Bus, Navigation,
  Sunrise, Sunset, Sparkles
} from 'lucide-react';

interface HomePageProps {
  articles: Article[];
  currentWeather: WeatherData;
  weatherDataMap: Record<string, WeatherData>;
  setWeatherDataMap: React.Dispatch<React.SetStateAction<Record<string, WeatherData>>>;
  activeCity: string;
  setActiveCity: (city: string) => void;
  savedArticleIds: string[];
  onToggleSave: (id: string) => void;
  onReadArticle: (article: Article) => void;
  onViewWeatherDetail: () => void;
  onViewSourcesNews: () => void;
  onViewTrips?: (mode?: 'car' | 'bus') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language?: AppSettings['language'];
}

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  currentWeather,
  savedArticleIds,
  onToggleSave,
  onReadArticle,
  onViewWeatherDetail,
  onViewSourcesNews,
  onViewTrips,
  searchQuery,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');
  const [mainTrip] = useState<RouteTrip | null>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 'default',
      name: 'Travail',
      origin: 'Kopstal, Luxembourg',
      destination: 'Luxembourg, Stäreplatz / Étoile'
    };
  });

  const filteredArticles = articles.filter(a =>
    searchQuery === '' ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
    a.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainFeaturedArticle = filteredArticles[0];
  const sideArticles = filteredArticles.slice(1, 5);

  const renderConditionIcon = (condition = '', className = "w-5 h-5") => {
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-amber-400`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-400`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-300`} />;
    return <CloudSun className={`${className} text-indigo-300`} />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full overflow-x-hidden">

      {/* 1. MÉTÉO - CARTE COMPACTE POUR MOBILE */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#16182a] via-[#1a1733] to-[#121324] border border-indigo-500/20 rounded-2xl p-3.5 shadow-xl w-full">
          <div className="flex flex-col gap-3">
            
            {/* VILLE & TEMPÉRATURE */}
            <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2.5">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex-shrink-0">
                  {renderConditionIcon(currentWeather.condition, "w-5 h-5")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[10px] text-indigo-300/80 truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-2xl font-black text-white">{currentWeather.temperature}°C</span>
                <button onClick={onViewWeatherDetail} className="p-2 bg-indigo-600/30 text-indigo-200 rounded-xl border border-indigo-400/30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ÉPHÉMÉRIDE ET MÉTÉO DÉTAILLÉE */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#0d0e1a]/80 p-2 rounded-xl border border-indigo-500/15 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> {t.humidity}</span>
                <span className="font-bold text-white">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-[#0d0e1a]/80 p-2 rounded-xl border border-indigo-500/15 flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1"><Wind className="w-3 h-3 text-indigo-400" /> {t.wind}</span>
                <span className="font-bold text-white">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-indigo-950/60 p-2 rounded-xl border border-indigo-500/20 text-[10px]">
              <div className="flex items-center space-x-1 text-amber-300 font-semibold truncate">
                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="truncate">{t.saintOfDay} : St Christophe</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 flex-shrink-0 pl-2">
                <span className="flex items-center gap-0.5"><Sunrise className="w-3 h-3 text-amber-400" /> 06:34</span>
                <span>/</span>
                <span className="flex items-center gap-0.5"><Sunset className="w-3 h-3 text-orange-400" /> 20:48</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. TRAJET PRINCIPAL */}
      {mainTrip && (
        <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2">
            <div className="flex items-center space-x-2 text-emerald-400 min-w-0">
              <Navigation className="w-4 h-4 flex-shrink-0" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-100 truncate">
                {t.detailedRoute}
              </h2>
            </div>
            
            {onViewTrips && (
              <button onClick={() => onViewTrips(activeMapMode)} className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1 flex-shrink-0">
                <span>{t.details}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sélection Mode Mobile */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveMapMode('car')}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 ${
                activeMapMode === 'car' ? 'bg-[#1b2621] border-amber-500 text-amber-400' : 'bg-[#0a1217] border-slate-800 text-slate-400'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{t.byCar}</span>
            </button>

            <button
              onClick={() => setActiveMapMode('bus')}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 ${
                activeMapMode === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400' : 'bg-[#0a1217] border-slate-800 text-slate-400'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>{t.byBus}</span>
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a1217] border border-emerald-800/40 space-y-1">
            <p className="text-slate-300 font-medium truncate"><span className="text-slate-500">{t.departure}:</span> {mainTrip.origin}</p>
            <p className="text-slate-300 font-medium truncate"><span className="text-slate-500">{t.arrival}:</span> {mainTrip.destination}</p>
          </div>

          {/* Carte adaptative */}
          <div className="h-48 rounded-xl overflow-hidden border border-emerald-800/40 w-full relative">
            <iframe
              key={activeMapMode}
              title="Carte Mobile Trajet"
              width="100%" height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              loading="lazy"
              src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed`}
            />
          </div>
        </div>
      )}

      {/* 3. ACTUALITÉS ACCUEIL */}
      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Newspaper className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">{t.liveNews}</h2>
          </div>
          <button onClick={onViewSourcesNews} className="text-[10px] text-indigo-400 font-bold">{t.allSources}</button>
        </div>

        {mainFeaturedArticle && (
          <div className="bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-3.5 space-y-3 w-full">
            {mainFeaturedArticle.imageUrl && (
              <img src={mainFeaturedArticle.imageUrl} alt={mainFeaturedArticle.title} className="w-full h-36 object-cover rounded-xl" />
            )}
            <h2 onClick={() => onReadArticle(mainFeaturedArticle)} className="font-extrabold text-white text-xs cursor-pointer line-clamp-2">
              {mainFeaturedArticle.title}
            </h2>
            <div className="flex items-center justify-between pt-1">
              <button onClick={() => onReadArticle(mainFeaturedArticle)} className="text-indigo-400 font-bold flex items-center space-x-1 text-[11px]">
                <span>{t.readArticle}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button onClick={() => onToggleSave(mainFeaturedArticle.id)} className="p-1.5 rounded-lg bg-[#0d0f17] text-slate-400">
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dernières publications empilées */}
        <div className="space-y-2">
          {sideArticles.map((art) => (
            <div key={art.id} onClick={() => onReadArticle(art)} className="bg-[#151824] border border-slate-800 rounded-xl p-2.5 flex space-x-2.5 items-center cursor-pointer">
              {art.imageUrl && <img src={art.imageUrl} alt={art.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
              <h4 className="font-bold text-white text-[11px] line-clamp-2 leading-tight">{art.title}</h4>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};