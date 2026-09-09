import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Trophy, Gauge, SunMedium,
  Thermometer, Umbrella, Compass, Flower2, Clock, X, Plus, Trash2, ShieldCheck, Info,
  RefreshCw, CheckCircle2, Award, Leaf, Sprout, Flower, Navigation, CloudSnow, CloudLightning, Home
} from 'lucide-react';

interface WeatherDetailPageProps {
  currentWeather: WeatherData | null;
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  onSelectCity: (city: string) => void;
  onOpenSettings: () => void;
  onAddCity?: (city: string) => void;
  onRemoveCity?: (city: string) => void;
  language?: AppSettings['language'];
}

type WeatherTab = 'temp' | 'aqi' | 'uv' | 'activities';

const STORAGE_KEY = 'weather_saved_cities';
const HOME_CITY_KEY = 'weather_home_city';

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

// Configuration inverse pour les activités (90% = Vert / Haut niveau de LED)
const ACTIVITY_LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  8: { bars: 2, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]', borderClass: 'border-emerald-400/30' },
  7: { bars: 1, colorClass: 'bg-lime-400 shadow-[0_0_8px_#a3e635]', borderClass: 'border-lime-400/30' },
  6: { bars: 3, colorClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]', borderClass: 'border-amber-400/30' },
  5: { bars: 2, colorClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]', borderClass: 'border-orange-400/30' },
  4: { bars: 1, colorClass: 'bg-orange-500 shadow-[0_0_8px_#f97316]', borderClass: 'border-orange-500/30' },
  3: { bars: 3, colorClass: 'bg-red-500 shadow-[0_0_8px_#ef4444]', borderClass: 'border-red-500/30' },
  2: { bars: 2, colorClass: 'bg-red-600 shadow-[0_0_8px_#dc2626]', borderClass: 'border-red-600/30' },
  1: { bars: 1, colorClass: 'bg-red-700 shadow-[0_0_8px_#b91c1c]', borderClass: 'border-red-700/30' },
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

const LedLevelIndicator: React.FC<{ level: number; isActivity?: boolean }> = ({ level, isActivity = false }) => {
  const safeLevel = Math.max(1, Math.min(9, Math.round(level)));
  const config = isActivity ? ACTIVITY_LEVEL_CONFIG[safeLevel] : LEVEL_CONFIG[safeLevel];

  return (
    <div className={`flex flex-col gap-0.5 p-0.5 bg-black/80 rounded border ${config.borderClass} backdrop-blur-xs w-6 shadow-md`}>
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

const ConfidenceDotsIndicator: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.max(1, Math.min(5, Math.round(level)));

  const getDotStyle = (dotIndex: number, isLit: boolean) => {
    if (!isLit) return 'bg-slate-800/60';
    switch (dotIndex) {
      case 5: return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 4: return 'bg-lime-400 shadow-[0_0_8px_#a3e635]';
      case 3: return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
      case 2: return 'bg-orange-500 shadow-[0_0_8px_#f97316]';
      case 1: return 'bg-red-500 shadow-[0_0_8px_#ef4444]';
      default: return 'bg-emerald-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 p-1 bg-black/80 rounded-xl border border-amber-400/40 backdrop-blur-xs w-7 py-2 shadow-lg" title={`Indice de confiance : ${safeLevel}/5`}>
      {[5, 4, 3, 2, 1].map((dotIndex) => {
        const isLit = dotIndex <= safeLevel;
        return (
          <div
            key={dotIndex}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${getDotStyle(dotIndex, isLit)}`}
          />
        );
      })}
    </div>
  );
};

const getWeatherIcon = (condition: string = '', sizeClass: string = "w-4 h-4") => {
  const c = condition.toLowerCase();
  if (c.includes('pluie') || c.includes('rain') || c.includes('averses')) {
    return <CloudRain className={`${sizeClass} text-teal-200 drop-shadow-md`} />;
  }
  if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
    return <Cloud className={`${sizeClass} text-white drop-shadow-md`} />;
  }
  if (c.includes('soleil') || c.includes('sun') || c.includes('clair') || c.includes('ensoleillé')) {
    return <Sun className={`${sizeClass} text-amber-300 drop-shadow-md`} />;
  }
  return <CloudSun className={`${sizeClass} text-sky-200 drop-shadow-md`} />;
};

const getPollenIcon = (val: number, sizeClass: string = "w-3 h-3") => {
  if (val >= 4) return <span title="Pollen abondant (Herbacées/Fleurs)"><Flower className={`${sizeClass} text-rose-300`} /></span>;
  if (val >= 2) return <span title="Pollen modéré (Graminées)"><Sprout className={`${sizeClass} text-amber-300`} /></span>;
  return <span title="Pollen faible (Arbres)"><Leaf className={`${sizeClass} text-emerald-300`} /></span>;
};

const getPrecipitationIcon = (type: string = 'rain', amount: number = 0, sizeClass: string = "w-3 h-3") => {
  const t = type.toLowerCase();
  if (t.includes('neige') || t.includes('snow')) {
    if (amount > 5) return <span title={`Forte neige (${amount} mm)`}><CloudSnow className={`${sizeClass} text-white animate-pulse`} /></span>;
    return <span title={`Neige légère (${amount} mm)`}><CloudSnow className={`${sizeClass} text-sky-200`} /></span>;
  }
  if (t.includes('glace') || t.includes('grêle') || t.includes('ice') || t.includes('hail')) {
    return <span title={`Glace / Grêle (${amount} mm)`}><span className={`${sizeClass} inline-flex items-center justify-center font-black text-cyan-300 text-[11px]`}>•</span></span>;
  }
  if (amount > 7.5) {
    return <span title={`Forte averse / Orage (${amount} mm)`}><CloudLightning className={`${sizeClass} text-amber-300 animate-bounce`} /></span>;
  } else if (amount >= 2.0) {
    return <span title={`Pluie modérée (${amount} mm)`}><CloudRain className={`${sizeClass} text-teal-300`} /></span>;
  } else if (amount > 0) {
    return <span title={`Bruine / Pluie faible (${amount} mm)`}><Droplets className={`${sizeClass} text-teal-200`} /></span>;
  }
  return <span title="Pas de précipitation"><Droplets className={`${sizeClass} text-slate-500 opacity-50`} /></span>;
};

const getWindDirectionIcon = (dir: string | number = 'N', sizeClass: string = "w-3 h-3") => {
  let rotation = 0;
  if (typeof dir === 'number') {
    rotation = dir;
  } else {
    const d = typeof dir === 'string' ? dir.toUpperCase() : 'N';
    if (d.includes('NE')) rotation = 45;
    else if (d.includes('E')) rotation = 90;
    else if (d.includes('SE')) rotation = 135;
    else if (d.includes('S')) rotation = 180;
    else if (d.includes('SO') || d.includes('SW')) rotation = 225;
    else if (d.includes('O') || d.includes('W')) rotation = 270;
    else if (d.includes('NO') || d.includes('NW')) rotation = 315;
  }
  return (
    <span title={`Direction du vent : ${dir}`} className="inline-flex items-center justify-center">
      <Navigation className={`${sizeClass} text-sky-300 transition-transform duration-300`} style={{ transform: `rotate(${rotation}deg)` }} />
    </span>
  );
};

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({
  currentWeather,
  citiesList = [],
  activeCity = '',
  unit: _unit = 'C',
  onSelectCity,
  onOpenSettings: _onOpenSettings,
  onAddCity,
  onRemoveCity,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<WeatherTab>('temp');
  const [selectedActivity, setSelectedActivity] = useState<'fitness' | 'tennis' | 'cycling' | 'forestWalk'>('fitness');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const [homeCity, setHomeCity] = useState<string>(() => {
    return localStorage.getItem(HOME_CITY_KEY) || currentWeather?.city || 'Kopstal';
  });

  const handleSetHomeCity = (e: React.MouseEvent, city: string) => {
    e.stopPropagation();
    setHomeCity(city);
    localStorage.setItem(HOME_CITY_KEY, city);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefreshWeather = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setRefreshTrigger(prev => prev + 1);
    if (activeCity) onSelectCity(activeCity);
    setTimeout(() => { setIsRefreshing(false); setShowPopup(true); }, 600);
    setTimeout(() => { setShowPopup(false); }, 5000);
  };

  const currentLocalCity = currentWeather?.city || 'Paris';

  const [cities, setCities] = useState<string[]>(() => {
    let initialList: string[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) initialList = parsed;
      }
    } catch (e) {
      console.error(e);
    }
    if (initialList.length === 0) initialList = citiesList.length > 0 ? citiesList : [currentLocalCity];

    const uniqueMap = new Map<string, string>();
    initialList.forEach(c => {
      if (c && typeof c === 'string') {
        const trimmed = c.trim();
        uniqueMap.set(trimmed.toLowerCase(), trimmed);
      }
    });
    return Array.from(uniqueMap.values());
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
    } catch (e) {
      console.error(e);
    }
  }, [cities]);

  const [showCitySettings, setShowCitySettings] = useState<boolean>(false);
  const [newCityInput, setNewCityInput] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Array<{ name: string; country: string; admin1?: string }>>([]);

  useEffect(() => {
    const query = newCityInput.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`);
        const data = await res.json();
        if (data.results) setSuggestions(data.results);
        else setSuggestions([]);
      } catch (e) {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newCityInput]);

  const handleAddCityName = (cityName: string) => {
    const trimmed = cityName.trim();
    if (!trimmed) return;
    if (!cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...cities, trimmed];
      setCities(updated);
      if (onAddCity) onAddCity(trimmed);
    }
    onSelectCity(trimmed);
    setNewCityInput('');
    setSuggestions([]);
    setShowCitySettings(false);
  };

  const handleRemove = (e: React.MouseEvent, cityToRemove: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = cities.filter(c => c.toLowerCase() !== cityToRemove.toLowerCase());
    setCities(updated);
    if (onRemoveCity) onRemoveCity(cityToRemove);
    if (activeCity.toLowerCase() === cityToRemove.toLowerCase() && updated.length > 0) {
      onSelectCity(updated[0]);
    }
  };

  const forecastData = currentWeather?.forecast || [];
  const rawHourlyData = currentWeather?.hourly || [];

  const hourlyData = useMemo(() => {
    const now = new Date();
    const startHour = now.getMinutes() > 30 ? (now.getHours() + 1) % 24 : now.getHours();

    if (rawHourlyData.length > 0) {
      const startIndex = rawHourlyData.findIndex((item: any) => {
        const itemHour = parseInt(item.time.split(':')[0], 10);
        return itemHour === startHour;
      });
      if (startIndex !== -1) {
        return rawHourlyData.slice(startIndex, startIndex + 16);
      }
    }
    return Array.from({ length: 16 }).map((_, index) => {
      const targetHour = (startHour + index) % 24;
      return {
        time: `${targetHour.toString().padStart(2, '0')}:00`,
        temp: Number((currentWeather as any)?.temperature ?? 20),
        condition: currentWeather?.condition || 'Ensoleillé'
      };
    });
  }, [rawHourlyData, currentWeather, refreshTrigger]);

  const currentTemp = Number((currentWeather as any)?.temperature ?? 20);
  const currentWind = Number(currentWeather?.windSpeed ?? 10);

  const activePrevention = useMemo(() => {
    if (currentTemp > 32) return { type: 'Prévention Chaleur', color: 'bg-amber-950/80 border-amber-400 text-amber-200', icon: <Info className="w-4 h-4 text-amber-300" />, details: `Température élevée (${currentTemp}°C > 32°C). Pensez à vous hydrater.` };
    if (currentTemp < 4) return { type: 'Prévention Froid', color: 'bg-cyan-950/80 border-cyan-400 text-cyan-200', icon: <Info className="w-4 h-4 text-cyan-300" />, details: `Température basse (${currentTemp}°C < 4°C). Couvrez-vous bien.` };
    if (currentWind > 45) return { type: 'Prévention Vent', color: 'bg-sky-950/80 border-sky-400 text-sky-200', icon: <Info className="w-4 h-4 text-sky-300" />, details: `Vent mesuré à ${currentWind} km/h (> 45 km/h).` };
    return null;
  }, [currentTemp, currentWind]);

  const fifteenDaysData = useMemo(() => {
    const baseList: any[] = [...forecastData];
    const needed = Math.max(0, 15 - baseList.length);
    for (let i = 0; i < needed; i++) {
      const dayIndex = baseList.length + i;
      baseList.push({
        day: `J+${dayIndex}`, tempMin: 14, tempMax: 23, condition: 'Ensoleillé',
        mornTemp: 15, eveTemp: 22, mornCondition: 'Ensoleillé', eveCondition: 'Ensoleillé',
        aqiMorn: 30, aqiEve: 45, uvMorn: 2, uvEve: 5, feelsMorn: 15, feelsEve: 23,
        precipMorn: 0, precipEve: 0, windMorn: 10, windEve: 14, windDirMorn: 'N', windDirEve: 'NE', pollenMorn: 1, pollenEve: 2
      });
    }
    return baseList.slice(0, 15).map((d: any, idx: number) => {
      const rawCondition = (d.condition || d.eveCondition || '').toLowerCase();
      let detectedPrecipType = 'rain';
      if (rawCondition.includes('neige') || rawCondition.includes('snow') || (d.eveTemp !== undefined && d.eveTemp <= 0)) {
        detectedPrecipType = 'snow';
      }
      
      const mornTemp = d.mornTemp ?? d.tempMin ?? 15;
      const eveTemp = d.eveTemp ?? d.tempMax ?? 24;
      const precipEve = Number(d.precipEve ?? d.precipitation ?? 0);
      const mornPrecip = Number(d.precipMorn ?? 0);
      const windEve = d.windEve ?? 14;
      const mornWind = d.windMorn ?? 10;

      const calcScore = (temp: number, precip: number, wind: number, type: string) => {
        let score = 90;
        if (precip > 2) score -= 40;
        if (precip > 5) score -= 30;
        if (wind > 30) score -= 25;
        if (type === 'cycling' && wind > 25) score -= 20;
        if (type === 'tennis' && (wind > 20 || precip > 0)) score -= 35;
        if (temp < 2 || temp > 34) score -= 25;
        return Math.max(15, Math.min(100, score));
      };

      return {
        ...d,
        mornTemp,
        eveTemp,
        mornCondition: d.mornCondition ?? d.condition ?? 'Ensoleillé',
        eveCondition: d.eveCondition ?? d.condition ?? 'Ensoleillé',
        aqiMorn: d.aqiMorn ?? 30,
        aqiEve: d.aqiEve ?? 45,
        uvMorn: d.uvMorn ?? 2,
        uvEve: d.uvEve ?? 5,
        feelsMorn: d.feelsMorn ?? 15,
        feelsEve: d.feelsEve ?? 23,
        precipMorn: mornPrecip,
        precipEve,
        precipTypeMorn: d.precipTypeMorn ?? detectedPrecipType,
        precipTypeEve: d.precipTypeEve ?? detectedPrecipType,
        windMorn: mornWind,
        windEve,
        confidence: d.confidence ?? Math.max(1, 5 - Math.floor(idx / 3)),
        activityScores: {
          fitness: { morn: calcScore(mornTemp, mornPrecip, mornWind, 'fitness'), eve: calcScore(eveTemp, precipEve, windEve, 'fitness') },
          tennis: { morn: calcScore(mornTemp, mornPrecip, mornWind, 'tennis'), eve: calcScore(eveTemp, precipEve, windEve, 'tennis') },
          cycling: { morn: calcScore(mornTemp, mornPrecip, mornWind, 'cycling'), eve: calcScore(eveTemp, precipEve, windEve, 'cycling') },
          forestWalk: { morn: calcScore(mornTemp, mornPrecip, mornWind, 'forestWalk'), eve: calcScore(eveTemp, precipEve, windEve, 'forestWalk') }
        }
      };
    });
  }, [forecastData]);

  const maxDaily = Math.max(...fifteenDaysData.map((d: any) => Math.max(d.mornTemp ?? 30, d.eveTemp ?? 30)), 30);
  const minDaily = Math.min(...fifteenDaysData.map((d: any) => Math.min(d.mornTemp ?? 10, d.eveTemp ?? 10)), 5);
  const tempRange = Math.max(maxDaily - minDaily, 1);

  const hourlyTemps = hourlyData.map((h: any) => h.temp);
  const maxHourly = hourlyTemps.length > 0 ? Math.max(...hourlyTemps) : 30;
  const minHourly = hourlyTemps.length > 0 ? Math.min(...hourlyTemps) : 0;
  const rangeHourly = Math.max(maxHourly - minHourly, 1);

  const activityMeta = {
    fitness: { title: 'Fitness', icon: <Dumbbell className="w-4 h-4 text-teal-300" /> },
    tennis: { title: 'Tennis', icon: <Trophy className="w-4 h-4 text-amber-300" /> },
    cycling: { title: 'Cyclisme', icon: <Bike className="w-4 h-4 text-sky-300" /> },
    forestWalk: { title: 'Forêt', icon: <Trees className="w-4 h-4 text-emerald-300" /> },
  };

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-300 font-bold">
        <p>Chargement des données météo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full pb-20 px-1 bg-[#050811] min-h-screen">
      
      {showPopup && (
        <div className="fixed inset-x-0 top-3 z-[9999999] flex justify-center pointer-events-none px-2 animate-fade-in">
          <div className="bg-teal-950 border-2 border-teal-400 text-teal-100 p-3 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.7)] backdrop-blur-xl max-w-sm w-full font-mono flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-300 animate-pulse shrink-0" />
            <div>
              <p className="font-black uppercase tracking-wider text-white text-xs">[SYNC_WEATHER_DONE]</p>
              <p className="text-[10px] text-teal-200">Données météo actualisées pour {currentWeather.city}.</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-2 z-[999999] pointer-events-auto" style={{ top: `calc(50vh + ${scrollY}px)` }}>
        <button
          onClick={handleRefreshWeather}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-teal-400 text-teal-200 shadow-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer flex items-center justify-center group active:scale-95"
          title="Rafraîchir les données météo"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {showCitySettings && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 bg-black/85 backdrop-blur-xs p-2 animate-fade-in">
          <div className="bg-[#121622] border-2 border-teal-400 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-300" /> Ajouter une nouvelle ville
              </h3>
              <button type="button" onClick={() => setShowCitySettings(false)} className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[11px] text-slate-200 font-bold block uppercase tracking-wide">Nom de la ville</label>
              <input
                type="text"
                placeholder="Ex: Luxembourg, Paris..."
                value={newCityInput}
                onChange={(e) => setNewCityInput(e.target.value)}
                className="w-full bg-[#050811] border-2 border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400 font-semibold"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#050811] border-2 border-teal-400 rounded-xl shadow-2xl z-50 overflow-hidden max-h-44 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddCityName(item.name)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-teal-950 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800 last:border-none cursor-pointer"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[10px] text-teal-300 font-semibold">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] text-slate-200 font-bold block uppercase tracking-wide">Villes enregistrées ({cities.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {cities.map((city) => (
                  <div key={city} className="flex items-center justify-between bg-[#050811] border border-slate-700 px-3 py-2 rounded-xl">
                    <span className="font-bold text-white text-xs">{city}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, city)}
                      className="text-rose-200 hover:text-white p-1 bg-rose-950 border border-rose-400 rounded-lg cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCitySettings(false)} className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. EN-TÊTE : BLEU NUIT / INDIGO CLAIR (VILLES) */}
      <div className="bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#172554] border-2 border-indigo-400 rounded-2xl p-3 shadow-xl space-y-2.5 w-full backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="p-1.5 rounded-xl bg-indigo-950 border border-indigo-400 text-indigo-200 flex-shrink-0 shadow-md">
              <CloudSun className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white truncate">{currentWeather.city || 'Ville'}</h1>
                {currentWeather.city?.toLowerCase() === homeCity.toLowerCase() && (
                  <span className="bg-amber-950 text-amber-200 border border-amber-400 text-[9px] px-1.5 py-0.5 rounded-md font-black flex items-center gap-1 shadow-sm">
                    <Home className="w-3 h-3 text-amber-300" />
                  </span>
                )}
              </div>
              <p className="text-[10px] text-indigo-100 font-semibold capitalize truncate">{translateCondition(currentWeather.condition || '', language)}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowCitySettings(true); }}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-100 border border-indigo-300 font-black flex items-center gap-1 transition-colors text-[11px] cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-300" />
            <span>Ajouter une ville</span>
          </button>
        </div>

        {cities.length > 0 && (
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none py-0.5 items-center">
            {cities.map(city => {
              const isHome = city.toLowerCase() === homeCity.toLowerCase();
              const isActive = activeCity.toLowerCase() === city.toLowerCase();

              return (
                <div key={city} className={`flex items-center gap-1 border-2 rounded-xl px-2.5 py-1 flex-shrink-0 transition-all shadow-sm ${
                  isActive ? 'bg-indigo-950 border-indigo-300 shadow-indigo-950/80' : 'bg-[#050811] border-indigo-900/60'
                }`}>
                  <button
                    type="button"
                    onClick={() => onSelectCity(city)}
                    className={`font-black text-[10px] cursor-pointer ${
                      isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSetHomeCity(e, city)}
                    className={`p-1 rounded-lg transition-all cursor-pointer ${
                      isHome ? 'text-amber-300 bg-amber-950 border border-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={isHome ? "Ville de référence thermique (Maison)" : "Définir comme lieu de référence (Maison)"}
                  >
                    <Home className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activePrevention ? (
        <div className={`border-2 rounded-2xl p-3 shadow-xl flex items-start space-x-2.5 animate-fade-in ${activePrevention.color}`}>
          <div className="p-1.5 rounded-xl bg-black/60 border border-current/40 flex-shrink-0 mt-0.5 shadow-md">
            {activePrevention.icon}
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1 text-white">
                <Info className="w-3.5 h-3.5" /> {activePrevention.type}
              </h2>
              <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full bg-black/60 border border-current/50 uppercase">Conseil</span>
            </div>
            <p className="text-[10px] text-slate-100 leading-relaxed font-semibold">{activePrevention.details}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#042f2e] via-[#064e3b] to-[#042f2e] border-2 border-teal-400 rounded-2xl p-3 shadow-xl flex items-center space-x-2.5 text-slate-100">
          <div className="p-1.5 rounded-xl bg-teal-950 border border-teal-300 text-teal-200 flex-shrink-0 shadow-md">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[11px] font-black text-white uppercase tracking-wider">Conditions stables</h2>
            <p className="text-[9.5px] text-teal-100 font-medium truncate">Aucun seuil de vigilance particulier n'est atteint.</p>
          </div>
        </div>
      )}

      {/* 2. MÉTÉO HEURE PAR HEURE : BLEU OCÉAN TRÈS LUMINEUX */}
      <div className="space-y-2 bg-gradient-to-r from-[#0c2d57] via-[#1e40af] to-[#0c2d57] border-2 border-sky-400 p-3 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-sky-300/40 pb-2">
          <span className="font-black text-white text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-300" /> Météo Heure par Heure (Les 16 prochaines heures)
          </span>
          <span className="text-[10px] font-bold text-sky-200">°C</span>
        </div>
        <div className="h-48 flex items-end justify-between gap-1 pt-3 pb-1.5 bg-[#050811] p-2 rounded-xl border-2 border-sky-400/60 overflow-x-auto shadow-inner">
          {hourlyData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-bold">
              Chargement des données horaires de l'API...
            </div>
          ) : (
            hourlyData.map((item: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round(((item.temp - minHourly) / rangeHourly) * 100)));
              const hourlyLedLevel = getLedLevelForTemp(item.temp);

              return (
                <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1 h-full justify-end border border-sky-400/40 hover:border-sky-300 rounded-xl p-1 bg-[#0c2d57]/40 shadow-md">
                  <div className="h-4 flex items-center justify-center">
                    <LedLevelIndicator level={hourlyLedLevel} />
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-lg overflow-hidden border border-sky-300 bg-slate-950 relative shadow-md">
                    <div className="flex-1 bg-gradient-to-t from-emerald-500 via-teal-400 to-indigo-600 flex flex-col items-center justify-between py-1.5 px-0.5 relative">
                      <span className="text-[9px] font-black text-white z-10">{item.temp}°</span>
                      <div className="z-10">{getWeatherIcon(item.condition, "w-3.5 h-3.5")}</div>
                    </div>
                  </div>
                  <span className="text-[8.5px] text-sky-200 font-bold border-t border-sky-900/60 pt-1 w-full text-center truncate">{item.time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1e293b] border-2 border-slate-600 p-3 rounded-2xl flex items-center space-x-2.5 shadow-xl">
          <Droplets className="w-4 h-4 text-sky-300 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-300 text-[9.5px] font-bold block">{t.humidity}</span>
            <span className="text-xs font-black text-white">{currentWeather.humidity ?? 0}%</span>
          </div>
        </div>

        <div className="bg-[#1e293b] border-2 border-slate-600 p-3 rounded-2xl flex items-center space-x-2.5 shadow-xl">
          <Wind className="w-4 h-4 text-indigo-300 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-300 text-[9.5px] font-bold block">{t.wind}</span>
            <span className="text-xs font-black text-white">{currentWeather.windSpeed ?? 0} km/h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 bg-[#121622] p-1.5 border-2 border-slate-700 rounded-2xl shadow-xl">
        <button type="button" onClick={() => setActiveTab('temp')} className={`py-2 px-1 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-md ${activeTab === 'temp' ? 'bg-sky-600 text-white border border-sky-300' : 'text-slate-300 bg-slate-900 hover:text-white'}`}>
          <Calendar className="w-3.5 h-3.5" /><span className="truncate">Températures</span>
        </button>
        <button type="button" onClick={() => setActiveTab('aqi')} className={`py-2 px-1 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-md ${activeTab === 'aqi' ? 'bg-teal-600 text-white border border-teal-300' : 'text-slate-300 bg-slate-900 hover:text-white'}`}>
          <Gauge className="w-3.5 h-3.5" /><span className="truncate">Air (AQI)</span>
        </button>
        <button type="button" onClick={() => setActiveTab('uv')} className={`py-2 px-1 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-md ${activeTab === 'uv' ? 'bg-amber-600 text-white border border-amber-300' : 'text-slate-300 bg-slate-900 hover:text-white'}`}>
          <SunMedium className="w-3.5 h-3.5" /><span className="truncate">Indice UV</span>
        </button>
        <button type="button" onClick={() => setActiveTab('activities')} className={`py-2 px-1 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-md ${activeTab === 'activities' ? 'bg-purple-600 text-white border border-purple-300' : 'text-slate-300 bg-slate-900 hover:text-white'}`}>
          <Activity className="w-3.5 h-3.5" /><span className="truncate">Activités</span>
        </button>
      </div>

      {/* 4. DIAGRAMME PRINCIPAL (15 Jours) : VERT ÉMERAUDE PROFOND */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#064e3b] border-2 border-emerald-400 p-3 rounded-2xl shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-300/40 pb-2">
          <h2 className="text-[11px] font-black uppercase text-white flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-300" /> 
            {activeTab === 'temp' && "Tendance Températures (15 Jours)"}
            {activeTab === 'aqi' && "Qualité de l'Air AQI (15 Jours)"}
            {activeTab === 'uv' && "Évolution Indice UV (15 Jours)"}
            {activeTab === 'activities' && `Scores - ${activityMeta[selectedActivity].title} (15 Jours)`}
          </h2>
          <div className="flex items-center gap-2.5 text-[10px] font-black">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block border border-white"></span><span className="text-white">Matin</span></div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block border border-white"></span><span className="text-amber-200">Soir/Apm</span></div>
          </div>
        </div>

        {activeTab === 'activities' && (
          <div className="flex gap-1 pb-1 overflow-x-auto">
            {(Object.keys(activityMeta) as Array<keyof typeof activityMeta>).map((actKey) => (
              <button
                key={actKey}
                type="button"
                onClick={() => setSelectedActivity(actKey)}
                className={`px-2.5 py-1 rounded-xl text-[9.5px] font-black border-2 flex items-center gap-1 cursor-pointer transition-all shadow-md ${
                  selectedActivity === actKey ? 'bg-slate-950 text-emerald-200 border-emerald-300' : 'bg-slate-900 text-slate-300 border-emerald-800'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1.5 bg-[#050811] p-2 rounded-xl border-2 border-emerald-400/60 overflow-x-auto shadow-inner">
          {fifteenDaysData.map((day: any, idx: number) => {
            let evePercent = 50;
            let mornPercent = 50;
            let ledLevel = 5;

            const mornVal = day.mornTemp;
            const eveVal = day.eveTemp;

            if (activeTab === 'temp') {
              evePercent = Math.max(20, Math.min(100, Math.round(((eveVal - minDaily) / tempRange) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round(((mornVal - minDaily) / tempRange) * 100)));
              ledLevel = getLedLevelForTemp(eveVal);
            } else if (activeTab === 'aqi') {
              evePercent = Math.max(20, Math.min(100, Math.round((day.aqiEve / 120) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round((day.aqiMorn / 120) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round((day.aqiEve / 120) * 8) + 1));
            } else if (activeTab === 'uv') {
              evePercent = Math.max(20, Math.min(100, Math.round((day.uvEve / 10) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round((day.uvMorn / 10) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round((day.uvEve / 10) * 8) + 1));
            } else {
              evePercent = Math.max(20, Math.min(100, day.activityScores[selectedActivity].eve));
              mornPercent = Math.max(20, Math.min(100, day.activityScores[selectedActivity].morn));
              ledLevel = Math.max(1, Math.min(9, Math.round((evePercent / 100) * 9)));
            }

            const combinedVal = evePercent + mornPercent; 
            const totalHeightPercent = Math.max(45, Math.min(100, Math.round(combinedVal / 1.6)));
            const eveShare = combinedVal > 0 ? (evePercent / combinedVal) * 100 : 50;
            const mornShare = combinedVal > 0 ? (mornPercent / combinedVal) * 100 : 50;

            return (
              <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-emerald-400/30 rounded-xl p-1 bg-slate-900/60 shadow-md">
                <div className="h-4 flex items-center justify-center">
                  <LedLevelIndicator level={ledLevel} isActivity={activeTab === 'activities'} />
                </div>
                <div style={{ height: `${totalHeightPercent}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-lg overflow-hidden border-2 border-white/40 bg-slate-950 relative shadow-md">
                  <div style={{ height: `${eveShare}%` }} className="bg-gradient-to-t from-amber-600 via-orange-500 to-yellow-400 flex flex-col items-center justify-center py-1 px-0.5 relative">
                    <span className="text-[9px] font-black text-slate-950 z-10">
                      {activeTab === 'temp' && `${eveVal}°`}
                      {activeTab === 'aqi' && `${day.aqiEve}`}
                      {activeTab === 'uv' && `${day.uvEve}`}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].eve}%`}
                    </span>
                  </div>
                  <div className="w-full h-[1.5px] bg-white z-20 flex-shrink-0" />
                  <div style={{ height: `${mornShare}%` }} className="bg-gradient-to-t from-blue-950 via-indigo-700 to-blue-500 flex flex-col items-center justify-center py-1 px-0.5 relative">
                    <span className="text-[9px] font-black text-white z-10">
                      {activeTab === 'temp' && `${mornVal}°`}
                      {activeTab === 'aqi' && `${day.aqiMorn}`}
                      {activeTab === 'uv' && `${day.uvMorn}`}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].morn}%`}
                    </span>
                  </div>
                </div>
                <span className="text-[8.5px] text-emerald-100 font-extrabold border-t border-emerald-800/80 pt-1 w-full text-center truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DÉTAILS AVANCÉS : VIOLET / INDIGO INTENSE */}
      <div className="bg-gradient-to-r from-[#3b0764] via-[#581c87] to-[#3b0764] border-2 border-purple-400 rounded-2xl overflow-hidden shadow-2xl">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3 bg-[#1e1136] hover:bg-[#281747] transition-colors cursor-pointer text-left shadow-md"
        >
          <div className="flex items-center space-x-2 text-white font-black text-[11px] uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-purple-300" />
            <span className="text-white">Graphiques Avancés (Temp. Ressentie, Précipitations, Vent, Pollen, Indice de Confiance)</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-purple-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </button>

        {isDetailsOpen && (
          <div className="p-3 border-t border-purple-400/40 space-y-4 animate-fade-in bg-[#050811]/90">
            
            {/* Ressentie */}
            <div className="space-y-1.5 bg-[#121622] p-3 rounded-2xl border-2 border-purple-400/60 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-orange-400" /> Ressentie (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1 overflow-x-auto bg-[#050811] p-2 rounded-xl border border-purple-400/40">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round(((day.feelsEve + 5) / 45) * 100)));
                  const feelsLedLevel = getLedLevelForTemp(day.feelsEve);
                  const tempVal = day.feelsEve ?? 20;

                  let faceIcon = '😌';
                  let faceColor = 'text-emerald-300';
                  if (tempVal < 5) { faceIcon = '🥶'; faceColor = 'text-cyan-300'; }
                  else if (tempVal < 15) { faceIcon = '🧥'; faceColor = 'text-sky-300'; }
                  else if (tempVal >= 28) { faceIcon = '🥵'; faceColor = 'text-red-400'; }

                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1 h-full justify-end border border-purple-400/30 rounded-xl p-1 bg-slate-900/60 shadow-md">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={feelsLedLevel} />
                        <span className={`text-[11px] select-none inline-flex items-center justify-center ${faceColor}`}>{faceIcon}</span>
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md border border-white/30">
                        <div className="flex-1 bg-gradient-to-t from-orange-600 to-amber-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.feelsEve}°</span></div>
                        <div className="flex-1 bg-gradient-to-t from-amber-950 to-amber-700 flex items-center justify-center border-t border-white/40"><span className="text-[8px] font-black text-white">{day.feelsMorn}°</span></div>
                      </div>
                      <span className="text-[8.5px] text-slate-200 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Précipitations */}
            <div className="space-y-1.5 bg-[#121622] p-3 rounded-2xl border-2 border-purple-400/60 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                  <Umbrella className="w-4 h-4 text-teal-300" /> Précipitations (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1 overflow-x-auto bg-[#050811] p-2 rounded-xl border border-purple-400/40">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((Math.max(day.precipEve, 0.1) / 8) * 100)));
                  const precipLedLevel = Math.max(1, Math.min(9, Math.round(5 + (day.precipEve / 8) * 4)));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1 h-full justify-end border border-purple-400/30 rounded-xl p-1 bg-slate-900/60 shadow-md">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={precipLedLevel} />
                        {getPrecipitationIcon(day.precipTypeEve ?? 'rain', day.precipEve ?? 0, "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md border border-white/30">
                        <div className="flex-1 bg-gradient-to-t from-teal-500 to-emerald-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.precipEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-emerald-950 to-emerald-800 flex items-center justify-center border-t border-white/40"><span className="text-[8px] font-black text-white">{day.precipMorn}</span></div>
                      </div>
                      <span className="text-[8.5px] text-slate-200 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vent */}
            <div className="space-y-1.5 bg-[#121622] p-3 rounded-2xl border-2 border-purple-400/60 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-300" /> Vent & Direction (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1 overflow-x-auto bg-[#050811] p-2 rounded-xl border border-purple-400/40">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.windEve / 35) * 100)));
                  const windLedLevel = Math.max(1, Math.min(9, Math.round(5 + (day.windEve / 35) * 4)));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1 h-full justify-end border border-purple-400/30 rounded-xl p-1 bg-slate-900/60 shadow-md">
                      <div className="h-4 flex items-center justify-center gap-1">
                        <LedLevelIndicator level={windLedLevel} />
                        {getWindDirectionIcon(day.windDirEve ?? 'N', "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md border border-white/30">
                        <div className="flex-1 bg-gradient-to-t from-sky-500 to-cyan-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.windEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-blue-950 to-blue-700 flex items-center justify-center border-t border-white/40"><span className="text-[8px] font-black text-white">{day.windMorn}</span></div>
                      </div>
                      <span className="text-[8.5px] text-slate-200 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pollen */}
            <div className="space-y-1.5 bg-[#121622] p-3 rounded-2xl border-2 border-purple-400/60 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-yellow-300" /> Pollen (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1 overflow-x-auto bg-[#050811] p-2 rounded-xl border border-purple-400/40">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.pollenEve / 5) * 100)));
                  const pollenLedLevel = Math.max(1, Math.min(9, Math.round((day.pollenEve / 5) * 8) + 1));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1 h-full justify-end border border-purple-400/30 rounded-xl p-1 bg-slate-900/60 shadow-md">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={pollenLedLevel} />
                        {getPollenIcon(day.pollenEve, "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md border border-white/30">
                        <div className="flex-1 bg-gradient-to-t from-rose-500 to-pink-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.pollenEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-purple-950 to-purple-800 flex items-center justify-center border-t border-white/40"><span className="text-[8px] font-black text-white">{day.pollenMorn}</span></div>
                      </div>
                      <span className="text-[8.5px] text-slate-200 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indice de Confiance */}
            <div className="space-y-1.5 bg-[#121622] p-3 rounded-2xl border-2 border-amber-400 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-300" /> Indice de Confiance Météo (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1 pt-3 pb-1 overflow-x-auto bg-[#050811] p-2 rounded-xl border border-amber-400/40">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const conf = day.confidence ?? 3;
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-2 h-full justify-end border border-amber-400/40 rounded-xl p-1 bg-slate-900/60 shadow-md">
                      <div className="flex-1 flex items-center justify-center">
                        <ConfidenceDotsIndicator level={conf} />
                      </div>
                      <span className="text-[8.5px] text-slate-200 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default WeatherDetailPage;