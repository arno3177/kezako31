import React, { useState, useEffect } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, ArrowRight, Bookmark, Search,
  Newspaper, ExternalLink, Calendar, ChevronRight,
  Car, Bus, Navigation, Loader2, CloudLightning, Clock,
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
  setSearchQuery,
  language = 'fr'
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');
  const [mainTrip, setMainTrip] = useState<RouteTrip | null>(() => {
    const saved = localStorage.getItem('user_saved_trips');
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
      origin: 'Kopstal, Brédewues',
      destination: 'Luxembourg, Stäreplatz / Étoile',
      carDuration: '18 min',
      busDuration: '22 min',
      distance: '11.8 km'
    };
  });

  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  useEffect(() => {
    if (!mainTrip?.origin || !mainTrip?.destination) return;
    let isMounted = true;
    setIsLoadingRoute(true);

    const calculateRealRoute = async () => {
      try {
        const originRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mainTrip.origin)}`);
        const originData = await originRes.json();
        const destRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mainTrip.destination)}`);
        const destData = await destRes.json();

        if (originData.length > 0 && destData.length > 0) {
          const lon1 = originData[0].lon;
          const lat1 = originData[0].lat;
          const lon2 = destData[0].lon;
          const lat2 = destData[0].lat;

          const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
          const routeData = await routeRes.json();

          if (routeData.routes && routeData.routes.length > 0 && isMounted) {
            const carMin = Math.round(routeData.routes[0].duration / 60);
            const busMin = Math.round(carMin * 1.25 + 3);
            const distKm = (routeData.routes[0].distance / 1000).toFixed(1);

            setMainTrip(prev => prev ? {
              ...prev,
              carDuration: `${carMin} min`,
              busDuration: `${busMin} min`,
              distance: `${distKm} km`
            } : null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoadingRoute(false);
      }
    };

    calculateRealRoute();
    return () => { isMounted = false; };
  }, [mainTrip?.origin, mainTrip?.destination]);

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
    if (cond.includes('soleil') || cond.includes('ensoleillé') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-amber-400`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-400`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-300`} />;
    return <CloudSun className={`${className} text-indigo-300`} />;
  };

  const currentHour = new Date().getHours();
  const plus3hTime = `${(currentHour + 3) % 24}:00`;
  const plus6hTime = `${(currentHour + 6) % 24}:00`;

  const getTemp = (item: any, defaultVal: number) => {
    if (!item) return defaultVal;
    if (typeof item.temperature === 'number') return item.temperature;
    if (typeof item.temp === 'number') return item.temp;
    if (typeof item.tempMax === 'number') return item.tempMax;
    return defaultVal;
  };

  const forecast3h = currentWeather?.forecast?.[0];
  const forecast6h = currentWeather?.forecast?.[1];

  const temp3h = getTemp(forecast3h, (currentWeather?.temperature || 18) + 1);
  const temp6h = getTemp(forecast6h, (currentWeather?.temperature || 18) - 1);

  const cond3h = forecast3h?.condition || currentWeather?.condition || 'Nuageux';
  const cond6h = forecast6h?.condition || currentWeather?.condition || 'Ensoleillé';

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div className="space-y-6 animate-fade-in text-xs">

      {/* 1. MÉTÉO EN DIRECT */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#16182a] via-[#1a1733] to-[#121324] border border-indigo-500/20 rounded-2xl p-3.5 shadow-xl shadow-indigo-950/20">
          <div className="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto scrollbar-none">
            
            {/* VILLE & CONDITION */}
            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                {renderConditionIcon(currentWeather.condition, "w-5 h-5")}
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <h1 className="text-sm font-extrabold text-white tracking-tight whitespace-nowrap">{currentWeather.city}</h1>
                <span className="text-[10px] text-indigo-200/80 font-semibold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30 whitespace-nowrap">
                  {currentWeather.country}
                </span>
                <span className="text-xs text-indigo-300/70 font-medium capitalize whitespace-nowrap hidden sm:inline">• {currentWeather.condition}</span>
              </div>
            </div>

            {/* SAINT DU JOUR TRADUIT */}
            <div className="flex items-center space-x-1.5 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30 text-amber-300 font-semibold text-[10px] flex-shrink-0 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>{t.saintOfDay} : <strong className="text-white">St Christophe</strong></span>
            </div>

            {/* PRÉVISIONS */}
            <div className="flex items-center space-x-2 bg-[#0d0e1a]/80 px-3 py-1 rounded-xl border border-indigo-500/15 flex-shrink-0">
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/50 border border-indigo-500/20">
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-[9px] font-bold text-indigo-300 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5" />
                    <span>+3h ({plus3hTime})</span>
                  </div>
                  <span className="text-xs font-black text-white">{temp3h}°C</span>
                </div>
                {renderConditionIcon(cond3h, "w-3.5 h-3.5")}
              </div>

              <span className="text-indigo-900 font-light">|</span>

              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/50 border border-indigo-500/20">
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-[9px] font-bold text-indigo-300 whitespace-nowrap">
                    <Clock className="w-2.5 h-2.5" />
                    <span>+6h ({plus6hTime})</span>
                  </div>
                  <span className="text-xs font-black text-white">{temp6h}°C</span>
                </div>
                {renderConditionIcon(cond6h, "w-3.5 h-3.5")}
              </div>

              <span className="text-indigo-900 font-light">|</span>

              <div className="flex items-center space-x-2 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-500/20 text-slate-200">
                <div className="flex items-center space-x-1" title={t.sunrise}>
                  <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-extrabold text-slate-200">06:34</span>
                </div>
                <span className="text-indigo-800 text-[10px]">/</span>
                <div className="flex items-center space-x-1" title={t.sunset}>
                  <Sunset className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] font-extrabold text-slate-200">20:48</span>
                </div>
              </div>
            </div>

            {/* INDICATEURS & BOUTON DÉTAILS */}
            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <div className="flex items-center space-x-2 text-slate-300 bg-[#0d0e1a]/70 px-2.5 py-1 rounded-xl border border-indigo-500/10">
                <div className="flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-semibold text-slate-200 text-[11px]">{currentWeather.humidity}%</span>
                </div>
                <span className="text-indigo-900">|</span>
                <div className="flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200 text-[11px]">{currentWeather.windSpeed} km/h</span>
                </div>
              </div>

              <span className="text-xl font-black text-white tracking-tight">{currentWeather.temperature}°C</span>

              <button onClick={onViewWeatherDetail} className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-xl border border-indigo-400/30 transition-all cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. SECTION TRAJET TRADUITE */}
      {mainTrip && (
        <div className="bg-gradient-to-r from-[#111e25] via-[#13222a] to-[#0f171c] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2.5">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Navigation className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                {t.detailedRoute} : {mainTrip.name}
              </h2>
            </div>
            
            {onViewTrips && (
              <button 
                onClick={() => onViewTrips(activeMapMode)} 
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>{activeMapMode === 'bus' ? t.byBus : t.byCar}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            <div className="md:col-span-5 flex flex-col justify-between space-y-2">
              <div className="p-2.5 rounded-xl bg-[#0a1217]/90 border border-emerald-800/40 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                  <span className="text-[10px] text-slate-400 font-medium">{t.departure} :</span>
                  <span className="text-xs font-bold text-slate-100 truncate">{mainTrip.origin}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0"></span>
                  <span className="text-[10px] text-slate-400 font-medium">{t.arrival} :</span>
                  <span className="text-xs font-bold text-slate-100 truncate">{mainTrip.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => setActiveMapMode('car')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    activeMapMode === 'car' ? 'bg-[#1b2621] border-amber-500' : 'bg-[#0a1217]/90 border-emerald-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <Car className="w-4 h-4" />
                    <span className="text-[10px] font-bold text-slate-200">{t.byCar}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-black text-white">{mainTrip.carDuration}</span>
                    {isLoadingRoute && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                  </div>
                </div>

                <div 
                  onClick={() => setActiveMapMode('bus')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    activeMapMode === 'bus' ? 'bg-[#132733] border-sky-400' : 'bg-[#0a1217]/90 border-emerald-900/30'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <Bus className="w-4 h-4" />
                    <span className="text-[10px] font-bold text-slate-200">{t.byBus}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-black text-white">{mainTrip.busDuration}</span>
                    {isLoadingRoute && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 h-44 rounded-xl overflow-hidden border border-emerald-800/40 relative">
              <iframe
                key={activeMapMode}
                title="Carte Trajet"
                width="100%" height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy"
                src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION ACTUALITÉS TRADUITE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Newspaper className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">{t.liveNews}</h2>
          </div>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mainFeaturedArticle && (
              <div className="lg:col-span-2 bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group">
                {mainFeaturedArticle.imageUrl && (
                  <div className="relative h-64 overflow-hidden">
                    <img src={mainFeaturedArticle.imageUrl} alt={mainFeaturedArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 onClick={() => onReadArticle(mainFeaturedArticle)} className="text-base font-extrabold text-white hover:text-indigo-400 transition-colors cursor-pointer leading-snug">
                      {mainFeaturedArticle.title}
                    </h2>
                    <p className="text-slate-400 line-clamp-3 text-xs leading-relaxed">{mainFeaturedArticle.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button onClick={() => onReadArticle(mainFeaturedArticle)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer">
                      <span>{t.readArticle}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onToggleSave(mainFeaturedArticle.id)} className={`p-2 rounded-lg border transition-all cursor-pointer ${savedArticleIds.includes(mainFeaturedArticle.id) ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-[#0d0f17] text-slate-400 hover:text-white border-slate-800'}`}>
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center space-x-2">
                <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.latestPosts}</span>
              </h3>
              {sideArticles.map((art) => (
                <div key={art.id} className="bg-[#151824] border border-slate-800 rounded-xl p-3.5 shadow-md flex space-x-3 cursor-pointer group" onClick={() => onReadArticle(art)}>
                  {art.imageUrl && <img src={art.imageUrl} alt={art.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">{art.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

    </div>
  );
};