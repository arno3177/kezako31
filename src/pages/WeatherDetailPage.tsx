import React from 'react';
import { WeatherData, TemperatureUnit, AppSettings } from '../types';
import { getTranslation, translateCondition } from '../utils/translations';
import { 
  CloudSun, Sun, Cloud, CloudRain, Droplets, Wind, 
  Settings, MapPin, Gauge, Eye, SunMedium, Clock, Calendar
} from 'lucide-react';

interface WeatherDetailPageProps {
  currentWeather: WeatherData;
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  onSelectCity: (city: string) => void;
  onOpenSettings: () => void;
  language?: AppSettings['language'];
}

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({
  currentWeather,
  citiesList,
  activeCity,
  unit,
  onSelectCity,
  onOpenSettings,
  language = 'fr'
}) => {
  const t = getTranslation(language);

  const renderConditionIcon = (condition = '', className = "w-6 h-6") => {
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('clear') || cond.includes('sun')) return <Sun className={`${className} text-amber-400`} />;
    if (cond.includes('pluie') || cond.includes('rain')) return <CloudRain className={`${className} text-sky-400`} />;
    if (cond.includes('nuage') || cond.includes('cloud')) return <Cloud className={`${className} text-slate-300`} />;
    return <CloudSun className={`${className} text-indigo-300`} />;
  };

  return (
    <div className="space-y-6 text-xs animate-fade-in text-slate-200 max-w-6xl mx-auto pb-10">
      
      {/* En-tête de la page Météo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#16182a] border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{currentWeather.city}</span>
              <span className="text-slate-400 font-normal">({currentWeather.country})</span>
            </h1>
            <p className="text-[11px] text-sky-300/70 capitalize">
              {translateCondition(currentWeather.condition, language)}
            </p>
          </div>
        </div>

        {/* Sélecteur de villes rapides & Bouton Paramètres */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
            {citiesList.map(city => (
              <button
                key={city}
                onClick={() => onSelectCity(city)}
                className={`px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-[#0d0f17] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 bg-[#0d0f17] border border-slate-800 hover:border-indigo-500 text-indigo-400 rounded-xl transition-all cursor-pointer flex-shrink-0"
            title={t.settingsTitle}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cartes d'indicateurs météo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-medium block">{t.humidity}</span>
            <span className="text-sm font-extrabold text-white">{currentWeather.humidity}%</span>
          </div>
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-medium block">{t.wind}</span>
            <span className="text-sm font-extrabold text-white">{currentWeather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <SunMedium className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-medium block">{t.uvIndex}</span>
            <span className="text-sm font-extrabold text-white">{currentWeather.uvIndex ?? 3} / 10</span>
          </div>
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-medium block">{t.pressure}</span>
            <span className="text-sm font-extrabold text-white">{currentWeather.pressure ?? 1013} hPa</span>
          </div>
        </div>
      </div>

      {/* Prévisions Horaire */}
      {currentWeather.hourly && currentWeather.hourly.length > 0 && (
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Clock className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.hourlyForecast}</h2>
          </div>
          <div className="flex space-x-3 overflow-x-auto scrollbar-none py-2">
            {currentWeather.hourly.map((item, idx) => (
              <div key={idx} className="flex-shrink-0 bg-[#0d0f17] border border-slate-800 rounded-xl p-3 text-center space-y-1.5 w-20">
                <span className="text-[10px] text-slate-400 block font-semibold">{item.time}</span>
                <div className="flex justify-center">{renderConditionIcon(item.condition, "w-5 h-5")}</div>
                <span className="text-xs font-black text-white block">{item.temp}°{unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prévisions sur 7 jours */}
      {currentWeather.forecast && currentWeather.forecast.length > 0 && (
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Calendar className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.dailyForecast}</h2>
          </div>
          <div className="space-y-2">
            {currentWeather.forecast.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#0d0f17] border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3 w-32">
                  <span className="font-bold text-white text-xs">{day.day}</span>
                  <span className="text-[10px] text-slate-500">{day.date}</span>
                </div>
                <div className="flex items-center space-x-2 flex-1">
                  {renderConditionIcon(day.condition, "w-4 h-4")}
                  <span className="text-slate-300 text-xs capitalize">{translateCondition(day.condition, language)}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-white text-xs">{day.tempMax}°</span>
                  <span className="text-slate-500 text-xs ml-1.5">{day.tempMin}°</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};