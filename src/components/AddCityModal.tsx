 import React, { useState } from 'react';
import { Search, MapPin, X, Loader2, Plus } from 'lucide-react';

interface AddCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCity: (cityName: string) => Promise<void>;
}

export const AddCityModal: React.FC<AddCityModalProps> = ({ isOpen, onClose, onAddCity }) => {
  if (!isOpen) return null;

  const [inputCity, setInputCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCity.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onAddCity(inputCity.trim());
      setInputCity('');
      onClose();
    } catch (err) {
      setError('Impossible de trouver cette ville. Vérifiez l’orthographe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151821] border border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-5 h-5 text-indigo-400" />
          <h3 className="font-['Playfair_Display'] text-xl font-bold text-white">Ajouter une ville</h3>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Saisissez le nom de n'importe quelle ville (ex: Luxembourg, Marseille, Berlin) pour obtenir sa météo en direct.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nom de la ville..."
              value={inputCity}
              onChange={(e) => setInputCity(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#12141c] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !inputCity.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recherche Météo...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ajouter la ville</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};