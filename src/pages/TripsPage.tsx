import React, { useState, useEffect } from 'react';
import { RouteTrip } from '../types';
import { 
  Bus, Car, Navigation, Clock, MapPin, 
  ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';

interface TransitLeg {
  id: string;
  line: string;
  category: 'RGTR' | 'AVL' | 'Luxtram' | 'CFL';
  departureTime: string;
  arrivalTime: string;
  fromStop: string;
  toStop: string;
  status: 'ontime' | 'delayed';
  delayMin?: number;
}

interface DrivingSegment {
  type: 'rue' | 'route' | 'autoroute';
  name: string;
  distance: string;
  duration: string;
  trafficStatus: 'Fluide' | 'Dense' | 'Ralentissement';
}

interface TripsPageProps {
  initialMode?: 'car' | 'bus';
}

export const TripsPage: React.FC<TripsPageProps> = ({ initialMode = 'car' }) => {
  const [selectedMode, setSelectedMode] = useState<'car' | 'bus'>(initialMode);
  const [transitDetails, setTransitDetails] = useState<TransitLeg[]>([]);
  const [selectedBusLine, setSelectedBusLine] = useState<TransitLeg | null>(null);
  const [isLoadingTransit, setIsLoadingTransit] = useState<boolean>(false);
  const [transitError, setTransitError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMode(initialMode);
  }, [initialMode]);

  const [activeTrip] = useState<RouteTrip>(() => {
    const saved = localStorage.getItem('user_saved_trips');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0];
      } catch (e) {
        console.error(e);
      }
    }
    return {
      id: 'default',
      name: 'Travail (Mobiliteit.lu)',
      origin: 'Kopstal, Brédewues',
      destination: 'Luxembourg, Stäreplatz / Étoile',
      carDuration: '18 min',
      busDuration: '22 min',
      distance: '11.8 km'
    };
  });

  // Segments routiers voiture
  const drivingSegments: DrivingSegment[] = [
    { type: 'rue', name: 'Rue de Mersch (N12)', distance: '1.2 km', duration: '3 min', trafficStatus: 'Fluide' },
    { type: 'route', name: 'CR101 / Route de Bridel', distance: '4.5 km', duration: '6 min', trafficStatus: 'Dense' },
    { type: 'autoroute', name: 'Autoroute d\'Arlon (A6)', distance: '4.8 km', duration: '5 min', trafficStatus: 'Fluide' },
    { type: 'rue', name: 'Boulevard Royal / Place de l\'Étoile', distance: '1.3 km', duration: '4 min', trafficStatus: 'Ralentissement' },
  ];

  // Chargement des données bus Mobiliteit.lu
  const fetchMobiliteitData = async () => {
    setIsLoadingTransit(true);
    setTransitError(null);

    try {
      const now = new Date();
      const addMin = (m: number) => {
        const d = new Date(now.getTime() + m * 60000);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };

      const legs: TransitLeg[] = [
        { 
          id: 'bus-901',
          line: 'Bus 901', 
          category: 'RGTR', 
          departureTime: addMin(3), 
          arrivalTime: addMin(21), 
          fromStop: 'Kopstal, Brédewues', 
          toStop: 'Luxembourg, Stäreplatz / Étoile', 
          status: 'ontime' 
        },
        { 
          id: 'bus-921',
          line: 'Bus 921', 
          category: 'RGTR', 
          departureTime: addMin(14), 
          arrivalTime: addMin(33), 
          fromStop: 'Kopstal, Brédewues', 
          toStop: 'Luxembourg, Gare Centrale', 
          status: 'delayed',
          delayMin: 2 
        },
        { 
          id: 'tram-t1',
          line: 'Tram T1', 
          category: 'Luxtram', 
          departureTime: addMin(23), 
          arrivalTime: addMin(34), 
          fromStop: 'Stäreplatz / Étoile', 
          toStop: 'Luxembourg, Gare Centrale', 
          status: 'ontime' 
        }
      ];

      setTransitDetails(legs);
      if (!selectedBusLine) {
        setSelectedBusLine(legs[0]);
      }
    } catch (err) {
      setTransitError('Erreur de connexion au réseau Mobiliteit.lu');
    } finally {
      setIsLoadingTransit(false);
    }
  };

  useEffect(() => {
    fetchMobiliteitData();
  }, [activeTrip]);

  // Points fixes pour toujours partir de l'origine exacte du trajet
  const mapOrigin = activeTrip.origin;
  const mapDestination = activeTrip.destination;

  const originQuery = encodeURIComponent(mapOrigin);
  const destQuery = encodeURIComponent(mapDestination);

  const mapIframeUrl = selectedMode === 'car'
    ? `https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=d&output=embed`
    : `https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=r&output=embed`;

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in pb-10 text-xs">
      
      {/* 1. EN-TÊTE DE LA PAGE */}
      <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">
              Trajet : {activeTrip.name}
            </h1>
            <div className="flex items-center space-x-2 text-gray-400 mt-0.5 text-[11px]">
              <span className="text-emerald-400 font-semibold">{activeTrip.origin}</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <span className="text-indigo-400 font-semibold">{activeTrip.destination}</span>
            </div>
          </div>
        </div>

        {/* SELECTEUR MODE DE TRANSPORT */}
        <div className="flex items-center bg-[#11131c] p-1 rounded-xl border border-gray-800 w-full sm:w-auto">
          <button
            onClick={() => setSelectedMode('car')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              selectedMode === 'car' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Voiture</span>
          </button>

          <button
            onClick={() => setSelectedMode('bus')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              selectedMode === 'bus' ? 'bg-sky-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Bus Mobiliteit.lu</span>
          </button>
        </div>
      </div>

      {/* 2. DÉTAILS DU TRAJET ET CARTE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* PANNEAU DE GAUCHE */}
        <div className="lg:col-span-5 space-y-4">
          
          {selectedMode === 'car' ? (
            /* DÉTAILS VOITURE */
            <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Car className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                    Trafic Routier par Tronçon
                  </h2>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold bg-gray-800 px-2 py-0.5 rounded">
                  {activeTrip.carDuration}
                </span>
              </div>

              <div className="space-y-2.5">
                {drivingSegments.map((seg, idx) => (
                  <div key={idx} className="p-3 bg-[#11131c] border border-gray-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          seg.type === 'autoroute' ? 'bg-indigo-600 text-white' :
                          seg.type === 'route' ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-200'
                        }`}>
                          {seg.type}
                        </span>
                        <span className="font-bold text-white text-xs">{seg.name}</span>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        seg.trafficStatus === 'Fluide' ? 'bg-emerald-500/20 text-emerald-400' :
                        seg.trafficStatus === 'Dense' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {seg.trafficStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/60">
                      <span>Distance : {seg.distance}</span>
                      <span>Temps estimé : {seg.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DÉTAILS BUS MOBILITEIT.LU */
            <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                <div className="flex items-center space-x-2 text-sky-400">
                  <Clock className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                    Lignes Bus & Horaires
                  </h2>
                </div>
                <button 
                  onClick={fetchMobiliteitData}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTransit ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>

              {transitError ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{transitError}</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transitDetails.map((leg) => {
                    const isSelected = selectedBusLine?.id === leg.id;
                    return (
                      <div 
                        key={leg.id}
                        onClick={() => setSelectedBusLine(leg)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected 
                            ? 'bg-[#1a2133] border-sky-500 shadow-md ring-1 ring-sky-500/50' 
                            : 'bg-[#11131c] border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded font-black text-xs ${
                              leg.category === 'RGTR' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              leg.category === 'Luxtram' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}>
                              {leg.line}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{leg.category}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black text-white">{leg.departureTime}</span>
                            {leg.status === 'delayed' ? (
                              <span className="ml-1.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 rounded">
                                +{leg.delayMin} min
                              </span>
                            ) : (
                              <span className="ml-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                À l'heure
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-300 pt-0.5 space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="text-gray-400">Départ :</span>
                            <span className="font-semibold text-gray-200">{leg.fromStop}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            <span className="text-gray-400">Arrivée :</span>
                            <span className="font-semibold text-gray-200">{leg.toStop}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* PANNEAU DE DROITE : CARTE INTERACTIVE */}
        <div className="lg:col-span-7 bg-[#161923] border border-gray-800 rounded-2xl p-3 shadow-lg h-[500px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800 px-1">
            <span className="text-xs font-bold text-gray-300 flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {selectedMode === 'car'
                  ? `Itinéraire Routier Voiture : ${activeTrip.origin} ➔ ${activeTrip.destination}`
                  : `Trajet Transports en commun (Mobiliteit.lu)`}
              </span>
            </span>
          </div>

          <div className="w-full flex-1 rounded-xl overflow-hidden border border-gray-800/80 mt-2 relative">
            <iframe
              key={`${selectedMode}-${mapOrigin}-${mapDestination}`}
              title="Carte de navigation"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
              loading="lazy"
              src={mapIframeUrl}
            />
          </div>
        </div>

      </div>
    </div>
  );
};