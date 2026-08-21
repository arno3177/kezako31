import React, { useState, useEffect } from 'react';
import { Article, WeatherData, RouteTrip } from '../types';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, ArrowRight, Bookmark, Search,
  Newspaper, ExternalLink, Calendar, ChevronRight,
  Car, Bus, Navigation, Loader2, CloudLightning
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
  setSearchQuery
}) => {
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
    if (cond.includes('soleil') || cond.includes('ensoleillé') || cond.includes('clear')) return <Sun className={`${className} text-amber-400`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-400`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-300`} />;
    return <CloudSun className={`${className} text-indigo-300`} />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div className="space-y-6 animate-fade-in text-xs">

      {/* 1. SECTION MÉTÉO - DESIGN AMBIANT VIOLET/INDIGO */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#16182a] via-[#1a1733] to-[#121324] border border-indigo-500/20 rounded-2xl p-4 shadow-xl shadow-indigo-950/20 space-y-3">
          {/* Titre de la Section Météo */}
          <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <CloudLightning className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-100">
                Météo en Direct
              </h2>
            </div>
            <span className="text-[10px] text-indigo-300/60 font-medium">Ville active</span>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-inner">
                {renderConditionIcon(currentWeather.condition, "w-6 h-6")}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <h1 className="text-base font-extrabold text-white tracking-tight">{currentWeather.city}</h1>
                  <span className="text-[10px] text-indigo-200/80 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    {currentWeather.country}
                  </span>
                </div>
                <p className="text-xs text-indigo-300/70 font-medium capitalize mt-0.5">{currentWeather.condition}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-indigo-900/40 pt-3 md:pt-0">
              <div className="flex items-center space-x-4 text-slate-300 bg-[#0d0e1a]/70 px-3.5 py-1.5 rounded-xl border border-indigo-500/10">
                <div className="flex items-center space-x-1.5"><Droplets className="w-3.5 h-3.5 text-sky-400" /><span className="font-semibold text-slate-200">{currentWeather.humidity}%</span></div>
                <span className="text-indigo-900">|</span>
                <div className="flex items-center space-x-1.5"><Wind className="w-3.5 h-3.5 text-indigo-400" /><span className="font-semibold text-slate-200">{currentWeather.windSpeed} km/h</span></div>
              </div>
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl font-black text-white tracking-tight">{currentWeather.temperature}°C</span>
                <button onClick={onViewWeatherDetail} className="p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-xl border border-indigo-400/30 transition-all cursor-pointer flex items-center space-x-1 shadow-sm">
                  <span className="text-[11px] font-bold pl-1 hidden sm:inline">Détails</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION TRAJET PRINCIPAL - PALETTE ÉMERAUDE / TÉRON */}
      {mainTrip && (
        <div className="bg-gradient-to-r from-[#111e25] via-[#13222a] to-[#0f171c] border border-emerald-500/20 rounded-2xl p-4 shadow-xl shadow-emerald-950/10 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2.5">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Navigation className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Trajet Principal : {mainTrip.name}
              </h2>
            </div>
            
            {onViewTrips && (
              <button 
                onClick={() => onViewTrips(activeMapMode)} 
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Détails & Horaires ({activeMapMode === 'bus' ? 'Bus' : 'Voiture'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
            {/* GAUCHE : SÉLECTEUR DE MODE DE TRAJET */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-2">
              <div className="p-2.5 rounded-xl bg-[#0a1217]/90 border border-emerald-800/40 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400"></span>
                  <span className="text-[10px] text-slate-400 font-medium">Départ :</span>
                  <span className="text-xs font-bold text-slate-100 truncate">{mainTrip.origin}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0 shadow-sm shadow-sky-400"></span>
                  <span className="text-[10px] text-slate-400 font-medium">Arrivée :</span>
                  <span className="text-xs font-bold text-slate-100 truncate">{mainTrip.destination}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* VOITURE */}
                <div 
                  onClick={() => setActiveMapMode('car')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    activeMapMode === 'car' 
                      ? 'bg-[#1b2621] border-amber-500 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/40' 
                      : 'bg-[#0a1217]/90 border-emerald-900/30 hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <Car className="w-4 h-4" />
                    <span className="text-[10px] font-bold text-slate-200">Voiture</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white">{mainTrip.carDuration}</span>
                      <span className="text-[9px] text-slate-400 block">{mainTrip.distance}</span>
                    </div>
                    {isLoadingRoute && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                  </div>
                </div>

                {/* BUS */}
                <div 
                  onClick={() => setActiveMapMode('bus')}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    activeMapMode === 'bus' 
                      ? 'bg-[#132733] border-sky-400 shadow-lg shadow-sky-950/20 ring-1 ring-sky-400/40' 
                      : 'bg-[#0a1217]/90 border-emerald-900/30 hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <Bus className="w-4 h-4" />
                    <span className="text-[10px] font-bold text-slate-200">Bus / TC</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white">{mainTrip.busDuration}</span>
                      <span className="text-[9px] text-slate-400 block">{mainTrip.distance}</span>
                    </div>
                    {isLoadingRoute && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                  </div>
                </div>
              </div>
            </div>

            {/* DROITE : CARTE D'ITINÉRAIRE */}
            <div className="md:col-span-7 h-44 rounded-xl overflow-hidden border border-emerald-800/40 shadow-inner relative">
              <iframe
                key={activeMapMode}
                title="Carte Trajet Accueil"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy"
                src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION ACTUALITÉS - DESIGN ARDOISE / ANTHRACITE BLEUTÉ */}
      <div className="space-y-4">
        
        {/* Titre de la Section Actualités */}
        <div className="flex items-center justify-between px-1 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Newspaper className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Actualités & Fil d'Information
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Flux en direct</span>
        </div>

        {/* BARRE DE RECHERCHE & SOURCES */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#151824] border border-slate-800 rounded-xl p-3 shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0f17] text-white text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button onClick={onViewSourcesNews} className="w-full sm:w-auto px-3.5 py-1.5 bg-[#0d0f17] hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-slate-300 hover:text-white font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer">
            <Newspaper className="w-4 h-4 text-indigo-400" />
            <span>Toutes les sources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* GRILLE D'ARTICLES */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mainFeaturedArticle && (
              <div className="lg:col-span-2 bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group">
                {mainFeaturedArticle.imageUrl && (
                  <div className="relative h-64 overflow-hidden">
                    <img src={mainFeaturedArticle.imageUrl} alt={mainFeaturedArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151824] via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
                      {mainFeaturedArticle.category || 'À la une'}
                    </span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                      <span className="font-bold text-indigo-400">{mainFeaturedArticle.source}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {mainFeaturedArticle.publishedAt}</span>
                    </div>
                    <h2 onClick={() => onReadArticle(mainFeaturedArticle)} className="text-base font-extrabold text-white hover:text-indigo-400 transition-colors cursor-pointer leading-snug">
                      {mainFeaturedArticle.title}
                    </h2>
                    <p className="text-slate-400 line-clamp-3 text-xs leading-relaxed">{mainFeaturedArticle.excerpt}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button onClick={() => onReadArticle(mainFeaturedArticle)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 cursor-pointer">
                      <span>Lire l'article</span><ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onToggleSave(mainFeaturedArticle.id)} className={`p-2 rounded-lg border transition-all cursor-pointer ${savedArticleIds.includes(mainFeaturedArticle.id) ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-[#0d0f17] text-slate-400 hover:text-white border-slate-800'}`}>
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COLONNE SECONDAIRE */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center space-x-2">
                <Newspaper className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dernières Publications</span>
              </h3>
              {sideArticles.map((art) => {
                const isSaved = savedArticleIds.includes(art.id);
                return (
                  <div key={art.id} className="bg-[#151824] border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-slate-700 transition-all flex space-x-3 group cursor-pointer" onClick={() => onReadArticle(art)}>
                    {art.imageUrl && <img src={art.imageUrl} alt={art.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 flex flex-col justify-between space-y-1">
                      <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">{art.title}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="text-indigo-400 font-semibold">{art.source}</span>
                        <button onClick={(e) => { e.stopPropagation(); onToggleSave(art.id); }} className={`p-1 rounded transition-colors ${isSaved ? 'text-amber-400' : 'text-slate-500 hover:text-white'}`}>
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-[#151824] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            Aucun article ne correspond à votre recherche.
          </div>
        )}
      </div>

    </div>
  );
};