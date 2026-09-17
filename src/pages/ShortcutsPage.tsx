import React, { useState } from 'react';
import { ArrowLeft, Bookmark, ExternalLink, Plus, Trash2, X } from 'lucide-react';

export interface Shortcut {
  id: string;
  category: string;
  name: string;
  url: string;
}

interface ShortcutsPageProps {
  onBackToHome: () => void;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: '1', category: 'Actus', name: 'RTL.lu', url: 'https://www.rtl.lu' },
  { id: '2', category: 'Transport', name: 'Mobiliteit.lu', url: 'https://www.mobiliteit.lu/fr/' },
  { id: '3', category: 'Voiture', name: 'ACL Carburants', url: 'https://www.acl.lu/fr/mobilite/prix-des-carburants/' },
  { id: '4', category: 'Administratif', name: 'Guichet.lu', url: 'https://guichet.public.lu/fr.html' },
  { id: '5', category: 'Banque', name: 'Spuerkeess / E-Banking', url: 'https://www.spuerkeess.lu' },
  { id: '6', category: 'Actus', name: '100komma7', url: 'https://www.100komma7.lu' }
];

export const SHORTCUTS_STORAGE_KEY = 'user_quick_links';

export const ShortcutsPage: React.FC<ShortcutsPageProps> = ({ onBackToHome }) => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => {
    const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SHORTCUTS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Favoris');

  const saveAndNotify = (newShortcuts: Shortcut[]) => {
    setShortcuts(newShortcuts);
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts));
    window.dispatchEvent(new Event('storage-update'));
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name: name.trim(),
      url: formattedUrl,
      category: category.trim() || 'Favoris'
    };

    saveAndNotify([...shortcuts, newShortcut]);
    setName('');
    setUrl('');
    setCategory('Favoris');
    setIsModalOpen(false);
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveAndNotify(shortcuts.filter(item => item.id !== id));
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in text-xs pb-20 px-1 font-sans text-slate-100">
      
      {/* En-tête de la page harmonisé */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-5 shadow-xl flex items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-sky-400/30 rounded-2xl transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white flex items-center gap-2 truncate">
              <Bookmark className="w-4 h-4 text-sky-400 flex-shrink-0" /> Raccourcis Favoris & Utiles
            </h1>
            <p className="text-[11px] text-slate-300 font-medium truncate">Gérez vos accès rapides personnalisés</p>
          </div>
        </div>

        {/* Bouton d'ajout uniforme */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-400/30 font-semibold flex items-center gap-1.5 transition-colors text-xs cursor-pointer shadow-sm flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Ajouter un raccourci</span>
        </button>
      </div>

      {/* Grille des raccourcis */}
      {shortcuts.length === 0 ? (
        <div className="bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 rounded-3xl p-12 text-center text-slate-400 font-medium shadow-xl backdrop-blur-md">
          Aucun raccourci pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shortcuts.map((item) => (
            <div
              key={item.id}
              className="relative p-4 bg-gradient-to-r from-sky-900/60 via-slate-800 to-sky-900/60 border border-sky-400/40 hover:border-sky-400 rounded-3xl flex flex-col justify-between space-y-3 transition-all shadow-xl group backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-sky-400/30 pb-2.5">
                <span className="px-2.5 py-1 bg-slate-900/90 text-sky-300 font-extrabold rounded-xl text-[10px] uppercase tracking-wide border border-sky-400/30">
                  {item.category}
                </span>

                <button
                  onClick={(e) => handleDeleteShortcut(item.id, e)}
                  className="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-sky-400/30 transition-colors cursor-pointer shadow-sm"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between pt-1 cursor-pointer group/link"
              >
                <span className="font-extrabold text-white group-hover/link:text-sky-300 transition-colors truncate pr-2">
                  {item.name}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover/link:text-sky-300 transition-colors flex-shrink-0" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* MODALE D'AJOUT UNIFORMISÉE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
          <div className="bg-gradient-to-r from-sky-900/90 via-slate-800 to-sky-900/90 border border-sky-400/50 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl relative backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-sky-400/30 pb-3">
              <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <Plus className="w-4 h-4 text-sky-400" /> Ajouter un nouveau raccourci
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShortcut} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Nom du site</label>
                <input
                  type="text"
                  placeholder="Ex: RTL.lu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-900 border border-sky-400/40 rounded-2xl text-white placeholder-slate-400 focus:border-sky-400 outline-none text-xs shadow-inner font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Adresse Web (URL)</label>
                <input
                  type="text"
                  placeholder="Ex: www.rtl.lu"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-900 border border-sky-400/40 rounded-2xl text-white placeholder-slate-400 focus:border-sky-400 outline-none text-xs shadow-inner font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wide">Catégorie</label>
                <input
                  type="text"
                  placeholder="Ex: Favoris, Transport, Actus..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-900 border border-sky-400/40 rounded-2xl text-white placeholder-slate-400 focus:border-sky-400 outline-none text-xs shadow-inner font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-sky-400/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 font-bold text-xs cursor-pointer shadow-sm hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShortcutsPage;