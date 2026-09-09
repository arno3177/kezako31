import React, { useState, useEffect } from 'react';
import { WeatherData, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { clothingCatalog } from '../data/clothingCatalog';
import { 
  Shirt, ChevronLeft, Sparkles, 
  User, Baby, Activity, RefreshCw, Clock, Loader2, Zap 
} from 'lucide-react';

interface AssistantDetailPageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
}

type ProfileType = 'adult' | 'kids' | 'sport';
type GenderType = 'male' | 'female';

interface OutfitSlot {
  tops: string;
  bottoms: string;
  outerwear: string;
  shoes: string;
  accessories: string;
}

interface AiOutfitContent {
  morning: OutfitSlot;
  afternoon: OutfitSlot;
  evening: OutfitSlot;
}

export const AssistantDetailPage: React.FC<AssistantDetailPageProps> = ({
  currentWeather,
  onBack,
  language = 'en'
}) => {
  const _t = getTranslation(language);
  const [activeProfile, setActiveProfile] = useState<ProfileType>('adult');
  const [activeGender, setActiveGender] = useState<GenderType>('male');
  const [seed, setSeed] = useState<number>(0);

  const [aiContent, setAiContent] = useState<AiOutfitContent | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isUsingAiMode, setIsUsingAiMode] = useState(false);
  const [usedModelName, setUsedModelName] = useState<string>('');

  const MAX_RPM = 5;
  const [remainingQuota, setRemainingQuota] = useState<number>(MAX_RPM);
  const [resetTimer, setResetTimer] = useState<number>(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingQuota(MAX_RPM);
      setResetTimer(60);
    }, 60000);

    const countdown = setInterval(() => {
      setResetTimer(prev => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(countdown);
    };
  }, []);

  const currentTemp = currentWeather ? Number(currentWeather.temperature ?? 11) : 11;
  const windSpeed = currentWeather ? Number(currentWeather.windSpeed ?? 15) : 15;
  const humidity = currentWeather ? Number(currentWeather.humidity ?? 75) : 75;
  const condition = (currentWeather?.condition || 'Ensoleillé').toLowerCase();

  const catalogKey = activeProfile === 'adult' ? activeGender : activeProfile;
  const currentCatalog = clothingCatalog[catalogKey];

  const cacheKey = `ai_outfit_cache_${currentTemp}_${windSpeed}_${humidity}_${condition}_${activeProfile}_${activeGender}_${seed}`;

  useEffect(() => {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        setAiContent(JSON.parse(cachedData));
        setIsUsingAiMode(true);
        setUsedModelName('Cache local');
      } catch (e) {
        console.error("Erreur lecture cache outfit", e);
      }
    } else {
      setIsUsingAiMode(false);
      setAiContent(null);
      setUsedModelName('');
    }
  }, [cacheKey]);

  const handleRunAiOutfit = async () => {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      setAiContent(JSON.parse(cachedData));
      setIsUsingAiMode(true);
      setUsedModelName('Cache local');
      return;
    }

    if (remainingQuota <= 0) {
      setAiError(`Limite de requêtes atteinte (${MAX_RPM}/min). Veuillez patienter ${resetTimer}s.`);
      return;
    }

    const apiKey = localStorage.getItem('user_ai_api_key');
    if (!apiKey || apiKey.trim().length === 0) {
      setAiError("Veuillez renseigner votre clé API Gemini dans les Paramètres.");
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);
    setRemainingQuota(prev => Math.max(0, prev - 1));

    const prompt = `
    Agis en tant que styliste personnel et expert en mode. Propose des tenues vestimentaires parfaitement adaptées aux conditions météorologiques et au profil de l'utilisateur :
    - Profil : ${activeProfile} ${activeProfile === 'adult' ? `(${activeGender})` : ''}
    - Météo : ${currentTemp}°C, condition: ${condition}, vent: ${windSpeed} km/h, humidité: ${humidity}%
    - Catalogue de référence : 
      Tops disponibles : ${JSON.stringify(currentCatalog.tops.slice(0, 15))}
      Bottoms disponibles : ${JSON.stringify(currentCatalog.bottoms.slice(0, 15))}
      Vêtements extérieurs : ${JSON.stringify(currentCatalog.outerwear.slice(0, 10))}
      Chaussures : ${JSON.stringify(currentCatalog.shoes.slice(0, 10))}
      Accessoires : ${JSON.stringify(currentCatalog.accessories.slice(0, 10))}

    Renvoie UNIQUEMENT un objet JSON valide (sans balises markdown) structuré exactement ainsi pour les 3 moments de la journée :
    {
      "morning": { "tops": "...", "bottoms": "...", "outerwear": "...", "shoes": "...", "accessories": "..." },
      "afternoon": { "tops": "...", "bottoms": "...", "outerwear": "...", "shoes": "...", "accessories": "..." },
      "evening": { "tops": "...", "bottoms": "...", "outerwear": "...", "shoes": "...", "accessories": "..." }
    }
    `;

    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash-lite'
    ];

    let success = false;

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429 || (data?.error?.message && data.error.message.includes('quota'))) {
            console.warn(`Modèle ${modelName} en dépassement de quota, essai du modèle suivant...`);
            continue;
          }
          throw new Error(data?.error?.message || `Erreur API (${response.status})`);
        }

        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed: AiOutfitContent = JSON.parse(cleanJson);
          
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
          setAiContent(parsed);
          setIsUsingAiMode(true);
          setUsedModelName(modelName);
          success = true;
          break;
        }
      } catch (err: any) {
        console.warn(`Échec avec le modèle ${modelName}:`, err.message);
      }
    }

    if (!success) {
      setAiError("Tous les modèles IA ont atteint leur quota ou échoué. Basculement sur le mode standard.");
      setIsUsingAiMode(false);
      setUsedModelName('Mode Standard');
    }

    setIsGeneratingAi(false);
  };

  const pick = (arr: string[], offset: number = 0) => {
    const index = Math.abs(Math.sin(seed + offset + arr.length * 53) * 10000) % arr.length;
    return arr[Math.floor(index)];
  };

  const getFallbackPieces = (timeOffset: number = 0): OutfitSlot => ({
    tops: pick(currentCatalog.tops, timeOffset),
    bottoms: pick(currentCatalog.bottoms, timeOffset + 1),
    outerwear: pick(currentCatalog.outerwear, timeOffset + 2),
    shoes: pick(currentCatalog.shoes, timeOffset + 3),
    accessories: pick(currentCatalog.accessories, timeOffset + 4)
  });

  const morningPieces = isUsingAiMode && aiContent ? aiContent.morning : getFallbackPieces(10);
  const afternoonPieces = isUsingAiMode && aiContent ? aiContent.afternoon : getFallbackPieces(20);
  const eveningPieces = isUsingAiMode && aiContent ? aiContent.evening : getFallbackPieces(30);

  const currentHour = new Date().getHours();
  const isMatinPassed = currentHour >= 12;
  const isApmPassed = currentHour >= 17;

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full pb-20 px-0 bg-[#050811] min-h-screen">
      
      {/* 1. EN-TÊTE UNIFIÉ (Camaïeu de bleus) */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-slate-700/85 rounded-2xl p-4 shadow-md flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-2">
              <Shirt className="w-4 h-4 text-sky-300" /> Assistant Tenues & Style
            </h1>
            <p className="text-[10px] text-slate-300 font-semibold mt-0.5">
              {currentTemp}°C • {condition} {isUsingAiMode && `• 🤖 IA (${usedModelName})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-[9px] font-bold text-slate-300 shadow-sm" title="Requêtes restantes dans la minute">
            <Zap className="w-3 h-3 text-sky-300" />
            <span>{remainingQuota}/{MAX_RPM} req.</span>
          </div>

          <button
            onClick={handleRunAiOutfit}
            disabled={isGeneratingAi || remainingQuota <= 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-400 disabled:border-slate-800 text-sky-200 font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm text-[10px]"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
                <span>Cascade IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                <span>{isUsingAiMode ? 'Actualiser Look' : 'Générer avec IA'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => { setSeed(prev => prev + 1); setIsUsingAiMode(false); }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-sky-300 flex items-center gap-1 font-bold transition-all cursor-pointer shadow-sm"
            title="Varier les looks"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {aiError && (
        <div className="bg-[#0f172a] border border-sky-400/60 rounded-xl p-3 text-sky-200 text-[11px] leading-relaxed shadow-md">
          {aiError}
        </div>
      )}

      {/* 2. SÉLECTEUR DE PROFIL */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] p-1.5 border border-slate-700/85 rounded-2xl shadow-md backdrop-blur-md">
          <button
            type="button"
            onClick={() => { setActiveProfile('adult'); setIsUsingAiMode(false); }}
            className={`py-2 px-2 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
              activeProfile === 'adult' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'border-transparent text-slate-300 hover:text-white bg-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-sky-200" />
            <span>Pour Moi</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveProfile('kids'); setIsUsingAiMode(false); }}
            className={`py-2 px-2 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
              activeProfile === 'kids' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'border-transparent text-slate-300 hover:text-white bg-slate-900'
            }`}
          >
            <Baby className="w-3.5 h-3.5 text-sky-200" />
            <span>Enfants (École)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveProfile('sport'); setIsUsingAiMode(false); }}
            className={`py-2 px-2 rounded-xl font-black text-[10px] flex items-center justify-center space-x-1.5 transition-all cursor-pointer border ${
              activeProfile === 'sport' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'border-transparent text-slate-300 hover:text-white bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-200" />
            <span>Sport / Actif</span>
          </button>
        </div>

        {activeProfile === 'adult' && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] p-1.5 border border-slate-700/85 rounded-xl animate-fade-in shadow-sm backdrop-blur-md">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-wide mr-1">Style :</span>
            <button
              type="button"
              onClick={() => { setActiveGender('male'); setIsUsingAiMode(false); }}
              className={`py-1.5 px-3 rounded-lg font-black text-[9.5px] flex items-center gap-1 transition-all cursor-pointer border ${
                activeGender === 'male' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'border-slate-700 text-slate-300 hover:text-white bg-slate-900'
              }`}
            >
              <span>👨</span>
              <span>Masculin</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveGender('female'); setIsUsingAiMode(false); }}
              className={`py-1.5 px-3 rounded-lg font-black text-[9.5px] flex items-center gap-1 transition-all cursor-pointer border ${
                activeGender === 'female' ? 'bg-sky-600 border-sky-300 text-white shadow-sm' : 'border-slate-700 text-slate-300 hover:text-white bg-slate-900'
              }`}
            >
              <span>👩</span>
              <span>Féminin</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SECTIONS HORAIRES */}
      <div className="space-y-4">
        {!isMatinPassed ? (
          <TimeSlotCard 
            title="🌅 Matin (08h00 - 12h00)" 
            subtitle="Fraîcheur matinale & départ"
            pieces={morningPieces} 
          />
        ) : isApmPassed ? (
          <TimeSlotCard 
            title="🌅 Matin Prochain (Demain 08h00 - 12h00)" 
            subtitle="Anticipation pour demain"
            pieces={morningPieces} 
          />
        ) : null}

        {!isApmPassed && (
          <TimeSlotCard 
            title="☀️ Après-midi (12h00 - 17h00)" 
            subtitle="Plein cœur de journée"
            pieces={afternoonPieces} 
          />
        )}

        {isApmPassed && (
          <TimeSlotCard 
            title="🌙 Soirée (Après 17h00)" 
            subtitle="Détente ou sortie nocturne"
            pieces={eveningPieces} 
          />
        )}
      </div>

    </div>
  );
};

const TimeSlotCard = ({ title, subtitle, pieces }: { title: string; subtitle: string; pieces: OutfitSlot }) => (
  <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-slate-700/85 rounded-2xl p-4 shadow-md space-y-3 backdrop-blur-md">
    <div className="flex items-center justify-between border-b border-slate-700/85 pb-2">
      <h2 className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-sky-300" />
        {title}
      </h2>
      <span className="text-[9px] text-slate-300 italic font-semibold">{subtitle}</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wide">👕 Hauts / Couches</span>
        <p className="text-xs text-white font-bold">{pieces?.tops}</p>
      </div>

      <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wide">👖 Bas / Pantalon</span>
        <p className="text-xs text-white font-bold">{pieces?.bottoms}</p>
      </div>

      <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wide">🧥 Veste / Manteau</span>
        <p className="text-xs text-white font-bold">{pieces?.outerwear}</p>
      </div>

      <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 space-y-1 shadow-sm">
        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wide">👞 Chaussures</span>
        <p className="text-xs text-white font-bold">{pieces?.shoes}</p>
      </div>

      <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 space-y-1 sm:col-span-2 shadow-sm">
        <span className="text-[9px] font-black text-sky-300 uppercase tracking-wide">🧣 Accessoires Indispensables</span>
        <p className="text-xs text-white font-bold">{pieces?.accessories}</p>
      </div>
    </div>
  </div>
);

export default AssistantDetailPage;