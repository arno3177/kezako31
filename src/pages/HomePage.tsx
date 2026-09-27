import React, { useState, useEffect } from 'react';
import { Article, WeatherData, RouteTrip, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { auth } from '../firebase';
import { GoogleAuthService } from '../service/googleAuthService';
import { fetchUnreadEmailCount } from '../service/gmailService';
import { 
  Sun, 
  Car, 
  Sparkles, 
  Trash2, 
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
  GripVertical,
  RotateCcw,
  Palette
} from 'lucide-react';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ParkedCar {
  lat: number;
  lng: number;
  timestamp: number;
  originLat?: number;
  originLng?: number;
  originCoords?: string | null;
}

const STORAGE_KEY_PARKED_CAR = 'homepulse_parked_car_v1';
const STORAGE_KEY_WIDGET_ORDER = 'homepulse_widget_order_v1';
const STORAGE_KEY_WIDGET_COLORS = 'homepulse_widget_colors_v1';

const DEFAULT_WIDGET_ORDER = [
  'weather',
  'homepulse',
  'energy',
  'shortcuts',
  'trips',
  'news'
];

type WidgetTheme = 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'cyan';

const DEFAULT_WIDGET_COLORS: Record<string, WidgetTheme> = {
  weather: 'amber',
  homepulse: 'purple',
  energy: 'emerald',
  shortcuts: 'rose',
  trips: 'blue',
  news: 'cyan'
};

const THEME_STYLES: Record<WidgetTheme, { gradient: string; border: string; glow: string; dot: string }> = {
  amber: {
    gradient: 'from-amber-950/60 via-slate-900 to-amber-950/60',
    border: 'border-amber-500/80 hover:border-amber-400',
    glow: 'shadow-amber-500/10',
    dot: 'bg-amber-500'
  },
  emerald: {
    gradient: 'from-emerald-950/60 via-slate-900 to-emerald-950/60',
    border: 'border-emerald-500/80 hover:border-emerald-400',
    glow: 'shadow-emerald-500/10',
    dot: 'bg-emerald-500'
  },
  blue: {
    gradient: 'from-blue-950/60 via-slate-900 to-blue-950/60',
    border: 'border-blue-500/80 hover:border-blue-400',
    glow: 'shadow-blue-500/10',
    dot: 'bg-blue-500'
  },
  purple: {
    gradient: 'from-purple-950/60 via-slate-900 to-purple-950/60',
    border: 'border-purple-500/80 hover:border-purple-400',
    glow: 'shadow-purple-500/10',
    dot: 'bg-purple-500'
  },
  rose: {
    gradient: 'from-rose-950/60 via-slate-900 to-rose-950/60',
    border: 'border-rose-500/80 hover:border-rose-400',
    glow: 'shadow-rose-500/10',
    dot: 'bg-rose-500'
  },
  cyan: {
    gradient: 'from-cyan-950/60 via-slate-900 to-cyan-950/60',
    border: 'border-cyan-500/80 hover:border-cyan-400',
    glow: 'shadow-cyan-500/10',
    dot: 'bg-cyan-500'
  }
};

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

  // --- ORDRE DES WIDGETS ---
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDGET_ORDER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_WIDGET_ORDER.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WIDGET_ORDER;
  });

  // --- COULEURS ET THÈMES INDIVIDUELS DE WIDGETS ---
  const [widgetColors, setWidgetColors] = useState<Record<string, WidgetTheme>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDGET_COLORS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WIDGET_COLORS;
  });

  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  const handleSelectColor = (widgetId: string, color: WidgetTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...widgetColors, [widgetId]: color };
    setWidgetColors(updated);
    localStorage.setItem(STORAGE_KEY_WIDGET_COLORS, JSON.stringify(updated));
    setActiveColorPicker(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(widgetOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setWidgetOrder(items);
    localStorage.setItem(STORAGE_KEY_WIDGET_ORDER, JSON.stringify(items));
  };

  const handleResetOrder = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    setWidgetColors(DEFAULT_WIDGET_COLORS);
    localStorage.removeItem(STORAGE_KEY_WIDGET_ORDER);
    localStorage.removeItem(STORAGE_KEY_WIDGET_COLORS);
  };

  // Sélecteur de ville
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const defaultCities = ['Kopstal', 'Paris', 'Montréal', 'Genève', 'Londres', 'New York'];
  const availableCities = Array.from(
    new Set([activeCity, ...Object.keys(weatherDataMap), ...defaultCities])
  );

  // ÉTAT STATIONNEMENT
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
  const [, setParkingNotice] = useState<string | null>(null);

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
      setParkingNotice("Géolocalisation non supportée.");
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

  // GOOGLE WORKSPACE & EMAIL STATUS
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

  const [mainTrip] = useState<RouteTrip>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {}
    }
    return {
      id: 'default',
      name: 'Domicile - Travail',
      origin: 'Kopstal, Luxembourg',
      destination: 'Luxembourg, Stäreplatz / Étoile',
      distance: '7.5 km',
      carDuration: '15 min',
      busDuration: '22 min'
    };
  });

  const latestNews = articles.length > 0 ? articles[0] : null;

  // --- COMPOSANT PALETTE BOUTON ---
  const ColorPickerButton = ({ widgetId }: { widgetId: string }) => {
    const isPickerOpen = activeColorPicker === widgetId;
    return (
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveColorPicker(isPickerOpen ? null : widgetId);
          }}
          title="Changer le thème du widget"
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {isPickerOpen && (
          <>
            <div className="fixed inset-0 z-[999]" onClick={(e) => { e.stopPropagation(); setActiveColorPicker(null); }} />
            <div className="absolute right-0 top-8 z-[1000] bg-slate-900 border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 backdrop-blur-xl animate-fade-in">
              {(Object.keys(THEME_STYLES) as WidgetTheme[]).map((themeKey) => (
                <button
                  key={themeKey}
                  type="button"
                  onClick={(e) => handleSelectColor(widgetId, themeKey, e)}
                  className={`w-5 h-5 rounded-full ${THEME_STYLES[themeKey].dot} border-2 ${
                    widgetColors[widgetId] === themeKey ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                  } transition-all cursor-pointer`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // --- RENDU DES WIDGETS AVEC THÈME PERSONNALISABLE SUR CONTOUR + DÉGRADÉ ---
  const renderWidget = (id: string, dragHandleProps: any) => {
    const currentThemeKey = widgetColors[id] || DEFAULT_WIDGET_COLORS[id] || 'purple';
    const themeStyle = THEME_STYLES[currentThemeKey];

    const cardBaseClass = `group relative bg-gradient-to-r ${themeStyle.gradient} border-2 ${themeStyle.border} ${themeStyle.glow} rounded-3xl p-3 shadow-xl transition-all duration-300 flex flex-col justify-between space-y-2 backdrop-blur-md h-full cursor-pointer`;

    switch (id) {
      case 'weather':
        return (
          <div className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-sky-400">
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-sky-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold text-white">Météo</span>
              </div>

              <div className="flex items-center gap-1">
                <ColorPickerButton widgetId="weather" />
                <button onClick={onViewWeatherDetail} title="Détails" className="p-1 text-slate-400 hover:text-sky-300 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </button>
              </div>
            </div>

            <div onClick={onViewWeatherDetail} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-white tracking-tight">{currentTemp}°</span>
                  <span className="text-xs text-sky-300 font-medium">C</span>
                </div>
                <span className="text-[9px] text-sky-200 font-bold bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                  {currentTemp - 3}° / {currentTemp + 4}°
                </span>
              </div>

              <div className="grid grid-cols-3 gap-0.5 text-center bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[8px] text-slate-400 block font-medium">Mat.</span>
                  <span className="text-[9px] font-bold text-slate-200">{currentTemp - 2}°</span>
                </div>
                <div className="border-x border-slate-700/60">
                  <span className="text-[8px] text-sky-300 block font-bold">Apr.</span>
                  <span className="text-[9px] font-black text-amber-300">{currentTemp + 3}°</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 block font-medium">Soir</span>
                  <span className="text-[9px] font-bold text-slate-200">{currentTemp - 1}°</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCityDropdownOpen(!isCityDropdownOpen);
                }}
                className="flex items-center gap-1 bg-slate-900/90 hover:bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-700/60 text-sky-200 font-semibold transition-all"
              >
                <MapPin className="w-3 h-3 text-sky-400" />
                <span className="capitalize truncate max-w-[55px]">{activeCity}</span>
                <ChevronDown className={`w-3 h-3 text-sky-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <span onClick={onViewWeatherDetail} className="text-sky-300 font-semibold hover:text-white transition-colors text-[10px]">
                Détails →
              </span>

              {isCityDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsCityDropdownOpen(false); }} />
                  <div className="absolute left-0 bottom-8 z-50 w-36 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-0.5">
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
                          {activeCity.toLowerCase() === city.toLowerCase() && <Check className="w-3 h-3 text-sky-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'homepulse':
        return (
          <div onClick={onViewHomePulse} className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-purple-300">
                <div {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-purple-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <FileText className="w-4 h-4 text-purple-300" />
                <span className="text-[11px] font-bold text-white">HomePulse</span>
              </div>

              <div className="flex items-center gap-1">
                <ColorPickerButton widgetId="homepulse" />
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>

            <div className="space-y-1 my-auto text-[10px]">
              <div className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></span>
                  <span className="truncate">🛒 Courses</span>
                </span>
                <span className="text-[8px] text-purple-300 font-mono font-bold">3 art.</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-300 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"></span>
                  <span className="truncate">🔧 Chaudière</span>
                </span>
                <span className="text-[8px] text-teal-300 font-mono font-bold">Rappel</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <span className="text-slate-300 font-medium">2 mémos</span>
              <span className="text-purple-300 group-hover:text-white transition-colors font-semibold">Voir →</span>
            </div>
          </div>
        );

      case 'energy':
        return (
          <div onClick={onViewEnergyComfort} className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <div {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-emerald-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Zap className="w-4 h-4 text-emerald-300" />
                <span className="text-[11px] font-bold text-white">Énergie</span>
              </div>

              <div className="flex items-center gap-1">
                <ColorPickerButton widgetId="energy" />
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5 my-auto">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-white tracking-tight">20.5°</span>
                  <span className="text-xs text-emerald-300 font-medium">C</span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-slate-400 block font-medium">Tendance +3h</span>
                  <span className="text-[9px] font-bold text-teal-300">↗ 21.2°C</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[9px]">
                <span className="text-slate-200 font-medium">Fenêtres : Fermées</span>
                <span className="text-emerald-300 font-mono font-bold">Stores 100%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <span className="text-teal-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Mode Éco
              </span>
              <span className="text-emerald-300 group-hover:text-white transition-colors font-semibold">Gérer →</span>
            </div>
          </div>
        );

      case 'shortcuts':
        return (
          <div onClick={onViewShortcuts} className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-rose-400">
                <div {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-rose-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Bookmark className="w-4 h-4 text-rose-300" />
                <span className="text-[11px] font-bold text-white">Raccourcis</span>
              </div>

              <div className="flex items-center gap-1">
                <ColorPickerButton widgetId="shortcuts" />
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>

            <div className="space-y-1 my-auto text-[10px]">
              <div className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-200 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                  petrol.lu
                </span>
                <span className="text-[8px] text-rose-300 font-mono font-bold">Carburants</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-xl border border-slate-700/60">
                <span className="font-semibold text-slate-300 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"></span>
                  mobiliteit.lu
                </span>
                <span className="text-[8px] text-teal-300 font-mono font-bold">Transports</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <span className="text-slate-300 font-medium">Favoris Web</span>
              <span className="text-rose-300 group-hover:text-white transition-colors font-semibold">Explorer →</span>
            </div>
          </div>
        );

      case 'trips':
        return (
          <div onClick={() => onViewTrips?.()} className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-sky-400">
                <div {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-sky-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Car className="w-4 h-4 text-sky-300 flex-shrink-0" />
                <span className="text-[11px] font-bold text-white truncate max-w-[90px]" title={parkedCar ? "Position Garée" : mainTrip.name}>
                  {parkedCar ? "Position Garée" : mainTrip.name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={parkedCar ? handleClearParking : handleSaveParkingLocation}
                  disabled={parkingLoading}
                  title={parkedCar ? "Effacer position garée" : "Enregistrer position garée"}
                  className="p-1 bg-slate-900/80 hover:bg-slate-700 text-sky-300 rounded-lg text-[9px] border border-slate-700/60 flex items-center gap-1 transition-all cursor-pointer flex-shrink-0"
                >
                  {parkedCar ? <Trash2 className="w-3 h-3 text-rose-400" /> : <Navigation className="w-3 h-3 text-sky-400" />}
                </button>
                <ColorPickerButton widgetId="trips" />
              </div>
            </div>

            <div className="space-y-1 my-auto text-[9px]">
              {parkedCar ? (
                <div className="bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 text-[9px]">
                  <span className="text-sky-300 font-bold block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                    Véhicule Garé
                  </span>
                  <span className="text-slate-400 text-[8px] block mt-0.5">
                    Il y a {Math.max(1, Math.floor((Date.now() - parkedCar.timestamp) / 60000))} min
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60">
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Car className="w-3 h-3 text-sky-400" /> Voiture
                    </span>
                    <span className="text-white font-bold">{mainTrip.carDuration || '15 min'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60">
                    <span className="flex items-center gap-1 text-slate-300 font-medium">
                      <Bus className="w-3 h-3 text-teal-400" /> Bus / TC
                    </span>
                    <span className="text-white font-bold">{mainTrip.busDuration || '22 min'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <span className="text-sky-200/80 truncate text-[9px] max-w-[85px]" title={mainTrip.destination}>
                ➔ {mainTrip.destination.split(',')[0]}
              </span>
              <span className="text-sky-300 group-hover:text-white transition-colors font-semibold">Carte →</span>
            </div>
          </div>
        );

      case 'news':
        return latestNews ? (
          <div onClick={onViewSourcesNews} className={cardBaseClass}>
            <div className="flex items-center justify-between border-b border-slate-700/40 pb-1.5">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <div {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing p-0.5 text-slate-400 hover:text-cyan-300">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Newspaper className="w-4 h-4 text-cyan-300" />
                <span className="text-[11px] font-bold text-white">News</span>
              </div>

              <div className="flex items-center gap-1">
                <ColorPickerButton widgetId="news" />
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>

            <div onClick={(e) => { e.stopPropagation(); onReadArticle(latestNews); }} className="space-y-1 my-auto">
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-cyan-300 inline-block">
                {latestNews.source}
              </span>
              <p className="text-[10px] font-semibold text-white line-clamp-2 leading-tight group-hover:text-cyan-200 transition-colors">
                {latestNews.title}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px]">
              <span className="text-slate-400 text-[9px]">{latestNews.publishedAt}</span>
              <span className="text-cyan-300 group-hover:text-white transition-colors font-semibold">Dépêches →</span>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 text-xs w-full max-w-2xl mx-auto overflow-x-hidden pb-36 relative text-slate-100 px-2 font-sans tracking-tight">

      {/* 1. EN-TÊTE HARMONISÉ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-700/60 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-800 border border-slate-700 text-sky-300">
            <Sparkles className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              {getGreeting()}
              <span className="text-[10px] font-mono text-slate-300 font-normal px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60">
                v2.4 Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              Centre de contrôle • {activeCity}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetOrder}
            title="Réinitialiser l'organisation et les couleurs"
            className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {unreadCount !== null && unreadCount > 0 && (
            <button 
              onClick={handleOpenGmail} 
              className="relative p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/60 text-sky-300 transition-all cursor-pointer shadow-sm"
            >
              <Mail className="w-4 h-4 text-sky-400" />
              <span className="absolute -top-1 -right-1 bg-sky-400 text-slate-950 text-[9px] font-black px-1.5 rounded-full shadow-lg">
                {unreadCount}
              </span>
            </button>
          )}

          {!isWorkspaceConnected ? (
            <button 
              onClick={handleGoogleLogin} 
              className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700/60 text-sky-300 transition-all cursor-pointer shadow-sm"
            >
              <UserX className="w-4 h-4 text-sky-400" />
            </button>
          ) : (
            <div className="p-1 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-center">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full ring-1 ring-teal-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-teal-300" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. DRAG AND DROP - TOUS LES WIDGETS SUR 2 COLONNES AVEC COULEURS DYNAMIQUES */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets-grid">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="grid grid-cols-2 gap-3"
            >
              {widgetOrder.map((widgetId, index) => (
                <Draggable key={widgetId} draggableId={widgetId} index={index}>
                  {(providedDraggable, snapshot) => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      className={`h-full ${snapshot.isDragging ? 'z-50 shadow-2xl scale-[1.02]' : ''}`}
                    >
                      {renderWidget(widgetId, providedDraggable.dragHandleProps)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

    </div>
  );
};

export default HomePage;