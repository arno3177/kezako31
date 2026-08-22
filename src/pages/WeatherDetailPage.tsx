import React, { useState, useEffect } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Settings, Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Trophy, Gauge, SunMedium, Sparkles, CheckCircle2, AlertTriangle,
  Thermometer, Umbrella, Compass, Flower2, Flame, Snowflake, Clock, X, Plus, Trash2
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

const getWeatherIcon = (condition: string = '') => {
  const c = condition.toLowerCase();
  if (c.includes('pluie') || c.includes('rain') || c.includes('averses')) {
    return <CloudRain className="w-3 h-3 text-sky-400" />;
  }
  if (c.includes('nuage') || c.includes('cloud') || c.includes('couvert')) {
    return <Cloud className="w-3 h-3 text-slate-300" />;
  }
  if (c.includes('soleil') || c.includes('sun') || c.includes('clair') || c.includes('ensoleillé')) {
    return <Sun className="w-3 h-3 text-amber-400" />;
  }
  return <CloudSun className="w-3 h-3 text-sky-300" />;
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

  // Gestion de la liste des villes avec déduplication stricte (insensible à la casse)
  const [cities, setCities] = useState<string[]>(() => {
    let initialList: string[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      }
    } catch (e) {
      console.error("Erreur de lecture du localStorage", e);
    }

    if (initialList.length === 0) {
      if (citiesList && citiesList.length > 0) {
        initialList = citiesList;
      } else {
        initialList = [currentLocalCity];
      }
    }

    // Déduplication pour s'assurer qu'il n'y a pas de doublons
    const uniqueMap = new Map<string, string>();
    initialList.forEach(c => {
      if (c && typeof c === 'string') {
        const trimmed = c.trim();
        const lower = trimmed.toLowerCase();
        if (!uniqueMap.has(lower)) {
          uniqueMap.set(lower, trimmed);
        }
      }
    });
    return Array.from(uniqueMap.values());
  });

  // Synchronisation et sauvegarde dans le localStorage avec déduplication
  useEffect(() => {
    try {
      const uniqueMap = new Map<string, string>();
      cities.forEach(c => {
        if (c && typeof c === 'string') {
          const trimmed = c.trim();
          const lower = trimmed.toLowerCase();
          if (!uniqueMap.has(lower)) {
            uniqueMap.set(lower, trimmed);
          }
        }
      });
      const cleanList = Array.from(uniqueMap.values());
      
      if (cleanList.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
      }
    } catch (e) {
      console.error("Erreur d'écriture dans le localStorage", e);
    }
  }, [cities]);

  useEffect(() => {
    if (currentLocalCity) {
      const exists = cities.some(c => c.toLowerCase() === currentLocalCity.toLowerCase());
      if (!exists) {
        setCities(prev => [...prev, currentLocalCity]);
      }
    }
  }, [currentLocalCity]);

  const [showCitySettings, setShowCitySettings] = useState<boolean>(false);
  const [newCityInput, setNewCityInput] = useState<string>('');

  const handleAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCityInput.trim();
    if (!trimmed) return;

    const exists = cities.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...cities, trimmed];
      setCities(updated);
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

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Chargement des données météo...</p>
      </div>
    );
  }

  const forecastData = currentWeather.forecast || [];
  const hourlyData = currentWeather.hourly || [];

  const tenDaysData = Array.from({ length: 10 }).map((_, index) => {
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

      aqiMorn: Math.round(30 + (index * 3) % 70),
      aqiEve: Math.round(45 + (index * 4) % 80),

      uvMorn: Math.round(1 + (index % 3)),
      uvEve: Math.round(3 + (index % 6)),

      feelsMorn: Math.round(tMin),
      feelsEve: Math.round(tMax + 1),

      precipMorn: Number(((index * 1.2) % 5).toFixed(1)),
      precipEve: Number(((index * 1.8) % 7).toFixed(1)),

      windMorn: Math.round(10 + (index * 2) % 15),
      windEve: Math.round(15 + (index * 3) % 20),

      pollenMorn: Math.round(1 + (index * 2) % 4),
      pollenEve: Math.round(2 + (index * 2) % 5),

      pressureMorn: Math.round(1012 + (index % 4 - 2) * 3),
      pressureEve: Math.round(1010 + (index % 5 - 2) * 4),

      activityScores: {
        fitness: { morn: Math.min(100, Math.max(40, 75 + Math.sin(index) * 20)), eve: Math.min(100, Math.max(40, 85 + Math.cos(index) * 15)) },
        tennis: { morn: Math.min(100, Math.max(30, 70 + Math.cos(index) * 25)), eve: Math.min(100, Math.max(30, 80 + Math.sin(index) * 20)) },
        cycling: { morn: Math.min(100, Math.max(40, 80 + Math.sin(index * 1.5) * 15)), eve: Math.min(100, Math.max(40, 90 + Math.cos(index * 1.2) * 10)) },
        forestWalk: { morn: Math.min(100, Math.max(50, 85 + Math.cos(index * 0.8) * 10)), eve: Math.min(100, Math.max(50, 95 + Math.sin(index * 0.9) * 5)) },
      }
    };
  });

  const maxDaily = Math.max(...tenDaysData.map(d => Math.max(d.mornTemp, d.eveTemp)), 30);
  const minDaily = Math.min(...tenDaysData.map(d => Math.min(d.mornTemp, d.eveTemp)), 10);
  const tempRange = maxDaily - minDaily || 1;

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
            className="p-2 bg-[#0d0f17] border border-slate-800 text-indigo-400 hover:border-indigo-500 rounded-xl flex-shrink-0 cursor-pointer shadow-md"
            title="Gérer les villes"
          >
            <Settings className="w-4 h-4" />
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

      {/* 2. Météo Heure par Heure */}
      <div className="space-y-2 bg-[#151824] p-3.5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" /> Météo & Température Heure par Heure
          </span>
          <span className="text-[9px] text-slate-400">°C</span>
        </div>
        <div className="h-44 flex items-end justify-between gap-1 pt-10 pb-1 overflow-x-auto">
          {hourlyData.map((item: any, idx: number) => {
            const h = Math.max(25, Math.round(((item.temp - minHourly) / rangeHourly) * 100));
            return (
              <div key={idx} className="flex-1 min-w-[38px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-md p-0.5 bg-[#121420]/30">
                <div className="flex flex-col items-center h-7 justify-end mb-1" title={item.condition || 'Météo'}>
                  {getWeatherIcon(item.condition)}
                </div>
                <span className="text-[9px] font-bold text-indigo-300">{item.temp}°</span>
                <div style={{ height: `${h}%` }} className="w-full max-w-[16px] bg-gradient-to-t from-cyan-500 via-indigo-500 to-blue-600 rounded-t-lg shadow-sm" />
                <span className="text-[8px] text-slate-400 pt-1">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Indicateurs rapides (Humidité & Vent) */}
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

      {/* 4. DIAGRAMME PRINCIPAL VERTICAL */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-bold uppercase text-indigo-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 
            {activeTab === 'temp' && "Tendance Températures (Matin & Soir)"}
            {activeTab === 'aqi' && "Qualité de l'Air AQI (Matin & Soir)"}
            {activeTab === 'uv' && "Évolution Indice UV (Matin & Soir)"}
            {activeTab === 'activities' && `Scores - ${activityMeta[selectedActivity].title} (Matin & Soir)`}
          </h2>
          <div className="flex items-center gap-3 text-[9px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Matin</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Soir</span>
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

        {/* VUE TEMPÉRATURES */}
        {activeTab === 'temp' && (
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const mornHeight = Math.max(20, Math.round(((day.mornTemp - minDaily) / tempRange) * 100));
              const eveHeight = Math.max(20, Math.round(((day.eveTemp - minDaily) / tempRange) * 100));
              const isHot = day.eveTemp > 32;
              const isCold = day.mornTemp < 5;
              return (
                <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                  <div className="flex flex-col items-center h-4 justify-end">
                    {isHot && <div className="text-rose-400 flex flex-col items-center"><Flame className="w-2.5 h-2.5 animate-pulse" /></div>}
                    {isCold && <div className="text-sky-400 flex flex-col items-center"><Snowflake className="w-2.5 h-2.5" /></div>}
                  </div>
                  <div className="flex items-end justify-center gap-0 w-full h-full">
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="mb-1.5" title={`Matin: ${day.mornCondition}`}>{getWeatherIcon(day.mornCondition)}</div>
                      <span className="text-[8px] font-bold text-sky-300 mb-1">{day.mornTemp}°</span>
                      <div style={{ height: `${mornHeight}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-sky-600 to-cyan-400 rounded-l-md shadow-md"></div>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="mb-1.5" title={`Soir: ${day.eveCondition}`}>{getWeatherIcon(day.eveCondition)}</div>
                      <span className="text-[8px] font-bold text-rose-300 mb-1">{day.eveTemp}°</span>
                      <div style={{ height: `${eveHeight}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-amber-500 to-rose-600 rounded-r-md shadow-md"></div>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE AQI */}
        {activeTab === 'aqi' && (
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const mornH = Math.max(20, Math.round((day.aqiMorn / 150) * 100));
              const eveH = Math.max(20, Math.round((day.aqiEve / 150) * 100));
              return (
                <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                  <div className="h-4"></div>
                  <div className="flex items-end justify-center gap-0 w-full h-full">
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-sky-300 mb-1">{day.aqiMorn}</span>
                      <div style={{ height: `${mornH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-l-md shadow-md"></div>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-rose-300 mb-1">{day.aqiEve}</span>
                      <div style={{ height: `${eveH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-teal-500 to-amber-500 rounded-r-md shadow-md"></div>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE UV */}
        {activeTab === 'uv' && (
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const mornH = Math.round((day.uvMorn / 12) * 100);
              const eveH = Math.round((day.uvEve / 12) * 100);
              return (
                <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                  <div className="h-4"></div>
                  <div className="flex items-end justify-center gap-0 w-full h-full">
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-sky-300 mb-1">{day.uvMorn}</span>
                      <div style={{ height: `${Math.max(20, mornH)}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-amber-400 to-orange-500 rounded-l-md shadow-md"></div>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-rose-300 mb-1">{day.uvEve}</span>
                      <div style={{ height: `${Math.max(20, eveH)}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-orange-500 to-purple-600 rounded-r-md shadow-md"></div>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE ACTIVITÉS */}
        {activeTab === 'activities' && (
          <div className="h-52 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const mornS = Math.round(day.activityScores[selectedActivity].morn);
              const eveS = Math.round(day.activityScores[selectedActivity].eve);
              return (
                <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                  <div className="h-4"></div>
                  <div className="flex items-end justify-center gap-0 w-full h-full">
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-sky-300 mb-1">{mornS}%</span>
                      <div style={{ height: `${mornS}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-l-md shadow-md"></div>
                    </div>
                    <div className="flex flex-col items-center justify-end h-full w-1/2">
                      <div className="h-4 mb-1.5"></div>
                      <span className="text-[7px] font-bold text-rose-300 mb-1">{eveS}%</span>
                      <div style={{ height: `${eveS}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-teal-500 to-emerald-400 rounded-r-md shadow-md"></div>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. SECTION REPLIABLE : DÉTAILS AVANCÉS */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-[#181b28] hover:bg-[#1c1f30] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span className="text-white">Graphiques Avancés (Pollen, Vent, Précipitations...)</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 border-t border-slate-800 space-y-6 animate-fade-in">
            
            {/* A. Température Ressentie */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-orange-400" /> Température Ressentie (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">°C</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-1.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const mornH = Math.max(25, Math.round(((day.feelsMorn + 5) / 45) * 100));
                  const eveH = Math.max(25, Math.round(((day.feelsEve + 5) / 45) * 100));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="flex items-end justify-center gap-0 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[8px] font-bold text-sky-300 mb-1">{day.feelsMorn}°</span>
                          <div style={{ height: `${mornH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-blue-500 to-amber-500 rounded-l-md shadow-sm"></div>
                        </div>
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[8px] font-bold text-rose-300 mb-1">{day.feelsEve}°</span>
                          <div style={{ height: `${eveH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-amber-500 to-rose-500 rounded-r-md shadow-sm"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. Précipitations */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Umbrella className="w-4 h-4 text-sky-400" /> Précipitations (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">mm</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-1.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const mornH = Math.max(15, Math.round((day.precipMorn / 10) * 100));
                  const eveH = Math.max(15, Math.round((day.precipEve / 10) * 100));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="flex items-end justify-center gap-0 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-sky-300 mb-1">{day.precipMorn}</span>
                          <div style={{ height: `${mornH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-sky-900 to-sky-600 rounded-l-md shadow-sm"></div>
                        </div>
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-rose-300 mb-1">{day.precipEve}</span>
                          <div style={{ height: `${eveH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-sky-600 to-cyan-400 rounded-r-md shadow-sm"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. Vent */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" /> Vent (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">km/h</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-1.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const mornH = Math.max(20, Math.round((day.windMorn / 40) * 100));
                  const eveH = Math.max(20, Math.round((day.windEve / 40) * 100));
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="flex items-end justify-center gap-0 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-sky-300 mb-1">{day.windMorn}</span>
                          <div style={{ height: `${mornH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-emerald-600 to-teal-500 rounded-l-md shadow-sm"></div>
                        </div>
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-rose-300 mb-1">{day.windEve}</span>
                          <div style={{ height: `${eveH}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-teal-500 to-rose-600 rounded-r-md shadow-sm"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* D. Pollen */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Flower2 className="w-4 h-4 text-yellow-400" /> Pollen (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">Niveau 1-5</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-1.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const mornH = Math.round((day.pollenMorn / 5) * 100);
                  const eveH = Math.round((day.pollenEve / 5) * 100);
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="flex items-end justify-center gap-0 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-sky-300 mb-1">{day.pollenMorn}</span>
                          <div style={{ height: `${Math.max(20, mornH)}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-yellow-400 to-orange-500 rounded-l-md shadow-sm"></div>
                        </div>
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-rose-300 mb-1">{day.pollenEve}</span>
                          <div style={{ height: `${Math.max(20, eveH)}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-orange-500 to-purple-600 rounded-r-md shadow-sm"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* E. Pression Atmosphérique */}
            <div className="space-y-2 bg-[#0d0f17] p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-indigo-400" /> Pression Atmosphérique (Matin & Soir)
                </span>
                <span className="text-[9px] text-slate-400">hPa</span>
              </div>
              <div className="h-48 flex items-end justify-between gap-1.5 pt-4 pb-1 overflow-x-auto">
                {tenDaysData.map((day, idx) => {
                  const mornH = Math.round(((day.pressureMorn - 990) / 40) * 100);
                  const eveH = Math.round(((day.pressureEve - 990) / 40) * 100);
                  return (
                    <div key={idx} className="flex-1 min-w-[46px] flex flex-col items-center gap-1.5 h-full justify-end border border-indigo-500/15 rounded-lg p-0.5 bg-[#121420]/40">
                      <div className="flex items-end justify-center gap-0 w-full h-full">
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-sky-300 mb-1">{day.pressureMorn}</span>
                          <div style={{ height: `${Math.max(20, Math.min(100, mornH))}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-indigo-600 to-cyan-500 rounded-l-md shadow-sm"></div>
                        </div>
                        <div className="flex flex-col items-center justify-end h-full w-1/2">
                          <span className="text-[7px] font-bold text-rose-300 mb-1">{day.pressureEve}</span>
                          <div style={{ height: `${Math.max(20, Math.min(100, eveH))}%` }} className="w-full max-w-[20px] bg-gradient-to-t from-cyan-500 to-teal-400 rounded-r-md shadow-sm"></div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold border-t border-slate-800 pt-1 w-full text-center">{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL DE GESTION DES VILLES */}
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
                    if (e.key === 'Enter') {
                      handleAdd(e);
                    }
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