 import React, { useState, useEffect } from 'react';
import { Car, Bus, Navigation, Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { RouteTrip } from '../types';

export const RoutePlanner: React.FC = () => {
  const [trips, setTrips] = useState<RouteTrip[]>(() => {
    const saved = localStorage.getItem('user_saved_trips');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Domicile ➔ Travail', origin: 'Paris', destination: 'La Défense', carDuration: '25 min', busDuration: '42 min', distance: '12 km' },
      { id: '2', name: 'Maison ➔ Gare', origin: 'Centre-ville', destination: 'Gare Centrale', carDuration: '10 min', busDuration: '18 min', distance: '4.5 km' }
    ];
  });

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tripName, setTripName] = useState('');
  const [activeTrip, setActiveTrip] = useState<RouteTrip | null>(trips[0] || null);

  useEffect(() => {
    localStorage.setItem('user_saved_trips', JSON.stringify(trips));
  }, [trips]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    const estimatedKm = Math.max(3, (origin.length + destination.length) * 1.5);
    const carMins = Math.round(estimatedKm * 1.8);
    const busMins = Math.round(estimatedKm * 2.8 + 5);

    const newTrip: RouteTrip = {
      id: Date.now().toString(),
      name: tripName.trim() || `${origin} ➔ ${destination}`,
      origin,
      destination,
      carDuration: `${carMins} min`,
      busDuration: `${busMins} min`,
      distance: `${estimatedKm.toFixed(1)} km`
    };

    setTrips([newTrip, ...trips]);
    setActiveTrip(newTrip);
    setOrigin('');
    setDestination('');
    setTripName('');
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    if (activeTrip?.id === id) {
      setActiveTrip(updated[0] || null);
    }
  };

  return (
    <div className="bg-[#161923] border border-gray-800 rounded-2xl p-4 shadow-lg space-y-4">
      <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-800 pb-3">
        <Navigation className="w-4 h-4" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">
          Temps de Navigation & Trajets Habituels
        </h2>
      </div>

      <form onSubmit={handleAddTrip} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#11131c] p-2.5 rounded-xl border border-gray-800/80">
        <input
          type="text"
          placeholder="Départ (ex: Paris)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="bg-[#1b1f2b] text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="text"
          placeholder="Arrivée (ex: Lyon)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="bg-[#1b1f2b] text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 focus:outline-none focus:border-indigo-500"
          required
        />
        <input
          type="text"
          placeholder="Nom (Optionnel)"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="bg-[#1b1f2b] text-white text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Enregistrer</span>
        </button>
      </form>

      {trips.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Vos trajets enregistrés :</span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
            {trips.map((trip) => {
              const isSelected = activeTrip?.id === trip.id;
              return (
                <div
                  key={trip.id}
                  onClick={() => setActiveTrip(trip)}
                  className={`flex-shrink-0 cursor-pointer p-2.5 rounded-xl border transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/80 text-white shadow-md'
                      : 'bg-[#11131c] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{trip.name}</span>
                    <span className="text-[10px] text-gray-400">{trip.origin} ➔ {trip.destination} ({trip.distance})</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTrip(trip.id, e)}
                    className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                    title="Supprimer le trajet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTrip && (
        <div className="bg-[#11131c] border border-gray-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{activeTrip.origin} ➔ {activeTrip.destination}</span>
            </div>
            <span className="text-gray-400 text-[11px] font-normal">Distance approx. : {activeTrip.distance}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#1b1f2b] border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-amber-400">
                <Car className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-300">Voiture</span>
                  <span className="text-xs font-extrabold text-white">{activeTrip.carDuration}</span>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>

            <div className="p-3 rounded-xl bg-[#1b1f2b] border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-sky-400">
                <Bus className="w-5 h-5" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-300">Bus / TC</span>
                  <span className="text-xs font-extrabold text-white">{activeTrip.busDuration}</span>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};