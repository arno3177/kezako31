import React, { useState, useEffect, useMemo } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Settings, Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Trophy, Gauge, SunMedium,
  Thermometer, Umbrella, Compass, Flower2, Clock, X, Plus, Trash2
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

// Echelle universelle des 9 niveaux LED
const LEVEL_CONFIG: Record<number, { bars: number; colorClass: string; borderClass: string }> = {
  9: { bars: 3, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  8: { bars: 2, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  7: { bars: 1, colorClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]', borderClass: 'border-emerald-500/30' },
  6: { bars: 3, colorClass: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]', borderClass: 'border-amber-500/30' },
  5: { bars: 2, colorClass: 'bg-orange-500 shadow-[0_0_8px_#f97316]', borderClass: 'border-orange-500/30' },
  4: { bars: 1, colorClass: 'bg-orange-500 shadow-[0_0_8px_#f97316]', borderClass: 'border-orange-500/30' },
  3: { bars: 1, colorClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]', borderClass: 'border-rose-500/30' },
  2: { bars: 2, colorClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]', borderClass: 'border-rose-500/30' },
  1: { bars: 3, colorClass: 'bg-red-600 shadow-[0_0_8px_#dc2626]', borderClass: 'border-red-600/30' },
};

// Indicateur LED 9 Niveaux (Sans libellé)
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

// Icônes Météo
const getWeatherIcon = (condition: string = '', sizeClass: string = "w-4 h-4") => {
  const c = condition.toLowerCase();
  if (c.includes('pluie') || c.includes('rain') || c.includes('averses')) {
    return <CloudRain className={`${sizeClass} text-sky-200 drop-shadow-md`} />;
  }
  if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
    return <Cloud className={`${sizeClass} text-white drop-shadow-md`} />;
  }
  if (c.includes('soleil') || c.includes('sun') || c.includes('clair') || c.includes('ensoleillé')) {
    return <Sun className={`${sizeClass} text-amber-300 drop-shadow-md`} />;
  }
  return <CloudSun className={`${sizeClass} text-sky-100 drop-shadow-md`} />;
};

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({
  currentWeather,
  citiesList = [],
  activeCity = '',
  unit = 'C',
  onSelectCity,
  onOpenSettings,
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

  const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    if (!cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCities([...cities, trimmed]);
      if (onAddCity) onAddCity(trimmed);
    }
    setNewCityInput('');
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
  const hourlyData = currentWeather?.hourly || [];

  const tenDaysData = useMemo(() => {
    return Array.from({ length: 10 }).map((_, index) => {
      const base = forecastData[index % forecastData.length] || {
        day: `J-${index + 1}`,
        tempMax: 24,
        tempMin: 14,
        condition: 'Ensoleillé'
      };
      const tMin = base.tempMin || 14;
      const tMax = base.tempMax || 24;

      return {
        ...base,
        dayLabel: index === 0 ? "Aujourd'hui" : `J ${index + 1}`,
        mornTemp: Math.round(tMin + 1),
        eveTemp: Math.round(tMax),
        
        mornCondition: index % 2 === 0 ? 'Ensoleillé' : 'Nuageux',
        eveCondition: index % 3 === 0 ? 'Pluie' : 'Ensoleillé',

        aqiMorn: Math.round(30 + (index * 3) % 45),
        aqiEve: Math.round(45 + (index * 4) % 65),

        uvMorn: Math.round(1 + (index % 3)),
        uvEve: Math.round(3 + (index % 6)),

        feelsMorn: Math.round(tMin),
        feelsEve: Math.round(tMax + 1),

        precipMorn: Number(((index * 1.2) % 4).toFixed(1)),
        precipEve: Number(((index * 1.8) % 6).toFixed(1)),

        windMorn: Math.round(10 + (index * 2) % 15),
        windEve: Math.round(15 + (index * 3) % 20),

        pollenMorn: Math.round(1 + (index * 2) % 3),
        pollenEve: Math.round(2 + (index * 2) % 4),

        pressureMorn: Math.round(1012 + (index % 4 - 2) * 3),
        pressureEve: Math.round(1010 + (index % 5 - 2) * 4),

        activityScores: {
          fitness: { 
            morn: Math.min(100, Math.max(40, Math.round(75 + Math.sin(index) * 20))), 
            eve: Math.min(100, Math.max(40, Math.round(85 + Math.cos(index) * 15))) 
          },
          tennis: { 
            morn: Math.min(100, Math.max(30, Math.round(70 + Math.cos(index) * 25))), 
            eve: Math.min(100, Math.max(30, Math.round(80 + Math.sin(index * 20)))) 
          },
          cycling: { 
            morn: Math.min(100, Math.max(40, Math.round(80 + Math.sin(index * 1.5) * 15))), 
            eve: Math.min(100, Math.max(40, Math.round(90 + Math.cos(index * 1.2) * 10))) 
          },
          forestWalk: { 
            morn: Math.min(100, Math.max(50, Math.round(85 + Math.cos(index * 0.8) * 10))), 
            eve: Math.min(100, Math.max(50, Math.round(95 + Math.sin(index * 0.9) * 5))) 
          },
        }
      };
    });
  }, [forecastData]);

  const maxDaily = Math.max(...tenDaysData.map(d => Math.max(d.mornTemp, d.eveTemp)), 30);
  const minDaily = Math.min(...tenDaysData.map(d => Math.min(d.mornTemp, d.eveTemp)), 5);
  const tempRange = Math.max(maxDaily - minDaily, 1);

  const hourlyTemps = hourlyData.map((h: any) => h.temp);
  const maxHourly = hourlyTemps.length > 0 ? Math.max(...hourlyTemps) : 30;
  const minHourly = hourlyTemps.length > 0 ? Math.min(...hourlyTemps) : 0;
  const rangeHourly = Math.max(maxHourly - minHourly, 1);

  const activityMeta = {
    fitness: { title: 'Fitness', icon: <Dumbbell className="w-4 h-4 text-indigo-400" /> },
    tennis: { title: 'Tennis', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    cycling: { title: 'Cyclisme', icon: <Bike className="w-4 h-4 text-sky-400" /> },
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
      <div className="bg-[#16182a] border border-indigo-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex-shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city || 'Ville'}</h1>
              <p className="text-[10px] text-sky-300/70 capitalize truncate">{translateCondition(currentWeather.condition || '', language)}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCitySettings(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-sky-300 border border-sky-400/30 font-bold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer shadow-md"
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
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-[#0d0f17] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Météo Heure par Heure (Bloc unique glossy harmonisé avec les jours) */}
      <div className="space-y-2 bg-[#151824] p-3.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> Météo & Température Heure par Heure
          </span>
          <span className="text-[9px] text-slate-400">°C</span>
        </div>
        <div className="h-72 flex items-end justify-between gap-2 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
          {hourlyData.map((item: any, idx: number) => {
            const h = Math.max(35, Math.min(100, Math.round(((item.temp - minHourly) / rangeHourly) * 100)));
            const hourlyLedLevel = Math.max(1, Math.min(9, Math.round((item.temp / 30) * 9)));

            return (
              <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-xl p-1 bg-[#121420]/40 hover:bg-[#16192a] transition-all">
                
                {/* Module LED Level */}
                <div className="h-5 flex items-center justify-center animate-fade-in">
                  <LedLevelIndicator level={hourlyLedLevel} />
                </div>

                {/* BARRE GLOSSY UNIQUE POUR L'HEURE */}
                <div 
                  style={{ height: `${h}%` }} 
                  className="w-full max-w-[32px] flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-white/20 bg-slate-950/80 backdrop-blur-sm relative group"
                >
                  <div className="flex-1 bg-gradient-to-t from-blue-700 via-sky-600 to-amber-400 flex flex-col items-center justify-between py-2 px-0.5 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                    
                    {/* Température en haut */}
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] z-10">
                      {item.temp}°
                    </span>
                    
                    {/* Icône au centre/bas de la barre */}
                    <div className="z-10">{getWeatherIcon(item.condition, "w-4 h-4")}</div>
                  </div>
                </div>

                {/* Heure */}
                <span className="text-[9px] text-slate-200 font-extrabold border-t border-slate-800/80 pt-1 w-full text-center truncate">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Indicateurs rapides */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
          <Droplets className="w-4 h-4 text-sky-400 flex-shrink-0" />
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
        <button type="button" onClick={() => setActiveTab('temp')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'temp' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Calendar className="w-3.5 h-3.5" /><span className="truncate">Températures</span>
        </button>
        <button type="button" onClick={() => setActiveTab('aqi')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'aqi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Gauge className="w-3.5 h-3.5" /><span className="truncate">Air (AQI)</span>
        </button>
        <button type="button" onClick={() => setActiveTab('uv')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'uv' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <SunMedium className="w-3.5 h-3.5" /><span className="truncate">Indice UV</span>
        </button>
        <button type="button" onClick={() => setActiveTab('activities')} className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${activeTab === 'activities' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
          <Activity className="w-3.5 h-3.5" /><span className="truncate">Activités</span>
        </button>
      </div>

      {/* 4. DIAGRAMME PRINCIPAL */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-bold uppercase text-indigo-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 
            {activeTab === 'temp' && "Tendance Températures (Unifié Matin & Soir)"}
            {activeTab === 'aqi' && "Qualité de l'Air AQI (Unifié Matin & Soir)"}
            {activeTab === 'uv' && "Évolution Indice UV (Unifié Matin & Soir)"}
            {activeTab === 'activities' && `Scores - ${activityMeta[selectedActivity].title} (Unifié Matin & Soir)`}
          </h2>
          <div className="flex items-center gap-3 text-[9px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Matin</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Soir/Apm</span>
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
                  selectedActivity === actKey ? 'bg-pink-500/25 text-pink-300 border-pink-500 shadow-sm' : 'bg-[#0d0f17] text-slate-400 border-slate-800'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
        )}

        {/* CONTENEUR PRINCIPAL */}
        <div className="h-68 flex items-end justify-between gap-2 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
          {tenDaysData.map((day, idx) => {
            let totalHeightPercent = 40;
            let ledLevel = 9;

            if (activeTab === 'temp') {
              totalHeightPercent = Math.max(35, Math.min(100, Math.round(((day.eveTemp - minDaily) / tempRange) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round((day.eveTemp / 30) * 9)));
            } else if (activeTab === 'aqi') {
              totalHeightPercent = Math.max(35, Math.min(100, Math.round((day.aqiEve / 120) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round(10 - (day.aqiEve / 120) * 9)));
            } else if (activeTab === 'uv') {
              totalHeightPercent = Math.max(35, Math.min(100, Math.round((day.uvEve / 10) * 100)));
              ledLevel = Math.max(1, Math.min(9, Math.round(10 - (day.uvEve / 10) * 9)));
            } else {
              const score = day.activityScores[selectedActivity].eve;
              totalHeightPercent = Math.max(35, Math.min(100, score));
              ledLevel = Math.max(1, Math.min(9, Math.round((score / 100) * 9)));
            }

            return (
              <div key={idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-xl p-1 bg-[#121420]/40 hover:bg-[#16192a] transition-all">
                
                {/* Module LED Level sans texte */}
                <div className="h-5 flex items-center justify-center animate-fade-in">
                  <LedLevelIndicator level={ledLevel} />
                </div>

                {/* BARRE GLOSSY */}
                <div 
                  style={{ height: `${totalHeightPercent}%` }} 
                  className="w-full max-w-[32px] flex flex-col justify-between rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-white/20 bg-slate-950/80 backdrop-blur-sm relative group"
                >
                  <div className="flex-1 bg-gradient-to-t from-pink-600 via-rose-500 to-amber-500 flex flex-col items-center justify-between py-1 px-0.5 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] z-10">
                      {activeTab === 'temp' && `${day.eveTemp}°`}
                      {activeTab === 'aqi' && day.aqiEve}
                      {activeTab === 'uv' && day.uvEve}
                      {activeTab === 'activities' && `${day.activityScores[selectedActivity].eve}%`}
                    </span>
                    {activeTab === 'temp' && <div className="z-10">{getWeatherIcon(day.eveCondition, "w-4 h-4")}</div>}
                  </div>

                  <div className="w-full h-[1px] bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.9)] z-20" />

                  <div className="h-1/2 bg-gradient-to-t from-blue-700 via-sky-600 to-cyan-400 flex flex-col items-center justify-between py-1 px-0.5 relative overflow-hidden">
                    {activeTab === 'temp' && <div className="z-10">{getWeatherIcon(day.mornCondition, "w-4 h-4")}</div>}
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] z-10">
                      {activeTab === 'temp' && `${day.mornTemp}°`}
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
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span className="text-white">Graphiques Avancés (Temp. Ressentie, Précipitations, Vent, Pollen)</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 border-t border-slate-800 space-y-6 animate-fade-in">
            
            {/* Ressentie */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-orange-400" /> Ressentie (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">°C</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const h = Math.max(30, Math.min(100, Math.round(((day.feelsEve + 5) / 45) * 100)));
                  const dev = Math.abs(day.feelsEve - 22);
                  const feelsLedLevel = Math.max(1, Math.min(9, Math.round(9 - dev / 3.5)));

                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="h-5 flex items-center justify-center">
                        <LedLevelIndicator level={feelsLedLevel} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[28px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-orange-600 to-rose-500 flex items-center justify-center">
                          <span className="text-[9px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.feelsEve}°</span>
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-blue-600 to-sky-400 flex items-center justify-center border-t border-black/20">
                          <span className="text-[9px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.feelsMorn}°</span>
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
                  <Umbrella className="w-4 h-4 text-sky-400" /> Précipitations (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">mm</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const h = Math.max(25, Math.min(100, Math.round((day.precipEve / 8) * 100)));
                  const precipLedLevel = Math.max(1, Math.min(9, Math.round(9 - (day.precipEve / 7) * 8)));

                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="h-5 flex items-center justify-center">
                        <LedLevelIndicator level={precipLedLevel} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[28px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-sky-600 to-cyan-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.precipEve}</span>
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-sky-900 to-sky-700 flex items-center justify-center border-t border-black/20">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.precipMorn}</span>
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
                <span className="text-[9px] text-slate-400">km/h</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const h = Math.max(25, Math.min(100, Math.round((day.windEve / 35) * 100)));
                  const windLedLevel = Math.max(1, Math.min(9, Math.round(10 - (day.windEve / 35) * 9)));

                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="h-5 flex items-center justify-center">
                        <LedLevelIndicator level={windLedLevel} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[28px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-teal-500 to-emerald-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.windEve}</span>
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-emerald-800 to-teal-700 flex items-center justify-center border-t border-black/20">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.windMorn}</span>
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
                <span className="text-[9px] text-slate-400">Niveau 1-5</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const h = Math.max(30, Math.min(100, Math.round((day.pollenEve / 5) * 100)));
                  const pollenLedLevel = Math.max(1, Math.min(9, Math.round(10 - (day.pollenEve / 5) * 8)));

                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="h-5 flex items-center justify-center">
                        <LedLevelIndicator level={pollenLedLevel} />
                      </div>
                      <div style={{ height: `${h}%` }} className="w-full max-w-[28px] flex flex-col justify-between rounded-t-lg overflow-hidden shadow-md">
                        <div className="flex-1 bg-gradient-to-t from-orange-500 to-amber-400 flex items-center justify-center">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.pollenEve}</span>
                        </div>
                        <div className="h-1/2 bg-gradient-to-t from-amber-700 to-yellow-600 flex items-center justify-center border-t border-black/20">
                          <span className="text-[8.5px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{day.pollenMorn}</span>
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
          <div className="bg-[#16182a] border border-indigo-500/50 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" /> Gestionnaire des Villes
              </h3>
              <button 
                type="button"
                onClick={() => setShowCitySettings(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#0d0f17] border border-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-300 font-semibold block">Ajouter une ville</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nom de la ville..."
                  value={newCityInput}
                  onChange={(e) => setNewCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(e);
                  }}
                  className="flex-1 bg-[#0d0f17] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={(e) => handleAdd(e)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
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