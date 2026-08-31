import React, { useState, useEffect, useMemo } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Settings, Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Trophy, Gauge, SunMedium,
  Thermometer, Umbrella, Compass, Flower2, Clock, X, Plus, Trash2, ShieldCheck, Info
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

// --- CONFIGURATION DES LED : BLEU (Froid) -> VERT (Doux) -> ORANGE (Chaud) -> ROUGE (Canicule) ---
const LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-red-700 shadow-[0_0_8px_#b91c1c]', borderClass: 'border-red-700/30' },       // Rouge foncé (> 35°C)
  8: { bars: 2, colorClass: 'bg-red-500 shadow-[0_0_8px_#ef4444]', borderClass: 'border-red-500/30' },       // Rouge moyen (32°C - 35°C)
  7: { bars: 1, colorClass: 'bg-orange-600 shadow-[0_0_8px_#ea580c]', borderClass: 'border-orange-600/30' }, // Orange foncé (28°C - 31°C)
  6: { bars: 3, colorClass: 'bg-orange-400 shadow-[0_0_8px_#fb923c]', borderClass: 'border-orange-400/30' }, // Orange clair (27°C - 28°C)
  5: { bars: 2, colorClass: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' }, // Vert moyen (22°C - 26°C)
  4: { bars: 1, colorClass: 'bg-emerald-300 shadow-[0_0_8px_#6ee7b7]', borderClass: 'border-emerald-300/30' }, // Vert clair (17°C - 21°C -> 19°C)
  3: { bars: 3, colorClass: 'bg-blue-700 shadow-[0_0_8px_#1d4ed8]', borderClass: 'border-blue-700/30' },       // Bleu foncé (12°C - 16°C)
  2: { bars: 2, colorClass: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]', borderClass: 'border-blue-500/30' },       // Bleu moyen (5°C - 11°C)
  1: { bars: 1, colorClass: 'bg-blue-900 shadow-[0_0_8px_#1e3a8a]', borderClass: 'border-blue-900/30' },       // Bleu très foncé (< 5°C)
};

// --- GESTION DES TRANCHES DE TEMPÉRATURE EXACTES ---
const getLedLevelForTemp = (temp: number): number => {
  if (temp < 5) return 1;    // Niveau 1 : < 5°C (Bleu foncé)
  if (temp <= 11) return 2;  // Niveau 2 : 5°C à 11°C (Bleu moyen)
  if (temp <= 16) return 3;  // Niveau 3 : 12°C à 16°C (Bleu foncé)
  if (temp <= 21) return 4;  // Niveau 4 : 17°C à 21°C (Vert clair - 19°C tombe ici)
  if (temp <= 26) return 5;  // Niveau 5 : 22°C à 26°C (Vert moyen)
  if (temp <= 28) return 6;  // Niveau 6 : 27°C à 28°C (Orange clair)
  if (temp <= 31) return 7;  // Niveau 7 : 29°C à 31°C (Orange foncé)
  if (temp <= 35) return 8;  // Niveau 8 : 32°C à 35°C (Rouge moyen)
  return 9;                  // Niveau 9 : > 35°C (Rouge foncé)
};

const LedLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.max(1, Math.min(9, Math.round(level)));
  const config = LEVEL_CONFIG[safeLevel];

  return (
    <div className={`flex flex-col gap-0.5 p-0.5 bg-black/60 rounded border ${config.borderClass} backdrop-blur-xs w-6 shadow-md`}>
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

const getWeatherIcon = (condition: string = '', sizeClass: string = "w-4 h-4") => {
  const c = condition.toLowerCase();
  if (c.includes('pluie') || c.includes('rain') || c.includes('averses')) {
    return <CloudRain className={`${sizeClass} text-teal-200 drop-shadow-md`} />;
  }
  if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
    return <Cloud className={`${sizeClass} text-white drop-shadow-md`} />;
  }
  if (c.includes('soleil') || c.includes('sun') || c.includes('clair') || c.includes('ensoleillé')) {
    return <Sun className={`${sizeClass} text-emerald-300 drop-shadow-md`} />;
  }
  return <CloudSun className={`${sizeClass} text-teal-100 drop-shadow-md`} />;
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
  
  // États pour l'autocomplétion des villes
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
        if (data.results) {
          setSuggestions(data.results);
        } else {
          setSuggestions([]);
        }
      } catch (e) {
        console.error(e);
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
    if (rawHourlyData.length > 0) return rawHourlyData;
    const now = new Date();
    const currentHour = now.getHours();
    return Array.from({ length: 17 }).map((_, index) => {
      const targetHour = (currentHour + index) % 24;
      return {
        time: `${targetHour.toString().padStart(2, '0')}:00`,
        temp: Number((currentWeather as any)?.temperature ?? 20),
        condition: currentWeather?.condition || 'Ensoleillé'
      };
    });
  }, [rawHourlyData, currentWeather]);

  const currentTemp = Number((currentWeather as any)?.temperature ?? 20);
  const currentWind = Number(currentWeather?.windSpeed ?? 10);

  // GESTION DE LA PRÉVENTION DOUCE (SANS LE MOT "ALERTE")
  const activePrevention = useMemo(() => {
    if (currentTemp > 32) {
      return { 
        type: 'Prévention Chaleur', 
        color: 'bg-amber-500/10 border-amber-500/30 text-amber-300', 
        icon: <Info className="w-4 h-4 text-amber-400" />, 
        details: `Température élevée (${currentTemp}°C > 32°C). Pensez à vous hydrater.` 
      };
    }
    if (currentTemp < 4) {
      return { 
        type: 'Prévention Froid', 
        color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300', 
        icon: <Info className="w-4 h-4 text-cyan-400" />, 
        details: `Température basse (${currentTemp}°C < 4°C). Couvrez-vous bien.` 
      };
    }
    if (currentWind > 45) {
      return { 
        type: 'Prévention Vent', 
        color: 'bg-sky-500/10 border-sky-500/30 text-sky-300', 
        icon: <Info className="w-4 h-4 text-sky-400" />, 
        details: `Vent mesuré à ${currentWind} km/h (> 45 km/h). Soyez prudents en extérieur.` 
      };
    }
    return null;
  }, [currentTemp, currentWind]);

  const tenDaysData = useMemo(() => {
    if (forecastData.length > 0) return forecastData;
    return Array.from({ length: 7 }).map((_, index) => ({
      day: index === 0 ? "Aujourd'hui" : `J-${index + 1}`,
      tempMin: 14,
      tempMax: 24,
      condition: 'Ensoleillé',
      mornTemp: 16,
      eveTemp: 23,
      mornCondition: 'Ensoleillé',
      eveCondition: 'Ensoleillé',
      aqiMorn: 30,
      aqiEve: 45,
      uvMorn: 2,
      uvEve: 5,
      feelsMorn: 15,
      feelsEve: 24,
      precipMorn: 0,
      precipEve: 0.5,
      windMorn: 10,
      windEve: 14,
      pollenMorn: 2,
      pollenEve: 3,
      activityScores: {
        fitness: { morn: 80, eve: 70 },
        tennis: { morn: 85, eve: 60 },
        cycling: { morn: 75, eve: 65 },
        forestWalk: { morn: 90, eve: 80 }
      }
    }));
  }, [forecastData]);

  const maxDaily = Math.max(...tenDaysData.map((d: any) => Math.max(d.mornTemp ?? d.tempMax ?? 30, d.eveTemp ?? d.tempMax ?? 30)), 30);
  const minDaily = Math.min(...tenDaysData.map((d: any) => Math.min(d.mornTemp ?? d.tempMin ?? 10, d.eveTemp ?? d.tempMin ?? 10)), 5);
  const tempRange = Math.max(maxDaily - minDaily, 1);

  const hourlyTemps = hourlyData.map((h: any) => h.temp);
  const maxHourly = hourlyTemps.length > 0 ? Math.max(...hourlyTemps) : 30;
  const minHourly = hourlyTemps.length > 0 ? Math.min(...hourlyTemps) : 0;
  const rangeHourly = Math.max(maxHourly - minHourly, 1);

  const activityMeta = {
    fitness: { title: 'Fitness', icon: <Dumbbell className="w-4 h-4 text-teal-400" /> },
    tennis: { title: 'Tennis', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    cycling: { title: 'Cyclisme', icon: <Bike className="w-4 h-4 text-teal-400" /> },
    forestWalk: { title: 'Forêt', icon: <Trees className="w-4 h-4 text-emerald-400" /> },
  };

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Chargement des données météo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-200 w-full max-w-full overflow-x-hidden pb-10 px-2 relative">
      
      {/* 1. En-tête Météo & Liste des villes */}
      <div className="bg-[#16182a] border border-teal-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex-shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city || 'Ville'}</h1>
              <p className="text-[10px] text-teal-300/70 capitalize truncate">{translateCondition(currentWeather.condition || '', language)}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCitySettings(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-300 border border-teal-400/30 font-bold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une ville</span>
          </button>
        </div>

        {cities.length > 0 && (
          <div className="flex space-x-1.5 overflow-x-auto scrollbar-none py-1">
            {cities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 rounded-lg border font-bold text-[10px] transition-all flex-shrink-0 cursor-pointer ${
                  activeCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-teal-600 text-white border-teal-400'
                    : 'bg-[#0d0f17] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION PRÉVENTION OU CONDITIONS STABLES */}
      {activePrevention ? (
        <div className={`border rounded-2xl p-3.5 shadow-xl flex items-start space-x-3 animate-fade-in ${activePrevention.color}`}>
          <div className="p-2 rounded-xl bg-black/30 border border-current/20 flex-shrink-0 mt-0.5">
            {activePrevention.icon}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> 
                {activePrevention.type}
              </h2>
              <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-black/40 border border-current/30 uppercase">
                Conseil
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
              {activePrevention.details}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#151824]/60 border border-slate-800 rounded-2xl p-3 shadow-lg flex items-center space-x-3 text-slate-400">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Conditions stables
            </h2>
            <p className="text-[9px] text-slate-500 truncate">
              Aucun seuil de vigilance particulier n'est atteint.
            </p>
          </div>
        </div>
      )}

      {/* 2. MÉTÉO HEURE PAR HEURE */}
      <div className="space-y-2 bg-[#151824] p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-400" /> Météo Heure par Heure (Les 16 prochaines heures)
          </span>
          <span className="text-[9px] text-slate-400">°C</span>
        </div>
        <div className="h-48 flex items-end justify-between gap-2.5 pt-4 pb-2 bg-[#090d16] p-3.5 rounded-xl border border-slate-800/80 overflow-x-auto">
          {hourlyData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
              Chargement des données horaires de l'API...
            </div>
          ) : (
            hourlyData.map((item: any, idx: number) => {
              const h = Math.max(35, Math.min(100, Math.round(((item.temp - minHourly) / rangeHourly) * 100)));
              const hourlyLedLevel = getLedLevelForTemp(item.temp);

              return (
                <div 
                  key={idx} 
                  className="flex-1 min-w-[65px] flex flex-col items-center gap-2 h-full justify-end border border-teal-500/20 hover:border-teal-400/50 rounded-2xl p-2 bg-gradient-to-b from-[#0f172a]/90 to-[#090d16] shadow-[0_8px_20px_rgb(0,0,0,0.4)] backdrop-blur-md transition-all duration-300 group"
                >
                  <div className="h-5 flex items-center justify-center">
                    <LedLevelIndicator level={hourlyLedLevel} />
                  </div>

                  <div 
                    style={{ height: `${h}%` }} 
                    className="w-full max-w-[34px] flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.3)] border border-teal-300/30 bg-slate-950 relative group-hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] transition-all"
                  >
                    <div className="flex-1 bg-gradient-to-t from-emerald-500 via-teal-400 to-indigo-600 flex flex-col items-center justify-between py-2 px-0.5 relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                      <span className="text-[10px] font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] z-10">
                        {item.temp}°
                      </span>
                      <div className="z-10">{getWeatherIcon(item.condition, "w-4 h-4")}</div>
                    </div>
                  </div>

                  <span className="text-[9px] text-teal-200/80 font-bold border-t border-teal-900/40 pt-1 w-full text-center truncate">
                    {item.time}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Indicateurs rapides */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
          <Droplets className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 text-[9px] block">{t.humidity}</span>
            <span className="text-xs font-extrabold text-white">{currentWeather.humidity ?? 0}%</span>
          </div>
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
          <Wind className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 text-[9px] block">{t.wind}</span>
            <span className="text-xs font-extrabold text-white">{currentWeather.windSpeed ?? 0} km/h</span>
          </div>
        </div>
      </div>

      {/* Onglets de catégorie */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#12141f] p-1.5 rounded-xl border border-slate-800">
        <button type="button" onClick={() => setActiveTab('temp')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'temp' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Calendar className="w-3.5 h-3.5" /><span className="truncate">Températures</span>
        </button>
        <button type="button" onClick={() => setActiveTab('aqi')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'aqi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Gauge className="w-3.5 h-3.5" /><span className="truncate">Air (AQI)</span>
        </button>
        <button type="button" onClick={() => setActiveTab('uv')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'uv' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <SunMedium className="w-3.5 h-3.5" /><span className="truncate">Indice UV</span>
        </button>
        <button type="button" onClick={() => setActiveTab('activities')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'activities' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Activity className="w-3.5 h-3.5" /><span className="truncate">Activités</span>
        </button>
      </div>

      {/* 4. DIAGRAMME PRINCIPAL */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-bold uppercase text-teal-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 
            {activeTab === 'temp' && "Tendance Températures (Unifié Matin & Soir)"}
            {activeTab === 'aqi' && "Qualité de l'Air AQI (Unifié Matin & Soir)"}
            {activeTab === 'uv' && "Évolution Indice UV (Unifié Matin & Soir)"}
            {activeTab === 'activities' && `Scores - ${activityMeta[selectedActivity].title} (Unifié Matin & Soir)`}
          </h2>
          
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block shadow-sm"></span>
              <span className="text-white">Matin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block shadow-sm"></span>
              <span className="text-slate-300">Soir/Apm</span>
            </div>
          </div>
        </div>

        {activeTab === 'activities' && (
          <div className="flex gap-1.5 pb-1 overflow-x-auto">
            {(Object.keys(activityMeta) as Array<keyof typeof activityMeta>).map((actKey) => (
              <button
                key={actKey}
                type="button"
                onClick={() => setSelectedActivity(actKey)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                  selectedActivity === actKey ? 'bg-teal-500/25 text-teal-300 border-teal-500 shadow-sm' : 'bg-[#0d0f17] text-slate-400 border-slate-800'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-52 flex items-end justify-between gap-2.5 pt-4 pb-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800 overflow-x-auto">
          {tenDaysData.map((day: any, idx: number) => {
            let evePercent = 50;
            let mornPercent = 50;
            let ledLevel = 5;

            const mornVal = day.mornTemp ?? day.tempMin ?? 15;
            const eveVal = day.eveTemp ?? day.tempMax ?? 25;

            if (activeTab === 'temp') {
              evePercent = Math.max(20, Math.min(100, Math.round(((eveVal - minDaily) / tempRange) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round(((mornVal - minDaily) / tempRange) * 100)));
              ledLevel = getLedLevelForTemp(eveVal);
            } else if (activeTab === 'aqi') {
              evePercent = Math.max(20, Math.min(100, Math.round((day.aqiEve / 120) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round((day.aqiMorn / 120) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round(10 - (day.aqiEve / 120) * 9)));
            } else if (activeTab === 'uv') {
              evePercent = Math.max(20, Math.min(100, Math.round((day.uvEve / 10) * 100)));
              mornPercent = Math.max(20, Math.min(100, Math.round((day.uvMorn / 10) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round(10 - (day.uvEve / 10) * 9)));
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
              <div key={idx} className="flex-1 min-w-[70px] flex flex-col items-center gap-2 h-full justify-end border border-teal-500/15 rounded-xl p-1.5 bg-[#121420]/40 hover:bg-[#16192a] transition-all">
                <div className="h-4 flex items-center justify-center animate-fade-in">
                  <LedLevelIndicator level={ledLevel} />
                </div>

                <div 
                  style={{ height: `${totalHeightPercent}%` }} 
                  className="w-full max-w-[36px] flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.6)] border border-white/25 bg-slate-950/80 backdrop-blur-sm relative group transition-all duration-300"
                >
                  <div 
                    style={{ height: `${eveShare}%` }} 
                    className="bg-gradient-to-t from-amber-600 via-orange-500 to-yellow-400 flex flex-col items-center justify-center py-1 px-0.5 relative overflow-hidden transition-all duration-300"
                  >
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                    <span className="text-[9.5px] font-black text-slate-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] z-10">
                      {activeTab === 'temp' && `${eveVal}°`}
                      {activeTab === 'aqi' && day.aqiEve}
                      {activeTab === 'uv' && day.uvEve}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].eve}%`}
                    </span>
                    {activeTab === 'temp' && <div className="z-10">{getWeatherIcon(day.eveCondition, "w-3.5 h-3.5")}</div>}
                  </div>

                  <div className="w-full h-[1.5px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] z-20 flex-shrink-0" />

                  <div 
                    style={{ height: `${mornShare}%` }} 
                    className="bg-gradient-to-t from-blue-950 via-indigo-700 to-blue-500 flex flex-col items-center justify-center py-1 px-0.5 relative overflow-hidden transition-all duration-300"
                  >
                    {activeTab === 'temp' && <div className="z-10">{getWeatherIcon(day.mornCondition, "w-3.5 h-3.5")}</div>}
                    <span className="text-[9.5px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">
                      {activeTab === 'temp' && `${mornVal}°`}
                      {activeTab === 'aqi' && day.aqiMorn}
                      {activeTab === 'uv' && day.uvMorn}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].morn}%`}
                    </span>
                  </div>
                </div>

                <span className="text-[9px] text-slate-200 font-extrabold border-t border-slate-800/80 pt-1 w-full text-center truncate">
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. DÉTAILS AVANCÉS */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-[#181b28] hover:bg-[#1c1f30] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2 text-teal-400 font-bold text-[11px] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span className="text-white">Graphiques Avancés (Temp. Ressentie, Précipitations, Vent, Pollen)</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-teal-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 border-t border-slate-800 space-y-6 animate-fade-in">
            
            {/* Ressentie */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-orange-400" /> Ressentie (Matin & Soir)
                </span>
                <div className="flex items-center gap-2.5 text-[9px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-800 inline-block"></span> Matin</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-400 inline-block"></span> Soir/Apm</span>
                </div>
              </div>
              <div className="h-52 flex items-end justify-between gap-2.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round(((day.feelsEve + 5) / 45) * 100)));
                  return (
                    <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1 h-full justify-end border border-teal-500/15 rounded-lg p-1 bg-[#121420]/40">
                      <div className="h-4 flex items-center justify-center">
                        <LedLevelIndicator level={getLedLevelForTemp(day.feelsEve)} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[32px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-orange-600 to-amber-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-slate-950">{day.feelsEve}°</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-t from-amber-950 to-amber-700 flex items-center justify-center border-t border-white/40">
                          <span className="text-[8.5px] font-black text-white">{day.feelsMorn}°</span>
                        </div>
                      </div>
                      <span className="text-[8.5px] text-slate-300 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Précipitations */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Umbrella className="w-4 h-4 text-teal-400" /> Précipitations (Matin & Soir)
                </span>
                <div className="flex items-center gap-2.5 text-[9px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-900 inline-block"></span> Matin</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span> Soir/Apm</span>
                </div>
              </div>
              <div className="h-52 flex items-end justify-between gap-2.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((Math.max(day.precipEve, 0.1) / 8) * 100)));
                  return (
                    <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1 h-full justify-end border border-teal-500/15 rounded-lg p-1 bg-[#121420]/40">
                      <div className="h-4 flex items-center justify-center">
                        <LedLevelIndicator level={Math.max(1, Math.min(9, Math.round(9 - (day.precipEve / 7) * 8)))} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[32px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-teal-500 to-emerald-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-slate-950">{day.precipEve}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-t from-emerald-950 to-emerald-800 flex items-center justify-center border-t border-white/40">
                          <span className="text-[8.5px] font-black text-white">{day.precipMorn}</span>
                        </div>
                      </div>
                      <span className="text-[8.5px] text-slate-300 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vent */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" /> Vent (Matin & Soir)
                </span>
                <div className="flex items-center gap-2.5 text-[9px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-900 inline-block"></span> Matin</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block"></span> Soir/Apm</span>
                </div>
              </div>
              <div className="h-52 flex items-end justify-between gap-2.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.windEve / 35) * 100)));
                  return (
                    <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1 h-full justify-end border border-teal-500/15 rounded-lg p-1 bg-[#121420]/40">
                      <div className="h-4 flex items-center justify-center">
                        <LedLevelIndicator level={Math.max(1, Math.min(9, Math.round(10 - (day.windEve / 35) * 9)))} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[32px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-sky-500 to-cyan-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-slate-950">{day.windEve}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-t from-blue-950 to-blue-700 flex items-center justify-center border-t border-white/40">
                          <span className="text-[8.5px] font-black text-white">{day.windMorn}</span>
                        </div>
                      </div>
                      <span className="text-[8.5px] text-slate-300 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pollen */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-yellow-400" /> Pollen (Matin & Soir)
                </span>
                <div className="flex items-center gap-2.5 text-[9px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-900 inline-block"></span> Matin</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-400 inline-block"></span> Soir/Apm</span>
                </div>
              </div>
              <div className="h-52 flex items-end justify-between gap-2.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day: any, idx: number) => {
                  const h = Math.max(35, Math.min(100, Math.round((day.pollenEve / 5) * 100)));
                  return (
                    <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1 h-full justify-end border border-teal-500/15 rounded-lg p-1 bg-[#121420]/40">
                      <div className="h-4 flex items-center justify-center">
                        <LedLevelIndicator level={Math.max(1, Math.min(9, Math.round(10 - (day.pollenEve / 5) * 8)))} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[32px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-rose-500 to-pink-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-slate-950">{day.pollenEve}</span>
                        </div>
                        <div className="flex-1 bg-gradient-to-t from-purple-950 to-purple-800 flex items-center justify-center border-t border-white/40">
                          <span className="text-[8.5px] font-black text-white">{day.pollenMorn}</span>
                        </div>
                      </div>
                      <span className="text-[8.5px] text-slate-300 font-bold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODALE DE GESTION DES VILLES */}
      {showCitySettings && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#16182a] border border-teal-500/50 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-400" /> Gestionnaire des Villes
              </h3>
              <button 
                type="button"
                onClick={() => setShowCitySettings(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#0d0f17] border border-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] text-slate-300 font-semibold block">Ajouter une ville (Recherche automatique)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tapez une ville (ex: Rome, Paris...)"
                  value={newCityInput}
                  onChange={(e) => setNewCityInput(e.target.value)}
                  className="flex-1 bg-[#0d0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  disabled={!newCityInput.trim() || suggestions.length === 0}
                  onClick={() => {
                    if (suggestions.length > 0) {
                      handleAddCityName(suggestions[0].name);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    !newCityInput.trim() || suggestions.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-md'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              {/* Suggestions d'autocomplétion en direct */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0d0f17] border border-teal-500/40 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddCityName(item.name)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-teal-500/20 hover:text-white flex items-center justify-between transition-colors border-b border-slate-800/50 last:border-none cursor-pointer"
                    >
                      <span className="font-bold">{item.name}</span>
                      <span className="text-[9px] text-teal-400/80">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] text-slate-300 font-semibold block">Villes enregistrées ({cities.length})</label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {cities.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic py-2 text-center">Aucune ville dans la liste.</p>
                ) : (
                  cities.map((city) => (
                    <div 
                      key={city} 
                      className="flex items-center justify-between bg-[#0d0f17] border border-slate-800 px-3 py-2 rounded-xl"
                    >
                      <span className="font-semibold text-white">{city}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemove(e, city)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                        title="Supprimer cette ville"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[9px]">Supprimer</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCitySettings(false)}
                className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WeatherDetailPage;