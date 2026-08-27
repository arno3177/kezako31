import React, { useState, useEffect } from 'react';
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
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in text-xs pb-16">
      
      {/* En-tête de la page harmonisé */}
      <div className="flex items-center justify-between bg-[#1c1114] border border-rose-500/30 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToHome}
            className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-rose-400" /> Raccourcis Favoris & Utiles
            </h1>
            <p className="text-[10px] text-slate-400">Gérez vos accès rapides personnalisés</p>
          </div>
        </div>

        {/* Bouton d'ajout uniforme */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-rose-400 border border-rose-800/50 font-bold flex items-center gap-1.5 transition-colors text-[11px] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un raccourci</span>
        </button>
      </div>

      {/* Grille des raccourcis */}
      {shortcuts.length === 0 ? (
        <div className="bg-[#151824] border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
          Aucun raccourci pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {shortcuts.map((item) => (
            <div
              key={item.id}
              className="relative p-4 bg-[#120a0d] border border-rose-950 hover:border-rose-500/50 rounded-2xl flex flex-col justify-between space-y-3 transition-all hover:bg-[#1c1114] group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-slate-900 text-rose-300 font-extrabold rounded text-[9px] uppercase tracking-wide">
                  {item.category}
                </span>

                <button
                  onClick={(e) => handleDeleteShortcut(item.id, e)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Supprimer ce raccourci"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between pt-1 cursor-pointer"
              >
                <span className="font-extrabold text-white group-hover:text-rose-300 transition-colors">
                  {item.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* MODALE D'AJOUT UNIFORMISEÉ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141215] border border-rose-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-rose-900/30 pb-3">
              <h2 className="text-xs font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" /> Ajouter un nouveau raccourci
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddShortcut} className="space-y-3">
              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Nom du site</label>
                <input
                  type="text"
                  placeholder="Ex: RTL.lu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-[#0d0f17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Adresse Web (URL)</label>
                <input
                  type="text"
                  placeholder="Ex: www.rtl.lu"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-[#0d0f17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 font-bold uppercase">Catégorie</label>
                <input
                  type="text"
                  placeholder="Ex: Favoris, Transport, Actus..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-[#0d0f17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 outline-none text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
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