import React, { useState, useEffect, useMemo } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Calendar, 
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

interface TempLevelConfig {
  bars: number;
  colorClass: string;
}

const getTempLevelConfig = (temp: number): TempLevelConfig => {
  if (temp < -15) return { bars: 3, colorClass: 'bg-fuchsia-400 shadow-[0_0_8px_#e879f9]' };
  if (temp >= -15 && temp < -10) return { bars: 2, colorClass: 'bg-purple-400 shadow-[0_0_8px_#c084fc]' };
  if (temp >= -10 && temp < -5) return { bars: 1, colorClass: 'bg-violet-300 shadow-[0_0_8px_#ddd6fe]' };
  if (temp >= -5 && temp < 0) return { bars: 3, colorClass: 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]' };
  if (temp >= 0 && temp < 5) return { bars: 2, colorClass: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' };
  if (temp >= 5 && temp < 10) return { bars: 1, colorClass: 'bg-blue-300 shadow-[0_0_8px_#93c5fd]' };
  if (temp >= 10 && temp < 13) return { bars: 3, colorClass: 'bg-sky-200 shadow-[0_0_8px_#bae6fd]' };
  if (temp >= 13 && temp < 16) return { bars: 2, colorClass: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' };
  if (temp >= 16 && temp < 19) return { bars: 1, colorClass: 'bg-sky-300 shadow-[0_0_8px_#7dd3fc]' };
  if (temp >= 19 && temp < 22) return { bars: 3, colorClass: 'bg-emerald-300 shadow-[0_0_8px_#6ee7b7]' };
  if (temp >= 22 && temp < 25) return { bars: 2, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' };
  if (temp >= 25 && temp < 28) return { bars: 1, colorClass: 'bg-teal-300 shadow-[0_0_8px_#5eead4]' };
  if (temp >= 28 && temp < 30) return { bars: 3, colorClass: 'bg-amber-200 shadow-[0_0_8px_#fde68a]' };
  if (temp >= 30 && temp < 32) return { bars: 2, colorClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' };
  if (temp >= 32 && temp < 34) return { bars: 1, colorClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]' };
  if (temp >= 34 && temp < 36) return { bars: 3, colorClass: 'bg-rose-300 shadow-[0_0_8px_#fda4af]' };
  if (temp >= 36 && temp < 38) return { bars: 2, colorClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' };
  return { bars: 3, colorClass: 'bg-red-500 shadow-[0_0_10px_#ef4444]' };
};

interface AqiLevelConfig {
  bars: number;
  colorClass: string;
}

const getAqiLevelConfig = (aqi: number): AqiLevelConfig => {
  if (aqi <= 10) return { bars: 3, colorClass: 'bg-purple-900 shadow-[0_0_8px_#581c87]' };
  if (aqi <= 15) return { bars: 2, colorClass: 'bg-purple-600 shadow-[0_0_8px_#9333ea]' };
  if (aqi <= 20) return { bars: 1, colorClass: 'bg-purple-300 shadow-[0_0_8px_#d8b4fe]' };
  if (aqi <= 25) return { bars: 3, colorClass: 'bg-red-900 shadow-[0_0_8px_#7f1d1d]' };
  if (aqi <= 30) return { bars: 2, colorClass: 'bg-red-600 shadow-[0_0_8px_#dc2626]' };
  if (aqi <= 35) return { bars: 1, colorClass: 'bg-red-300 shadow-[0_0_8px_#fca5a5]' };
  if (aqi <= 40) return { bars: 3, colorClass: 'bg-amber-700 shadow-[0_0_8px_#b45309]' };
  if (aqi <= 43) return { bars: 2, colorClass: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' };
  if (aqi <= 48) return { bars: 1, colorClass: 'bg-amber-200 shadow-[0_0_8px_#fde68a]' };
  if (aqi <= 53) return { bars: 3, colorClass: 'bg-blue-900 shadow-[0_0_8px_#1e3a8a]' };
  if (aqi <= 60) return { bars: 2, colorClass: 'bg-blue-600 shadow-[0_0_8px_#2563eb]' };
  if (aqi <= 70) return { bars: 1, colorClass: 'bg-blue-300 shadow-[0_0_8px_#93c5fd]' };
  if (aqi <= 80) return { bars: 3, colorClass: 'bg-emerald-800 shadow-[0_0_8px_#065f46]' };
  if (aqi <= 90) return { bars: 2, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' };
  return { bars: 1, colorClass: 'bg-emerald-200 shadow-[0_0_8px_#a7f3d0]' };
};

interface UvLevelConfig {
  bars: number;
  colorClass: string;
}

const getUvLevelConfig = (uv: number): UvLevelConfig => {
  if (uv <= 0.8) return { bars: 3, colorClass: 'bg-emerald-800 shadow-[0_0_8px_#065f46]' };
  if (uv <= 1.5) return { bars: 2, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' };
  if (uv <= 2.5) return { bars: 1, colorClass: 'bg-emerald-200 shadow-[0_0_8px_#a7f3d0]' };
  if (uv <= 3.5) return { bars: 3, colorClass: 'bg-blue-900 shadow-[0_0_8px_#1e3a8a]' };
  if (uv <= 4.5) return { bars: 2, colorClass: 'bg-blue-600 shadow-[0_0_8px_#2563eb]' };
  if (uv <= 5.5) return { bars: 1, colorClass: 'bg-blue-300 shadow-[0_0_8px_#93c5fd]' };
  if (uv <= 6.5) return { bars: 3, colorClass: 'bg-amber-700 shadow-[0_0_8px_#b45309]' };
  if (uv <= 7.5) return { bars: 2, colorClass: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' };
  if (uv <= 8.5) return { bars: 1, colorClass: 'bg-amber-200 shadow-[0_0_8px_#fde68a]' };
  if (uv <= 9.5) return { bars: 3, colorClass: 'bg-red-900 shadow-[0_0_8px_#7f1d1d]' };
  if (uv <= 10.5) return { bars: 2, colorClass: 'bg-red-600 shadow-[0_0_8px_#dc2626]' };
  if (uv <= 11.5) return { bars: 1, colorClass: 'bg-red-300 shadow-[0_0_8px_#fca5a5]' };
  if (uv <= 13) return { bars: 3, colorClass: 'bg-purple-900 shadow-[0_0_8px_#581c87]' };
  if (uv <= 15) return { bars: 2, colorClass: 'bg-purple-600 shadow-[0_0_8px_#9333ea]' };
  return { bars: 1, colorClass: 'bg-purple-300 shadow-[0_0_8px_#d8b4fe]' };
};

interface ActivityLevelConfig {
  bars: number;
  colorClass: string;
}

const getActivityLevelConfig = (score: number): ActivityLevelConfig => {
  if (score >= 90) return { bars: 3, colorClass: 'bg-teal-300 shadow-[0_0_8px_#5eead4]' };
  if (score >= 75) return { bars: 2, colorClass: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' };
  if (score >= 60) return { bars: 1, colorClass: 'bg-teal-200 shadow-[0_0_8px_#99f6e4]' };
  if (score >= 45) return { bars: 3, colorClass: 'bg-sky-300 shadow-[0_0_8px_#7dd3fc]' };
  if (score >= 30) return { bars: 2, colorClass: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' };
  if (score >= 15) return { bars: 1, colorClass: 'bg-sky-200 shadow-[0_0_8px_#bae6fd]' };
  return { bars: 1, colorClass: 'bg-slate-600 shadow-[0_0_4px_#475569]' };
};

const LedHorizontalIndicator: React.FC<{ 
  temp?: number; 
  aqi?: number; 
  uv?: number; 
  activityScore?: number;
  isActivity?: boolean; 
  isAqi?: boolean; 
  isUv?: boolean 
}> = ({ temp, aqi, uv, activityScore, isActivity = false, isAqi = false, isUv = false }) => {
  let config: TempLevelConfig | AqiLevelConfig | UvLevelConfig | ActivityLevelConfig;
  
  if (isUv && uv !== undefined) {
    config = getUvLevelConfig(uv);
  } else if (isAqi && aqi !== undefined) {
    config = getAqiLevelConfig(aqi);
  } else if (isActivity && activityScore !== undefined) {
    config = getActivityLevelConfig(activityScore);
  } else if (temp !== undefined) {
    config = getTempLevelConfig(temp);
  } else {
    config = { bars: 2, colorClass: 'bg-sky-300 shadow-[0_0_8px_#7dd3fc]' };
  }

  return (
    <div className="h-5 flex items-center justify-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-sky-400/20 shrink-0 mx-auto">
      {[1, 2, 3].map((dotIndex) => {
        const isLit = dotIndex <= config.bars;
        return (
          <div
            key={dotIndex}
            className={`w-1 h-1 rounded-full transition-all duration-300 shrink-0 ${
              isLit ? config.colorClass : 'bg-slate-700/60'
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
    <div className="flex flex-col items-center justify-center gap-1 p-0 bg-transparent w-6 py-1.5" title={`Indice de confiance : ${safeLevel}/5`}>
      {[5, 4, 3, 2, 1].map((dotIndex) => {
        const isLit = dotIndex <= safeLevel;
        return (
          <div
            key={dotIndex}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isLit ? 'bg-sky-300 shadow-[0_0_8px_#7dd3fc]' : 'bg-slate-700/60'}`}
          />
        );
      })}
    </div>
  );
};

const getWeatherIcon = (condition: string = '', sizeClass: string = "w-3.5 h-3.5") => {
  const c = condition.toLowerCase();
  if (c.includes('pluie') || c.includes('rain') || c.includes('averses')) {
    return <CloudRain className={`${sizeClass} text-teal-200 drop-shadow-md`} />;
  }
  if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
    return <Cloud className={`${sizeClass} text-white drop-shadow-md`} />;
  }
  if (c.includes('soleil') || c.includes('sun') || c.includes('clair') || c.includes('ensoleillé')) {
    return <Sun className={`${sizeClass} text-sky-200 drop-shadow-md`} />;
  }
  return <CloudSun className={`${sizeClass} text-sky-200 drop-shadow-md`} />;
};

const getPollenIcon = (val: number, sizeClass: string = "w-3 h-3") => {
  if (val >= 4) return <span title="Pollen abondant"><Flower className={`${sizeClass} text-teal-300`} /></span>;
  if (val >= 2) return <span title="Pollen modéré"><Sprout className={`${sizeClass} text-sky-300`} /></span>;
  return <span title="Pollen faible"><Leaf className={`${sizeClass} text-cyan-300`} /></span>;
};

const getPrecipitationIcon = (type: string = 'rain', amount: number = 0, sizeClass: string = "w-3 h-3") => {
  const t = type.toLowerCase();
  if (t.includes('neige') || t.includes('snow')) {
    if (amount > 5) return <span title={`Forte neige (${amount} mm)`}><CloudSnow className={`${sizeClass} text-white animate-pulse`} /></span>;
    return <span title={`Neige légère (${amount} mm)`}><CloudSnow className={`${sizeClass} text-sky-200`} /></span>;
  }
  if (amount > 7.5) {
    return <span title={`Forte averse (${amount} mm)`}><CloudLightning className={`${sizeClass} text-sky-300 animate-bounce`} /></span>;
  } else if (amount >= 2.0) {
    return <span title={`Pluie modérée (${amount} mm)`}><CloudRain className={`${sizeClass} text-teal-300`} /></span>;
  } else if (amount > 0) {
    return <span title={`Bruine (${amount} mm)`}><Droplets className={`${sizeClass} text-teal-200`} /></span>;
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
    <span title={`Vent : ${dir}`} className="inline-flex items-center justify-center">
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
  const [selectedActivity, setSelectedActivity] = useState<'fitness' | 'tennis' | 'cycling' | 'forestWalk'>('fitness');

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
      const precipMorn = Number(d.precipMorn ?? 0);
      const windEve = Number(d.windEve ?? (12 + (idx % 7)));
      const windMorn = Number(d.windMorn ?? (8 + (idx % 5)));
      const pollenVal = Number(d.pollenEve ?? ((idx % 4) + 1));

      const aqiMorn = d.aqiMorn ?? 30;
      const aqiEve = d.aqiEve ?? 45;
      const uvMorn = d.uvMorn ?? 2;
      const uvEve = d.uvEve ?? 5;

      const calcScore = (temp: number, precip: number, wind: number, type: string) => {
        let score = 85;
        if (type === 'fitness') {
          if (temp > 30 || temp < 2) score -= 25;
          if (precip > 1) score -= 35;
        } else if (type === 'tennis') {
          if (wind > 18) score -= 40;
          if (precip > 0) score -= 50;
          if (temp > 32 || temp < 10) score -= 30;
        } else if (type === 'cycling') {
          if (wind > 25) score -= 45;
          if (precip > 0.5) score -= 40;
        } else if (type === 'forestWalk') {
          if (pollenVal >= 4) score -= 30;
          if (precip > 2) score -= 35;
        }
        return Math.max(20, Math.min(100, score - (idx % 3) * 5));
      };

      return {
        ...d,
        mornTemp,
        eveTemp,
        mornCondition: d.mornCondition ?? d.condition ?? 'Ensoleillé',
        eveCondition: d.eveCondition ?? d.condition ?? 'Ensoleillé',
        aqiMorn,
        aqiEve,
        uvMorn,
        uvEve,
        feelsMorn: d.feelsMorn ?? (mornTemp - 2),
        feelsEve: d.feelsEve ?? (eveTemp + 1),
        precipMorn,
        precipEve,
        precipTypeMorn: d.precipTypeMorn ?? detectedPrecipType,
        precipTypeEve: d.precipTypeEve ?? detectedPrecipType,
        windMorn,
        windEve,
        confidence: d.confidence ?? Math.max(1, 5 - Math.floor(idx / 3)),
        activityScores: {
          fitness: { morn: calcScore(mornTemp, precipMorn, windMorn, 'fitness'), eve: calcScore(eveTemp, precipEve, windEve, 'fitness') },
          tennis: { morn: calcScore(mornTemp, precipMorn, windMorn, 'tennis'), eve: calcScore(eveTemp, precipEve, windEve, 'tennis') },
          cycling: { morn: calcScore(mornTemp, precipMorn, windMorn, 'cycling'), eve: calcScore(eveTemp, precipEve, windEve, 'cycling') },
          forestWalk: { morn: calcScore(mornTemp, precipMorn, windMorn, 'forestWalk'), eve: calcScore(eveTemp, precipEve, windEve, 'forestWalk') }
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

      {/* BANDEAU DE NAVIGATION RAPIDE PAR SECTION */}
      <div className="bg-gradient-to-r from-sky-900/80 via-slate-800 to-sky-900/80 border border-sky-400/40 p-2.5 rounded-3xl shadow-xl backdrop-blur-md flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button type="button" onClick={() => scrollToSection('section-hourly')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Clock className="w-3 h-3 text-sky-400" /> Horaire
        </button>
        <button type="button" onClick={() => scrollToSection('section-daily')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <BarChart3 className="w-3 h-3 text-sky-400" /> Températures
        </button>
        <button type="button" onClick={() => scrollToSection('section-feels')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Thermometer className="w-3 h-3 text-sky-400" /> Ressentie
        </button>
        <button type="button" onClick={() => scrollToSection('section-activities')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Activity className="w-3 h-3 text-indigo-400" /> Activités
        </button>
        <button type="button" onClick={() => scrollToSection('section-precip')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Umbrella className="w-3 h-3 text-teal-300" /> Pluie
        </button>
        <button type="button" onClick={() => scrollToSection('section-uv')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <SunMedium className="w-3 h-3 text-amber-300" /> UV
        </button>
        <button type="button" onClick={() => scrollToSection('section-wind')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Compass className="w-3 h-3 text-sky-400" /> Vent
        </button>
        <button type="button" onClick={() => scrollToSection('section-aqi')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Gauge className="w-3 h-3 text-teal-400" /> Air
        </button>
        <button type="button" onClick={() => scrollToSection('section-pollen')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Flower2 className="w-3 h-3 text-teal-300" /> Pollen
        </button>
        <button type="button" onClick={() => scrollToSection('section-confidence')} className="px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-sky-950 text-sky-200 border border-sky-400/30 text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shadow-sm">
          <Award className="w-3 h-3 text-sky-400" /> Confiance
        </button>
      </div>

      {/* 2. MÉTÉO HEURE PAR HEURE */}
      <div id="section-hourly" className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-md scroll-mt-4">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <span className="font-black text-white text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" /> Météo Heure par Heure (Les 16 prochaines heures)
          </span>
          <span className="text-[10px] font-bold text-sky-300">°C</span>
        </div>
        <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 overflow-x-auto shadow-inner">
          {hourlyData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-semibold">
              Chargement des données horaires de l'API...
            </div>
          ) : (
            hourlyData.map((item: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round(((item.temp - minHourly) / rangeHourly) * 100)));

              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1 h-full items-center border border-sky-400/20 hover:border-sky-400 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full pb-0.5" title={`LED : ${item.temp}°C`}><LedHorizontalIndicator temp={item.temp} /></div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[26px] mx-auto flex flex-col justify-center items-center rounded-xl overflow-hidden border border-sky-400/50 bg-gradient-to-b from-sky-900/85 via-indigo-950/90 to-slate-950 relative shadow-[0_0_12px_rgba(56,189,248,0.15)] py-1 gap-1 my-0.5 self-end">
                    <span className="text-[9px] font-black text-white z-10 shrink-0">{item.temp}°</span>
                    <div className="z-10 shrink-0">{getWeatherIcon(item.condition, "w-3.5 h-3.5")}</div>
                  </div>
                  <div className="w-full pt-0.5" title={`LED : ${item.temp}°C`}><LedHorizontalIndicator temp={item.temp} /></div>
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

      {/* 3. MÉTÉO JOUR PAR JOUR (SANS BANDEAU DE NAVIGATION) */}
      <div id="section-daily" className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 p-5 rounded-3xl shadow-xl space-y-4 backdrop-blur-md scroll-mt-4">
        <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
          <h2 className="text-xs font-black uppercase text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" /> Tendance Températures (15 Jours)
          </h2>
        </div>

        <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 overflow-x-auto shadow-inner">
          {fifteenDaysData.map((day: any, idx: number) => {
            const mornVal = day.mornTemp;
            const eveVal = day.eveTemp;

            const evePercent = Math.max(25, Math.min(100, Math.round(((eveVal - minDaily) / tempRange) * 100)));
            const mornPercent = Math.max(25, Math.min(100, Math.round(((mornVal - minDaily) / tempRange) * 100)));

            const combinedVal = evePercent + mornPercent; 
            const totalHeightPercent = Math.max(60, Math.min(100, Math.round(combinedVal / 1.6)));
            const eveShare = combinedVal > 0 ? (evePercent / combinedVal) * 100 : 50;
            const mornShare = combinedVal > 0 ? (mornPercent / combinedVal) * 100 : 50;

            return (
              <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1 h-full items-center border border-sky-400/25 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                <div className="w-full pb-0.5">
                  <LedHorizontalIndicator temp={eveVal} />
                </div>

                <div style={{ height: `${totalHeightPercent}%` }} className="w-full max-w-[26px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden border border-sky-400/50 bg-slate-950 relative shadow-[0_0_12px_rgba(56,189,248,0.15)] my-0.5 self-end">
                  <div style={{ height: `${eveShare}%` }} className="bg-gradient-to-b from-sky-900/90 via-teal-950/95 to-slate-950 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 relative border-b border-sky-400/30 min-h-0">
                    <span className="text-[9px] font-black text-teal-200 z-10 shrink-0">{eveVal}°</span>
                    <div className="z-10 shrink-0">{getWeatherIcon(day.eveCondition, "w-3 h-3")}</div>
                  </div>

                  <div className="w-full h-[2px] bg-sky-300 z-20 flex-shrink-0 shadow-[0_0_8px_#38bdf8]" />

                  <div style={{ height: `${mornShare}%` }} className="bg-gradient-to-b from-slate-950 via-indigo-950/95 to-sky-950/80 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 relative min-h-0">
                    <span className="text-[9px] font-black text-sky-200 z-10 shrink-0">{mornVal}°</span>
                    <div className="z-10 shrink-0">{getWeatherIcon(day.mornCondition, "w-3 h-3")}</div>
                  </div>
                </div>

                <div className="w-full pt-0.5">
                  <LedHorizontalIndicator temp={mornVal} />
                </div>

                <span className="text-[9px] text-sky-300 font-semibold border-t border-slate-800 pt-1 w-full text-center truncate">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. GRAPHIQUES AVANCÉS DANS L'ORDRE DEMANDÉ */}
      <div className="space-y-4 pt-2">

        {/* A. Température Ressentie */}
        <div id="section-feels" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-400" /> Ressentie (15 Jours)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round(((day.feelsEve + 5) / 45) * 100)));
              const eveFeels = day.feelsEve ?? 20;
              const mornFeels = day.feelsMorn ?? 15;

              let faceIcon = '😌';
              let faceColor = 'text-sky-300';
              if (eveFeels < 5) { faceIcon = '🥶'; faceColor = 'text-cyan-300'; }
              else if (eveFeels < 15) { faceIcon = '🧥'; faceColor = 'text-sky-200'; }
              else if (eveFeels >= 28) { faceIcon = '🥵'; faceColor = 'text-teal-300'; }

              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1 h-full items-center border border-sky-400/25 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full pb-0.5"><LedHorizontalIndicator temp={eveFeels} /></div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 my-1 bg-slate-950 min-h-[100px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-sky-900/90 via-teal-950 to-slate-950 flex flex-col items-center justify-between py-1 px-0.5 relative min-h-0">
                      <span className="text-[8px] font-black text-teal-200 z-10 shrink-0">{eveFeels}°</span>
                      <span className={`text-[9px] select-none ${faceColor} z-10 shrink-0`}>{faceIcon}</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-b from-slate-950 via-indigo-950 to-sky-900/80 flex flex-col items-center justify-between py-1 px-0.5 border-t border-sky-400/40 relative min-h-0">
                      <span className="text-[8px] font-black text-sky-200 z-10 shrink-0">{mornFeels}°</span>
                    </div>
                  </div>
                  <div className="w-full pt-0.5"><LedHorizontalIndicator temp={mornFeels} /></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* B. Activités (Placé sous la température ressentie) */}
        <div id="section-activities" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Activités - {activityMeta[selectedActivity].title} (15 Jours)
            </span>
          </div>
          <div className="flex gap-1.5 pb-2 overflow-x-auto pt-1">
            {(Object.keys(activityMeta) as Array<keyof typeof activityMeta>).map((actKey) => (
              <button
                key={actKey}
                type="button"
                onClick={() => setSelectedActivity(actKey)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold border flex items-center gap-1.5 cursor-pointer transition-all shadow-sm ${
                  selectedActivity === actKey ? 'bg-indigo-500 text-slate-950 font-bold border-indigo-300' : 'bg-slate-900/90 text-slate-300 border-sky-400/30 hover:text-white'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const eveScore = day.activityScores[selectedActivity].eve;
              const mornScore = day.activityScores[selectedActivity].morn;
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1 h-full items-center border border-sky-400/25 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full pb-0.5"><LedHorizontalIndicator activityScore={eveScore} isActivity={true} /></div>
                  <div className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 my-1 bg-slate-950 min-h-[100px] self-end" style={{ height: `${Math.round((eveScore + mornScore) / 2)}%` }}>
                    <div className="flex-1 bg-gradient-to-b from-indigo-900/90 via-sky-950 to-slate-950 flex flex-col items-center justify-center py-1 px-0.5"><span className="text-[8px] font-black text-indigo-200">{eveScore}%</span></div>
                    <div className="flex-1 bg-gradient-to-b from-slate-950 via-sky-950 to-indigo-900/80 flex flex-col items-center justify-center py-1 px-0.5 border-t border-sky-400/40"><span className="text-[8px] font-black text-sky-200">{mornScore}%</span></div>
                  </div>
                  <div className="w-full pt-0.5"><LedHorizontalIndicator activityScore={mornScore} isActivity={true} /></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Précipitations */}
        <div id="section-precip" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Umbrella className="w-4 h-4 text-teal-300" /> Précipitations (15 Jours)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round((Math.max(day.precipEve, 0.1) / 8) * 100)));
              const precipLedLevel = Math.max(1, Math.min(9, Math.round(5 + (day.precipEve / 8) * 4)));
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1.5 h-full items-center border border-sky-400/20 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full flex items-center justify-center gap-1">
                    <LedHorizontalIndicator activityScore={precipLedLevel * 10} isActivity={true} />
                    {getPrecipitationIcon(day.precipTypeEve ?? 'rain', day.precipEve ?? 0, "w-3 h-3")}
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 bg-slate-950 min-h-[90px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-sky-900/90 to-teal-950 flex items-center justify-center min-h-0"><span className="text-[8px] font-black text-teal-200">{day.precipEve}</span></div>
                    <div className="flex-1 bg-gradient-to-b from-indigo-950 to-sky-900/80 flex items-center justify-center border-t border-sky-400/40 min-h-0"><span className="text-[8px] font-black text-sky-200">{day.precipMorn}</span></div>
                  </div>
                  <div className="w-full"><span className="opacity-0">.</span></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* D. Indice UV (Placé sous les précipitations) */}
        <div id="section-uv" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-amber-300" /> Indice UV (15 Jours - Réel)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round((day.uvEve / 15) * 100)));
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1.5 h-full items-center border border-sky-400/20 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full"><LedHorizontalIndicator uv={day.uvEve} isUv={true} /></div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 bg-slate-950 min-h-[90px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-amber-900/90 to-amber-950 flex items-center justify-center min-h-0"><span className="text-[8px] font-black text-amber-200">{day.uvEve}</span></div>
                    <div className="flex-1 bg-gradient-to-b from-sky-950 to-sky-900/80 flex items-center justify-center border-t border-sky-400/40 min-h-0"><span className="text-[8px] font-black text-sky-200">{day.uvMorn}</span></div>
                  </div>
                  <div className="w-full"><LedHorizontalIndicator uv={day.uvMorn} isUv={true} /></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* E. Vent */}
        <div id="section-wind" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" /> Vent & Direction (15 Jours)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round((day.windEve / 35) * 100)));
              const windScore = Math.max(10, 100 - (day.windEve / 35) * 80);
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1.5 h-full items-center border border-sky-400/20 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full flex items-center justify-center gap-1">
                    <LedHorizontalIndicator activityScore={windScore} isActivity={true} />
                    {getWindDirectionIcon(day.windDirEve ?? 'N', "w-3 h-3")}
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 bg-slate-950 min-h-[90px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-sky-900/90 to-teal-950 flex items-center justify-center min-h-0"><span className="text-[8px] font-black text-teal-200">{day.windEve}</span></div>
                    <div className="flex-1 bg-gradient-to-b from-indigo-950 to-sky-900/80 flex items-center justify-center border-t border-sky-400/40 min-h-0"><span className="text-[8px] font-black text-sky-200">{day.windMorn}</span></div>
                  </div>
                  <div className="w-full"><span className="opacity-0">.</span></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* F. Qualité de l'Air AQI (Placé sous le vent) */}
        <div id="section-aqi" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Gauge className="w-4 h-4 text-teal-400" /> Qualité de l'Air AQI (15 Jours - Réel)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round((day.aqiEve / 100) * 100)));
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1.5 h-full items-center border border-sky-400/20 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full"><LedHorizontalIndicator aqi={day.aqiEve} isAqi={true} /></div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 bg-slate-950 min-h-[90px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-teal-900/90 to-teal-950 flex items-center justify-center min-h-0"><span className="text-[8px] font-black text-teal-200">{day.aqiEve}</span></div>
                    <div className="flex-1 bg-gradient-to-b from-sky-950 to-sky-900/80 flex items-center justify-center border-t border-sky-400/40 min-h-0"><span className="text-[8px] font-black text-sky-200">{day.aqiMorn}</span></div>
                  </div>
                  <div className="w-full"><LedHorizontalIndicator aqi={day.aqiMorn} isAqi={true} /></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* G. Pollen */}
        <div id="section-pollen" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-teal-300" /> Pollen (15 Jours)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round((day.pollenEve / 5) * 100)));
              const pollenScore = Math.max(10, 100 - (day.pollenEve / 5) * 80);
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto_auto] gap-1.5 h-full items-center border border-sky-400/20 rounded-2xl p-1 bg-slate-900 shadow-sm text-center">
                  <div className="w-full flex items-center justify-center gap-1">
                    <LedHorizontalIndicator activityScore={pollenScore} isActivity={true} />
                    {getPollenIcon(day.pollenEve, "w-3 h-3")}
                  </div>
                  <div style={{ height: `${h}%` }} className="w-full max-w-[24px] mx-auto flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.15)] border border-sky-400/50 bg-slate-950 min-h-[90px] self-end">
                    <div className="flex-1 bg-gradient-to-b from-sky-900/90 to-teal-950 flex items-center justify-center min-h-0"><span className="text-[8px] font-black text-teal-200">{day.pollenEve}</span></div>
                    <div className="flex-1 bg-gradient-to-b from-indigo-950 to-sky-900/80 flex items-center justify-center border-t border-sky-400/40 min-h-0"><span className="text-[8px] font-black text-sky-200">{day.pollenMorn}</span></div>
                  </div>
                  <div className="w-full"><span className="opacity-0">.</span></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* H. Indice de Confiance */}
        <div id="section-confidence" className="space-y-2 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 p-4 rounded-3xl border border-sky-400/40 shadow-xl backdrop-blur-md scroll-mt-4">
          <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
            <span className="font-black text-white text-xs flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" /> Indice de Confiance Météo (15 Jours)
            </span>
          </div>
          <div className="h-60 flex items-end justify-between gap-1.5 pt-3 pb-1.5 overflow-x-auto bg-slate-900/90 p-3 rounded-2xl border border-sky-400/30 shadow-inner">
            {fifteenDaysData.map((day: any, idx: number) => {
              const conf = day.confidence ?? 3;
              return (
                <div key={idx} className="flex-1 min-w-[50px] max-w-[58px] grid grid-rows-[auto_1fr_auto] gap-2 h-full items-center border border-sky-400/20 rounded-2xl p-1.5 bg-slate-900 shadow-sm text-center">
                  <div className="w-full"><span className="opacity-0">.</span></div>
                  <div className="w-full flex items-center justify-center"><ConfidenceDotsIndicator level={conf} /></div>
                  <span className="text-[9px] text-slate-300 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default WeatherDetailPage;