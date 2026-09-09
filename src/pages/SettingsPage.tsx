import React, { useState } from 'react';
import { AppSettings, TemperatureUnit } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Settings, Globe, Languages, Bus, CheckCircle2, 
  Thermometer, ArrowLeft, Key, Sparkles, Building2
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

  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('user_ai_api_key') || '';
  });
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const isLux = newCountry === 'LU' || newCountry === 'Luxembourg';

    onUpdateSettings({
      country: newCountry,
      busApi: isLux ? 'mobiliteit' : 'maps'
    });
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_ai_api_key', apiKeyInput.trim());
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
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

        {/* UNITÉ DE TEMPÉRATURE */}
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

        {/* --- PARAMÈTRES AVANCÉS DU LOGEMENT (CONFORT & ÉNERGIE) --- */}
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-1 pt-4">
          Paramètres Avancés du Logement (Thermique & Bâtiment)
        </div>

        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Passeport Énergétique & Enveloppe</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Classe Énergétique */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-bold block">Classe Énergétique</label>
              <select
                value={settings.energyClass || 'AAA'}
                onChange={(e) => onUpdateSettings({ energyClass: e.target.value as any })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {['AAA', 'AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((cls) => (
                  <option key={cls} value={cls}>Classe {cls}</option>
                ))}
              </select>
            </div>

            {/* Orientation du vitrage */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-bold block">Orientation Principale</label>
              <select
                value={settings.orientation || 'S'}
                onChange={(e) => onUpdateSettings({ orientation: e.target.value as any })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="S">Sud (Ensoleillement maximal)</option>
                <option value="SW">Sud-Ouest</option>
                <option value="SE">Sud-Est</option>
                <option value="W">Ouest</option>
                <option value="E">Est</option>
                <option value="NW">Nord-Ouest</option>
                <option value="NE">Nord-Est</option>
                <option value="N">Nord (Minimal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Surface habitable */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Surface habitable (m²)</label>
              <input
                type="number"
                value={settings.apartmentSurface ?? 75}
                onChange={(e) => onUpdateSettings({ apartmentSurface: parseFloat(e.target.value) || 75 })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs"
              />
            </div>

            {/* Surface vitrée */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Surface Vitrée (m²)</label>
              <input
                type="number"
                value={settings.glassSurface ?? 14}
                onChange={(e) => onUpdateSettings({ glassSurface: parseFloat(e.target.value) || 14 })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs"
              />
            </div>

            {/* Hauteur sous plafond */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Hauteur sous plafond (m)</label>
              <input
                type="number"
                step="0.1"
                value={settings.ceilingHeight ?? 2.6}
                onChange={(e) => onUpdateSettings({ ceilingHeight: parseFloat(e.target.value) || 2.6 })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Type de ventilation */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Système de Ventilation</label>
              <select
                value={settings.ventilationType || 'double_flux'}
                onChange={(e) => onUpdateSettings({ ventilationType: e.target.value as any })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs cursor-pointer"
              >
                <option value="double_flux">Double flux (HR)</option>
                <option value="simple_flux">Simple flux</option>
                <option value="natural">Ventilation naturelle</option>
              </select>
            </div>

            {/* Protection solaire */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Protection Solaire</label>
              <select
                value={settings.sunProtection || 'bso'}
                onChange={(e) => onUpdateSettings({ sunProtection: e.target.value as any })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs cursor-pointer"
              >
                <option value="bso">BSO (Brise-soleil orientable)</option>
                <option value="shutters">Volets extérieurs</option>
                <option value="indoor">Stores intérieurs</option>
                <option value="none">Aucune protection</option>
              </select>
            </div>

            {/* Position dans l'immeuble */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">Position dans l'Immeuble</label>
              <select
                value={settings.buildingPosition || 'intermediate'}
                onChange={(e) => onUpdateSettings({ buildingPosition: e.target.value as any })}
                className="w-full bg-[#0d0f17] text-white font-bold p-2 rounded-xl border border-slate-800 text-xs cursor-pointer"
              >
                <option value="intermediate">Étage intermédiaire</option>
                <option value="top_floor">Dernier étage (+ exposition)</option>
                <option value="ground_floor">Rez-de-chaussée</option>
                <option value="corner">Appartement d'angle</option>
              </select>
            </div>
          </div>
        </div>
{/* CLÉ API GEMINI */}
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Clé API Gemini (Assistant IA)</h2>
          </div>
          <form onSubmit={handleSaveApiKey} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Entrez votre clé API Gemini (AIza...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-[#0d0f17] text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Enregistrer</span>
              </button>
            </div>
            {savedKeySuccess && (
              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clé API enregistrée avec succès !
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;