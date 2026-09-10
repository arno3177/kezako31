import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { auth } from '../firebase';
import { GoogleAuthService } from '../service/googleAuthService';
import { fetchUnreadEmailCount } from '../service/gmailService';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Droplets, Wind, Bookmark,
  Newspaper,
  Car, Bus, 
  Sunrise, Sunset, Sparkles,
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
  onBack?: () => void;
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
  onViewShortcuts,
  onViewAssistant,
  onViewEnergyComfort,
  searchQuery,
  language = 'en',
  onBack
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');

  // Gestion du glissement tactile (Swipe to go back)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX.current;
    const diffY = Math.abs(touchEndY - touchStartY.current);

    if (diffX > 100 && diffY < 60) {
      if (onBack) {
        onBack();
      } else {
        window.history.back();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

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
        icon: <Flame className="w-4 h-4 text-sky-200" />,
        action: "Optimisation Thermique Active"
      };
    } else if (currentTemp >= 22) {
      return {
        title: "Aération Matinale Conseillée",
        desc: `Chaleur extérieure marquée (${currentTemp}°C). Aérez tôt le matin (avant 9h) puis baissez les stores pour garder la maison au frais sans surconsommer.`,
        icon: <Zap className="w-4 h-4 text-teal-200" />,
        action: "Gestion Fraîcheur Active"
      };
    } else {
      return {
        title: "Aération Idéale (10 min max)",
        desc: `Conditions extérieures stables (${currentTemp}°C, humidité ${humidity}%). C'est le moment parfait pour faire un courant d'air rapide et renouveler l'air intérieur.`,
        icon: <CheckCircle2 className="w-4 h-4 text-sky-200" />,
        action: "Renouvellement d'air optimal"
      };
    }
  };

  const energy = getEnergyAndComfortStatus();

  const activePrevention = useMemo(() => {
    if (!currentWeather) return null;
    const wind = Number(currentWeather.windSpeed ?? 10);

    if (currentTemp > 32) return { type: 'Chaleur', badgeColor: 'bg-sky-700 border-sky-300 text-white', icon: <Info className="w-3 h-3 text-sky-200" /> };
    if (currentTemp < 4) return { type: 'Froid', badgeColor: 'bg-teal-700 border-teal-300 text-white', icon: <Info className="w-3 h-3 text-teal-200" /> };
    if (wind > 45) return { type: 'Vent', badgeColor: 'bg-blue-700 border-blue-300 text-white', icon: <Info className="w-3 h-3 text-blue-200" /> };
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

  const sortedArticles = useMemo(() => {
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
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-sky-200`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-100`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-100`} />;
    return <CloudSun className={`${className} text-sky-200`} />;
  };

  const getNewsIcon = (title = '', source = '') => {
    const text = (title + ' ' + source).toLowerCase();
    if (text.includes('trafic') || text.includes('bus') || text.includes('route') || text.includes('train')) return <Bus className="w-5 h-5 text-sky-200" />;
    if (text.includes('voiture') || text.includes('accident') || text.includes('radar')) return <Car className="w-5 h-5 text-sky-200" />;
    if (text.includes('meteo') || text.includes('temps') || text.includes('pluie') || text.includes('soleil')) return <Sun className="w-5 h-5 text-sky-200" />;
    if (text.includes('economie') || text.includes('bourse') || text.includes('prix') || text.includes('emploi')) return <Briefcase className="w-5 h-5 text-teal-200" />;
    if (text.includes('politique') || text.includes('gouvernement') || text.includes('commune')) return <Building2 className="w-5 h-5 text-cyan-200" />;
    if (text.includes('alerte') || text.includes('police') || text.includes('feu')) return <ShieldAlert className="w-5 h-5 text-sky-300" />;
    if (text.includes('tech') || text.includes('ia') || text.includes('innovation')) return <Zap className="w-5 h-5 text-teal-200" />;
    return <Globe className="w-5 h-5 text-sky-200" />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-8 animate-fade-in text-xs w-full max-w-full overflow-x-hidden pb-20 relative text-slate-100 bg-[#1e293b] min-h-screen px-3 sm:px-4"
    >

      {/* POPUP DE NOTIFICATION */}
      {popupMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce transition-all ${
          popupMessage.type === 'success' 
            ? 'bg-[#334155] border-sky-300 text-white' 
            : 'bg-[#334155] border-sky-300 text-white'
        }`}>
          <span>{popupMessage.text}</span>
        </div>
      )}

      {/* EN-TÊTE UNIFIÉ */}
      <div className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-sky-400/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-400" />
        
        <div className="space-y-1.5 pl-2">
          <h2 className="text-sm font-black text-white flex items-center gap-2 tracking-wide">
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>{getGreeting()}</span>
          </h2>
          <p className="text-[11px] text-slate-200 font-medium">
            Aujourd'hui : Conditions stables • 0 perturbation sur votre trajet
          </p>
        </div>

        <div className="flex items-center gap-3 pl-2 sm:pl-0 flex-wrap">
          {unreadCount !== null && unreadCount > 0 && (
            <button
              onClick={handleOpenGmail}
              className="relative p-2.5 rounded-2xl bg-[#475569] hover:bg-[#64748b] border border-sky-300 text-sky-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md group"
              title="Ouvrir Gmail"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform text-sky-200" />
              <span className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                {unreadCount}
              </span>
            </button>
          )}

          {!isWorkspaceConnected ? (
            <button 
              onClick={handleGoogleLogin}
              className="relative p-2.5 rounded-2xl bg-[#475569] hover:bg-[#64748b] border border-slate-400 hover:border-sky-300 text-slate-100 transition-all active:scale-95 cursor-pointer shadow-md group"
              title="Se connecter à Google Workspace"
            >
              <UserX className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-200" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
              </span>
            </button>
          ) : (
            <div 
              className="relative p-2.5 rounded-2xl bg-teal-800 border border-teal-300 text-teal-100 flex items-center justify-center shadow-md"
              title="Workspace Connecté"
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserCheck className="w-4 h-4 text-teal-200" />
              )}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
              </span>
            </div>
          )}

          <div className="bg-[#334155] border border-slate-400 px-3.5 py-2 rounded-2xl text-right flex-shrink-0 shadow-md">
            <span className="text-xs font-mono font-black text-sky-300 block">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] font-mono text-slate-200 block">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 1. SECTION MÉTÉO - Correction du chevauchement avec une grille rigide flex/grid */}
      {currentWeather && (
        <div 
          onClick={onViewWeatherDetail}
          className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 rounded-3xl p-5 shadow-xl w-full space-y-4 backdrop-blur-md cursor-pointer group hover:border-sky-300 active:scale-[0.99] transition-all duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-500/80 pb-3.5">
            <div className="flex items-center space-x-2.5 text-white">
              <Sun className="w-4 h-4 text-sky-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Météo & Éphéméride</h2>
              <span className="text-[10px] font-bold text-sky-200 bg-[#475569] px-3 py-1 rounded-lg border border-slate-400 ml-2 shadow-sm">
                St Christophe
              </span>
            </div>
            
            {activePrevention && (
              <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl border text-[10px] font-black uppercase shadow-md ${activePrevention.badgeColor}`} title="Conseil de prévention météo">
                {activePrevention.icon}
                <span>{activePrevention.type}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Ligne principale isolée pour éliminer tout risque de chevauchement sur S25 Ultra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-3 border-b border-slate-500/80 pb-4">
              
              {/* Colonne gauche : Icône + Ville + Condition */}
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="p-3 rounded-2xl bg-[#475569] border border-slate-400 flex-shrink-0 shadow-md">
                  {renderConditionIcon(currentWeather.condition, "w-6 h-6")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-sky-300 flex-shrink-0" />
                    <h1 className="text-sm font-black text-white truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[11px] text-slate-200 font-medium truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              {/* Colonne droite : Température actuelle, Min/Max et Lever/Coucher alignés proprement */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-500/50">
                <span className="text-3xl font-black text-white">{currentTemp}°C</span>
                <div className="flex flex-col text-[10px] font-black leading-tight pl-3 border-l border-slate-400">
                  <span className="text-sky-300" title="Température maximale">▲ {tempMax}°</span>
                  <span className="text-slate-200" title="Température minimale">▼ {tempMin}°</span>
                </div>
                <div className="flex flex-col text-[10px] font-medium leading-tight pl-3 border-l border-slate-400">
                  <span className="text-slate-100 flex items-center gap-1" title="Lever du soleil"><Sunrise className="w-3 h-3 text-sky-300" /> 06:34</span>
                  <span className="text-slate-100 flex items-center gap-1 mt-0.5" title="Coucher du soleil"><Sunset className="w-3 h-3 text-sky-400" /> 20:48</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-[#26354a] p-3.5 rounded-2xl border border-slate-500/80 flex items-center justify-between shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-sky-300" /> {t.humidity}</span>
                <span className="font-black text-white">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-[#26354a] p-3.5 rounded-2xl border border-slate-500/80 flex items-center justify-between shadow-sm">
                <span className="text-slate-200 font-bold flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-sky-300" /> {t.wind}</span>
                <span className="font-black text-white">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUIVI ÉNERGÉTIQUE */}
      <div 
        onClick={onViewEnergyComfort}
        className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 hover:border-sky-300 rounded-3xl p-5 shadow-xl space-y-3.5 transition-all duration-200 active:scale-[0.99] cursor-pointer group backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-slate-500/80 pb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Home className="w-4 h-4 text-sky-300" /> Suivi Énergétique & Confort Maison
          </h2>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 bg-sky-700 border-sky-300 text-white shadow-md`}>
            {energy.icon}
            <span>{energy.action}</span>
          </span>
        </div>
        <p className="text-[11px] text-slate-200 leading-relaxed font-medium pt-1">
          {energy.desc}
        </p>
      </div>

      {/* 2.5. ASSISTANT TENUES */}
      <div 
        onClick={onViewAssistant}
        className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 rounded-3xl p-5 shadow-xl hover:border-sky-300 transition-all duration-200 active:scale-[0.99] cursor-pointer group relative overflow-hidden backdrop-blur-md"
      >
        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center justify-between border-b border-slate-500/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-base">🎒</span>
              <h2 className="text-xs font-black text-white uppercase tracking-wider">Assistant Tenues & Accessoires</h2>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#475569] text-sky-200 border border-slate-400 shadow-sm">
                {new Date().getHours() < 12 ? "Matin / Apm / Soir" : "Apm, Soir & Demain"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-[#26354a] border border-slate-500/80 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-sky-300 transition-colors shadow-sm">
              <span className="text-[10px] font-black text-sky-300 uppercase">
                {new Date().getHours() < 12 ? "Matin" : "Après-midi"}
              </span>
              <div className="text-3xl py-1">
                {currentTemp < 10 ? "🧥🧣" : currentTemp > 26 ? "🕶️🧴" : "👔☂️"}
              </div>
              <span className="text-[10px] font-bold text-white truncate w-full">
                {currentTemp < 10 ? "Manteau & Écharpe" : currentTemp > 26 ? "Lunettes & Crème" : "Veste & Parapluie"}
              </span>
            </div>

            <div className="bg-[#26354a] border border-slate-500/80 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-sky-300 transition-colors shadow-sm">
              <span className="text-[10px] font-black text-sky-300 uppercase">
                {new Date().getHours() < 12 ? "Après-midi" : "Soirée"}
              </span>
              <div className="text-3xl py-1">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "☂️" : currentTemp > 25 ? "🧴☀️" : "🕶️🧢"}
              </div>
              <span className="text-[10px] font-bold text-white truncate w-full">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "Prévoir parapluie" : currentTemp > 25 ? "Crème solaire" : "Lunettes / Casquette"}
              </span>
            </div>

            <div className="bg-[#26354a] border border-slate-500/80 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-sky-300 transition-colors shadow-sm">
              <span className="text-[10px] font-black text-sky-300 uppercase">
                {new Date().getHours() < 12 ? "Soirée" : "Demain 📅"}
              </span>
              <div className="text-3xl py-1">
                {new Date().getHours() < 12 ? "🧥" : "☂️🧢"}
              </div>
              <span className="text-[10px] font-bold text-white truncate w-full">
                {new Date().getHours() < 12 ? "Petite laine" : "Vérifier imperméable"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TRAJET PRINCIPAL */}
      {mainTrip && (
        <div 
          onClick={() => onViewTrips && onViewTrips(activeMapMode)}
          className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 hover:border-sky-300 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between border-b border-slate-500/80 pb-3">
            <div className="flex items-center space-x-2.5 text-white min-w-0">
              <Car className="w-4 h-4 flex-shrink-0 text-sky-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-white truncate">
                {t.detailedRoute}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMapMode('car')}
              className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                activeMapMode === 'car' ? 'bg-sky-600 border-sky-300 text-white shadow-lg' : 'bg-[#475569] border-slate-400 text-slate-100 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 text-sky-200" />
              <span>{t.byCar}</span>
            </button>

            <button
              onClick={() => setActiveMapMode('bus')}
              className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                activeMapMode === 'bus' ? 'bg-teal-600 border-teal-300 text-white shadow-lg' : 'bg-[#475569] border-slate-400 text-slate-100 hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4 text-teal-200" />
              <span>{t.byBus}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#26354a] border border-slate-500/80 space-y-1.5 shadow-sm">
            <p className="text-white font-semibold truncate"><span className="text-sky-300 font-bold">{t.departure}:</span> {mainTrip.origin}</p>
            <p className="text-white font-semibold truncate"><span className="text-sky-300 font-bold">{t.arrival}:</span> {mainTrip.destination}</p>
          </div>

          <div className="h-48 rounded-2xl overflow-hidden border border-slate-500/80 w-full relative shadow-sm">
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

      {/* 4. RACCOURCIS FAVORIS */}
      <div 
        onClick={onViewShortcuts}
        className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 hover:border-sky-300 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-slate-500/80 pb-3">
          <div className="flex items-center space-x-2.5 text-white font-black text-xs">
            <Bookmark className="w-4 h-4 text-sky-300" />
            <span>Raccourcis Favoris & Utiles (Luxembourg)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" onClick={(e) => e.stopPropagation()}>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 rounded-2xl bg-[#26354a] border border-slate-500/80 hover:border-sky-300 transition-all duration-200 active:scale-[0.97] flex flex-col justify-between space-y-2.5 cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#475569] text-sky-300 uppercase tracking-wide border border-slate-400">
                  {link.category}
                </span>
                <button
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 p-1 transition-opacity cursor-pointer"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center space-x-2 min-w-0 pr-1">
                  <Globe className="w-4 h-4 text-sky-300 flex-shrink-0" />
                  <span className="text-white font-extrabold text-xs truncate group-hover:text-sky-300 transition-colors">
                    {link.name}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-300 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 5. ACTUALITÉS */}
      <div 
        onClick={onViewSourcesNews}
        className="bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] border border-slate-500/80 hover:border-sky-300 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-slate-500/80 pb-3.5">
          <div className="flex items-center space-x-2.5 text-white">
            <Newspaper className="w-4 h-4 text-sky-300" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              {t.liveNews}
            </h2>
          </div>
        </div>

        <div className="flex space-x-3.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-sky-300 w-full" onClick={(e) => e.stopPropagation()}>
          {carouselArticles.map((art) => {
            return (
              <div 
                key={art.id}
                onClick={() => onReadArticle(art)}
                className="flex-shrink-0 w-64 bg-[#26354a] border border-slate-500/80 hover:border-sky-300 rounded-2xl p-4 shadow-md cursor-pointer transition-all duration-200 active:scale-[0.97] group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-2xl bg-[#475569] border border-slate-400 shadow-sm">
                      {getNewsIcon(art.title, art.source)}
                    </div>
                    <span className="text-[10px] text-slate-200 font-bold flex items-center gap-0.5">
                      {art.publishedAt}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-lg bg-sky-700 text-white border border-sky-400">
                      {art.source}
                    </span>
                    <h3 className="font-extrabold text-white text-xs group-hover:text-sky-300 transition-colors line-clamp-3 leading-snug pt-1">
                      {art.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-slate-500/80 text-[11px]">
                  <span className="text-sky-300 font-black flex items-center space-x-1">
                    <span>{t.read}</span>
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }} 
                    className={`p-2 rounded-xl border transition-all active:scale-90 cursor-pointer ${
                      savedArticleIds?.includes(art.id) 
                        ? 'bg-sky-500/20 border-sky-300 text-sky-200' 
                        : 'bg-[#475569] border-slate-400 text-slate-200 hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedArticleIds?.includes(art.id) ? 'fill-current' : ''}`} />
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