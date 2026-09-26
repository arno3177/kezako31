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
  Home, Thermometer, ShieldCheck, Navigation
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

// --- INTERFACE STATIONNEMENT ---
interface ParkedCar {
  lat: number;
  lng: number;
  timestamp: number;
  originLat?: number;
  originLng?: number;
  originCoords?: string | null;
}

const STORAGE_KEY_PARKED_CAR = 'homepulse_parked_car_v1';

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
  onViewEnergyComfort,
  onViewHomePulse,
  searchQuery,
  language = 'en',
  onBack
}) => {
  const t = getTranslation(language);
  const [activeMapMode, setActiveMapMode] = useState<'car' | 'bus'>('car');

  // --- ÉTAT STATIONNEMENT & MODE CARTE ---
  const [parkedCar, setParkedCar] = useState<ParkedCar | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARKED_CAR);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  
  const [showWalkingRoute, setShowWalkingRoute] = useState(false);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [parkingNotice, setParkingNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (parkedCar) {
        localStorage.setItem(STORAGE_KEY_PARKED_CAR, JSON.stringify(parkedCar));
      } else {
        localStorage.removeItem(STORAGE_KEY_PARKED_CAR);
        setShowWalkingRoute(false);
        setParkingNotice(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [parkedCar]);

  const handleSaveParkingLocation = () => {
    if (!navigator.geolocation) {
      setParkingNotice("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setParkingLoading(true);
    setParkingNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;
        const newCar: ParkedCar = {
          lat: currentLat,
          lng: currentLng,
          timestamp: Date.now()
        };
        setParkedCar(newCar);
        setShowWalkingRoute(false);
        setParkingLoading(false);
      },
      (error) => {
        console.error(error);
        setParkingNotice("Impossible de récupérer votre position GPS.");
        setParkingLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleClearParking = () => {
    setParkedCar(null);
    setShowWalkingRoute(false);
    setParkingNotice(null);
  };

  // Calcul de distance (en mètres) entre deux coordonnées GPS (formule de Haversine)
  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCalculateRouteToCar = () => {
    if (!parkedCar) return;
    if (!navigator.geolocation) {
      setParkingNotice("La géolocalisation n'est pas supportée par votre appareil.");
      return;
    }

    setParkingLoading(true);
    setParkingNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        const distanceMeters = getDistanceFromLatLonInMeters(currentLat, currentLng, parkedCar.lat, parkedCar.lng);
        if (distanceMeters < 15) {
          setParkingNotice("Vous êtes déjà à côté de votre véhicule (moins de 15 m) ! Aucun itinéraire nécessaire.");
          setParkingLoading(false);
          return;
        }

        const coordsClean = `${currentLat},${currentLng}`;
        setParkedCar(prev => prev ? {
          ...prev,
          originLat: currentLat,
          originLng: currentLng,
          originCoords: coordsClean,
          timestamp: Date.now()
        } : null);

        setShowWalkingRoute(true);
        setParkingLoading(false);
      },
      (error) => {
        console.error("Erreur GPS lors du calcul d'itinéraire :", error);
        setParkingNotice("Impossible de récupérer votre position GPS actuelle pour tracer l'itinéraire.");
        setParkingLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

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

    if (currentTemp > 32) return { type: 'Chaleur', badgeColor: 'bg-amber-950/80 border-amber-500/50 text-amber-200', icon: <Info className="w-3 h-3 text-amber-300" /> };
    if (currentTemp < 4) return { type: 'Froid', badgeColor: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200', icon: <Info className="w-3 h-3 text-cyan-300" /> };
    if (wind > 45) return { type: 'Vent', badgeColor: 'bg-purple-950/80 border-purple-500/50 text-purple-200', icon: <Info className="w-3 h-3 text-purple-300" /> };
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
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-amber-300`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-cyan-300`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-sky-200`} />;
    return <CloudSun className={`${className} text-amber-200`} />;
  };

  const originQuery = encodeURIComponent(mainTrip?.origin || 'Kopstal');
  const destQuery = encodeURIComponent(mainTrip?.destination || 'Luxembourg, Stäreplatz');

  const mapEmbedUrl = parkedCar && showWalkingRoute
    ? `https://maps.google.com/maps?f=d&saddr=${parkedCar.originCoords || (parkedCar.originLat || parkedCar.lat) + ',' + (parkedCar.originLng || parkedCar.lng)}&daddr=${parkedCar.lat},${parkedCar.lng}&dirflg=w&output=embed&hl=fr`
    : parkedCar
    ? `https://maps.google.com/maps?q=${parkedCar.lat},${parkedCar.lng}&z=16&output=embed&hl=fr`
    : `https://maps.google.com/maps?f=d&saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMapMode === 'bus' ? 'r' : 'd'}&output=embed&hl=fr`;

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-5 animate-fade-in text-xs w-full max-w-xl mx-auto overflow-x-hidden pb-20 relative text-slate-100 px-1 font-sans"
    >

      {/* POPUP DE NOTIFICATION */}
      {popupMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[99999] px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce transition-all ${
          popupMessage.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500 text-emerald-100 shadow-emerald-950' 
            : 'bg-rose-950 border-rose-500 text-rose-100'
        }`}>
          <span>{popupMessage.text}</span>
        </div>
      )}

      {/* EN-TÊTE - Gradient Indigo / Cyan Lumineux */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl flex items-center justify-between gap-4 w-full relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        
        <div className="space-y-1 pl-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-black text-white tracking-wide">
              {getGreeting()}
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-indigo-200 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
            <span>Systèmes opérationnels • 0 alerte</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-2xl border border-indigo-500/30 shadow-inner">
            {unreadCount !== null && unreadCount > 0 && (
              <button
                onClick={handleOpenGmail}
                className="relative p-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md group font-bold border border-cyan-400/40"
                title="Ouvrir Gmail"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform text-cyan-300" />
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 border border-cyan-200 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-md">
                  {unreadCount}
                </span>
              </button>
            )}

            {!isWorkspaceConnected ? (
              <button 
                onClick={handleGoogleLogin}
                className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm group"
                title="Se connecter à Google Workspace"
              >
                <UserX className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-400" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </button>
            ) : (
              <div 
                className="relative p-1.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-white flex items-center justify-center shadow-sm"
                title="Workspace Connecté"
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-indigo-400" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-950/90 border border-indigo-500/40 px-3.5 py-2 rounded-2xl text-right shadow-inner">
            <span className="text-xs font-mono font-black text-cyan-300 block tracking-wider">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] font-mono text-indigo-300 block uppercase font-semibold">
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* 1. SECTION MÉTÉO */}
      {currentWeather && (
        <div 
          onClick={onViewWeatherDetail}
          className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-blue-950/80 border border-sky-500/40 hover:border-sky-400 rounded-3xl p-5 shadow-2xl w-full space-y-4 backdrop-blur-md cursor-pointer group active:scale-[0.99] transition-all duration-200"
        >
          <div className="flex items-center justify-between border-b border-sky-500/30 pb-3.5">
            <div className="flex items-center space-x-2.5 text-sky-200">
              <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 shadow-inner">
                <Sun className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">Météo & Éphéméride</h2>
              <span className="text-[10px] font-bold text-sky-300 bg-sky-950 px-3 py-1 rounded-xl border border-sky-400/30 ml-2 shadow-inner">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center justify-between gap-3 border-b border-sky-500/20 pb-4">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-400/40 flex-shrink-0 shadow-inner">
                  {renderConditionIcon(currentWeather.condition, "w-6 h-6")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <h1 className="text-sm font-black text-white truncate">{currentWeather.city}</h1>
                  </div>
                  <p className="text-[11px] text-sky-200 font-medium truncate">{translateCondition(currentWeather.condition, language)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-sky-500/20">
                <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">{currentTemp}°C</span>
                <div className="flex flex-col text-[10px] font-bold leading-tight pl-3 border-l border-sky-500/30">
                  <span className="text-amber-300" title="Température maximale">▲ {tempMax}°</span>
                  <span className="text-sky-300" title="Température minimale">▼ {tempMin}°</span>
                </div>
                <div className="flex flex-col text-[10px] font-medium leading-tight pl-3 border-l border-sky-500/30">
                  <span className="text-sky-200 flex items-center gap-1" title="Lever du soleil"><Sunrise className="w-3 h-3 text-amber-300" /> 06:34</span>
                  <span className="text-sky-200 flex items-center gap-1 mt-0.5" title="Coucher du soleil"><Sunset className="w-3 h-3 text-orange-400" /> 20:48</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-sky-500/30 flex items-center justify-between shadow-inner">
                <span className="text-sky-200 font-bold flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-cyan-400" /> {t.humidity}</span>
                <span className="font-black text-white">{currentWeather.humidity}%</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-sky-500/30 flex items-center justify-between shadow-inner">
                <span className="text-sky-200 font-bold flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-sky-400" /> {t.wind}</span>
                <span className="font-black text-white">{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUIVI ÉNERGÉTIQUE & CONFORT MAISON */}
      <div 
        onClick={onViewEnergyComfort}
        className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-5 shadow-2xl space-y-4 transition-all duration-200 active:scale-[0.99] cursor-pointer group backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3.5">
          <div className="flex items-center space-x-2.5 text-emerald-200">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-inner">
              <Home className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Suivi Énergétique & Confort Maison</h2>
          </div>
          <span className="text-[10px] font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 bg-emerald-950 border-emerald-400/40 text-emerald-200 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{energy.actionBadge}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> Intérieur Cible
            </span>
            <span className="text-base font-black text-white pt-1">{energy.interiorTarget}</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Statut Thermique
            </span>
            <span className="text-xs font-extrabold text-emerald-100 pt-1 truncate">{energy.statusText}</span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/30 flex flex-col justify-between shadow-inner">
            <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> Action Solaire
            </span>
            <span className="text-xs font-extrabold text-emerald-100 pt-1 truncate">Inertie préservée</span>
          </div>
        </div>

        <p className="text-[11px] text-emerald-200/90 leading-relaxed font-medium pt-1 px-1">
          {energy.desc}
        </p>
      </div>

      {/* 2.2. HOME-PULSE / NOTES HABITAT */}
      <div 
        onClick={onViewHomePulse}
        className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 hover:border-purple-400 rounded-3xl p-5 shadow-2xl space-y-3 transition-all duration-200 active:scale-[0.99] cursor-pointer group backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
          <div className="flex items-center space-x-2.5 text-purple-200">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-inner">
              <Home className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">HomePulse & Notes Habitat</h2>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-400/40 text-purple-200 shadow-inner">
            Notes & Listes
          </span>
        </div>
        <p className="text-[11px] text-purple-200/90 font-medium">
          Accédez à vos notes libres, listes de courses et rappels organisés par catégorie.
        </p>
      </div>

      {/* 3. TRAJET PRINCIPAL & CARTE INTERACTIVE (Redirige vers TripsPage au clic via callback sécurisé) */}
      {mainTrip && (
        <div 
          onClick={() => onViewTrips?.()}
          className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/40 hover:border-blue-400 rounded-3xl p-5 shadow-2xl space-y-4 w-full backdrop-blur-md transition-all duration-200 active:scale-[0.99] cursor-pointer group"
        >
          <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
            <div className="flex items-center space-x-2.5 text-blue-200 min-w-0">
              <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 shadow-inner">
                <Car className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-white truncate">
                {showWalkingRoute ? "Itinéraire Piéton vers la voiture" : parkedCar ? "Position de la voiture" : t.detailedRoute}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-blue-300 group-hover:translate-x-0.5 transition-transform">
              Mode trajets →
            </span>
          </div>

          {!parkedCar && (
            <div className="grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setActiveMapMode('car')}
                className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                  activeMapMode === 'car' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-blue-500/30 text-blue-300 hover:text-white'
                }`}
              >
                <Car className="w-4 h-4 text-blue-200" />
                <span>{t.byCar}</span>
              </button>

              <button
                onClick={() => setActiveMapMode('bus')}
                className={`p-3 rounded-2xl border font-black flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                  activeMapMode === 'bus' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-blue-500/30 text-blue-300 hover:text-white'
                }`}
              >
                <Bus className="w-4 h-4 text-blue-200" />
                <span>{t.byBus}</span>
              </button>
            </div>
          )}

          {!parkedCar && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/30 space-y-1.5 shadow-inner">
              <p className="text-blue-100 font-semibold truncate"><span className="text-blue-300 font-bold">{t.departure}:</span> {mainTrip.origin}</p>
              <p className="text-blue-100 font-semibold truncate"><span className="text-blue-300 font-bold">{t.arrival}:</span> {mainTrip.destination}</p>
            </div>
          )}

          {/* LA CARTE INTERACTIVE */}
          <div className="h-48 rounded-2xl overflow-hidden border border-blue-500/30 w-full relative shadow-inner" onClick={(e) => e.stopPropagation()}>
            <iframe
              key={`${activeMapMode}-${showWalkingRoute}-${parkedCar?.timestamp || 0}`}
              title="Carte interactive"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%)' }}
              loading="lazy"
              src={mapEmbedUrl}
            />
          </div>

          {/* SOUS LA CARTE : MODULE "OÙ EST MA VOITURE ?" */}
          <div className="pt-2 border-t border-blue-500/20" onClick={(e) => e.stopPropagation()}>
            {!parkedCar ? (
              <div className="flex items-center justify-between pt-1 gap-2">
                <span className="text-[11px] text-blue-200/80 font-medium">Où avez-vous garé votre véhicule ?</span>
                <button 
                  onClick={handleSaveParkingLocation}
                  disabled={parkingLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-all shadow-md border border-cyan-500/40 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{parkingLoading ? 'Localisation...' : '📍 Mémoriser ma position'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-[11px] bg-slate-950/80 p-3 rounded-2xl border border-cyan-500/40 shadow-inner">
                  <div className="space-y-0.5">
                    <span className="font-black text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                      Véhicule enregistré
                    </span>
                    <span className="text-cyan-200/80 text-[10px]">
                      Il y a {Math.max(1, Math.floor((Date.now() - parkedCar.timestamp) / 60000))} min
                    </span>
                  </div>
                  <button
                    onClick={handleClearParking}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                    title="Effacer la position"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {!showWalkingRoute ? (
                  <div className="space-y-2">
                    <button
                      onClick={handleCalculateRouteToCar}
                      disabled={parkingLoading}
                      className="w-full px-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-cyan-400 disabled:opacity-50"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{parkingLoading ? 'Calcul GPS...' : "Calculer le chemin vers ma voiture"}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => setShowWalkingRoute(false)}
                      className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all shadow-inner border border-slate-700 cursor-pointer"
                    >
                      Retourner à l'affichage de la position seule
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGE TEXTUEL SOUS LE BOUTON */}
            {parkingNotice && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-medium flex items-center gap-2 shadow-inner animate-fade-in">
                <Info className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>{parkingNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. RACCOURCIS FAVORIS */}
      <div 
        onClick={onViewShortcuts}
        className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-pink-950/70 border border-rose-500/40 hover:border-rose-400 rounded-3xl p-5 shadow-2xl space-y-4 w-full backdrop-blur-md cursor-pointer transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
          <div className="flex items-center space-x-2.5 text-rose-200 font-black text-xs">
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 shadow-inner">
              <Bookmark className="w-4 h-4" />
            </div>
            <h2 className="uppercase tracking-wider text-white">Accès Rapides</h2>
          </div>
          <span className="text-[9px] font-bold px-3 py-1 rounded-xl bg-rose-950 border border-rose-400/40 text-rose-200 shadow-inner">
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
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/80 border border-rose-500/30 hover:border-rose-400 transition-all duration-200 active:scale-[0.97] shadow-inner group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-900 border border-rose-500/30 flex-shrink-0 shadow-inner group-hover:bg-rose-950 transition-colors">
                  <Sparkles className="w-4 h-4 text-rose-300 group-hover:text-white" />
                </div>
                
                <div className="flex flex-col truncate pr-2">
                  <span className="text-white font-extrabold text-xs truncate group-hover:text-rose-200 transition-colors">
                    {link.name}
                  </span>
                  <span className="text-[9px] font-bold text-rose-300 uppercase tracking-wide truncate">
                    {link.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 pl-1 border-l border-slate-900">
                <button
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  className="p-2 rounded-xl bg-slate-900 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all cursor-pointer active:scale-90"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 5. ACTUALITÉS */}
      <div 
        onClick={onViewSourcesNews}
        className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-sky-950/80 border border-cyan-500/40 hover:border-cyan-400 rounded-3xl p-5 shadow-2xl space-y-4 w-full backdrop-blur-md cursor-pointer group transition-all duration-200 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
          <div className="flex items-center space-x-2.5 text-cyan-200">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-inner">
              <Newspaper className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              {t.liveNews}
            </h2>
          </div>
          <span className="text-[9px] font-bold px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-400/40 text-cyan-200 shadow-inner">
            {newsLoading ? "Chargement..." : `${carouselArticles.length} en direct`}
          </span>
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-cyan-700 w-full" onClick={(e) => e.stopPropagation()}>
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
                className="flex-shrink-0 w-80 bg-slate-950/90 border border-cyan-500/30 hover:border-cyan-400 rounded-2xl p-4 shadow-inner cursor-pointer transition-all duration-200 active:scale-[0.97] group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-cyan-300 tracking-wide bg-cyan-950 px-2.5 py-1 rounded-xl border border-cyan-500/40">
                      {cleanSource}
                    </span>
                    <span className="text-[9px] text-cyan-200 font-medium">
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
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md font-bold' 
                        : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-950'
                    }`}
                    title={isSaved ? "Retirer des favoris" : "Sauvegarder l'article"}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-xs group-hover:text-cyan-200 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-cyan-500/20 text-[10px]">
                  <span className="text-cyan-300 font-medium">
                    Consulter l'article
                  </span>

                  <span className="text-cyan-200 font-black flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
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