import React, { useState, useEffect, useMemo } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Gauge, SunMedium,
  Thermometer, Umbrella, Compass, Flower2, Clock, X, Plus, Trash2, ShieldCheck, Info,
  RefreshCw, CheckCircle2, Award, Leaf, Sprout, Flower, CloudSnow, CloudLightning, Home
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
  9: { bars: 3, colorClass: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]', borderClass: 'border-sky-400/40' },
  8: { bars: 2, colorClass: 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]', borderClass: 'border-sky-500/40' },
  7: { bars: 1, colorClass: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]', borderClass: 'border-cyan-500/40' },
  6: { bars: 3, colorClass: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]', borderClass: 'border-teal-400/40' },
  5: { bars: 2, colorClass: 'bg-teal-500 shadow-[0_0_8px_#14b8a6]', borderClass: 'border-teal-500/40' },
  4: { bars: 1, colorClass: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]', borderClass: 'border-blue-400/40' },
  3: { bars: 3, colorClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]', borderClass: 'border-blue-500/40' },
  2: { bars: 2, colorClass: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]', borderClass: 'border-indigo-500/40' },
  1: { bars: 1, colorClass: 'bg-indigo-600 shadow-[0_0_8px_#4f46e5]', borderClass: 'border-indigo-600/40' },
};

const ACTIVITY_LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-teal-300 shadow-[0_0_8px_#5eead4]', borderClass: 'border-teal-300/40' },
  8: { bars: 2, colorClass: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]', borderClass: 'border-teal-400/40' },
  7: { bars: 1, colorClass: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]', borderClass: 'border-sky-400/40' },
  6: { bars: 3, colorClass: 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]', borderClass: 'border-sky-500/40' },
  5: { bars: 2, colorClass: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]', borderClass: 'border-blue-400/40' },
  4: { bars: 1, colorClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]', borderClass: 'border-blue-500/40' },
  3: { bars: 3, colorClass: 'bg-indigo-400 shadow-[0_0_8px_#818cf8]', borderClass: 'border-indigo-400/40' },
  2: { bars: 2, colorClass: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]', borderClass: 'border-indigo-500/40' },
  1: { bars: 1, colorClass: 'bg-indigo-600 shadow-[0_0_8px_#4f46e5]', borderClass: 'border-indigo-600/40' },
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

  return (
    <div className="flex flex-col items-center justify-center gap-1 p-1 bg-black/80 rounded-xl border border-sky-400/40 backdrop-blur-xs w-7 py-2 shadow-lg" title={`Indice de confiance : ${safeLevel}/5`}>
      {[5, 4, 3, 2, 1].map((dotIndex) => {
        const isLit = dotIndex <= safeLevel;
        return (
          <div
            key={dotIndex}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${isLit ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800/60'}`}
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
    return <Sun className={`${sizeClass} text-sky-300 drop-shadow-md`} />;
  }
  return <CloudSun className={`${sizeClass} text-sky-200 drop-shadow-md`} />;
};

const getPollenIcon = (val: number, sizeClass: string = "w-3 h-3") => {
  if (val >= 4) return <span title="Pollen abondant (Herbacées/Fleurs)"><Flower className={`${sizeClass} text-teal-300`} /></span>;
  if (val >= 2) return <span title="Pollen modéré (Graminées)"><Sprout className={`${sizeClass} text-sky-300`} /></span>;
  return <span title="Pollen faible (Arbres)"><Leaf className={`${sizeClass} text-cyan-300`} /></span>;
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
    return <span title={`Forte averse / Orage (${amount} mm)`}><CloudLightning className={`${sizeClass} text-sky-300 animate-bounce`} /></span>;
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
      <Compass className={`${sizeClass} text-sky-300 transition-transform duration-300`} style={{ transform: `rotate(${rotation}deg)` }} />
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
    if (currentTemp > 32) return { type: 'Prévention Chaleur', color: 'bg-sky-950/80 border-sky-400 text-sky-100', icon: <Info className="w-4 h-4 text-sky-300" />, details: `Température élevée (${currentTemp}°C > 32°C). Pensez à vous hydrater.` };
    if (currentTemp < 4) return { type: 'Prévention Froid', color: 'bg-slate-900/90 border-slate-600 text-slate-100', icon: <Info className="w-4 h-4 text-sky-300" />, details: `Température basse (${currentTemp}°C < 4°C). Couvrez-vous bien.` };
    if (currentWind > 45) return { type: 'Prévention Vent', color: 'bg-indigo-950/80 border-indigo-400 text-indigo-100', icon: <Info className="w-4 h-4 text-indigo-300" />, details: `Vent mesuré à ${currentWind} km/h (> 45 km/h).` };
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
    fitness: { title: 'Fitness', icon: <Dumbbell className="w-4 h-4 text-sky-300" /> },
    tennis: { title: 'Tennis', icon: <Activity className="w-4 h-4 text-sky-300" /> },
    cycling: { title: 'Cyclisme', icon: <Bike className="w-4 h-4 text-teal-300" /> },
    forestWalk: { title: 'Forêt', icon: <Trees className="w-4 h-4 text-teal-300" /> },
  };

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-300 font-bold">
        <p>Chargement des données météo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full max-w-xl mx-auto pb-20 px-1 font-sans">
      
      {showPopup && (
        <div className="fixed inset-x-0 top-3 z-[9999999] flex justify-center pointer-events-none px-2 animate-fade-in">
          <div className="bg-slate-900 border border-sky-400 text-sky-100 p-3 rounded-2xl shadow-xl backdrop-blur-xl max-w-sm w-full font-mono flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-300 animate-pulse shrink-0" />
            <div>
              <p className="font-black uppercase tracking-wider text-white text-xs">[SYNC_WEATHER_DONE]</p>
              <p className="text-[10px] text-sky-200">Données météo actualisées pour {currentWeather.city}.</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-2 z-[999999] pointer-events-auto" style={{ top: `calc(50vh + ${scrollY}px)` }}>
        <button
          onClick={handleRefreshWeather}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-400 text-sky-200 shadow-xl backdrop-blur-2xl transition-all duration-300 cursor-pointer flex items-center justify-center group active:scale-95"
          title="Rafraîchir les données météo"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
        </button>
      </div>

      {showCitySettings && (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-8 bg-black/85 backdrop-blur-xs p-2 animate-fade-in">
          <div className="bg-gradient-to-r from-sky-900/90 via-slate-800 to-sky-900/90 border border-sky-400/50 rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-sky-400/30 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-300" /> Ajouter une nouvelle ville
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
                className="w-full bg-slate-900 border border-sky-400/40 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-400 font-semibold shadow-inner"
              />
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-sky-400 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-44 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddCityName(item.name)}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-sky-950 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800 last:border-none cursor-pointer"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-[10px] text-sky-300 font-semibold">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[11px] text-slate-200 font-bold block uppercase tracking-wide">Villes enregistrées ({cities.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {cities.map((city) => (
                  <div key={city} className="flex items-center justify-between bg-slate-900/90 border border-sky-400/30 px-3 py-2 rounded-2xl shadow-inner">
                    <span className="font-semibold text-white text-xs">{city}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, city)}
                      className="text-rose-200 hover:text-white p-1 bg-rose-950 border border-rose-400/50 rounded-xl cursor-pointer transition-all flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-sky-400/30 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCitySettings(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. EN-TÊTE HARMONISÉ */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 w-full backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-sky-400/20 border border-sky-400/40 text-sky-300 flex-shrink-0 shadow-inner">
              <CloudSun className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white truncate">{currentWeather.city || 'Ville'}</h1>
                {currentWeather.city?.toLowerCase() === homeCity.toLowerCase() && (
                  <span className="bg-sky-950 text-sky-200 border border-sky-400/60 text-[9px] px-1.5 py-0.5 rounded-md font-black flex items-center gap-1 shadow-sm">
                    <Home className="w-3 h-3 text-sky-300" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium capitalize truncate">{translateCondition(currentWeather.condition || '', language)}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowCitySettings(true); }}
            className="px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-400/30 font-semibold flex items-center gap-1 transition-colors text-xs cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>Ajouter une ville</span>
          </button>
        </div>

        {cities.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto scrollbar-none py-1 items-center">
            {cities.map(city => {
              const isHome = city.toLowerCase() === homeCity.toLowerCase();
              const isActive = activeCity.toLowerCase() === city.toLowerCase();

              return (
                <div key={city} className={`flex items-center gap-1.5 border rounded-2xl px-3 py-1.5 flex-shrink-0 transition-all shadow-sm ${
                  isActive ? 'bg-gradient-to-r from-sky-900/80 to-slate-800 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40' : 'bg-slate-900/90 border-sky-400/30 text-slate-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => onSelectCity(city)}
                    className={`font-semibold text-xs cursor-pointer ${
                      isActive ? 'text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSetHomeCity(e, city)}
                    className={`p-1 rounded-xl transition-all cursor-pointer ${
                      isHome ? 'text-sky-300 bg-sky-950 border border-sky-400/60 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={isHome ? "Ville de référence thermique (Maison)" : "Définir comme lieu de référence (Maison)"}
                  >
                    <Home className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activePrevention ? (
        <div className={`border rounded-3xl p-4 shadow-xl flex items-start space-x-3 animate-fade-in ${activePrevention.color}`}>
          <div className="p-2 rounded-2xl bg-black/60 border border-current/40 flex-shrink-0 mt-0.5 shadow-sm">
            {activePrevention.icon}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                <Info className="w-4 h-4" /> {activePrevention.type}
              </h2>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-black/60 border border-current/50 uppercase">Conseil</span>
            </div>
            <p className="text-[11px] text-slate-100 leading-relaxed font-semibold">{activePrevention.details}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-4 shadow-xl flex items-center space-x-3 text-slate-100 backdrop-blur-md">
          <div className="p-2 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex-shrink-0 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-black text-white uppercase tracking-wider">Conditions stables</h2>
            <p className="text-[11px] text-slate-300 font-medium truncate">Aucun seuil de vigilance particulier n'est atteint.</p>
          </div>
        </div>
      )}

      {/* 2. MÉTÉO HEURE PAR HEURE (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <span className="font-black text-white text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> Météo Heure par Heure (Les 16 prochaines heures)
          </span>
          <span className="text-[10px] font-bold text-sky-300">°C</span>
        </div>
        <div className="h-48 flex items-end justify-between gap-1.5 pt-3 pb-1.5 bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 overflow-x-auto shadow-inner">
          {hourlyData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-semibold">
              Chargement des données horaires de l'API...
            </div>
          ) : (
            hourlyData.map((item: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round(((item.temp - minHourly) / rangeHourly) * 100)));
              const hourlyLedLevel = getLedLevelForTemp(item.temp);

              return (
                <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 hover:border-sky-400 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                  <div className="h-4 flex items-center justify-center">
                    <LedLevelIndicator level={hourlyLedLevel} />
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden border border-sky-400/40 bg-slate-950 relative shadow-inner">
                    <div className="flex-1 bg-gradient-to-t from-sky-600 via-sky-500 to-indigo-600 flex flex-col items-center justify-between py-1.5 px-0.5 relative">
                      <span className="text-[9px] font-black text-white z-10">{item.temp}°</span>
                      <div className="z-10">{getWeatherIcon(item.condition, "w-3.5 h-3.5")}</div>
                    </div>
                  </div>
                  <span className="text-[9px] text-sky-300 font-semibold border-t border-slate-800 pt-1 w-full text-center truncate">{item.time}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 p-4 rounded-3xl flex items-center space-x-3 shadow-xl backdrop-blur-md">
          <Droplets className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-300 text-[10px] font-bold block">{t.humidity}</span>
            <span className="text-xs font-black text-white">{currentWeather.humidity ?? 0}%</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 p-4 rounded-3xl flex items-center space-x-3 shadow-xl backdrop-blur-md">
          <Wind className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-300 text-[10px] font-bold block">{t.wind}</span>
            <span className="text-xs font-black text-white">{currentWeather.windSpeed ?? 0} km/h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-2 border border-sky-400/40 rounded-3xl shadow-xl backdrop-blur-md">
        <button type="button" onClick={() => setActiveTab('temp')} className={`py-2 px-1 rounded-2xl font-semibold text-[11px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-sm ${activeTab === 'temp' ? 'bg-sky-500 text-slate-950 font-bold shadow-md ring-1 ring-sky-300' : 'text-slate-300 bg-slate-900/90 border border-sky-400/20 hover:text-white'}`}>
          <Calendar className="w-3.5 h-3.5" /><span className="truncate">Températures</span>
        </button>
        <button type="button" onClick={() => setActiveTab('aqi')} className={`py-2 px-1 rounded-2xl font-semibold text-[11px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-sm ${activeTab === 'aqi' ? 'bg-teal-500 text-slate-950 font-bold shadow-md ring-1 ring-teal-300' : 'text-slate-300 bg-slate-900/90 border border-sky-400/20 hover:text-white'}`}>
          <Gauge className="w-3.5 h-3.5" /><span className="truncate">Air (AQI)</span>
        </button>
        <button type="button" onClick={() => setActiveTab('uv')} className={`py-2 px-1 rounded-2xl font-semibold text-[11px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-sm ${activeTab === 'uv' ? 'bg-sky-500 text-slate-950 font-bold shadow-md ring-1 ring-sky-300' : 'text-slate-300 bg-slate-900/90 border border-sky-400/20 hover:text-white'}`}>
          <SunMedium className="w-3.5 h-3.5" /><span className="truncate">Indice UV</span>
        </button>
        <button type="button" onClick={() => setActiveTab('activities')} className={`py-2 px-1 rounded-2xl font-semibold text-[11px] flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-sm ${activeTab === 'activities' ? 'bg-indigo-500 text-slate-950 font-bold shadow-md ring-1 ring-indigo-300' : 'text-slate-300 bg-slate-900/90 border border-sky-400/20 hover:text-white'}`}>
          <Activity className="w-3.5 h-3.5" /><span className="truncate">Activités</span>
        </button>
      </div>

      {/* 4. DIAGRAMME PRINCIPAL (15 Jours - HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 p-5 rounded-3xl shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <h2 className="text-xs font-black uppercase text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" /> 
            {activeTab === 'temp' && "Tendance Températures (15 Jours)"}
            {activeTab === 'aqi' && "Qualité de l'Air AQI (15 Jours)"}
            {activeTab === 'uv' && "Évolution Indice UV (15 Jours)"}
            {activeTab === 'activities' && `Scores - ${activityMeta[selectedActivity].title} (15 Jours)`}
          </h2>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block border border-white/60"></span><span className="text-white">Matin</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block border border-white/60"></span><span className="text-teal-300">Soir/Apm</span></div>
          </div>
        </div>

        {activeTab === 'activities' && (
          <div className="flex gap-1.5 pb-1 overflow-x-auto">
            {(Object.keys(activityMeta) as Array<keyof typeof activityMeta>).map((actKey) => (
              <button
                key={actKey}
                type="button"
                onClick={() => setSelectedActivity(actKey)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                  selectedActivity === actKey ? 'bg-sky-500 text-slate-950 font-bold border-sky-300' : 'bg-slate-900/90 text-slate-300 border-sky-400/30 hover:text-white'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-56 flex items-end justify-between gap-1.5 pt-3 pb-1.5 bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 overflow-x-auto shadow-inner">
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
            const totalHeightPercent = Math.max(50, Math.min(100, Math.round(combinedVal / 1.6)));
            const eveShare = combinedVal > 0 ? (evePercent / combinedVal) * 100 : 50;
            const mornShare = combinedVal > 0 ? (mornPercent / combinedVal) * 100 : 50;

            return (
              <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                
                <div className="h-4 flex items-center justify-center">
                  <LedLevelIndicator level={ledLevel} isActivity={activeTab === 'activities'} />
                </div>

                <div style={{ height: `${totalHeightPercent}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden border border-white/30 bg-slate-950 relative shadow-inner">
                  
                  {/* Section Après-midi (avec icône intégrée) */}
                  <div style={{ height: `${eveShare}%` }} className="bg-gradient-to-t from-teal-600 via-teal-500 to-sky-400 flex flex-col items-center justify-between py-1.5 px-0.5 relative">
                    <span className="text-[9px] font-black text-slate-950 z-10">
                      {activeTab === 'temp' && `${eveVal}°`}
                      {activeTab === 'aqi' && `${day.aqiEve}`}
                      {activeTab === 'uv' && `${day.uvEve}`}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].eve}%`}
                    </span>
                    <div className="z-10" title={`Après-midi : ${day.eveCondition || 'Ensoleillé'}`}>
                      {getWeatherIcon(day.eveCondition, "w-3.5 h-3.5")}
                    </div>
                  </div>

                  <div className="w-full h-[1.5px] bg-white z-20 flex-shrink-0" />

                  {/* Section Matin (avec icône intégrée) */}
                  <div style={{ height: `${mornShare}%` }} className="bg-gradient-to-t from-sky-950 via-sky-800 to-sky-500 flex flex-col items-center justify-between py-1.5 px-0.5 relative">
                    <span className="text-[9px] font-black text-white z-10">
                      {activeTab === 'temp' && `${mornVal}°`}
                      {activeTab === 'aqi' && `${day.aqiMorn}`}
                      {activeTab === 'uv' && `${day.uvMorn}`}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].morn}%`}
                    </span>
                    <div className="z-10" title={`Matin : ${day.mornCondition || 'Ensoleillé'}`}>
                      {getWeatherIcon(day.mornCondition, "w-3.5 h-3.5")}
                    </div>
                  </div>

                </div>

                <span className="text-[9px] text-sky-300 font-semibold border-t border-slate-800 pt-1 w-full text-center truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DÉTAILS AVANCÉS (HARMONISÉ) */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl overflow-hidden shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-900 transition-colors cursor-pointer text-left shadow-sm border-b border-sky-400/30"
        >
          <div className="flex items-center space-x-2.5 text-white font-black text-xs uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="text-white">Graphiques Avancés (Temp. Ressentie, Précipitations, Vent, Pollen, Confiance)</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 space-y-4 animate-fade-in bg-slate-950/60">
            
            {/* Ressentie */}
            <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-sky-400/30 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-sky-400" /> Ressentie (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-950 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round(((day.feelsEve + 5) / 45) * 100)));
                  const feelsLedLevel = getLedLevelForTemp(day.feelsEve);
                  const tempVal = day.feelsEve ?? 20;

                  let faceIcon = '😌';
                  let faceColor = 'text-sky-300';
                  if (tempVal < 5) { faceIcon = '🥶'; faceColor = 'text-cyan-300'; }
                  else if (tempVal < 15) { faceIcon = '🧥'; faceColor = 'text-sky-200'; }
                  else if (tempVal >= 28) { faceIcon = '🥵'; faceColor = 'text-teal-300'; }

                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={feelsLedLevel} />
                        <span className={`text-[11px] select-none inline-flex items-center justify-center ${faceColor}`}>{faceIcon}</span>
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden shadow-sm border border-white/20">
                        <div className="flex-1 bg-gradient-to-t from-sky-600 to-teal-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.feelsEve}°</span></div>
                        <div className="flex-1 bg-gradient-to-t from-indigo-950 to-indigo-700 flex items-center justify-center border-t border-white/30"><span className="text-[8px] font-black text-white">{day.feelsMorn}°</span></div>
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Précipitations */}
            <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-sky-400/30 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-2">
                  <Umbrella className="w-4 h-4 text-teal-300" /> Précipitations (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-950 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((Math.max(day.precipEve, 0.1) / 8) * 100)));
                  const precipLedLevel = Math.max(1, Math.min(9, Math.round(5 + (day.precipEve / 8) * 4)));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={precipLedLevel} />
                        {getPrecipitationIcon(day.precipTypeEve ?? 'rain', day.precipEve ?? 0, "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden shadow-sm border border-white/20">
                        <div className="flex-1 bg-gradient-to-t from-teal-500 to-sky-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.precipEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-sky-950 to-sky-800 flex items-center justify-center border-t border-white/30"><span className="text-[8px] font-black text-white">{day.precipMorn}</span></div>
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vent */}
            <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-sky-400/30 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-400" /> Vent & Direction (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-950 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.windEve / 35) * 100)));
                  const windLedLevel = Math.max(1, Math.min(9, Math.round(5 + (day.windEve / 35) * 4)));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                      <div className="h-4 flex items-center justify-center gap-1">
                        <LedLevelIndicator level={windLedLevel} />
                        {getWindDirectionIcon(day.windDirEve ?? 'N', "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden shadow-sm border border-white/20">
                        <div className="flex-1 bg-gradient-to-t from-sky-500 to-cyan-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.windEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-indigo-950 to-indigo-700 flex items-center justify-center border-t border-white/30"><span className="text-[8px] font-black text-white">{day.windMorn}</span></div>
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pollen */}
            <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-sky-400/30 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-2">
                  <Flower2 className="w-4 h-4 text-teal-300" /> Pollen (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-950 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.pollenEve / 5) * 100)));
                  const pollenLedLevel = Math.max(1, Math.min(9, Math.round((day.pollenEve / 5) * 8) + 1));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-1.5 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                      <div className="h-4 flex items-center justify-center gap-0.5">
                        <LedLevelIndicator level={pollenLedLevel} />
                        {getPollenIcon(day.pollenEve, "w-3 h-3")}
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[24px] flex flex-col justify-between rounded-xl overflow-hidden shadow-sm border border-white/20">
                        <div className="flex-1 bg-gradient-to-t from-teal-400 to-sky-400 flex items-center justify-center"><span className="text-[8px] font-black text-slate-950">{day.pollenEve}</span></div>
                        <div className="flex-1 bg-gradient-to-t from-indigo-950 to-indigo-800 flex items-center justify-center border-t border-white/30"><span className="text-[8px] font-black text-white">{day.pollenMorn}</span></div>
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indice de Confiance */}
            <div className="space-y-2 bg-slate-900/90 p-4 rounded-2xl border border-sky-400/30 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-xs flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" /> Indice de Confiance Météo (15 Jours)
                </span>
              </div>
              <div className="h-52 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-950 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
                {fifteenDaysData.map((day: any, idx: number) => {
                  const conf = day.confidence ?? 3;
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] max-w-[54px] flex flex-col items-center gap-2 h-full justify-end border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm">
                      <div className="flex-1 flex items-center justify-center">
                        <ConfidenceDotsIndicator level={conf} />
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
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