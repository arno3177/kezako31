import React, { useState } from 'react';
import { Bookmark, ExternalLink, Plus, Trash2, Globe } from 'lucide-react';

interface LinkItem {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const QuickLinksWidget: React.FC = () => {
  // Liste par défaut orientée Luxembourg / Frontaliers
  const defaultLinks: LinkItem[] = [
    { id: '1', name: 'RTL.lu', url: 'https://www.rtl.lu', category: 'Actus' },
    { id: '2', name: 'Mobiliteit.lu', url: 'https://www.mobiliteit.lu/fr/', category: 'Transport' },
    { id: '3', name: 'ACL Carburants', url: 'https://www.acl.lu/fr/mobilite/prix-des-carburants/', category: 'Voiture' },
    { id: '4', name: 'Guichet.lu', url: 'https://guichet.public.lu/fr.html', category: 'Administratif' },
    { id: '5', name: 'Spuerkeess / E-Banking', url: 'https://www.spuerkeess.lu', category: 'Banque' },
    { id: '6', name: '100komma7', url: 'https://www.100komma7.lu', category: 'Actus' },
  ];

  const [links, setLinks] = useState<LinkItem[]>(() => {
    const saved = localStorage.getItem('user_quick_links');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return defaultLinks;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Général');

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    let formattedUrl = newUrl;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newItem: LinkItem = {
      id: Date.now().toString(),
      name: newName,
      url: formattedUrl,
      category: newCategory || 'Favoris'
    };

    const updated = [...links, newItem];
    setLinks(updated);
    localStorage.setItem('user_quick_links', JSON.stringify(updated));

    setNewName('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleDeleteLink = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    localStorage.setItem('user_quick_links', JSON.stringify(updated));
  };

  return (
    <div className="bg-[#111e25] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 text-white font-bold text-xs">
          <Bookmark className="w-4 h-4 text-emerald-400" />
          <span>Raccourcis Favoris & Utiles (Luxembourg)</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold flex items-center gap-1 transition-colors text-[10px] cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Modal d'ajout de lien */}
      {showAddModal && (
        <div className="bg-[#142028] p-3 rounded-xl border border-emerald-500/40 shadow-lg space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">Nouveau raccourci</span>
            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
          </div>
          <form onSubmit={handleAddLink} className="space-y-2">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase">Nom du site</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Ex: RTL.lu" 
                required
                className="w-full mt-0.5 p-1.5 rounded-lg bg-[#0a1217] border border-slate-700 text-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase">URL / Adresse Web</label>
              <input 
                type="text" 
                value={newUrl} 
                onChange={(e) => setNewUrl(e.target.value)} 
                placeholder="Ex: https://www.rtl.lu" 
                required
                className="w-full mt-0.5 p-1.5 rounded-lg bg-[#0a1217] border border-slate-700 text-white focus:border-emerald-500 outline-none text-xs"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grille des liens favoris */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-2.5 rounded-xl bg-[#0a1217] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-1.5 cursor-pointer shadow-sm hover:shadow-emerald-500/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 uppercase tracking-wide">
                {link.category}
              </span>
              <button
                onClick={(e) => handleDeleteLink(link.id, e)}
                className="opacity-0 group-hover:opacity-150 text-slate-500 hover:text-rose-400 p-0.5 transition-opacity"
                title="Supprimer ce raccourci"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center space-x-1.5 min-w-0 pr-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200 font-bold text-xs truncate group-hover:text-emerald-300 transition-colors">
                  {link.name}
                </span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};