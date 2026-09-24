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
  Trash2, Info, Mail, UserCheck, UserX,
  Home, Thermometer, ShieldCheck
} from 'lucide-react';
import { DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, Shortcut } from './ShortcutsPage';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

// --- HOOK DE NEWS POUR LE MONDE & FRANCE 24 (OPTIMISÉ MOBILE / CAPACITOR) ---
function useNewsFetcher() {
  const LOCAL_CACHE_KEY = 'news_lemonde_france24_mobile_v1';

  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[Cache Read Warning]', e);
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(articles.length === 0);

  useEffect(() => {
    let isMounted = true;

    async function fetchXML(targetUrl: string, viteProxyPath: string, sourceName: string, category: string) {
      const proxies = import.meta.env.DEV
        ? [viteProxyPath]
        : [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
          ];

      let textData = '';

      for (const proxyUrl of proxies) {
        try {
          const res = await fetch(proxyUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && (text.includes('<item') || text.includes('<entry'))) {
              textData = text;
              break;
            }
          }
        } catch (err) {
          console.warn(`[Proxy Fail] ${sourceName} via ${proxyUrl}`, err);
        }
      }

      if (!textData) {
        try {
          const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}&_t=${Date.now()}`);
          if (res.ok) {
            const json = await res.json();
            if (json.status === 'ok' && Array.isArray(json.items)) {
              return json.items.slice(0, 15).map((item: any, idx: number) => {
                const cleanDesc = (item.description || item.content || '').replace(/<[^>]*>?/gm, '').trim();
                const pubDate = item.pubDate || '';
                const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
                const formattedTime = pubDate && !isNaN(timestamp)
                  ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Récemment';

                return {
                  id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}-${timestamp}`,
                  title: item.title || '',
                  excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
                  content: cleanDesc || item.title,
                  category,
                  source: sourceName,
                  url: item.link || '',
                  publishedAt: formattedTime,
                  rawDate: isNaN(timestamp) ? Date.now() : timestamp,
                  imageUrl: item.thumbnail || item.enclosure?.link || undefined,
                  readTime: '3 min',
                  likes: Math.floor(Math.random() * 40) + 10,
                  commentsCount: Math.floor(Math.random() * 10) + 1,
                  author: { name: sourceName, avatar: `https://www.google.com/s2/favicons?domain=${sourceName}&sz=32` }
                };
              });
            }
          }
        } catch (e) {
          console.warn(`[rss2json Fallback Failed] ${sourceName}`, e);
          return [];
        }
      }

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, 'text/xml');
        const items = Array.from(xmlDoc.querySelectorAll('item, entry'));

        return items.slice(0, 15).map((item, idx) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description, summary, content')?.textContent || '';
          const pubDate = item.querySelector('pubDate, updated, published')?.textContent || '';

          let link = item.querySelector('link')?.textContent || item.querySelector('guid')?.textContent || '';
          if (!link) {
            const linkAttr = item.querySelector('link')?.getAttribute('href');
            if (linkAttr) link = linkAttr;
          }

          const enclosure = item.querySelector('enclosure')?.getAttribute('url');
          const mediaContent = item.getElementsByTagName('media:content')[0]?.getAttribute('url') ||
                               item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content')[0]?.getAttribute('url');
          const mediaThumbnail = item.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') ||
                                 item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0]?.getAttribute('url');
          const imageFromHTML = description.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

          const imageUrl = enclosure || mediaContent || mediaThumbnail || imageFromHTML || undefined;

          const cleanDesc = description.replace(/<[^>]*>?/gm, '').trim();
          const timestamp = pubDate ? new Date(pubDate).getTime() : Date.now();
          const formattedTime = pubDate && !isNaN(timestamp)
            ? new Date(pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Récemment';

          return {
            id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}-${timestamp}`,
            title,
            excerpt: cleanDesc.slice(0, 160) + (cleanDesc.length > 160 ? '...' : ''),
            content: cleanDesc || title,
            category,
            source: sourceName,
            url: link,
            publishedAt: formattedTime,
            rawDate: isNaN(timestamp) ? Date.now() : timestamp,
            imageUrl,
            readTime: '3 min',
            likes: Math.floor(Math.random() * 40) + 10,
            commentsCount: Math.floor(Math.random() * 10) + 1,
            author: { name: sourceName, avatar: `https://www.google.com/s2/favicons?domain=${sourceName}&sz=32` }
          };
        });
      } catch (e) {
        console.warn(`[XML Parsing Error] ${sourceName}`, e);
        return [];
      }
    }

    async function loadAllNews() {
      const [f24, monde] = await Promise.all([
        fetchXML('https://www.france24.com/fr/rss', '/proxy-france24/fr/rss', 'www.france24.com', 'Actualités'),
        fetchXML('https://www.lemonde.fr/rss/une.xml', '/proxy-lemonde/rss/une.xml', 'www.lemonde.fr', 'Actualités')
      ]);

      const total = [...f24, ...monde];

      if (isMounted) {
        if (total.length > 0) {
          total.sort((a: any, b: any) => b.rawDate - a.rawDate);
          setArticles(total as any);
          try {
            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(total));
          } catch (e) {
            console.warn('[Cache Write Warning]', e);
          }
        }
        setLoading(false);
      }
    }

    loadAllNews();

    return () => {
      isMounted = false;
    };
  }, []);

  return { articles, loading };
}

// --- COMPOSANT HOMEPAGE ---
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
  onViewHomePulse?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  language?: AppSettings['language'];
  onBack?: () => void;
  
}

export const HomePage: React.FC<HomePageProps> = ({
  articles: propArticles,
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
  onViewHomePulse,
  searchQuery,
  language = 'en',
  onBack
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');

  const { articles: fetchedArticles, loading: newsLoading } = useNewsFetcher();
  const articles = propArticles && propArticles.length > 0 ? propArticles : fetchedArticles;

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
        title: "Chauffage & Isolation",
        statusText: "Optimisation Thermique Active",
        interiorTarget: "20.5°C",
        actionBadge: "Volets fermés",
        desc: `Extérieur frais (${currentTemp}°C). Conservez l'inertie thermique en fermant les volets.`
      };
    } else if (currentTemp >= 22) {
      return {
        title: "Rafraîchissement",
        statusText: "Gestion Fraîcheur Active",
        interiorTarget: "22.0°C",
        actionBadge: "Stores baissés",
        desc: `Chaleur extérieure (${currentTemp}°C). Aération matinale conseillée avant 9h.`
      };
    } else {
      return {
        title: "Ventilation Naturelle",
        statusText: "Renouvellement d'air optimal",
        interiorTarget: "21.0°C",
        actionBadge: "Fenêtres entrouvertes",
        desc: `Conditions stables (${currentTemp}°C, ${humidity}% humidité). Idéal pour un courant d'air rapide.`
      };
    }
  };

  const energy = getEnergyAndComfortStatus();

  const activePrevention = useMemo(() => {
    if (!currentWeather) return null;
    const wind = Number(currentWeather.windSpeed ?? 10);

    if (currentTemp > 32) return { type: 'Chaleur', badgeColor: 'bg-slate-700/50 border-slate-600 text-slate-200', icon: <Info className="w-3 h-3 text-slate-300" /> };
    if (currentTemp < 4) return { type: 'Froid', badgeColor: 'bg-slate-700/50 border-slate-600 text-slate-200', icon: <Info className="w-3 h-3 text-slate-300" /> };
    if (wind > 45) return { type: 'Vent', badgeColor: 'bg-slate-700/50 border-slate-600 text-slate-200', icon: <Info className="w-3 h-3 text-slate-300" /> };
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

  const carouselArticles = filteredArticles.slice(0, 16);

  const renderConditionIcon = (condition = '', className = "w-5 h-5") => {
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-slate-200`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-slate-300`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-400`} />;
    return <CloudSun className={`${className} text-slate-300`} />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg');

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-4 animate-fade-in text-xs w-full max-w-xl mx-auto overflow-x-hidden pb-20 relative text-slate-100 px-1 font-sans"
    >

      {/* POPUP DE NOTIFICATION */}
      {popupMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce transition-all ${
          popupMessage.type === 'success' 
            ? 'bg-slate-800 border-slate-600 text-slate-100 shadow-slate-950' 
            : 'bg-slate-800 border-slate-600 text-slate-100'
        }`}>
          <span>{popupMessage.text}</span>
        </div>
      )}

      {/* EN-TÊTE - Gris Acier Brossé */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-2xl flex items-center justify-between gap-4 w-full relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-500" />
        
        <div className="space-y-1 pl-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-slate-300 animate-pulse" />
            <h2 className="text-sm font-black text-slate-100 tracking-wide">
              {getGreeting()}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span>Systèmes opérationnels • 0 alerte</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
            {unreadCount !== null && unreadCount > 0 && (
              <button
                onClick={handleOpenGmail}
                className="relative p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md group font-bold border border-slate-600"
                title="Ouvrir Gmail"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-200" />
                <span className="absolute -top-1 -right-1 bg-slate-900 text-slate-200 border border-slate-600 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md">
                  {unreadCount}
                </span>
              </button>
            )}

            {!isWorkspaceConnected ? (
              <button 
                onClick={handleGoogleLogin}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm group"
                title="Se connecter à Google Workspace"
              >
                <UserX className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-400" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                </span>
              </button>
            ) : (
              <div 
                className="relative p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 flex items-center justify-center shadow-sm"
                title="Workspace Connecté"
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-slate-200" />
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900/90 border border-slate-700 px-3.5 py-2 rounded-2xl text-right shadow-inner">
            <span className="text-xs font-mono font-black text-slate-200 block tracking-wider">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block uppercase font-semibold">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* 1. SECTION MÉTÉO */}
      {currentWeather && (
        <div 
          onClick={onViewWeatherDetail}
          className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl w-full space-y-4 backdrop-blur-md cursor-pointer group hover:border-slate-500 active:scale-[0.99] transition-all duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3.5">
            <div className="flex items-center space-x-2.5 text-slate-200">
              <Sun className="w-4 h-4 text-slate-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">Météo & Éphéméride</h2>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 ml-2 shadow-inner">
                St Christophe
              </span>
            </div>
            
            {activePrevention && (
              <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border text-[10px] font-bold uppercase shadow-md ${activePrevention.badgeColor}`} title="Conseil de prévention météo">
                {activePrevention.icon}
                <span>{activePrevention.type}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-3 border-b border-slate-700 pb-4">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-750 flex-shrink-0 shadow-inner">
                  {renderConditionIcon(currentWeather.condition, "w-6 h-6")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <h1 className="text-sm font-black text-slate-100 truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700">
                <span className="text-3xl font-black text-slate-100">{currentTemp}°C</span>
                <div className="flex flex-col text-[10px] font-bold leading-tight pl-3 border-l border-slate-700">
                  <span className="text-slate-200" title="Température maximale">▲ {tempMax}°</span>
                  <span className="text-slate-400" title="Température minimale">▼ {tempMin}°</span>
                </div>
                <div className="flex flex-col text-[10px] font-medium leading-tight pl-3 border-l border-slate-700">
                  <span className="text-slate-300 flex items-center gap-1" title="Lever du soleil"><Sunrise className="w-3 h-3 text-slate-300" /> 06:34</span>
                  <span className="text-slate-300 flex items-center gap-1 mt-0.5" title="Coucher du soleil"><Sunset className="w-3 h-3 text-slate-300" /> 20:48</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between shadow-inner">
                <span className="text-slate-300 font-bold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-slate-300" /> {t.humidity}</span>
                <span className="font-black text-slate-100">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 flex items-center justify-between shadow-inner">
                <span className="text-slate-300 font-bold flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-slate-300" /> {t.wind}</span>
                <span className="font-black text-slate-100">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUIVI ÉNERGÉTIQUE & CONFORT MAISON */}
      <div 
        onClick={onViewEnergyComfort}
        className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 hover:border-slate-500 rounded-3xl p-5 shadow-xl space-y-4 transition-all duration-200 active:scale-[0.99] cursor-pointer group backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-slate-700 pb-3.5">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Home className="w-4 h-4 text-slate-300" /> Suivi Énergétique & Confort Maison
          </h2>
          <span className="text-[10px] font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 bg-slate-900 border-slate-700 text-slate-300 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            <span>{energy.actionBadge}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-slate-300" /> Intérieur Cible
            </span>
            <span className="text-base font-black text-slate-100 pt-1">{energy.interiorTarget}</span>
          </div>

          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-slate-300" /> Statut Thermique
            </span>
            <span className="text-xs font-extrabold text-slate-200 pt-1 truncate">{energy.statusText}</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900 p-3 rounded-2xl border border-slate-700 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-slate-300" /> Action Solaire
            </span>
            <span className="text-xs font-extrabold text-slate-200 pt-1 truncate">Inertie préservée</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-1 px-1">
          {energy.desc}
        </p>
      </div>

      {/* 2.5. ASSISTANT TENUES */}
      <div 
        onClick={onViewAssistant}
        className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-xl hover:border-slate-500 transition-all duration-200 active:scale-[0.99] cursor-pointer group relative overflow-hidden backdrop-blur-md"
      >
        <div className="space-y-3.5 relative z-10">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-base">🎒</span>
              <h2 className="text-xs font-black text-slate-200 uppercase tracking-wider">Assistant Tenues & Accessoires</h2>
              <span className="text-[10px] font-bold px-3 py-1 rounded-xl bg-slate-900 text-slate-300 border border-slate-700 shadow-inner">
                {new Date().getHours() < 12 ? "Matin / Apm / Soir" : "Apm, Soir & Demain"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-slate-500 transition-colors shadow-inner">
              <span className="text-[10px] font-black text-slate-300 uppercase">
                {new Date().getHours() < 12 ? "Matin" : "Après-midi"}
              </span>
              <div className="text-3xl py-1">
                {currentTemp < 10 ? "🧥🧣" : currentTemp > 26 ? "🕶️🧴" : "👔☂️"}
              </div>
              <span className="text-[10px] font-bold text-slate-200 truncate w-full">
                {currentTemp < 10 ? "Manteau & Écharpe" : currentTemp > 26 ? "Lunettes & Crème" : "Veste & Parapluie"}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-slate-500 transition-colors shadow-inner">
              <span className="text-[10px] font-black text-slate-300 uppercase">
                {new Date().getHours() < 12 ? "Après-midi" : "Soirée"}
              </span>
              <div className="text-3xl py-1">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "☂️" : currentTemp > 25 ? "🧴☀️" : "🕶️🧢"}
              </div>
              <span className="text-[10px] font-bold text-slate-200 truncate w-full">
                {currentWeather?.condition?.toLowerCase().includes('pluie') ? "Prévoir parapluie" : currentTemp > 25 ? "Crème solaire" : "Lunettes / Casquette"}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 group-hover:border-slate-500 transition-colors shadow-inner">
              <span className="text-[10px] font-black text-slate-300 uppercase">
                {new Date().getHours() < 12 ? "Soirée" : "Demain 📅"}
              </span>
              <div className="text-3xl py-1">
                {new Date().getHours() < 12 ? "🧥" : "☂️🧢"}
              </div>
              <span className="text-[10px] font-bold text-slate-200 truncate w-full">
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
          className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 hover:border-slate-500 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center space-x-2.5 text-slate-200 min-w-0">
              <Car className="w-4 h-4 flex-shrink-0 text-slate-300" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 truncate">
                {t.detailedRoute}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveMapMode('car')}
              className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                activeMapMode === 'car' ? 'bg-slate-700 border-slate-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4 text-slate-200" />
              <span>{t.byCar}</span>
            </button>

            <button
              onClick={() => setActiveMapMode('bus')}
              className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                activeMapMode === 'bus' ? 'bg-slate-700 border-slate-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bus className="w-4 h-4 text-slate-200" />
              <span>{t.byBus}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 space-y-1.5 shadow-inner">
            <p className="text-slate-200 font-semibold truncate"><span className="text-slate-300 font-bold">{t.departure}:</span> {mainTrip.origin}</p>
            <p className="text-slate-200 font-semibold truncate"><span className="text-slate-300 font-bold">{t.arrival}:</span> {mainTrip.destination}</p>
          </div>

          <div className="h-48 rounded-2xl overflow-hidden border border-slate-700 w-full relative shadow-inner">
            <iframe
              key={activeMapMode}
              title="Carte interactive du trajet"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%)' }}
              loading="lazy"
              src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed`}
            />
          </div>
        </div>
      )}

      {/* 4. RACCOURCIS FAVORIS */}
      <div 
        onClick={onViewShortcuts}
        className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 hover:border-slate-500 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2.5 text-slate-200 font-black text-xs">
            <Bookmark className="w-4 h-4 text-slate-300" />
            <h2 className="uppercase tracking-wider">Accès Rapides</h2>
          </div>
          <span className="text-[9px] font-bold px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 shadow-inner">
            {links.length} favoris
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 transition-all duration-200 active:scale-[0.97] shadow-inner group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 flex-shrink-0 shadow-inner group-hover:bg-slate-700 group-hover:border-slate-500 transition-colors">
                  <Sparkles className="w-4 h-4 text-slate-300 group-hover:text-slate-100" />
                </div>
                
                <div className="flex flex-col truncate pr-2">
                  <span className="text-slate-100 font-extrabold text-xs truncate group-hover:text-slate-300 transition-colors">
                    {link.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    {link.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 pl-1 border-l border-slate-800">
                <button
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer active:scale-90"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>
{/* 2.2. HOME-PULSE / GESTION HABITAT */}
<div 
  onClick={onViewHomePulse}
  className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 hover:border-slate-500 rounded-3xl p-5 shadow-xl space-y-3 transition-all duration-200 active:scale-[0.99] cursor-pointer group backdrop-blur-md"
>
  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
    <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
      <Home className="w-4 h-4 text-slate-300" /> HomePulse & Habitudes Foyer
    </h2>
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
      Gestion active
    </span>
  </div>
  <p className="text-[11px] text-slate-400 font-medium">
    Suivi des micro-tâches, maintenance et entretien de la maison sans charge mentale.
  </p>
</div>
      {/* 5. ACTUALITÉS (Carrousel multi-sources) */}
      <div 
        onClick={onViewSourcesNews}
        className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 hover:border-slate-500 rounded-3xl p-5 shadow-xl space-y-4 w-full backdrop-blur-md cursor-pointer group transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2.5 text-slate-200">
            <Newspaper className="w-4 h-4 text-slate-300" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {t.liveNews}
            </h2>
          </div>
          <span className="text-[9px] font-bold px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 shadow-inner">
            {newsLoading ? "Chargement..." : `${carouselArticles.length} en direct`}
          </span>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-600 w-full" onClick={(e) => e.stopPropagation()}>
          {carouselArticles.map((art) => {
            const isSaved = savedArticleIds?.includes(art.id);
            const cleanSource = art.source ? art.source.replace('www.', '') : 'Actualité';

            return (
              <div 
                key={art.id}
                onClick={() => {
                  const articleUrl = (art as any).url || (art as any).link;
                  if (articleUrl) {
                    window.open(articleUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    onReadArticle(art);
                  }
                }}
                className="flex-shrink-0 w-80 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-2xl p-4 shadow-inner cursor-pointer transition-all duration-200 active:scale-[0.97] group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-300 tracking-wide bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                      {cleanSource}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {art.publishedAt}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(art.id);
                    }} 
                    className={`p-1.5 rounded-xl border transition-all active:scale-90 cursor-pointer shadow-sm ${
                      isSaved 
                        ? 'bg-slate-700 text-slate-100 border-slate-500 shadow-md font-bold' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
                    }`}
                    title={isSaved ? "Retirer des favoris" : "Sauvegarder l'article"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-100 text-xs group-hover:text-slate-300 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-400 font-medium">
                    Consulter l'article
                  </span>

                  <span className="text-slate-300 font-black flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    <span>{t.read}</span>
                    <span>→</span>
                  </span>
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