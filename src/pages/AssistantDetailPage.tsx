import React, { useState } from 'react';
import { WeatherData, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { clothingCatalog } from '../data/clothingCatalog'; // <-- Import du catalogue externe
import { 
  Shirt, ChevronLeft, Sparkles, 
  ShieldCheck, User, Baby, Activity, Layers, RefreshCw
} from 'lucide-react';

interface AssistantDetailPageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
}

type ProfileType = 'adult' | 'kids' | 'sport';
type GenderType = 'male' | 'female';

export const AssistantDetailPage: React.FC<AssistantDetailPageProps> = ({
  currentWeather,
  onBack,
  language = 'en'
}) => {
  const _t = getTranslation(language);
  const [activeProfile, setActiveProfile] = useState<ProfileType>('adult');
  const [activeGender, setActiveGender] = useState<GenderType>('male');
  const [seed, setSeed] = useState<number>(0);

  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 11) : 11;
  const windSpeed = currentWeather ? Number(currentWeather.windSpeed ?? 15) : 15;
  const humidity = currentWeather ? Number(currentWeather.humidity ?? 75) : 75;
  const condition = (currentWeather?.condition || 'Ensoleillé').toLowerCase();

  const isSnowy = condition.includes('neige') || condition.includes('snow') || currentTemp <= 0;
  const isRainy = condition.includes('pluie') || condition.includes('rain') || condition.includes('averses') || humidity > 85;

  // Détermination de la clé du catalogue à utiliser
  const catalogKey = activeProfile === 'adult' ? activeGender : activeProfile;
  const currentCatalog = clothingCatalog[catalogKey];

  // Fonction de pioche pseudo-aléatoire basée sur le seed
  const pick = (arr: string[]) => {
    const index = Math.abs(Math.sin(seed + arr.length * 53) * 10000) % arr.length;
    return arr[Math.floor(index)];
  };

  const getClothingPieces = () => {
    return {
      tops: pick(currentCatalog.tops),
      bottoms: pick(currentCatalog.bottoms),
      outerwear: pick(currentCatalog.outerwear),
      shoes: pick(currentCatalog.shoes),
      accessories: pick(currentCatalog.accessories)
    };
  };

  const pieces = getClothingPieces();

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-200 w-full pb-20 px-0">
      
      {/* EN-TÊTE AVEC BOUTON DE RETOUR & VARIATION */}
      <div className="bg-gradient-to-r from-teal-950/90 via-[#16182a] to-indigo-950/90 border border-teal-500/30 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-teal-300 border border-teal-400/30 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-teal-400" /> Assistant Tenues & Style
            </h1>
            <p className="text-[10px] text-teal-300/80">Catalogue dynamique & modulaire</p>
          </div>
        </div>

        <button
          onClick={() => setSeed(prev => prev + 1)}
          className="p-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center gap-1 font-bold transition-all cursor-pointer shadow"
          title="Générer une autre combinaison"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Varier</span>
        </button>
      </div>

      {/* SÉLECTEUR DE PROFIL */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5 bg-[#12141f] p-1.5 border border-slate-800 rounded-2xl shadow-lg">
          <button
            type="button"
            onClick={() => setActiveProfile('adult')}
            className={`py-2 px-2 rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeProfile === 'adult' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-[#0d0f17]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pour Moi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfile('kids')}
            className={`py-2 px-2 rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeProfile === 'kids' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-[#0d0f17]'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>Enfants (École)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfile('sport')}
            className={`py-2 px-2 rounded-xl font-bold text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeProfile === 'sport' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-[#0d0f17]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sport / Actif</span>
          </button>
        </div>

        {activeProfile === 'adult' && (
          <div className="flex items-center justify-center gap-2 bg-[#0d0f17]/80 p-1.5 border border-slate-800 rounded-xl animate-fade-in">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mr-1">Style :</span>
            <button
              type="button"
              onClick={() => setActiveGender('male')}
              className={`py-1.5 px-3 rounded-lg font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
                activeGender === 'male' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>👨</span>
              <span>Masculin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveGender('female')}
              className={`py-1.5 px-3 rounded-lg font-bold text-[9.5px] flex items-center gap-1 transition-all cursor-pointer ${
                activeGender === 'female' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              <span>👩</span>
              <span>Féminin</span>
            </button>
          </div>
        )}
      </div>

      {/* COMPOSITION DE LA TENUE */}
      <div className="bg-[#151824] border border-teal-500/30 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-300" />
            Suggestion du jour ({activeProfile === 'adult' ? (activeGender === 'female' ? 'Femme' : 'Homme') : activeProfile})
          </h2>
          <span className="text-[9px] text-teal-300/70 italic">Clique sur "Varier" pour changer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-extrabold text-teal-300 uppercase tracking-wide">👕 Hauts / Couches</span>
            <p className="text-xs text-white font-medium">{pieces.tops}</p>
          </div>

          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-extrabold text-teal-300 uppercase tracking-wide">👖 Bas / Pantalon</span>
            <p className="text-xs text-white font-medium">{pieces.bottoms}</p>
          </div>

          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-extrabold text-teal-300 uppercase tracking-wide">🧥 Veste / Manteau</span>
            <p className="text-xs text-white font-medium">{pieces.outerwear}</p>
          </div>

          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 space-y-1">
            <span className="text-[9px] font-extrabold text-teal-300 uppercase tracking-wide">👞 Chaussures</span>
            <p className="text-xs text-white font-medium">{pieces.shoes}</p>
          </div>

          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 space-y-1 sm:col-span-2">
            <span className="text-[9px] font-extrabold text-amber-300 uppercase tracking-wide">🧣 Accessoires & Extras</span>
            <p className="text-xs text-white font-medium">{pieces.accessories}</p>
          </div>
        </div>
      </div>

      {/* ANALYSE MÉTÉO */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Conditions Météo & Confort
        </h2>

        <div className="space-y-2">
          <div className="bg-[#0d0f17] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-extrabold text-blue-400 uppercase">🌅 Analyse du Matin</span>
              <p className="text-xs text-white font-medium pt-0.5">
                {currentTemp < 10 ? "Fraîcheur matinale : privilégiez une bonne superposition." : "Température clémente pour démarrer la journée du bon pied."}
              </p>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/25 text-blue-300 border border-blue-500/30 flex-shrink-0 ml-2">
              {currentTemp}°C • {windSpeed} km/h
            </span>
          </div>
        </div>
      </div>

      {/* CONSEIL PRATIQUE */}
      <div className="bg-gradient-to-r from-teal-950/40 to-indigo-950/40 border border-teal-500/30 rounded-2xl p-4 shadow-lg flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[11px] font-black text-white uppercase tracking-wider">Astuce Stylisme</h3>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            {isRainy 
              ? "Temps humide détecté : privilégiez des chaussures étanches et un bon parapluie." 
              : "La superposition (layering) reste votre meilleur allié pour moduler votre confort au fil de la journée."}
          </p>
        </div>
      </div>

    </div>
  );
};

export default AssistantDetailPage;