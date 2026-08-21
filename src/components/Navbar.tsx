 import { Navigation } from 'lucide-react';

// Dans vos boutons de navigation / onglets :
<button
  onClick={() => setActiveTab('trips')} // Ou votre système de navigation React Router
  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
    activeTab === 'trips' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
  }`}
>
  <Navigation className="w-4 h-4" />
  <span>Trajets</span>
</button>