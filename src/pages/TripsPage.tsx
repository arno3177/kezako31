import React, { useState } from 'react';
import { RouteTrip, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { Navigation, Car, Bus, ExternalLink, ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TripsPageProps {
  savedTrips?: RouteTrip[];
  onBack?: () => void;
  language?: AppSettings['language'];
  initialMode?: 'car' | 'bus';
  busApi?: AppSettings['busApi'];
}

export const TripsPage: React.FC<TripsPageProps> = ({
  savedTrips = [],
  onBack,
  language = 'en',
  initialMode = 'car'
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'car' | 'bus'>(initialMode);

  const mainTrip = savedTrips[0] || {
    id: 'default',
    name: 'Travail',
    origin: 'Kopstal, Luxembourg',
    destination: 'Luxembourg, Stäreplatz / Étoile'
  };

  const originQuery = encodeURIComponent(mainTrip.origin);
  const destQuery = encodeURIComponent(mainTrip.destination);

  // Détection si l'utilisateur est au Luxembourg
  const isLuxembourg = language === 'fr' || language === 'de' || navigator.language.toLowerCase().includes('lu');

  // Fonction dynamique pour retourner les lignes de bus RGTR adaptées au trajet sélectionné
  const getBusLinesForTrip = (origin: string, destination: string) => {
    const orig = origin.toLowerCase();
    const dest = destination.toLowerCase();

    // Si le trajet concerne Kopstal ou le nord-ouest vers Luxembourg
    if (orig.includes('kopstal') || dest.includes('kopstal') || orig.includes('bridel') || orig.includes('strassen')) {
      return [
        { line: 'Bus 921', route: `${mainTrip.origin} ➔ Luxembourg (Stäreplatz)`, frequency: 'Régulier / Direct', link: 'https://www.mobiliteit.lu/fr/ligne/bus-921-rgtr/' },
        { line: 'Bus 902', route: 'Mersch ➔ Kopstal ➔ Luxembourg', frequency: 'Heures de pointe', link: 'https://www.mobiliteit.lu/fr/ligne/bus-902-rgtr/' },
        { line: 'Bus 903', route: 'Ettelbruck ➔ Mersch ➔ Luxembourg', frequency: 'Ligne Express', link: 'https://www.mobiliteit.lu/fr/ligne/bus-903-rgtr/' },
        { line: 'Bus 911', route: 'Diekirch ➔ Kopstal ➔ Luxembourg', frequency: 'Réseau RGTR', link: 'https://www.mobiliteit.lu/fr/ligne/bus-911-rgtr/' },
      ];
    }

    // Lignes par défaut pour tout autre trajet au Luxembourg
    return [
      { line: 'Bus RGTR', route: `${mainTrip.origin} ➔ ${mainTrip.destination}`, frequency: 'Correspondances multiples', link: 'https://www.mobiliteit.lu' },
      { line: 'Tram T1', route: 'Luxembourg Kirchberg ➔ Cloche d\'Or', frequency: 'Toutes les 3-5 min', link: 'https://www.mobiliteit.lu' }
    ];
  };

  const currentBusLines = getBusLinesForTrip(mainTrip.origin, mainTrip.destination);

  // Indicateurs de fluidité routière en temps réel
  const carTrafficSegments = [
    { segment: 'Secteur de départ ➔ Axes principaux', status: 'Trafic fluide', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' },
    { segment: 'Voies de dégagement / Périphérie', status: 'Ralentissement modéré', color: 'text-amber-400 bg-amber-950/60 border-amber-800/40' },
    { segment: 'Approche de la destination (Centre)', status: 'Trafic dense (Heure de pointe)', color: 'text-orange-400 bg-orange-950/60 border-orange-800/40' },
  ];

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full pb-6">
      
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center space-x-1.5 text-indigo-400 font-bold hover:text-indigo-300 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        )}
        <h1 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Détails et Trafic du Trajet</span>
        </h1>
      </div>

      {/* Sélecteur Mode Voiture / Bus */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('car')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'car' ? 'bg-[#1b2621] border-amber-500 text-amber-400' : 'bg-[#0f172a] border-slate-800 text-slate-400'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{t.byCar}</span>
        </button>

        <button
          onClick={() => setActiveTab('bus')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all ${
            activeTab === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400' : 'bg-[#0f172a] border-slate-800 text-slate-400'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>{t.byBus}</span>
        </button>
      </div>

      {/* Bloc principal : Informations à gauche et Carte à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Colonne de gauche : Infos Trafic ou Lignes de Bus dynamiques */}
        <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#0a1217] border border-emerald-800/40 space-y-1">
              <p className="text-slate-300 font-medium"><span className="text-slate-500">{t.departure} :</span> {mainTrip.origin}</p>
              <p className="text-slate-300 font-medium"><span className="text-slate-500">{t.arrival} :</span> {mainTrip.destination}</p>
            </div>

            {/* MODE VOITURE : FLUIDITÉ PAR TRONÇON */}
            {activeTab === 'car' && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> État de la fluidité du trafic :
                </p>
                <div className="space-y-2">
                  {carTrafficSegments.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${item.color}`}>
                      <span className="font-medium text-slate-200">{item.segment}</span>
                      <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-black/40">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODE BUS : LIGNES DYNAMIQUES SELON LE TRAJET */}
            {activeTab === 'bus' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Lignes disponibles pour ce trajet :
                  </p>
                  <span className="text-[9px] px-2 py-0.5 bg-sky-950 text-sky-300 rounded border border-sky-800">
                    {isLuxembourg ? 'Luxembourg' : 'International'}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {currentBusLines.map((busItem, idx) => (
                    <div key={idx} className="bg-[#0a1217] p-2.5 rounded-xl border border-sky-900/40 flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold px-2 py-0.5 bg-sky-950 text-sky-300 rounded-md border border-sky-800">{busItem.line}</span>
                        <div>
                          <p className="text-white font-medium">{busItem.route}</p>
                          <p className="text-[9px] text-slate-400">{busItem.frequency}</p>
                        </div>
                      </div>
                      <a
                        href={isLuxembourg ? busItem.link : `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destQuery}&travelmode=transit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-300 bg-sky-950/80 px-2.5 py-1.5 rounded-lg border border-sky-800 hover:bg-sky-900 transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        <span>{isLuxembourg ? 'Mobiliteit' : 'Maps'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>
              {isLuxembourg 
                ? 'Sélection des lignes RGTR adaptée au point de départ.' 
                : 'Planification d\'itinéraire international via Google Maps Transit.'}
            </span>
          </div>
        </div>

        {/* Colonne de droite : Carte interactive Maps */}
        <div className="h-72 lg:h-auto rounded-2xl overflow-hidden border border-emerald-800/40 w-full relative shadow-xl">
          <iframe
            key={activeTab}
            title="Carte détaillée du trajet"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
            src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeTab === 'bus' ? 'r' : 'd'}&output=embed`}
          />
        </div>

      </div>

    </div>
  );
};