import React, { useState, useEffect } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { auth } from '../firebase';
import { GoogleAuthService } from '../service/googleAuthService';
import { fetchUnreadEmailCount } from '../service/gmailService';
import { 
  Sun, 
  Car, 
  Sparkles, 
  Trash2, 
  Info, 
  Mail, 
  UserCheck, 
  UserX, 
  Navigation, 
  FileText, 
  Zap, 
  Newspaper, 
  ArrowUpRight,
  Bookmark,
  ChevronDown,
  MapPin,
  Check,
  Bus,
  Clock
} from 'lucide-react';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

interface ParkedCar {
  lat: number;
  lng: number;
  timestamp: number;
  originLat?: number;
  originLng?: number;
  originCoords?: string | null;
}

const STORAGE_KEY_PARKED_CAR = 'homepulse_parked_car_v1';

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
  articles,
  currentWeather,
  weatherDataMap,
  activeCity,
  setActiveCity,
  onReadArticle,
  onViewWeatherDetail,
  onViewSourcesNews,
  onViewTrips,
  onViewShortcuts,
  onViewEnergyComfort,
  onViewHomePulse,
  language = 'en'
}) => {
  const t = getTranslation(language);

  // Menu déroulant custom pour la sélection de ville
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Villes disponibles
  const defaultCities = ['Kopstal', 'Paris', 'Montréal', 'Genève', 'Londres', 'New York'];
  const availableCities = Array.from(
    new Set([activeCity, ...Object.keys(weatherDataMap), ...defaultCities])
  );

  // --- ÉTAT STATIONNEMENT ---
  const [parkedCar, setParkedCar] = useState<ParkedCar | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PARKED_CAR);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [, setShowWalkingRoute] = useState(false);
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

  const handleSaveParkingLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      setParkingNotice("La géolocalisation n'est pas supportée.");
      return;
    }
    setParkingLoading(true);
    setParkingNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setParkedCar({ 
          lat: position.coords.latitude, 
          lng: position.coords.longitude, 
          timestamp: Date.now() 
        });
        setShowWalkingRoute(false);
        setParkingLoading(false);
      },
      (error) => {
        console.error(error);
        setParkingNotice("Erreur GPS.");
        setParkingLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleClearParking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setParkedCar(null);
    setShowWalkingRoute(false);
    setParkingNotice(null);
  };

  // --- GOOGLE WORKSPACE & EMAIL STATUS ---
  const currentUser = auth.currentUser;
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isWorkspaceConnected, setIsWorkspaceConnected] = useState<boolean>(() => {
    return GoogleAuthService.getStoredToken() !== null || localStorage.getItem('google_workspace_access_token') !== null;
  });

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
      }
    } catch (error) {
      console.error(error);
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
    return hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
  };

  const activeWeatherData = weatherDataMap[activeCity] || currentWeather;
  const currentTemp = activeWeatherData ? Number(activeWeatherData.temperature ?? 20) : 20;

  // Trajet par défaut conforme au type RouteTrip
  const [mainTrip] = useState<RouteTrip>(() => ({
    id: 'default',
    name: 'Travail',
    origin: 'Kopstal, Luxembourg',
    destination: 'Luxembourg, Stäreplatz / Étoile',
    distance: '7.5 km',
    carDuration: '15 min',
    busDuration: '22 min'
  }));

  const originQuery = encodeURIComponent(mainTrip.origin);
  const destQuery = encodeURIComponent(mainTrip.destination);

  const mapEmbedUrl = parkedCar
    ? `https://maps.google.com/maps?q=${parkedCar.lat},${parkedCar.lng}&z=16&output=embed&hl=fr`
    : `https://maps.google.com/maps?f=d&saddr=${originQuery}&daddr=${destQuery}&dirflg=d&output=embed&hl=fr`;

  const latestNews = articles.length > 0 ? articles[0] : null;

  return (
    <div className="space-y-4 text-xs w-full max-w-2xl mx-auto overflow-x-hidden pb-36 relative text-slate-100 px-2 font-sans tracking-tight">

      {/* ------------------------------------------------------------- */}
      {/* 1. EN-TÊTE PROFESSIONNEL                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              {getGreeting()}
              <span className="text-[10px] font-mono text-slate-400 font-normal px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50">
                v2.4 Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Centre de contrôle • {activeCity}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount !== null && unreadCount > 0 && (
            <button 
              onClick={handleOpenGmail} 
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 text-[9px] font-black px-1.5 rounded-full shadow-lg">
                {unreadCount}
              </span>
            </button>
          )}

          {!isWorkspaceConnected ? (
            <button 
              onClick={handleGoogleLogin} 
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-all cursor-pointer"
            >
              <UserX className="w-4 h-4 text-indigo-400" />
            </button>
          ) : (
            <div className="p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full ring-1 ring-emerald-400/50" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. GRILLE BENTO / MODULES SYSTEM                              */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3">

        {/* ☀️ WIDGET MÉTÉO */}
        <div 
          className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-sky-500/40 rounded-2xl p-4 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-3 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-sky-400">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-semibold text-slate-300">Météo & Journée</span>
            </div>
            
            <button 
              onClick={onViewWeatherDetail}
              title="Voir détails météo"
              className="text-slate-500 hover:text-sky-400 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>
          </div>

          <div onClick={onViewWeatherDetail} className="cursor-pointer space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">{currentTemp}°</span>
                <span className="text-xs text-slate-400 font-medium">C</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                Min {currentTemp - 3}° • Max {currentTemp + 4}°
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1 text-center bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/60">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 block">Matin</span>
                <span className="text-[10px] font-semibold text-slate-200">{currentTemp - 2}°</span>
              </div>
              <div className="space-y-0.5 border-x border-slate-800">
                <span className="text-[9px] text-sky-300 block font-medium">Aprem</span>
                <span className="text-[10px] font-bold text-sky-400">{currentTemp + 3}°</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 block">Soir</span>
                <span className="text-[10px] font-semibold text-slate-200">{currentTemp - 1}°</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCityDropdownOpen(!isCityDropdownOpen);
              }}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1 rounded-lg border border-slate-700/60 text-sky-300 font-medium transition-all active:scale-95"
            >
              <MapPin className="w-3 h-3 text-sky-400" />
              <span className="capitalize">{activeCity}</span>
              <ChevronDown className={`w-3 h-3 text-sky-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <span 
              onClick={onViewWeatherDetail} 
              className="text-sky-400 font-medium cursor-pointer hover:underline"
            >
              Détails →
            </span>

            {isCityDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCityDropdownOpen(false);
                  }}
                />
                <div className="absolute left-0 bottom-8 z-50 w-36 bg-slate-900 border border-sky-500/30 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                  <div className="text-[9px] font-mono text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-800">
                    Changer de ville
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {availableCities.map(city => (
                      <button
                        key={city}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCity(city);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors ${
                          activeCity.toLowerCase() === city.toLowerCase()
                            ? 'bg-sky-500/20 text-sky-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{city}</span>
                        {activeCity.toLowerCase() === city.toLowerCase() && (
                          <Check className="w-3 h-3 text-sky-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 📝 WIDGET HOMEPULSE */}
        <div 
          onClick={onViewHomePulse}
          className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-4 shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-purple-400">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-semibold text-slate-300">HomePulse</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 bg-purple-950/30 rounded-lg border border-purple-500/20 text-[10px]">
              <span className="font-medium text-purple-200 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                🛒 Courses Semaine
              </span>
              <span className="text-[9px] text-purple-300 font-mono">3 articles</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded-lg border border-slate-800/60 text-[10px]">
              <span className="font-medium text-slate-300 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                🔧 Entretien Chaudière
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Rappel</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <span className="text-purple-400 font-medium">2 mémos récents</span>
            <span className="text-slate-400 group-hover:text-purple-300 transition-colors">Toutes les notes →</span>
          </div>
        </div>

        {/* ⚡ WIDGET CONFORT & ÉNERGIE */}
        <div 
          onClick={onViewEnergyComfort}
          className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <Zap className="w-4 h-4" />
              <span className="text-[11px] font-semibold text-slate-300">Énergie & Confort</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">20.5°</span>
                <span className="text-xs text-slate-400 font-medium">C</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block">Tendance à +3h</span>
                <span className="text-[10px] font-semibold text-emerald-400">21.2°C ➔ 16h</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-emerald-950/20 rounded-lg border border-emerald-500/20 text-[10px]">
              <span className="text-slate-300 flex items-center gap-1">
                Fenêtres : <span className="text-emerald-300 font-medium">Fermées</span>
              </span>
              <span className="text-emerald-400 font-mono text-[9px]">Stores 100%</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Mode Éco
            </span>
            <span className="text-slate-400 group-hover:text-emerald-300 transition-colors">Détails →</span>
          </div>
        </div>

        {/* 🔖 WIDGET RACCOURCIS WEB */}
        <div 
          onClick={onViewShortcuts}
          className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-rose-500/40 rounded-2xl p-4 shadow-xl cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-3 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-rose-400">
              <Bookmark className="w-4 h-4" />
              <span className="text-[11px] font-semibold text-slate-300">Raccourcis Favoris</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded-lg border border-slate-800/60 text-[10px]">
              <span className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                petrol.lu
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Prix carburants</span>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded-lg border border-slate-800/60 text-[10px]">
              <span className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                mobiliteit.lu
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Transports Luxembourg</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
            <span className="text-rose-400 font-medium">Favoris Web</span>
            <span className="text-slate-400 group-hover:text-rose-300 transition-colors">Explorer →</span>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. WIDGET MOBILITÉ & CARTE COMPACTE AVEC INFOS À DROITE       */}
      {/* ------------------------------------------------------------- */}
      <div 
        onClick={() => onViewTrips?.()}
        className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-4 shadow-2xl transition-all duration-300 space-y-3 cursor-pointer backdrop-blur-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                {parkedCar ? "Position Véhicule Garé" : "Navigation & Trajets"}
              </span>
              <span className="text-[10px] text-slate-400">
                {parkedCar ? "Coordonnées GPS enregistrées" : `${activeCity} ➔ Destination`}
              </span>
            </div>
          </div>

          <button 
            onClick={parkedCar ? handleClearParking : handleSaveParkingLocation}
            disabled={parkingLoading}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 rounded-xl text-[10px] font-semibold border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            {parkedCar ? (
              <>
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Effacer</span>
              </>
            ) : (
              <>
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>{parkingLoading ? 'Localisation...' : 'Garer véhicule'}</span>
              </>
            )}
          </button>
        </div>

        {/* LAYOUT HORIZONTAL : MINI CARTE À GAUCHE (100x100px) + INFOS À DROITE */}
        <div className="flex items-stretch gap-3">
          
          {/* Mini carte compacte à gauche */}
          <div className="w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
            <iframe
              title="Mini Carte Cockpit"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(92%) hue-rotate(180deg) brightness(88%)' }}
              loading="lazy"
              src={mapEmbedUrl}
            />
          </div>

          {/* Infos trajets à droite */}
          <div className="flex-1 flex flex-col justify-between py-0.5 space-y-1.5 text-[11px]">
            {parkedCar ? (
              <div className="space-y-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Véhicule stationné
                </div>
                <p className="text-[10px] text-slate-400">
                  Enregistré il y a {Math.max(1, Math.floor((Date.now() - parkedCar.timestamp) / 60000))} min
                </p>
              </div>
            ) : (
              <div className="space-y-1 bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                <div className="text-slate-200 font-medium truncate">
                  <span className="text-blue-400 font-semibold">De :</span> {mainTrip.origin}
                </div>
                <div className="text-slate-200 font-medium truncate">
                  <span className="text-blue-400 font-semibold">À :</span> {mainTrip.destination}
                </div>
              </div>
            )}

            {/* Estimations de temps Voiture / Bus */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                <Car className="w-3 h-3 text-blue-400" />
                <div>
                  <span className="text-slate-400 block text-[9px]">Voiture</span>
                  <span className="text-white font-bold">{mainTrip.carDuration}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
                <Bus className="w-3 h-3 text-emerald-400" />
                <div>
                  <span className="text-slate-400 block text-[9px]">Bus</span>
                  <span className="text-white font-bold">{mainTrip.busDuration}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {parkingNotice && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[10px] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
            <span>{parkingNotice}</span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FLUX ACTUALITÉS / VEILLE DYNAMIQUE                         */}
      {/* ------------------------------------------------------------- */}
      {latestNews && (
        <div 
          onClick={onViewSourcesNews}
          className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-sky-500/40 rounded-2xl p-4 shadow-2xl transition-all duration-300 space-y-2.5 cursor-pointer backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2 text-sky-400">
              <Newspaper className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-200">Veille & Dépêches</span>
            </div>
            <span className="text-[10px] text-sky-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Toutes les actus →
            </span>
          </div>

          <div 
            onClick={(e) => {
              e.stopPropagation();
              onReadArticle(latestNews);
            }}
            className="flex items-center justify-between gap-3 pt-1 hover:bg-slate-800/40 p-2 rounded-xl transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-300">
                  {latestNews.source}
                </span>
                <span className="text-[10px] text-slate-400">
                  {latestNews.publishedAt}
                </span>
              </div>
              <p className="text-xs font-semibold text-white line-clamp-1 group-hover:text-sky-200 transition-colors">
                {latestNews.title}
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
          </div>
        </div>
      )}

    </div>
  );
};

export default HomePage;