import React, { useState, useEffect } from 'react';
import { RouteTrip, AppSettings } from '../types';
import { getTranslation } from '../utils/translations';
import { 
  Car, Bus, ArrowRight, Navigation, CheckCircle2, AlertTriangle, 
  AlertCircle, ChevronRight, Home, Briefcase, ShoppingBag, Star, 
  Trash2, Plus 
} from 'lucide-react';

interface ExtendedRouteTrip extends Omit<RouteTrip, 'carDuration' | 'busDuration' | 'distance'> {
  carDuration?: string;
  busDuration?: string;
  distance?: string;
  iconType?: 'home' | 'work' | 'shopping' | 'favorite';
  isDefault?: boolean;
}

interface TripsPageProps {
  initialMode?: 'car' | 'bus';
  busApi?: 'maps' | 'mobiliteit' | 'default';
  language?: AppSettings['language'];
}

const DEFAULT_TRIPS: ExtendedRouteTrip[] = [
  {
    id: '1',
    name: 'Domicile - Travail',
    origin: 'Kopstal, Luxembourg',
    destination: 'Luxembourg, Stäreplatz / Étoile',
    iconType: 'work',
    isDefault: true
  },
  {
    id: '2',
    name: 'Courses',
    origin: 'Kopstal, Luxembourg',
    destination: 'Belle Étoile, Bertrange',
    iconType: 'shopping',
    isDefault: false
  }
];

export const TripsPage: React.FC<TripsPageProps> = ({ 
  initialMode = 'car',
  busApi = 'mobiliteit',
  language = 'en'
}) => {
  const t = getTranslation(language);
  const [activeMode, setActiveMode] = useState<'car' | 'bus'>(initialMode);

  const [trips, setTrips] = useState<ExtendedRouteTrip[]>(() => {
    const saved = localStorage.getItem('user_saved_trips_extended');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_TRIPS;
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    const defaultTrip = trips.find(t => t.isDefault);
    return defaultTrip ? defaultTrip.id : (trips[0]?.id || '1');
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newIconType, setNewIconType] = useState<'home' | 'work' | 'shopping' | 'favorite'>('favorite');

  useEffect(() => {
    localStorage.setItem('user_saved_trips_extended', JSON.stringify(trips));
  }, [trips]);

  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0] || DEFAULT_TRIPS[0];
  const originQuery = encodeURIComponent(activeTrip.origin);
  const destQuery = encodeURIComponent(activeTrip.destination);

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrips(prev => prev.map(trip => ({ ...trip, isDefault: trip.id === id })));
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trips.length <= 1) return;
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    if (selectedTripId === id) setSelectedTripId(updated[0].id);
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newOrigin || !newDestination) return;

    const newTrip: ExtendedRouteTrip = {
      id: Date.now().toString(),
      name: newName,
      origin: newOrigin,
      destination: newDestination,
      iconType: newIconType,
      isDefault: trips.length === 0
    };

    setTrips(prev => [...prev, newTrip]);
    setSelectedTripId(newTrip.id);
    setNewName(''); setNewOrigin(''); setNewDestination('');
    setIsAdding(false);
  };

  const renderCategoryIcon = (iconType?: string) => {
    switch (iconType) {
      case 'home': return <Home className="w-4 h-4 text-emerald-400" />;
      case 'work': return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'shopping': return <ShoppingBag className="w-4 h-4 text-pink-400" />;
      default: return <Star className="w-4 h-4 text-amber-400" />;
    }
  };

  const carItinerarySteps = [
    { instruction: `${t.departure} ${activeTrip.origin}`, detail: 'N12 - Trafic fluide', traffic: 'green', label: t.fluid },
    { instruction: 'Traversée intermédiaire', detail: 'Ralentissement (+2 min)', traffic: 'orange', label: t.moderate },
    { instruction: 'Zone dense', detail: 'Bouchon (+5 min)', traffic: 'red', label: t.heavy },
    { instruction: `${t.arrival} ${activeTrip.destination}`, detail: 'Arrivée', traffic: 'green', label: t.fluid },
  ];

  const busSchedules = [
    { line: 'Bus 262', departure: '14:35', arrival: '14:57', status: t.onTime, traffic: 'green' },
    { line: 'Bus 921', departure: '14:48', arrival: '15:10', status: `${t.delay} +3m`, traffic: 'orange' },
    { line: 'Bus 262', departure: '15:05', arrival: '15:35', status: `${t.delay} +10m`, traffic: 'red' },
  ];

  const renderTrafficBadge = (status: string, text: string) => {
    switch (status) {
      case 'green': return <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">{text}</span>;
      case 'orange': return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">{text}</span>;
      case 'red': return <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">{text}</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-xs w-full max-w-full overflow-x-hidden pb-10">
      
      {/* Header Trajet */}
      <div className="bg-[#16182a] border border-emerald-500/20 rounded-2xl p-3.5 shadow-xl space-y-2 w-full">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            {renderCategoryIcon(activeTrip.iconType)}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-white truncate">{activeTrip.name}</h1>
            <p className="text-[10px] text-emerald-300/70 truncate">{activeTrip.origin} → {activeTrip.destination}</p>
          </div>
        </div>
      </div>

      {/* Mode Voiture / Bus */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveMode('car')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 ${
            activeMode === 'car' ? 'bg-[#1b2621] border-amber-500 text-amber-400' : 'bg-[#151824] border-slate-800 text-slate-400'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{t.byCar}</span>
        </button>

        <button
          onClick={() => setActiveMode('bus')}
          className={`p-2.5 rounded-xl border font-bold flex items-center justify-center space-x-2 ${
            activeMode === 'bus' ? 'bg-[#132733] border-sky-400 text-sky-400' : 'bg-[#151824] border-slate-800 text-slate-400'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>{t.byBus}</span>
        </button>
      </div>

      {/* CARTE ET FEUILLE DE ROUTE EMPILÉES SANS OVERFLOW */}
      <div className="space-y-3 w-full">
        <div className="h-52 rounded-xl overflow-hidden border border-slate-800 shadow-xl w-full">
          <iframe
            key={activeTrip.id + activeMode}
            title="Carte Trajet Mobile"
            width="100%" height="100%"
            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
            loading="lazy"
            src={`https://maps.google.com/maps?saddr=${originQuery}&daddr=${destQuery}&dirflg=${activeMode === 'bus' ? 'r' : 'd'}&output=embed`}
          />
        </div>

        {activeMode === 'car' && (
          <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="font-bold text-amber-400 text-[10px] uppercase">{t.trafficAndRoute}</div>
            <div className="space-y-2">
              {carItinerarySteps.map((step, idx) => (
                <div key={idx} className="bg-[#0d0e1a] p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-white truncate">{step.instruction}</p>
                    <p className="text-slate-400 truncate">{step.detail}</p>
                  </div>
                  {renderTrafficBadge(step.traffic, step.label)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeMode === 'bus' && (
          <div className="bg-[#151824] border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="font-bold text-sky-400 text-[10px] uppercase">{t.busSchedules}</div>
            <div className="space-y-2">
              {busSchedules.map((bus, idx) => (
                <div key={idx} className="bg-[#0d0e1a] p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-300 font-bold rounded">{bus.line}</span>
                    <span className="font-bold text-white">{bus.departure} → {bus.arrival}</span>
                  </div>
                  {renderTrafficBadge(bus.traffic, bus.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION DE GESTION DES TRAJETS */}
      <div className="bg-[#151824] border border-slate-800 rounded-xl p-3.5 space-y-3 w-full">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-[11px] font-bold uppercase text-white">Vos Trajets</h2>
          <button onClick={() => setIsAdding(!isAdding)} className="p-1.5 bg-emerald-600 text-white rounded-lg flex items-center space-x-1 font-bold text-[10px]">
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddTrip} className="bg-[#0d0f17] border border-slate-800 rounded-xl p-3 space-y-2">
            <input type="text" placeholder="Nom (ex: Travail)" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#151824] border border-slate-800 rounded-lg p-2 text-white text-[10px]" required />
            <input type="text" placeholder="Départ" value={newOrigin} onChange={e => setNewOrigin(e.target.value)} className="w-full bg-[#151824] border border-slate-800 rounded-lg p-2 text-white text-[10px]" required />
            <input type="text" placeholder="Arrivée" value={newDestination} onChange={e => setNewDestination(e.target.value)} className="w-full bg-[#151824] border border-slate-800 rounded-lg p-2 text-white text-[10px]" required />
            <div className="flex justify-end space-x-2 pt-1">
              <button type="button" onClick={() => setIsAdding(false)} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px]">Annuler</button>
              <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">Valider</button>
            </div>
          </form>
        )}

        <div className="space-y-1.5">
          {trips.map(trip => (
            <div key={trip.id} onClick={() => setSelectedTripId(trip.id)} className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${trip.id === selectedTripId ? 'bg-[#111e25] border-emerald-500' : 'bg-[#0d0f17] border-slate-800'}`}>
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                {renderCategoryIcon(trip.iconType)}
                <div className="min-w-0">
                  <p className="font-bold text-white text-[11px] truncate">{trip.name}</p>
                  <p className="text-[9px] text-slate-400 truncate">{trip.origin} → {trip.destination}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                {!trip.isDefault && (
                  <button onClick={(e) => handleSetDefault(trip.id, e)} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[8px] font-bold">
                    Par défaut
                  </button>
                )}
                {trips.length > 1 && (
                  <button onClick={(e) => handleDeleteTrip(trip.id, e)} className="p-1 text-slate-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};