import React from 'react';
import { AppSettings, TemperatureUnit } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Settings, Globe, Languages, Bus, CheckCircle2, 
  Thermometer, MapPin, Trash2, ArrowLeft 
} from 'lucide-react';

interface SettingsPageProps {
  citiesList: string[];
  activeCity: string;
  unit: TemperatureUnit;
  settings: AppSettings;
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
  onSelectCity: (city: string) => void;
  onToggleUnit: (unit: TemperatureUnit) => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBack?: () => void;
}

const COUNTRIES = [
  { code: 'LU', name: 'Luxembourg' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgique' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'España' }
];

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  citiesList,
  activeCity,
  unit,
  settings,
  onRemoveCity,
  onSelectCity,
  onToggleUnit,
  onUpdateSettings,
  onBack
}) => {
  const t = getTranslation(settings.language);
  const isLuxembourg = settings.country === 'LU' || settings.country === 'Luxembourg';

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const isLux = newCountry === 'LU' || newCountry === 'Luxembourg';

    onUpdateSettings({
      country: newCountry,
      busApi: isLux ? 'mobiliteit' : 'maps'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in text-xs text-slate-200 pb-10">
      
      {/* EN-TÊTE */}
      <div className="flex items-center justify-between bg-[#16182a] border border-indigo-500/20 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">{t.settingsTitle}</h1>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-xl bg-[#0d0f17] border border-slate-800 hover:text-white text-slate-400 flex items-center space-x-1.5 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1 pt-2">
          {t.generalSettings}
        </div>

        {/* PAYS */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Globe className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.residenceCountry}</h2>
          </div>
          <select
            value={settings.country || 'LU'}
            onChange={handleCountryChange}
            className="w-full bg-[#0d0f17] text-white font-bold p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* LANGUE */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Languages className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.preferredLanguage}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {LANGUAGES.map(lang => {
              const isSelected = (settings.language || 'fr') === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => onUpdateSettings({ language: lang.code as any })}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-[#0d0f17] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{lang.label}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* API BUS */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Bus className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.busApiTitle}</h2>
          </div>
          {isLuxembourg ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => onUpdateSettings({ busApi: 'mobiliteit' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.busApi === 'mobiliteit'
                    ? 'bg-emerald-950/30 border-emerald-500 text-white'
                    : 'bg-[#0d0f17] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-white">Mobiliteit.lu</div>
              </button>

              <button
                onClick={() => onUpdateSettings({ busApi: 'maps' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.busApi === 'maps'
                    ? 'bg-indigo-950/30 border-indigo-500 text-white'
                    : 'bg-[#0d0f17] border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-extrabold text-white">Google Maps API</div>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#0d0f17] border border-slate-800 text-slate-300">
              <div className="font-bold text-indigo-400">Google Maps API</div>
            </div>
          )}
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1 pt-4">
          {t.weatherSettings}
        </div>

        {/* UNITÉ */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Thermometer className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">{t.temperatureUnit}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => onToggleUnit('C')}
              className={`p-3 rounded-xl border font-extrabold transition-all cursor-pointer text-center ${
                unit === 'C' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#0d0f17] border-slate-800 text-slate-400'
              }`}
            >
              Celsius (°C)
            </button>
            <button
              onClick={() => onToggleUnit('F')}
              className={`p-3 rounded-xl border font-extrabold transition-all cursor-pointer text-center ${
                unit === 'F' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-[#0d0f17] border-slate-800 text-slate-400'
              }`}
            >
              Fahrenheit (°F)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};