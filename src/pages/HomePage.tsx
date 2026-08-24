import React, { useState } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, ArrowRight, Bookmark,
  Newspaper, ChevronRight,
  Car, Bus, Navigation,
  Sunrise, Sunset, Sparkles, Clock,
  Briefcase, Building2, ShieldAlert, Zap, Globe,
  ExternalLink, Plus, Trash2
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

interface LinkItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  currentWeather,
  onToggleSave,
  onReadArticle,
  savedArticleIds,
  onViewWeatherDetail,
  onViewSourcesNews,
  onViewTrips,
  searchQuery,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');

  // États pour les raccourcis favoris (Rouge profond)
  const defaultLinks: LinkItem[] = [
    { id: '1', name: 'RTL.lu', url: 'https://www.rtl.lu', category: 'Actus' },
    { id: '2', name: 'Mobiliteit.lu', url: 'https://www.mobiliteit.lu/fr/', category: 'Transport' },
    { id: '3', name: 'ACL Carburants', url: 'https://www.acl.lu/fr/mobilite/prix-des-carburants/', category: 'Voiture' },
    { id: '4', name: 'Guichet.lu', url: 'https://guichet.public.lu/fr.html', category: 'Administratif' },
    { id: '5', name: 'Spuerkeess / E-Banking', url: 'https://www.spuerkeess.lu', category: 'Banque' },
    { id: '6', name: '100komma7', url: 'https://www.100komma7.lu', category: 'Actus' },
  ];

  const [links, setLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('user_quick_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return defaultLinks;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    let formattedUrl = newUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newItem: LinkItem = {
      id: Date.now().toString(),
      name: newName,
      url: formattedUrl,
      category: 'Favoris'
    };

    const updated = [...links, newItem];
    setLinks(updated);
    localStorage.setItem('user_quick_links', JSON.stringify(updated));

    setNewName('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleDeleteLink = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    localStorage.setItem('user_quick_links', JSON.stringify(updated));
  };

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

  const sortedArticles = React.useMemo(() => {
    const essentielArticles = filteredArticles.filter(a => (a.source || '').toLowerCase().includes('essentiel'));
    const otherArticles = filteredArticles.filter(a => !(a.source || '').toLowerCase().includes('essentiel'));

    const mixed = [];
    if (essentielArticles.length > 0) {
      mixed.push(essentielArticles[0]);
    }

    let eIndex = 1;
    let oIndex = 0;
    while (eIndex < essentielArticles.length || oIndex < otherArticles.length) {
      if (oIndex < otherArticles.length) {
        mixed.push(otherArticles[oIndex]);
        oIndex++;
      }
      if (eIndex < essentielArticles.length) {
        mixed.push(essentielArticles[eIndex]);
        eIndex++;
      }
    }
    return mixed;
  }, [filteredArticles]);

  const carouselArticles = sortedArticles.slice(0, 12);

  const renderConditionIcon = (condition = '', className = "w-5 h-5") => {
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-amber-300`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-300`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-200`} />;
    return <CloudSun className={`${className} text-sky-200`} />;
  };

  const getNewsIcon = (title = '', source = '') => {
    const text = (title + ' ' + source).toLowerCase();
    if (text.includes('trafic') || text.includes('bus') || text.includes('route') || text.includes('train')) return <Bus className="w-5 h-5 text-sky-400" />;
    if (text.includes('voiture') || text.includes('accident') || text.includes('radar')) return <Car className="w-5 h-5 text-amber-400" />;
    if (text.includes('meteo') || text.includes('temps') || text.includes('pluie') || text.includes('soleil')) return <Sun className="w-5 h-5 text-amber-300" />;
    if (text.includes('economie') || text.includes('bourse') || text.includes('prix') || text.includes('emploi')) return <Briefcase className="w-5 h-5 text-emerald-400" />;
    if (text.includes('politique') || text.includes('gouvernement') || text.includes('commune')) return <Building2 className="w-5 h-5 text-emerald-300" />;
    if (text.includes('alerte') || text.includes('police') || text.includes('feu')) return <ShieldAlert className="w-5 h-5 text-rose-400" />;
    if (text.includes('tech') || text.includes('ia') || text.includes('innovation')) return <Zap className="w-5 h-5 text-emerald-300" />;
    return <Globe className="w-5 h-5 text-emerald-300" />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-full overflow-x-hidden pb-8 relative">

      {/* 1. MÉTÉO - BLEU CIEL LUMINEUX */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#0c2238] via-[#103458] to-[#081b2e] border border-sky-400/40 rounded-2xl p-3.5 shadow-xl w-full space-y-3">
          
          <div className="flex items-center space-x-2 border-b border-sky-400/30 pb-2 text-sky-200">
            <Sun className="w-4 h-4 text-sky-300" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-sky-100">Météo & Éphéméride</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-sky-400/30 pb-2.5">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="p-2 rounded-xl bg-sky-400/20 border border-sky-400/40 flex-shrink-0">
                  {renderConditionIcon(currentWeather.condition, "w-5 h-5")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                    <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[10px] text-sky-100/90 truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-2xl font-black text-white">{currentWeather.temperature}°C</span>
                <button onClick={onViewWeatherDetail} className="p-2 bg-sky-500/30 text-sky-100 rounded-xl border border-sky-400/40 cursor-pointer hover:bg-sky-500/50 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#071626]/90 p-2 rounded-xl border border-sky-400/30 flex items-center justify-between">
                <span className="text-sky-200 flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-300" /> {t.humidity}</span>
                <span className="font-bold text-white">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-[#071626]/90 p-2 rounded-xl border border-sky-400/30 flex items-center justify-between">
                <span className="text-sky-200 flex items-center gap-1"><Wind className="w-3 h-3 text-sky-300" /> {t.wind}</span>
                <span className="font-bold text-white">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-sky-900/60 p-2 rounded-xl border border-sky-400/30 text-[10px]">
              <div className="flex items-center space-x-1 text-sky-100 font-semibold truncate">
                <Sparkles className="w-3 h-3 text-sky-300 flex-shrink-0" />
                <span className="truncate">{t.saintOfDay} : St Christophe</span>
              </div>
              <div className="flex items-center space-x-2 text-sky-100/90 flex-shrink-0 pl-2">
                <span className="flex items-center gap-0.5"><Sunrise className="w-3 h-3 text-amber-300" /> 06:34</span>
                <span>/</span>
                <span className="flex items-center gap-0.5"><Sunset className="w-3 h-3 text-orange-300" /> 20:48</span>
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
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 truncate">
                {t.detailedRoute}
              </h2>
            </div>
            
            {onViewTrips && (
              <button onClick={() => onViewTrips(activeMapMode)} className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1 flex-shrink-0 cursor-pointer">
                <span>{t.details}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveMapMode('car')}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                activeMapMode === 'car' ? 'bg-[#1b2621] border-amber-500 text-amber-400' : 'bg-[#0a1217] border-slate-800 text-slate-400'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>{t.byCar}</span>
            </button>

            <button
              onClick={() => setActiveMapMode('bus')}
              className={`p-2 rounded-xl border font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
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

          <div className="h-48 rounded-xl overflow-hidden border border-emerald-800/40 w-full relative shadow-inner">
            <iframe
              key={activeMapMode}
              title="Carte interactive du trajet"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              loading="lazy"
              src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed`}
            />
          </div>
        </div>
      )}

      {/* 2.5. SECTION : RACCOURCIS FAVORIS (ROUGE PROFOND) */}
      <div className="bg-[#1c1114] border border-rose-500/30 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-rose-900/30 pb-2">
          <div className="flex items-center space-x-2 text-white font-bold text-xs">
            <Bookmark className="w-4 h-4 text-rose-400" />
            <span>Raccourcis Favoris & Utiles (Luxembourg)</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-800/50 font-bold flex items-center gap-1 transition-colors text-[10px] cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Modal d'ajout de lien */}
        {showAddModal && (
          <div className="bg-[#141215] p-3 rounded-xl border border-rose-500/40 shadow-lg space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">Nouveau raccourci</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-2">
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Nom du site</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="Ex: RTL.lu" 
                  required
                  className="w-full mt-0.5 p-1.5 rounded-lg bg-[#0a1217] border border-slate-700 text-white focus:border-rose-500 outline-none text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">URL / Adresse Web</label>
                <input 
                  type="text" 
                  value={newUrl} 
                  onChange={(e) => setNewUrl(e.target.value)} 
                  placeholder="Ex: https://www.rtl.lu" 
                  required
                  className="w-full mt-0.5 p-1.5 rounded-lg bg-[#0a1217] border border-slate-700 text-white focus:border-rose-500 outline-none text-xs"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grille des liens favoris */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2.5 rounded-xl bg-[#120a0d] border border-rose-950 hover:border-rose-500/50 transition-all flex flex-col justify-between space-y-1.5 cursor-pointer shadow-sm hover:shadow-rose-950/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-rose-300 uppercase tracking-wide">
                  {link.category}
                </span>
                <button
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center space-x-1.5 min-w-0 pr-1">
                  <Globe className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="text-slate-200 font-bold text-xs truncate group-hover:text-rose-300 transition-colors">
                    {link.name}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-rose-400 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 3. SECTION ACTUALITÉS */}
      <div className="bg-gradient-to-r from-[#0e1713] via-[#121f19] to-[#0c1411] border-2 border-emerald-600/50 rounded-2xl p-3.5 shadow-2xl space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-emerald-600/25 pb-2">
          <div className="flex items-center space-x-2 text-emerald-300">
            <Newspaper className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
              {t.liveNews}
            </h2>
          </div>
          <button onClick={onViewSourcesNews} className="text-[10px] text-emerald-300 font-bold hover:underline cursor-pointer flex items-center gap-1">
            <span>{t.allSources}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-500/30 w-full">
          {carouselArticles.map((art) => {
            const isEssentiel = (art.source || '').toLowerCase().includes('essentiel');
            return (
              <div 
                key={art.id}
                onClick={() => onReadArticle(art)}
                className={`flex-shrink-0 w-60 border rounded-xl p-3 shadow-lg cursor-pointer transition-all duration-300 group flex flex-col justify-between ${
                  isEssentiel 
                    ? 'bg-[#151922] border-emerald-500/50 hover:border-emerald-400 shadow-indigo-950/40' 
                    : 'bg-[#11131a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {getNewsIcon(art.title, art.source)}
                    </div>
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {art.publishedAt}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      isEssentiel ? 'bg-emerald-600 text-white font-black' : 'text-slate-300 bg-slate-900 border border-slate-800'
                    }`}>
                      {art.source}
                    </span>
                    <h3 className="font-extrabold text-white text-xs group-hover:text-emerald-300 transition-colors line-clamp-3 leading-snug pt-1">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span>{t.read}</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }} 
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600/30 text-slate-400 hover:text-white transition-colors"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds?.includes(art.id) ? 'text-emerald-400 fill-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};