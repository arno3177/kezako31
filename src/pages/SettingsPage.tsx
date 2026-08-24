import React, { useState, useEffect } from 'react';
import { AppSettings, TemperatureUnit } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Settings, Globe, Languages, Bus, CheckCircle2, 
  Thermometer, ArrowLeft, Key, ShieldCheck, Eye, EyeOff, Save, Trash2, ExternalLink 
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
  settings,
  unit,
  onToggleUnit,
  onUpdateSettings,
  onBack
}) => {
  const t = getTranslation(settings.language);
  const isLuxembourg = settings.country === 'LU' || settings.country === 'Luxembourg';

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('user_gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKey.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleDeleteApiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    setDeleteSuccess(true);
    // Déclencher un événement de stockage pour mettre à jour le Header en direct
    window.dispatchEvent(new Event('storage'));
    setTimeout(() => setDeleteSuccess(false), 3000);
  };

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

        {/* CLÉ API GEMINI PERSONNELLE (AVEC SUPPRESSION) */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Clé API Gemini AI Personnelle</h2>
            </div>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-400 hover:underline inline-flex items-center gap-1 font-mono"
            >
              <span>Obtenir une clé</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Saisissez votre clé API Google Gemini personnelle pour activer les fonctionnalités d'intelligence artificielle. Elle est stockée uniquement en local.
          </p>

          <form onSubmit={handleSaveApiKey} className="space-y-3 pt-1">
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Collez votre clé API Gemini ici (ex: AIzaSy...)"
                className="w-full p-2.5 pr-10 rounded-xl bg-[#0d0f17] border border-slate-800 text-white focus:border-indigo-500 outline-none text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                title={showKey ? "Masquer la clé" : "Afficher la clé"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div>
                {savedSuccess && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Clé enregistrée !
                  </span>
                )}
                {deleteSuccess && (
                  <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px] animate-fade-in">
                    <Trash2 className="w-4 h-4" /> Clé supprimée !
                  </span>
                )}
                {!savedSuccess && !deleteSuccess && (
                  <span className="text-[10px] text-slate-500">
                    Stockée en sécurité sur votre appareil.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {apiKey && (
                  <button 
                    type="button"
                    onClick={handleDeleteApiKey}
                    className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Supprimer la clé"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                )}

                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </form>
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