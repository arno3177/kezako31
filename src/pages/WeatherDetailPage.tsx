import React, { useState, useEffect } from 'react';
import { WeatherData, TemperatureUnit } from '../types';
import { 
  Sun, Cloud, CloudSun, CloudRain, MapPin, 
  Activity, Bike, Trees, Gauge, ShieldCheck, Thermometer, BarChart3, ChevronDown, ChevronUp, Check, X, ShieldAlert, Building2, Droplets, Wind, Settings, TrendingUp, Flower2
} from 'lucide-react';

interface WeatherDetailPageProps {
  currentWeather: WeatherData;
  citiesList?: string[];
  activeCity?: string;
  unit?: TemperatureUnit;
  onSelectCity?: (city: string) => void;
  onOpenSettings?: () => void;
}

type ChartMetric = 'hourly' | 'dailyTemp' | 'aqi' | 'uv' | 'activities';

export const WeatherDetailPage: React.FC<WeatherDetailPageProps> = ({ 
  currentWeather,
  citiesList = ['Paris', 'Montréal', 'Tokyo', 'Genève', 'Londres', 'New York'],
  activeCity = 'Paris',
  unit = 'C',
  onSelectCity,
  onOpenSettings
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('hourly');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Défilement automatique en haut de la page au chargement du composant ou changement de ville
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentWeather?.city]);

  if (!currentWeather) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400 text-xs">
        Chargement des données météo...
      </div>
    );
  }

  // --- GÉNÉRATION EXACTE DES 13 CRÉNEAUX (H à H+12) ---
  const currentHour = new Date().getHours();
  const allHourly = currentWeather.hourly || [];

  const futureHourly = Array.from({ length: 13 }, (_, i) => {
    const targetHour = (currentHour + i) % 24;
    const timeLabel = `${targetHour.toString().padStart(2, '0')}h00`;

    // Cherche si la donnée existe déjà pour cette heure
    const existing = allHourly.find(h => {
      const itemHour = parseInt(h.time.replace('h', '').replace(':00', ''), 10);
      return itemHour === targetHour;
    });

    if (existing) {
      return { ...existing, time: timeLabel };
    }

    // Valeur de repli si l'heure n'est pas présente dans l'index
    const baseTemp = currentWeather.temperature || 20;
    return {
      time: timeLabel,
      temp: baseTemp + Math.round(Math.sin((targetHour - 6) / 3) * 3),
      condition: currentWeather.condition || 'Ensoleillé',
      pop: Math.max(0, Math.min(100, (currentWeather.humidity || 50) - 20))
    };
  });

  const formatTemp = (tempC: number) => {
    if (unit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°`;
    }
    return `${tempC}°`;
  };

  const getAqiBadge = (aqi: number) => {
    if (aqi <= 50) return { label: 'Bon', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (aqi <= 100) return { label: 'Modéré', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    return { label: 'Médiocre', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' };
  };

  const renderTempBadge = (tempC: number) => {
    if (tempC > 32) return <span className="text-xs animate-pulse" title="Chaleur extrême (>32°C)">🔥</span>;
    if (tempC < 4) return <span className="text-xs animate-pulse" title="Risque de gel (<4°C)">❄️</span>;
    return null;
  };

  const renderConditionIcon = (condition: string, className = "w-3.5 h-3.5") => {
    const cond = condition.toLowerCase();
    if (cond.includes('soleil') || cond.includes('ensoleillé') || cond.includes('dégagé') || cond.includes('clear')) {
      return <Sun className={`${className} text-amber-400`} />;
    }
    if (cond.includes('pluie') || cond.includes('averse') || cond.includes('orage') || cond.includes('rain')) {
      return <CloudRain className={`${className} text-blue-400`} />;
    }
    if (cond.includes('nuage') || cond.includes('couvert') || cond.includes('cloud')) {
      return <Cloud className={`${className} text-gray-300`} />;
    }
    return <CloudSun className={`${className} text-sky-300`} />;
  };

  const renderSimpleSparkline = (
    data: { label: string; value: number }[], 
    color: string, 
    valueFormatter: (val: number) => string
  ) => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    const width = 300;
    const height = 50;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.value - min) / range) * (height - 12) - 6;
      return { x, y, label: d.label, val: d.value };
    });

    const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, '');

    return (
      <div className="w-full space-y-1">
        <div className="h-16 w-full flex items-center justify-center pt-2">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="3" fill="#11131c" stroke={color} strokeWidth="2" className="transition-all group-hover:r-5" />
                <text x={p.x} y={p.y - 7} textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  {valueFormatter(p.val)}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="flex justify-between text-[8px] text-gray-500 font-medium px-1">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const aqiInfo = getAqiBadge(currentWeather.airQuality?.aqi || 35);
  const currentUv = currentWeather.uvIndex || 4;

  const forecastData = currentWeather.forecast || [];
  const tempTrend = forecastData.map(f => ({ label: f.day, value: f.tempMax }));
  const feelsLikeTrend = forecastData.map(f => ({ label: f.day, value: f.tempMax - 2 }));
  const humidityTrend = forecastData.map((f, i) => ({ label: f.day, value: Math.min(95, Math.max(30, (currentWeather.humidity || 65) + ((i * 12) % 35) - 15)) }));
  const pollenTrend = forecastData.map((f, i) => ({ label: f.day, value: Math.min(100, Math.max(10, 40 + ((i * 17) % 55))) }));

  const renderBarChart = () => {
    switch (activeMetric) {
      case 'hourly': {
        const temps = futureHourly.map(h => h.temp);
        const maxVal = Math.max(...temps, 1);
        return (
          <div className="flex items-end justify-between gap-2 h-56 pt-8 pb-2 px-2 overflow-x-auto scrollbar-thin">
            {futureHourly.map((h, i) => {
              const heightPct = Math.max(22, Math.round((h.temp / maxVal) * 100));
              const tempBadge = renderTempBadge(h.temp);
              return (
                <div key={i} className="flex-1 min-w-[36px] max-w-[50px] flex flex-col items-center h-full justify-end group">
                  <div className="flex flex-col items-center mb-1.5 space-y-0.5">
                    <div className="h-4 flex items-center justify-center">
                      {tempBadge}
                    </div>
                    {renderConditionIcon(h.condition, "w-3.5 h-3.5")}
                  </div>

                  <div className="w-full bg-[#11131c] rounded-t-lg h-full flex items-end p-1 border border-white/5">
                    <div 
                      style={{ height: `${heightPct}%` }} 
                      className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-125 flex items-center justify-center p-0.5 overflow-hidden ${
                        h.temp > 32 ? 'bg-gradient-to-t from-orange-600 to-amber-400' :
                        h.temp < 4 ? 'bg-gradient-to-t from-sky-600 to-cyan-300' :
                        'bg-gradient-to-t from-indigo-600 to-sky-400'
                      }`}
                    >
                      <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tighter">
                        {formatTemp(h.temp)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-gray-400 mt-1.5">{h.time}</span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'dailyTemp': {
        const tempsMax = currentWeather.forecast?.map(f => f.tempMax) || [];
        const maxVal = Math.max(...tempsMax, 1);
        return (
          <div className="flex items-end justify-between gap-3 h-56 pt-8 pb-2 px-2 overflow-x-auto scrollbar-thin">
            {currentWeather.forecast?.map((f, i) => {
              const maxPct = Math.max(24, Math.round((f.tempMax / maxVal) * 100));
              const minPct = Math.max(18, Math.round((f.tempMin / maxVal) * 100));
              const maxBadge = renderTempBadge(f.tempMax);
              const minBadge = renderTempBadge(f.tempMin);

              return (
                <div key={i} className="flex-1 min-w-[54px] max-w-[72px] flex flex-col items-center h-full justify-end group">
                  <div className="flex flex-col items-center mb-1.5 space-y-0.5">
                    <div className="h-4 flex items-center space-x-1 justify-center">
                      {maxBadge}
                      {minBadge}
                    </div>
                    {renderConditionIcon(f.condition, "w-3.5 h-3.5")}
                  </div>

                  <div className="w-full bg-[#11131c] rounded-t-lg h-full flex items-end justify-center gap-1 p-1 border border-white/5">
                    <div 
                      style={{ height: `${maxPct}%` }} 
                      className={`w-1/2 rounded-t-sm transition-all flex items-center justify-center p-0.5 overflow-hidden ${
                        f.tempMax > 32 ? 'bg-gradient-to-t from-red-600 to-orange-400' : 'bg-gradient-to-t from-amber-600 to-amber-400'
                      }`}
                      title={`Max : ${formatTemp(f.tempMax)}`}
                    >
                      <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tighter">
                        {formatTemp(f.tempMax)}
                      </span>
                    </div>

                    <div 
                      style={{ height: `${minPct}%` }} 
                      className={`w-1/2 rounded-t-sm transition-all flex items-center justify-center p-0.5 overflow-hidden ${
                        f.tempMin < 4 ? 'bg-gradient-to-t from-blue-700 to-cyan-400' : 'bg-gradient-to-t from-sky-700 to-sky-400'
                      }`}
                      title={`Min : ${formatTemp(f.tempMin)}`}
                    >
                      <span className="text-[9px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tighter">
                        {formatTemp(f.tempMin)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 mt-1.5">{f.day}</span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'aqi': {
        const baseAqi = currentWeather.airQuality?.aqi || 35;
        return (
          <div className="flex items-end justify-between gap-3 h-48 pt-8 pb-2 px-2 overflow-x-auto scrollbar-thin">
            {currentWeather.forecast?.map((f, i) => {
              const val = Math.max(10, Math.min(150, baseAqi + ((i * 8) % 30) - 10));
              const heightPct = Math.min(100, Math.round((val / 150) * 100));
              return (
                <div key={i} className="flex-1 min-w-[40px] max-w-[60px] flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-extrabold text-emerald-400 mb-1">{val}</span>
                  <div className="w-full bg-[#11131c] rounded-t-lg h-full flex items-end p-1 border border-white/5">
                    <div 
                      style={{ height: `${heightPct}%` }} 
                      className={`w-full rounded-t-md transition-all ${
                        val <= 50 ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' :
                        val <= 100 ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                        'bg-gradient-to-t from-pink-600 to-pink-400'
                      }`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-gray-300 mt-1.5">{f.day}</span>
                </div>
              );
            })}
          </div>
        );
      }

      case 'uv': {
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1 border-b border-gray-800/60 pb-2">
              <span className="text-amber-400 font-bold">Indice UV Journalier</span>
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1 text-amber-400 font-bold">
                  <span className="text-xs">🧴</span>
                  <span>Crème requise (UV ≥ 3)</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3" />
                  <span>Pas besoin (UV &lt; 3)</span>
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 h-48 pb-2 px-2 overflow-x-auto scrollbar-thin">
              {currentWeather.forecast?.map((f, i) => {
                const uv = f.uvIndex || 4;
                const heightPct = Math.min(100, Math.round((uv / 11) * 100));
                const needsSunscreen = uv >= 3;

                return (
                  <div key={i} className="flex-1 min-w-[50px] max-w-[70px] flex flex-col items-center h-full justify-end group">
                    <div className="mb-1 flex flex-col items-center gap-0.5">
                      <div 
                        className={`p-1 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          needsSunscreen ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                        title={needsSunscreen ? "Crème solaire recommandée" : "Pas de protection requise"}
                      >
                        {needsSunscreen ? <span className="text-xs leading-none">🧴</span> : <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-400">UV {uv}</span>
                    </div>

                    <div className="w-full bg-[#11131c] rounded-t-lg h-full flex items-end p-1 border border-white/5">
                      <div 
                        style={{ height: `${heightPct}%` }} 
                        className="w-full bg-gradient-to-t from-amber-600 to-yellow-300 rounded-t-md transition-all hover:brightness-125"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 mt-1.5">{f.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'activities': {
        const baseFitness = currentWeather.activities?.fitness?.score || 85;
        const baseTennis = currentWeather.activities?.tennis?.score || 90;
        const baseCycling = currentWeather.activities?.cycling?.score || 80;
        const baseWalk = currentWeather.activities?.forestWalk?.score || 95;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[9px] text-gray-400 pt-1 border-b border-gray-800/60 pb-2">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span>Fitness</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span>Tennis</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span><span>Vélo</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>Forêt</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-0.5 text-emerald-400 font-bold"><Check className="w-3 h-3" /><span>Bon (&ge;70%)</span></span>
                <span className="flex items-center space-x-0.5 text-rose-400 font-bold"><X className="w-3 h-3" /><span>Pas bon (&lt;70%)</span></span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 h-48 pb-2 px-1 overflow-x-auto scrollbar-thin">
              {currentWeather.forecast?.map((f, i) => {
                const fitScore = Math.min(100, Math.max(20, baseFitness + ((i * 7) % 20) - 10));
                const tenScore = Math.min(100, Math.max(20, baseTennis + ((i * 9) % 25) - 12));
                const cycScore = Math.min(100, Math.max(20, baseCycling + ((i * 5) % 30) - 15));
                const walkScore = Math.min(100, Math.max(20, baseWalk + ((i * 11) % 15) - 5));

                const acts = [
                  { name: 'Fitness', score: fitScore, color: 'bg-indigo-500' },
                  { name: 'Tennis', score: tenScore, color: 'bg-amber-400' },
                  { name: 'Vélo', score: cycScore, color: 'bg-sky-400' },
                  { name: 'Forêt', score: walkScore, color: 'bg-emerald-400' }
                ];

                return (
                  <div key={i} className="flex-1 min-w-[85px] max-w-[110px] flex flex-col items-center h-full justify-end group">
                    <div className="w-full bg-[#11131c] rounded-t-lg h-full flex items-end justify-between gap-1 p-1 border border-white/5">
                      {acts.map((act, actIdx) => {
                        const isGood = act.score >= 70;
                        return (
                          <div 
                            key={actIdx} 
                            className="w-1/4 h-full flex flex-col items-center justify-end relative"
                            title={`${act.name} : ${act.score}% (${isGood ? 'Bon' : 'Pas bon'})`}
                          >
                            <div className={`mb-1 p-0.5 rounded-full flex items-center justify-center ${
                              isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {isGood ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <X className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>

                            <div 
                              style={{ height: `${act.score}%` }} 
                              className={`w-full ${act.color} rounded-t-sm transition-all hover:brightness-125`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-[9px] font-bold text-gray-300 mt-1.5">{f.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 animate-fade-in pb-10 text-xs">
      
      {/* 1. BARRE DE NAVIGATION STICKY */}
      <div className="sticky top-0 z-30 bg-[#161923]/95 backdrop-blur-md border border-gray-800/90 rounded-xl p-2 shadow-xl flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none flex-1">
          <div className="flex items-center space-x-1.5 text-indigo-400 px-2 flex-shrink-0">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Villes :</span>
          </div>
          <div className="flex items-center space-x-1.5 flex-nowrap">
            {citiesList.map((city, idx) => {
              const isActive = city.toLowerCase() === currentWeather.city.toLowerCase() || city.toLowerCase() === activeCity.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => onSelectCity && onSelectCity(city)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-md scale-105' 
                      : 'bg-[#11131c] text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 bg-[#11131c] border border-gray-800 text-gray-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 rounded-lg transition-all flex-shrink-0 shadow-sm cursor-pointer"
          title="Gérer les villes et unités"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 2. EN-TÊTE DE VILLE COMPACT */}
      <div className="bg-gradient-to-r from-[#181b26] via-[#141722] to-[#11131c] border border-gray-800/90 rounded-xl px-3.5 py-2 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">{currentWeather.city}</h1>
              <span className="text-[10px] text-gray-400 font-medium bg-gray-800/60 px-1.5 py-0.5 rounded border border-gray-700/50">
                {currentWeather.country}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium capitalize mt-0.5">
              {currentWeather.condition}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-4 text-[10px] text-gray-400 bg-[#0f1118]/60 px-3 py-1 rounded-lg border border-white/5">
          <div className="flex items-center space-x-1" title="Humidité">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span className="font-semibold text-gray-300">{currentWeather.humidity}%</span>
          </div>
          <span className="text-gray-700">|</span>
          <div className="flex items-center space-x-1" title="Vitesse du vent">
            <Wind className="w-3 h-3 text-indigo-400" />
            <span className="font-semibold text-gray-300">{currentWeather.windSpeed} km/h</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-lg font-black text-white tracking-tight">{formatTemp(currentWeather.temperature)}</span>
          {renderTempBadge(currentWeather.temperature)}
        </div>
      </div>

      {/* 3. DIAGRAMME À BARRES */}
      <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div className="flex items-center space-x-2 text-indigo-400">
            <BarChart3 className="w-4 h-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Diagramme Météo & Tendances</h2>
          </div>

          <div className="flex items-center space-x-1 bg-[#11131c] p-1 rounded-xl border border-gray-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveMetric('hourly')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMetric === 'hourly' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Heure par Heure
            </button>
            <button
              onClick={() => setActiveMetric('dailyTemp')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMetric === 'dailyTemp' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Temp Max / Min
            </button>
            <button
              onClick={() => setActiveMetric('aqi')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMetric === 'aqi' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              AQI / Jour
            </button>
            <button
              onClick={() => setActiveMetric('uv')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMetric === 'uv' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              UV / Jour
            </button>
            <button
              onClick={() => setActiveMetric('activities')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeMetric === 'activities' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Activités / Jour
            </button>
          </div>
        </div>

        {renderBarChart()}
      </div>

      {/* 4. SECTION DÉPLIABLE */}
      <div className="border border-gray-800 rounded-2xl bg-[#161923] overflow-hidden shadow-lg transition-all">
        <button
          onClick={() => setIsDetailsOpen(prev => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-[#181b26] hover:bg-[#1d212f] text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2 text-indigo-400">
            <Thermometer className="w-4 h-4" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {isDetailsOpen ? 'Masquer les prévisions détaillées' : 'Afficher les prévisions heure par heure, 7 jours & graphiques de tendances'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400 text-[11px]">
            <span>{isDetailsOpen ? 'Fermer' : 'Déplier'}</span>
            {isDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isDetailsOpen && (
          <div className="p-4 space-y-4 border-t border-gray-800/80 animate-fade-in">

            {/* Heure par heure */}
            <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                <Thermometer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Prévisions Heure par Heure</span>
              </h2>
              
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                {futureHourly.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 flex flex-col items-center justify-between p-2 rounded-xl bg-[#1b1f2b] border border-white/5 w-16 text-center space-y-1"
                  >
                    <span className="text-[10px] font-medium text-gray-400">{item.time}</span>
                    <div className="my-0.5">
                      {renderConditionIcon(item.condition, "w-4 h-4")}
                    </div>
                    <div className="text-xs font-bold text-white flex items-center justify-center gap-0.5">
                      <span>{formatTemp(item.temp)}</span>
                      {renderTempBadge(item.temp)}
                    </div>
                    <span className="text-[9px] text-blue-400">{item.pop}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7 Jours Max / Min */}
            <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                <CloudSun className="w-3.5 h-3.5 text-sky-400" />
                <span>Prévisions 7 Jours (Max / Min)</span>
              </h2>
              
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
                {currentWeather.forecast?.map((f, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 flex flex-col items-center justify-between p-2 rounded-xl bg-[#1b1f2b] border border-white/5 w-24 text-center space-y-1"
                  >
                    <span className="text-xs font-bold text-white">{f.day}</span>
                    <span className="text-[9px] text-gray-400">{f.date}</span>
                    <div className="my-0.5">
                      {renderConditionIcon(f.condition, "w-4 h-4")}
                    </div>
                    <span className="text-[9px] text-gray-300 truncate w-full">{f.condition}</span>
                    
                    <div className="text-xs font-extrabold flex items-center space-x-1 justify-center pt-0.5">
                      <span className="text-amber-400 flex items-center gap-0.5" title="Température Max">
                        {formatTemp(f.tempMax)} {renderTempBadge(f.tempMax)}
                      </span>
                      <span className="text-gray-500 font-normal">/</span>
                      <span className="text-sky-300 flex items-center gap-0.5" title="Température Min">
                        {formatTemp(f.tempMin)} {renderTempBadge(f.tempMin)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AQI & UV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Qualité de l'Air (AQI)</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold ${aqiInfo.color}`}>
                    {aqiInfo.label}
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">{currentWeather.airQuality?.aqi || 35}</span>
                  <span className="text-[10px] text-gray-400">/ 500 AQI</span>
                </div>
              </div>

              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <Sun className="w-4 h-4" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Indice UV</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold flex items-center space-x-1 ${
                    currentUv >= 3 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {currentUv >= 3 ? <span className="text-xs">🧴</span> : <Check className="w-3 h-3" />}
                    <span>{currentUv >= 3 ? 'Crème requise' : 'Pas besoin'}</span>
                  </span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-extrabold text-white">{currentUv}</span>
                  <span className="text-[10px] text-gray-400">/ 11+ Max</span>
                </div>
              </div>
            </div>

            {/* Activités */}
            <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Météo & Activités</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-indigo-400">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold text-white">Fitness</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{currentWeather.activities?.fitness?.score || 85}%</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <Gauge className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold text-white">Tennis</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{currentWeather.activities?.tennis?.score || 90}%</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-sky-400">
                    <Bike className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold text-white">Vélo</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{currentWeather.activities?.cycling?.score || 80}%</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1b1f2b] border border-white/5 space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Trees className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold text-white">Forêt</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{currentWeather.activities?.forestWalk?.score || 95}%</div>
                </div>
              </div>
            </div>

            {/* 4 Graphiques simples de tendances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Tendance Température (°C)</h3>
                </div>
                {renderSimpleSparkline(tempTrend, '#f59e0b', val => formatTemp(val))}
              </div>

              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-pink-400 mb-1">
                  <Thermometer className="w-3.5 h-3.5" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Tendance Ressentie (°C)</h3>
                </div>
                {renderSimpleSparkline(feelsLikeTrend, '#ec4899', val => formatTemp(val))}
              </div>

              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-sky-400 mb-1">
                  <Droplets className="w-3.5 h-3.5" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Tendance Humidité (%)</h3>
                </div>
                {renderSimpleSparkline(humidityTrend, '#38bdf8', val => `${val}%`)}
              </div>

              <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 mb-1">
                  <Flower2 className="w-3.5 h-3.5" />
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Allergies au Pollen (Score)</h3>
                </div>
                {renderSimpleSparkline(pollenTrend, '#10b981', val => `${val}/100`)}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};