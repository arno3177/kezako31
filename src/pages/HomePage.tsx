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
  ExternalLink, Trash2, Info, Mail, UserCheck, UserX,
  Home, Flame, CheckCircle2
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
  onViewAssistant?: () => void;
  onViewEnergyComfort?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language?: AppSettings['language'];
}

const LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-red-500 shadow-[0_0_12px_#ef4444]', borderClass: 'border-red-400' },
  8: { bars: 2, colorClass: 'bg-red-400 shadow-[0_0_12px_#f87171]', borderClass: 'border-red-400' },
  7: { bars: 1, colorClass: 'bg-orange-500 shadow-[0_0_12px_#f97316]', borderClass: 'border-orange-400' },
  6: { bars: 3, colorClass: 'bg-amber-400 shadow-[0_0_12px_#fbbf24]', borderClass: 'border-amber-400' },
  5: { bars: 2, colorClass: 'bg-emerald-400 shadow-[0_0_12px_#34d399]', borderClass: 'border-emerald-400' },
  4: { bars: 1, colorClass: 'bg-teal-400 shadow-[0_0_12px_#2dd4bf]', borderClass: 'border-teal-400' },
  3: { bars: 3, colorClass: 'bg-sky-400 shadow-[0_0_12px_#38bdf8]', borderClass: 'border-sky-400' },
  2: { bars: 2, colorClass: 'bg-blue-400 shadow-[0_0_12px_#60a5fa]', borderClass: 'border-blue-400' },
  1: { bars: 1, colorClass: 'bg-indigo-400 shadow-[0_0_12px_#818cf8]', borderClass: 'border-indigo-400' },
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
    <div className={`flex flex-col gap-0.5 p-1 bg-slate-950 rounded border ${config.borderClass} backdrop-blur-md w-5 shadow-lg flex-shrink-0`}>
      {[3, 2, 1].map((barIndex) => {
        const isLit = barIndex <= config.bars;
        return (
          <div
            key={barIndex}
            className={`h-0.5 w-full rounded-xs transition-all duration-300 ${
              isLit ? config.colorClass : 'bg-slate-700'
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
  onViewAssistant,
  onViewEnergyComfort,
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
        
        setPopupMessage({ text: "Connexion Google réussie !", type: 'success' });
        setTimeout(() => setPopupMessage(null), 2000);
      } else {
        setPopupMessage({ text: "Connexion annulée ou échouée.", type: 'error' });
        setTimeout(() => setPopupMessage(null), 2000);
      }
    } catch (error: any) {
      console.error("Erreur de connexion Google:", error);
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

  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 20) : 20;
  const humidity = currentWeather ? Number(currentWeather.humidity ?? 75) : 75;

  const tempMax = (currentWeather as any)?.tempMax !== undefined ? Number((currentWeather as any).tempMax) : currentTemp + 3;
  const tempMin = (currentWeather as any)?.tempMin !== undefined ? Number((currentWeather as any).tempMin) : currentTemp - 4;

  const getEnergyAndComfortStatus = () => {
    if (currentTemp < 12) {
      return {
        title: "Chauffage & Isolation Recommandés",
        desc: `Température extérieure fraîche (${currentTemp}°C). Veillez à maintenir les volets fermés dès la tombée de la nuit pour préserver l'inertie thermique de la maison.`,
        icon: <Flame className="w-4 h-4 text-amber-300" />,
        badgeBg: "bg-amber-950/80 border-amber-400 text-amber-200",
        action: "Optimisation Thermique Active"
      };
    } else if (currentTemp >= 22) {
      return {
        title: "Aération Matinale Conseillée",
        desc: `Chaleur extérieure marquée (${currentTemp}°C). Aérez tôt le matin (avant 9h) puis baissez les stores pour garder la maison au frais sans surconsommer.`,
        icon: <Zap className="w-4 h-4 text-teal-300" />,
        badgeBg: "bg-teal-950/80 border-teal-400 text-teal-200",
        action: "Gestion Fraîcheur Active"
      };
    } else {
      return {
        title: "Aération Idéale (10 min max)",
        desc: `Conditions extérieures stables (${currentTemp}°C, humidité ${humidity}%). C'est le moment parfait pour faire un courant d'air rapide et renouveler l'air intérieur.`,
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
        badgeBg: "bg-emerald-950/80 border-emerald-400 text-emerald-200",
        action: "Renouvellement d'air optimal"
      };
    }
  };

  const energy = getEnergyAndComfortStatus();

  const activePrevention = useMemo(() => {
    if (!currentWeather) return null;
    const wind = Number(currentWeather.windSpeed ?? 10);

    if (currentTemp > 32) return { type: 'Chaleur', badgeColor: 'bg-amber-900 border-amber-300 text-amber-100', icon: <Info className="w-3 h-3 text-amber-200" /> };
    if (currentTemp < 4) return { type: 'Froid', badgeColor: 'bg-cyan-900 border-cyan-300 text-cyan-100', icon: <Info className="w-3 h-3 text-cyan-200" /> };
    if (wind > 45) return { type: 'Vent', badgeColor: 'bg-sky-900 border-sky-300 text-sky-100', icon: <Info className="w-3 h-3 text-sky-200" /> };
    return null;
  }, [currentWeather, currentTemp]);

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
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-white`} />;
    return <CloudSun className={`${className} text-sky-200`} />;
  };

  const getNewsIcon = (title = '', source = '') => {
    const text = (title + ' ' + source).toLowerCase();
    if (text.includes('trafic') || text.includes('bus') || text.includes('route') || text.includes('train')) return <Bus className="w-5 h-5 text-sky-300" />;
    if (text.includes('voiture') || text.includes('accident') || text.includes('radar')) return <Car className="w-5 h-5 text-amber-300" />;
    if (text.includes('meteo') || text.includes('temps') || text.includes('pluie') || text.includes('soleil')) return <Sun className="w-5 h-5 text-amber-300" />;
    if (text.includes('economie') || text.includes('bourse') || text.includes('prix') || text.includes('emploi')) return <Briefcase className="w-5 h-5 text-emerald-300" />;
    if (text.includes('politique') || text.includes('gouvernement') || text.includes('commune')) return <Building2 className="w-5 h-5 text-teal-300" />;
    if (text.includes('alerte') || text.includes('police') || text.includes('feu')) return <ShieldAlert className="w-5 h-5 text-rose-300" />;
    if (text.includes('tech') || text.includes('ia') || text.includes('innovation')) return <Zap className="w-5 h-5 text-teal-300" />;
    return <Globe className="w-5 h-5 text-teal-300" />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  const currentLedLevel = getLedLevelForTemp(currentTemp);

  return (
    <div className="space-y-6 animate-fade-in text-xs w-full max-w-full overflow-x-hidden pb-12 relative text-slate-100 bg-[#050811] min-h-screen px-1 sm:px-2">

      {/* POPUP DE NOTIFICATION */}
      {popupMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce transition-all ${
          popupMessage.type === 'success' 
            ? 'bg-emerald-950 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.7)]' 
            : 'bg-rose-950 border-rose-400 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
        }`}>
          <span>{popupMessage.text}</span>
        </div>
      )}

      {/* EN-TÊTE : INDIGO VIVANT & CONTRASTÉ */}
      <div className="bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#172554] border-2 border-indigo-400 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-300 shadow-[0_0_15px_#818cf8]" />
        
        <div className="space-y-0.5 pl-2">
          <h2 className="text-xs font-black text-white flex items-center gap-1.5 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{getGreeting()}</span>
          </h2>
          <p className="text-[10px] text-indigo-100 font-semibold">
            Aujourd'hui : Conditions stables • 0 perturbation sur votre trajet
          </p>
        </div>

        <div className="flex items-center gap-2.5 pl-2 sm:pl-0 flex-wrap">
          
          {unreadCount !== null && unreadCount > 0 && (
            <button
              onClick={handleOpenGmail}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-400 text-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-md group"
              title="Ouvrir Gmail"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-300" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                {unreadCount}
              </span>
            </button>
          )}

          {!isWorkspaceConnected ? (
            <button 
              onClick={handleGoogleLogin}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-indigo-300 text-slate-100 transition-all cursor-pointer shadow-sm group"
              title="Se connecter à Google Workspace"
            >
              <UserX className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-300" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            </button>
          ) : (
            <div 
              className="relative p-2 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-100 flex items-center justify-center shadow-sm"
              title="Workspace Connecté"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-200" />
              )}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </div>
          )}

          <div className="bg-slate-950 border border-indigo-400 px-3 py-1.5 rounded-xl text-right flex-shrink-0 shadow-inner">
            <span className="text-[11px] font-mono font-black text-cyan-300 block">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[9px] font-mono text-slate-200 block">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 1. MÉTÉO : BLEU OCÉAN TRÈS LUMINEUX */}
      {currentWeather && (
        <div className="bg-gradient-to-r from-[#0c2d57] via-[#1e40af] to-[#0c2d57] border-2 border-sky-400 rounded-2xl p-4 shadow-2xl w-full space-y-3.5 backdrop-blur-md">
          
          <div className="flex items-center justify-between border-b border-sky-300/40 pb-2.5">
            <div className="flex items-center space-x-2 text-white">
              <Sun className="w-4 h-4 text-sky-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-sky-100">Météo & Éphéméride</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-sky-400 shadow-sm" title={`Niveau thermique : ${currentTemp}°C`}>
                <LedLevelIndicator level={currentLedLevel} />
                <span className="text-[11px] font-extrabold text-white">{currentTemp}°C</span>
              </div>

              {activePrevention && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-xl border-2 text-[10px] font-black uppercase shadow-md ${activePrevention.badgeColor}`} title="Conseil de prévention météo">
                  {activePrevention.icon}
                  <span>{activePrevention.type}</span>
                </div>
              )}

              <button 
                onClick={onViewWeatherDetail} 
                className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 border border-sky-200 font-bold transition-colors cursor-pointer shadow-md"
                title="Voir la météo détaillée"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-sky-300/40 pb-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-sky-500/30 border border-sky-300 flex-shrink-0 shadow-md">
                  {renderConditionIcon(currentWeather.condition, "w-5 h-5")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                    <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[10px] text-sky-100 font-semibold truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                <span className="text-2xl font-black text-white">{currentTemp}°C</span>
                <div className="flex flex-col text-[10px] font-black leading-tight pl-2 border-l border-sky-300">
                  <span className="text-amber-300" title="Température maximale">▲ {tempMax}°</span>
                  <span className="text-sky-200" title="Température minimale">▼ {tempMin}°</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-sky-400/60 flex items-center justify-between shadow-md">
                <span className="text-sky-100 font-bold flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-300" /> {t.humidity}</span>
                <span className="font-black text-white">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-sky-400/60 flex items-center justify-between shadow-md">
                <span className="text-sky-100 font-bold flex items-center gap-1"><Wind className="w-3 h-3 text-sky-300" /> {t.wind}</span>
                <span className="font-black text-white">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-sky-950/90 p-2.5 rounded-xl border border-sky-400/60 text-[10px] shadow-md">
              <div className="flex items-center space-x-1.5 text-white font-bold truncate">
                <Sparkles className="w-3 h-3 text-sky-300 flex-shrink-0" />
                <span className="truncate">{t.saintOfDay} : St Christophe</span>
              </div>
              <div className="flex items-center space-x-2 text-sky-100 font-bold flex-shrink-0 pl-2">
                <span className="flex items-center gap-0.5"><Sunrise className="w-3 h-3 text-amber-300" /> 06:34</span>
                <span>/</span>
                <span className="flex items-center gap-0.5"><Sunset className="w-3 h-3 text-orange-300" /> 20:48</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUIVI ÉNERGÉTIQUE : SARCELLE / BLEU-VERT PROFOND (#042f2e) */}
      <div 
        onClick={onViewEnergyComfort}
        className="bg-gradient-to-r from-[#042f2e] via-[#064e3b] to-[#042f2e] border-2 border-teal-400 hover:border-amber-300 rounded-2xl p-4 shadow-2xl space-y-2.5 transition-all duration-300 cursor-pointer group backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-teal-500/40 pb-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Home className="w-4 h-4 text-amber-300" /> Suivi Énergétique & Confort Maison
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-md ${energy.badgeBg}`}>
              {energy.icon}
              <span>{energy.action}</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-teal-200 group-hover:translate-x-1 group-hover:text-amber-300 transition-all" />
          </div>
        </div>
        <p className="text-[10px] text-teal-50 leading-relaxed font-semibold">
          {energy.desc}
        </p>
      </div>

      {/* 2.5. ASSISTANT TENUES : VIOLET / INDIGO INTENSE (#3b0764) */}
      <div 
        onClick={onViewAssistant}
        className="bg-gradient-to-r from-[#3b0764] via-[#581c87] to-[#3b0764] border-2 border-purple-400 rounded-2xl p-4 shadow-2xl hover:border-purple-300 transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-md"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          
          <div className="flex items-center justify-between border-b border-purple-400/40 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-base">🎒</span>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Assistant Tenues & Accessoires</h2>
              <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-purple-900 text-purple-100 border border-purple-300 shadow-sm">
                {new Date().getHours() < 12 ? "Matin / Apm / Soir" : "Apm, Soir & Demain"}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-200 group-hover:translate-x-1 transition-transform bg-slate-950 px-2 py-1 rounded-xl border border-purple-400 shadow-sm">
              <span>Explorer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            
            <div className="bg-slate-950 border border-purple-400/60 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1 group-hover:border-purple-300 transition-colors shadow-md">
              <span className="text-[9px] font-black text-purple-300 uppercase">
                {new Date().getHours() < 12 ? "Matin" : "Après-midi"}
              </span>
              <div className="text-2xl py-0.5 drop-shadow-md">
                {currentTemp < 10 ? "🧥🧣" : currentTemp > 26 ? "🕶️🧴" : "👔☂️"}
              </div>
              <span className="text-[9.5px] font-bold text-white truncate w-full">
                {currentTemp < 10 ? "Manteau & Écharpe" : currentTemp > 26 ? "Lunettes & Crème" : "Veste & Parapluie"}
              </span>
            </div>

            <div className="bg-slate-950 border border-purple-400/60 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1 group-hover:border-purple-300 transition-colors shadow-md">
              <span className="text-[9px] font-black text-amber-300 uppercase">
                {new Date().getHours() < 12 ? "Après-midi" : "Soirée"}
              </span>
              <div className="text-2xl py-0.5 drop-shadow-md">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "☂️" : currentTemp > 25 ? "🧴☀️" : "🕶️🧢"}
              </div>
              <span className="text-[9.5px] font-bold text-white truncate w-full">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "Prévoir parapluie" : currentTemp > 25 ? "Crème solaire" : "Lunettes / Casquette"}
              </span>
            </div>

            <div className="bg-slate-950 border border-indigo-400 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1 bg-gradient-to-b from-indigo-950 to-slate-950 group-hover:border-indigo-300 transition-colors shadow-md">
              <span className="text-[9px] font-black text-indigo-300 uppercase">
                {new Date().getHours() < 12 ? "Soirée" : "Demain 📅"}
              </span>
              <div className="text-2xl py-0.5 drop-shadow-md">
                {new Date().getHours() < 12 ? "🧥" : "☂️🧢"}
              </div>
              <span className="text-[9.5px] font-bold text-white truncate w-full">
                {new Date().getHours() < 12 ? "Petite laine" : "Vérifier imperméable"}
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* 3. TRAJET PRINCIPAL : VERT ÉMERAUDE PROFOND (#064e3b) */}
      {mainTrip && (
        <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#064e3b] border-2 border-emerald-400 rounded-2xl p-4 shadow-2xl space-y-3 w-full backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-emerald-300/40 pb-2">
            <div className="flex items-center space-x-2 text-white min-w-0">
              <Navigation className="w-4 h-4 flex-shrink-0 text-emerald-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-emerald-100 truncate">
                {t.detailedRoute}
              </h2>
            </div>
            
            {onViewTrips && (
              <button 
                onClick={() => onViewTrips(activeMapMode)} 
                className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-200 font-bold transition-colors cursor-pointer shadow-md"
                title="Voir le trajet détaillé"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveMapMode('car')}
              className={`p-2.5 rounded-xl border-2 font-black flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-md ${
                activeMapMode === 'car' ? 'bg-slate-950 border-emerald-300 text-emerald-200' : 'bg-slate-900 border-emerald-800 text-slate-200 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 text-emerald-300" />
              <span>{t.byCar}</span>
            </button>

            <button
              onClick={() => setActiveMapMode('bus')}
              className={`p-2.5 rounded-xl border-2 font-black flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-md ${
                activeMapMode === 'bus' ? 'bg-slate-950 border-sky-300 text-sky-200' : 'bg-slate-900 border-sky-900 text-slate-200 hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4 text-sky-300" />
              <span>{t.byBus}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border-2 border-emerald-500/50 space-y-1 shadow-inner">
            <p className="text-white font-semibold truncate"><span className="text-emerald-300 font-bold">{t.departure}:</span> {mainTrip.origin}</p>
            <p className="text-white font-semibold truncate"><span className="text-emerald-300 font-bold">{t.arrival}:</span> {mainTrip.destination}</p>
          </div>

          <div className="h-48 rounded-xl overflow-hidden border-2 border-emerald-500/50 w-full relative shadow-inner">
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

      {/* 4. RACCOURCIS FAVORIS : BORDEAUX / CORAIL INTENSE (#881337) */}
      <div className="bg-gradient-to-r from-[#881337] via-[#9f1239] to-[#881337] border-2 border-rose-400 rounded-2xl p-4 shadow-2xl space-y-3 w-full backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-rose-400/40 pb-2">
          <div className="flex items-center space-x-2 text-white font-bold text-xs">
            <Bookmark className="w-4 h-4 text-rose-300" />
            <span>Raccourcis Favoris & Utiles (Luxembourg)</span>
          </div>
          
          <button
            onClick={onViewShortcuts}
            className="p-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 border border-rose-200 font-bold transition-colors cursor-pointer shadow-md"
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
              className="group relative p-3 rounded-xl bg-slate-950 border-2 border-rose-400/60 hover:border-rose-200 transition-all flex flex-col justify-between space-y-2 cursor-pointer shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-rose-200 uppercase tracking-wide border border-rose-400">
                  {link.category}
                </span>
                <button
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-rose-200 p-0.5 transition-opacity"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center space-x-1.5 min-w-0 pr-1">
                  <Globe className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
                  <span className="text-white font-extrabold text-xs truncate group-hover:text-rose-200 transition-colors">
                    {link.name}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-200 group-hover:text-rose-300 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 5. ACTUALITÉS : BLEU ARDOISE / PÉTROLE LUMINEUX (#0f766e) */}
      <div className="bg-gradient-to-r from-[#0f5358] via-[#0f766e] to-[#0f5358] border-2 border-teal-400 rounded-2xl p-4 shadow-2xl space-y-3 w-full backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-teal-300/40 pb-2.5">
          <div className="flex items-center space-x-2 text-white">
            <Newspaper className="w-4 h-4 text-teal-300" />
            <h2 className="text-xs font-black uppercase tracking-wider text-teal-100">
              {t.liveNews}
            </h2>
          </div>
          <button 
            onClick={onViewSourcesNews} 
            className="p-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 border border-teal-100 font-bold transition-colors cursor-pointer shadow-md"
            title="Voir toutes les sources d'actualités"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-teal-400 w-full">
          {carouselArticles.map((art) => {
            const isEssentiel = (art.source || '').toLowerCase().includes('essentiel');
            return (
              <div 
                key={art.id}
                onClick={() => onReadArticle(art)}
                className={`flex-shrink-0 w-60 border-2 rounded-xl p-3.5 shadow-xl cursor-pointer transition-all duration-300 group flex flex-col justify-between ${
                  isEssentiel 
                    ? 'bg-slate-950 border-teal-300 hover:border-white shadow-teal-950/80' 
                    : 'bg-slate-950/90 border-teal-600 hover:border-teal-400'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-900 border border-teal-500 shadow-md">
                      {getNewsIcon(art.title, art.source)}
                    </div>
                    <span className="text-[9px] text-slate-200 font-bold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-teal-300" /> {art.publishedAt}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded shadow-sm ${
                      isEssentiel ? 'bg-teal-500 text-slate-950 font-black border border-teal-200' : 'text-slate-100 bg-slate-900 border border-teal-600'
                    }`}>
                      {art.source}
                    </span>
                    <h3 className="font-extrabold text-white text-xs group-hover:text-teal-300 transition-colors line-clamp-3 leading-snug pt-1">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-teal-800/60 text-[10px]">
                  <span className="text-teal-300 font-black flex items-center space-x-1">
                    <span>{t.read}</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }} 
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-teal-800 text-slate-200 hover:text-white transition-colors border border-teal-500"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedArticleIds?.includes(art.id) ? 'text-teal-300 fill-teal-300' : ''}`} />
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