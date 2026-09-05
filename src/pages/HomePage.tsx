import React, { useState, useEffect, useMemo } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { auth } from '../firebase';
import { GoogleAuthService } from '../service/googleAuthService';
import { fetchUnreadEmailCount } from '../service/gmailService';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, Bookmark,
  Newspaper, ChevronRight,
  Car, Bus, Navigation,
  Sunrise, Sunset, Sparkles, Clock,
  Briefcase, Building2, ShieldAlert, Zap, Globe,
  ExternalLink, Trash2, Info, Mail, UserCheck, UserX
} from 'lucide-react';
import { DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, Shortcut } from './ShortcutsPage';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

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
  onViewShortcuts?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language?: AppSettings['language'];
}

const LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-red-700 shadow-[0_0_8px_#b91c1c]', borderClass: 'border-red-700/30' },
  8: { bars: 2, colorClass: 'bg-red-500 shadow-[0_0_8px_#ef4444]', borderClass: 'border-red-500/30' },
  7: { bars: 1, colorClass: 'bg-orange-600 shadow-[0_0_8px_#ea580c]', borderClass: 'border-orange-600/30' },
  6: { bars: 3, colorClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]', borderClass: 'border-orange-400/30' },
  5: { bars: 2, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  4: { bars: 1, colorClass: 'bg-emerald-300 shadow-[0_0_8px_#6ee7b7]', borderClass: 'border-emerald-300/30' },
  3: { bars: 3, colorClass: 'bg-blue-700 shadow-[0_0_8px_#1d4ed8]', borderClass: 'border-blue-700/30' },
  2: { bars: 2, colorClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]', borderClass: 'border-blue-500/30' },
  1: { bars: 1, colorClass: 'bg-blue-900 shadow-[0_0_8px_#1e3a8a]', borderClass: 'border-blue-900/30' },
};

const getLedLevelForTemp = (temp: number): number => {
  if (temp < 5) return 1;
  if (temp <= 11) return 2;
  if (temp <= 16) return 3;
  if (temp <= 21) return 4;
  if (temp <= 26) return 5;
  if (temp <= 28) return 6;
  if (temp <= 31) return 7;
  if (temp <= 35) return 8;
  return 9;
};

const LedLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.max(1, Math.min(9, Math.round(level)));
  const config = LEVEL_CONFIG[safeLevel];

  return (
    <div className={`flex flex-col gap-0.5 p-0.5 bg-black/60 rounded border ${config.borderClass} backdrop-blur-xs w-5 shadow-md flex-shrink-0`}>
      {[3, 2, 1].map((barIndex) => {
        const isLit = barIndex <= config.bars;
        return (
          <div
            key={barIndex}
            className={`h-0.5 w-full rounded-xs transition-all duration-300 ${
              isLit ? config.colorClass : 'bg-slate-800/40'
            }`}
          />
        );
      })}
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  articles,
  currentWeather,
  onToggleSave,
  onReadArticle,
  savedArticleIds,
  onViewWeatherDetail,
  onViewSourcesNews,
  onViewTrips,
  onViewShortcuts,
  searchQuery,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');

  const currentUser = auth.currentUser;
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isWorkspaceConnected, setIsWorkspaceConnected] = useState<boolean>(() => {
    return GoogleAuthService.getStoredToken() !== null || localStorage.getItem('google_workspace_access_token') !== null;
  });

  // Popup de notification (Succès ou Erreur) de 2 secondes
  const [popupMessage, setPopupMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const token = GoogleAuthService.getStoredToken() || localStorage.getItem('google_workspace_access_token');
      setIsWorkspaceConnected(!!token);
      if (token) {
        fetchUnreadEmailCount(token).then(count => setUnreadCount(count)).catch(() => setUnreadCount(0));
      }
    };
    checkToken();

    window.addEventListener('storage', checkToken);
    window.addEventListener('workspace-auth-changed', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('workspace-auth-changed', checkToken);
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const token = await GoogleAuthService.signIn();
      if (token) {
        setIsWorkspaceConnected(true);
        const count = await fetchUnreadEmailCount(token);
        setUnreadCount(count);
        window.dispatchEvent(new Event('workspace-auth-changed'));
        
        // Popup succès (2 secondes)
        setPopupMessage({ text: "Connexion Google réussie !", type: 'success' });
        setTimeout(() => setPopupMessage(null), 2000);
      } else {
        setPopupMessage({ text: "Connexion annulée ou échouée.", type: 'error' });
        setTimeout(() => setPopupMessage(null), 2000);
      }
    } catch (error: any) {
      console.error("Erreur de connexion Google:", error);
      // Popup erreur (2 secondes)
      setPopupMessage({ text: "Erreur lors de la connexion Google.", type: 'error' });
      setTimeout(() => setPopupMessage(null), 2000);
    }
  };

  const handleOpenGmail = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const appUrl = Capacitor.getPlatform() === 'android' ? 'com.google.android.gm' : 'googlegmail://';
        const { value: canOpen } = await AppLauncher.canOpenUrl({ url: appUrl });
        if (canOpen) {
          await AppLauncher.openUrl({ url: appUrl });
          return;
        }
      }
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 5 ? 'Bonsoir, ravi de vous retrouver' : 'Bonjour, ravi de vous retrouver';
  };

  const activePrevention = useMemo(() => {
    if (!currentWeather) return null;
    const temp = Number(currentWeather.temperature ?? 20);
    const wind = Number(currentWeather.windSpeed ?? 10);

    if (temp > 32) return { type: 'Chaleur', badgeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-300', icon: <Info className="w-3 h-3 text-amber-400" /> };
    if (temp < 4) return { type: 'Froid', badgeColor: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300', icon: <Info className="w-3 h-3 text-cyan-400" /> };
    if (wind > 45) return { type: 'Vent', badgeColor: 'bg-sky-500/20 border-sky-500/40 text-sky-300', icon: <Info className="w-3 h-3 text-sky-400" /> };
    return null;
  }, [currentWeather]);

  const [links, setLinks] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SHORTCUTS;
  });

  useEffect(() => {
    const syncShortcuts = () => {
      const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (saved) {
        try { setLinks(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    };

    window.addEventListener('storage', syncShortcuts);
    window.addEventListener('storage-update', syncShortcuts);
    return () => {
      window.removeEventListener('storage', syncShortcuts);
      window.removeEventListener('storage-update', syncShortcuts);
    };
  }, []);

  const saveLinks = (newLinks: Shortcut[]) => {
    setLinks(newLinks);
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newLinks));
    window.dispatchEvent(new Event('storage-update'));
  };

  const handleDeleteLink = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveLinks(links.filter(l => l.id !== id));
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
    if (essentielArticles.length > 0) mixed.push(essentielArticles[0]);

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

  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 20) : 20;
  const currentLedLevel = getLedLevelForTemp(currentTemp);

  return (
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-full overflow-x-hidden pb-8 relative">

      {/* POPUP DE NOTIFICATION SUCCÈS / ERREUR (DISPARAÎT EN 2 SECONDES) */}
      {popupMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce transition-all ${
          popupMessage.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
            : 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
        }`}>
          <span>{popupMessage.text}</span>
        </div>
      )}

      {/* EN-TÊTE : CARTE AVEC GMAIL & BOUTON ICÔNE MINIMALISTE */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/50 to-slate-900 border border-teal-500/30 rounded-2xl p-3.5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-teal-400 to-indigo-500 shadow-[0_0_10px_#2dd4bf]" />
        
        <div className="space-y-0.5 pl-2">
          <h2 className="text-xs font-black text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{getGreeting()}</span>
          </h2>
          <p className="text-[10px] text-teal-200/80 font-medium">
            Aujourd'hui : Conditions stables • 0 perturbation sur votre trajet
          </p>
        </div>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-0 flex-wrap">
          
          {/* BOUTON ENVELOPPE GMAIL AVEC COMPTEUR NON LU */}
          {unreadCount !== null && unreadCount > 0 && (
            <button
              onClick={handleOpenGmail}
              className="relative p-2 rounded-xl bg-black/50 hover:bg-black/80 border border-rose-500/30 text-rose-400 flex items-center justify-center transition-all cursor-pointer shadow-md group"
              title="Ouvrir Gmail"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                {unreadCount}
              </span>
            </button>
          )}

          {/* ICÔNE D'ÉTAT DE CONNEXION WORKSPACE */}
          {!isWorkspaceConnected ? (
            <button 
              onClick={handleGoogleLogin}
              className="relative p-2 rounded-xl bg-[#121622] hover:bg-[#1a1f30] border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm group"
              title="Se connecter à Google Workspace"
            >
              <UserX className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-400" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </button>
          ) : (
            <div 
              className="relative p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-sm"
              title="Workspace Connecté"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
          )}

          <div className="bg-black/50 border border-teal-500/20 px-3 py-1.5 rounded-xl text-right flex-shrink-0">
            <span className="text-[11px] font-mono font-black text-teal-300 block">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 1. MÉTÉO */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#0c2238] via-[#103458] to-[#081b2e] border border-sky-400/40 rounded-2xl p-3.5 shadow-xl w-full space-y-3">
          
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-2">
            <div className="flex items-center space-x-2 text-sky-200">
              <Sun className="w-4 h-4 text-sky-300" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-sky-100">Météo & Éphéméride</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-black/40 border border-sky-400/20" title={`Niveau thermique : ${currentTemp}°C`}>
                <LedLevelIndicator level={currentLedLevel} />
                <span className="text-[10px] font-bold text-sky-200">{currentTemp}°C</span>
              </div>

              {activePrevention && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-xl border text-[10px] font-extrabold uppercase ${activePrevention.badgeColor}`} title="Conseil de prévention météo">
                  {activePrevention.icon}
                  <span>{activePrevention.type}</span>
                </div>
              )}

              <button 
                onClick={onViewWeatherDetail} 
                className="p-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/40 text-sky-200 border border-sky-400/30 transition-colors cursor-pointer"
                title="Voir la météo détaillée"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
              <button 
                onClick={() => onViewTrips(activeMapMode)} 
                className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 transition-colors cursor-pointer"
                title="Voir le trajet détaillé"
              >
                <ChevronRight className="w-4 h-4" />
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

      {/* 2.5. SECTION : RACCOURCIS FAVORIS */}
      <div className="bg-[#1c1114] border border-rose-500/30 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-rose-900/30 pb-2">
          <div className="flex items-center space-x-2 text-white font-bold text-xs">
            <Bookmark className="w-4 h-4 text-rose-400" />
            <span>Raccourcis Favoris & Utiles (Luxembourg)</span>
          </div>
          
          <button
            onClick={onViewShortcuts}
            className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
            title="Gérer tous les favoris"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

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
          <button 
            onClick={onViewSourcesNews} 
            className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/30 transition-colors cursor-pointer"
            title="Voir toutes les sources d'actualités"
          >
            <ChevronRight className="w-4 h-4" />
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

export default HomePage;