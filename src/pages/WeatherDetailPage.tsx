import React, { useState } from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Settings, Calendar, ChevronDown, ChevronUp, 
  BarChart3, Activity, Bike, Dumbbell, Trees, Trophy, Gauge, SunMedium, Sparkles, CheckCircle2, AlertTriangle
} from 'lucide-react';

interface WeatherDetailPageProps {
  currentWeather: WeatherData | null;
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  onSelectCity: (city: string) => void;
  onOpenSettings: () => void;
  language?: AppSettings['language'];
}

type WeatherTab = 'temp' | 'aqi' | 'uv' | 'activities';

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({
  currentWeather,
  citiesList,
  activeCity,
  unit,
  onSelectCity,
  onOpenSettings,
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<WeatherTab>('temp');
  const [selectedActivity, setSelectedActivity] = useState<'fitness' | 'tennis' | 'cycling' | 'forestWalk'>('fitness');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false); // Repliée par défaut

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>Loading weather data...</p>
      </div>
    );
  }

  const forecastData = currentWeather.forecast || [];
  
  // Projection sur 10 jours
  const tenDaysData = Array.from({ length: 10 }).map((_, index) => {
    const base = forecastData[index % forecastData.length] || {
      day: `J-${index + 1}`,
      tempMax: 24,
      tempMin: 14,
      condition: 'Ensoleillé'
    };
    return {
      ...base,
      dayLabel: index === 0 ? "Aujourd'hui" : `J ${index + 1}`,
      aqiValue: Math.round(30 + (index * 4) % 90),
      uvValue: Math.round(3 + (index % 7)),
      // Scores simulés sur 10 jours pour chaque activité
      activityScores: {
        fitness: Math.min(100, Math.max(40, 80 + Math.sin(index) * 20)),
        tennis: Math.min(100, Math.max(30, 75 + Math.cos(index) * 25)),
        cycling: Math.min(100, Math.max(40, 85 + Math.sin(index * 1.5) * 15)),
        forestWalk: Math.min(100, Math.max(50, 90 + Math.cos(index * 0.8) * 10)),
      }
    };
  });

  const maxDaily = Math.max(...tenDaysData.map(d => d.tempMax), 30);
  const minDaily = Math.min(...tenDaysData.map(d => d.tempMin), 10);
  const tempRange = maxDaily - minDaily || 1;

  const activityMeta = {
    fitness: { title: 'Fitness', icon: <Dumbbell className="w-4 h-4 text-indigo-400" /> },
    tennis: { title: 'Tennis', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    cycling: { title: 'Cyclisme', icon: <Bike className="w-4 h-4 text-sky-400" /> },
    forestWalk: { title: 'Forêt', icon: <Trees className="w-4 h-4 text-emerald-400" /> },
  };

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-200 w-full max-w-full overflow-x-hidden pb-10 px-2">
      
      {/* En-tête Météo */}
      <div className="bg-[#16182a] border border-indigo-500/20 rounded-2xl p-3.5 shadow-xl space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex-shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white truncate">{currentWeather.city}</h1>
              <p className="text-[10px] text-sky-300/70 capitalize truncate">{translateCondition(currentWeather.condition, language)}</p>
            </div>
          </div>
          <button onClick={onOpenSettings} className="p-2 bg-[#0d0f17] border border-slate-800 text-indigo-400 hover:border-indigo-500 rounded-xl flex-shrink-0 cursor-pointer">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Villes rapides */}
        <div className="flex space-x-1.5 overflow-x-auto scrollbar-none py-1">
          {citiesList.map(city => (
            <button
              key={city}
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
      </div>

      {/* Indicateurs rapides */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
          <Droplets className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 text-[9px] block">{t.humidity}</span>
            <span className="text-xs font-extrabold text-white">{currentWeather.humidity}%</span>
          </div>
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
          <Wind className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-slate-400 text-[9px] block">{t.wind}</span>
            <span className="text-xs font-extrabold text-white">{currentWeather.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* ========================================================
           ONGLETS DE CATÉGORIE POUR LE DIAGRAMME VERTICAL
         ======================================================== */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#12141f] p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('temp')}
          className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'temp' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="truncate">Températures</span>
        </button>

        <button
          onClick={() => setActiveTab('aqi')}
          className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'aqi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span className="truncate">Air (AQI)</span>
        </button>

        <button
          onClick={() => setActiveTab('uv')}
          className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'uv' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <SunMedium className="w-3.5 h-3.5" />
          <span className="truncate">Indice UV</span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`py-2 px-1 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            activeTab === 'activities' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="truncate">Activités</span>
        </button>
      </div>

      {/* ========================================================
          1. DIAGRAMME À BARRES VERTICALES (10 JOURS)
         ======================================================== */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-bold uppercase text-indigo-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 
            {activeTab === 'temp' && "Diagramme Vertical - Températures (10 Jours)"}
            {activeTab === 'aqi' && "Diagramme Vertical - Qualité de l'Air AQI (10 Jours)"}
            {activeTab === 'uv' && "Diagramme Vertical - Indice UV (10 Jours)"}
            {activeTab === 'activities' && `Diagramme Vertical - ${activityMeta[selectedActivity].title} (10 Jours)`}
          </h2>
          <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Tendance 10J
          </span>
        </div>

        {/* Sélecteur secondaire pour choisir quelle activité afficher en diagramme 10 jours */}
        {activeTab === 'activities' && (
          <div className="flex gap-1.5 pb-1 overflow-x-auto">
            {(Object.keys(activityMeta) as Array<keyof typeof activityMeta>).map((actKey) => (
              <button
                key={actKey}
                onClick={() => setSelectedActivity(actKey)}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                  selectedActivity === actKey ? 'bg-pink-500/20 text-pink-300 border-pink-500' : 'bg-[#0d0f17] text-slate-400 border-slate-800'
                }`}
              >
                {activityMeta[actKey].icon}
                <span>{activityMeta[actKey].title}</span>
              </button>
            ))}
          </div>
        )}

        {/* VUE 1 : TEMPÉRATURES VERTICALES (10 JOURS) */}
        {activeTab === 'temp' && (
          <div className="h-48 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const heightPercent = Math.max(25, Math.round(((day.tempMax - minDaily) / tempRange) * 100));
              return (
                <div key={idx} className="flex-1 min-w-[30px] flex flex-col items-center gap-1.5 h-full justify-end">
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className="w-full bg-gradient-to-t from-sky-600 to-indigo-500 rounded-t-md flex items-center justify-center shadow-md"
                  >
                    <span className="text-[9px] font-black text-white transform -rotate-90 sm:rotate-0">{day.tempMax}°</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE 2 : AQI VERTICAL (10 JOURS) */}
        {activeTab === 'aqi' && (
          <div className="h-48 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const heightPercent = Math.max(20, Math.round((day.aqiValue / 150) * 100));
              return (
                <div key={idx} className="flex-1 min-w-[30px] flex flex-col items-center gap-1.5 h-full justify-end">
                  <div 
                    style={{ height: `${Math.min(100, heightPercent)}%` }} 
                    className="w-full bg-gradient-to-t from-emerald-600 to-amber-400 rounded-t-md flex items-center justify-center shadow-md"
                  >
                    <span className="text-[9px] font-black text-slate-950 transform -rotate-90 sm:rotate-0">{day.aqiValue}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE 3 : UV VERTICAL (10 JOURS) */}
        {activeTab === 'uv' && (
          <div className="h-48 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const heightPercent = Math.round((day.uvValue / 12) * 100);
              return (
                <div key={idx} className="flex-1 min-w-[30px] flex flex-col items-center gap-1.5 h-full justify-end">
                  <div 
                    style={{ height: `${Math.max(20, Math.min(100, heightPercent))}%` }} 
                    className="w-full bg-gradient-to-t from-amber-500 to-rose-600 rounded-t-md flex items-center justify-center shadow-md"
                  >
                    <span className="text-[9px] font-black text-white transform -rotate-90 sm:rotate-0">{day.uvValue}</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* VUE 4 : ACTIVITÉS SUR 10 JOURS (UNE BARRE PAR JOUR AVEC ICÔNE BON/MAUVAIS) */}
        {activeTab === 'activities' && (
          <div className="h-48 flex items-end justify-between gap-1.5 pt-6 pb-1 bg-[#0d0f17] p-3 rounded-xl border border-slate-800 overflow-x-auto">
            {tenDaysData.map((day, idx) => {
              const score = Math.round(day.activityScores[selectedActivity]);
              const isGood = score >= 70;
              return (
                <div key={idx} className="flex-1 min-w-[30px] flex flex-col items-center gap-1.5 h-full justify-end group">
                  {/* Icône Bon / Mauvais au sommet de la barre */}
                  <div className="flex flex-col items-center">
                    {isGood ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    <span className="text-[8px] font-bold text-white">{score}%</span>
                  </div>

                  <div 
                    style={{ height: `${score}%` }} 
                    className={`w-full rounded-t-md flex items-center justify-center shadow-md ${
                      isGood ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-amber-600 to-amber-400'
                    }`}
                  >
                    <span className="text-[8px] font-black text-white transform -rotate-90 sm:rotate-0">{score}%</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold">{day.day}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          2. SECTION REPLIABLE (PAR DÉFAUT REPLIÉE) - DÉTAILS AVANCÉS
         ======================================================== */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-[#181b28] hover:bg-[#1c1f30] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span className="text-white">Détails Avancés & Statistiques sur 10 Jours</span>
          </div>
          {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isDetailsOpen && (
          <div className="p-4 border-t border-slate-800 space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h3 className="font-bold text-white text-[11px] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Analyse Météo Globale des 10 prochains jours
              </h3>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                Les diagrammes verticaux sur 10 jours vous permettent de suivre l'évolution quotidienne pour chaque activité, avec un indicateur clair pour identifier immédiatement les journées idéales.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#0d0f17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[9px] block">Température Max Moyenne</span>
                <span className="text-sm font-extrabold text-white">25°C</span>
              </div>
              <div className="bg-[#0d0f17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[9px] block">Indice UV Moyen</span>
                <span className="text-sm font-extrabold text-amber-400">5.5 / 12</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};