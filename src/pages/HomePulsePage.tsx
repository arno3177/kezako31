import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Trash2, Pin, Tag, Settings, Check
} from 'lucide-react';
import { WeatherData, AppSettings } from '../types';

interface HomePulsePageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
}

interface KeepNote {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  label: string;
}

const STORAGE_KEY_KEEP_NOTES = 'homepulse_keep_notes_v2';
const STORAGE_KEY_CATEGORIES = 'homepulse_categories_v2';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'courses', label: 'Courses' },
  { id: 'foyer', label: 'Foyer' },
  { id: 'copro', label: 'Copropriété' },
  { id: 'jardin', label: 'Jardin' },
  { id: 'idee', label: 'Idée' }
];

const DEFAULT_NOTES: KeepNote[] = [
  {
    id: '1',
    title: 'Pression chaudière',
    content: 'Vérifier la pression à 1.5 bar et purger le radiateur du salon si besoin.',
    category: 'maintenance',
    pinned: true,
    createdAt: '2026-09-20'
  },
  {
    id: '2',
    title: 'Liste de courses rapide',
    content: '- Lait d\'avoine\n- Café en grains\n- Légumes de saison',
    category: 'courses',
    pinned: true,
    createdAt: '2026-09-23'
  }
];

export const HomePulsePage: React.FC<HomePulsePageProps> = ({
  currentWeather,
  onBack
}) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  });

  const [notes, setNotes] = useState<KeepNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KEEP_NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_NOTES;
  });

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [showCatManager, setShowCatManager] = useState<boolean>(false);
  
  // Champs pour la nouvelle note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<string>(categories[0]?.id || 'maintenance');

  // Champs pour la gestion des catégories
  const [newCatLabel, setNewCatLabel] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_KEEP_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const newNote: KeepNote = {
      id: Date.now().toString(),
      title: noteTitle.trim() || 'Sans titre',
      content: noteContent.trim(),
      category: noteCategory,
      pinned: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setNotes(prev => [newNote, ...prev]);
    setNoteTitle('');
    setNoteContent('');
    setShowEditor(false);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCatLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (categories.some(c => c.id === id)) return;

    setCategories(prev => [...prev, { id, label }]);
    setNewCatLabel('');
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return; // Garder au moins une catégorie
    setCategories(prev => prev.filter(c => c.id !== id));
    if (filterCategory === id) setFilterCategory('all');
    if (noteCategory === id) {
      const remaining = categories.filter(c => c.id !== id);
      if (remaining.length > 0) setNoteCategory(remaining[0].id);
    }
  };

  const filteredNotes = filterCategory === 'all' 
    ? notes 
    : notes.filter(n => n.category === filterCategory);

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full max-w-xl mx-auto pb-24 px-1 font-sans">
      
      {/* 1. EN-TÊTE DU MODULE */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-800/90 to-slate-800 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-3.5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 shadow-inner">
              <Home className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-100 tracking-wide">HomePulse & Notes Habitat</h1>
              <p className="text-[11px] text-slate-400 font-medium">Notes libres, courses et rappels de la maison</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCatManager(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Gérer les catégories"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold transition-colors cursor-pointer text-xs shadow-sm"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GESTION DES CATÉGORIES */}
      {showCatManager && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-300" /> Gérer les Catégories
              </h3>
              <button onClick={() => setShowCatManager(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="Nouvelle catégorie (ex: Bricolage)..."
                value={newCatLabel}
                onChange={e => setNewCatLabel(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
              />
              <button type="submit" className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs cursor-pointer">
                Ajouter
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-slate-800/80 border border-slate-700/60 px-3 py-2 rounded-xl">
                  <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  {categories.length > 1 && (
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="Supprimer la catégorie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setShowCatManager(false)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRE DE CRÉATION DE NOTE (STYLE KEEP RAPIDE) */}
      {!showEditor ? (
        <div 
          onClick={() => setShowEditor(true)}
          className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 rounded-2xl p-3.5 shadow-inner cursor-pointer flex items-center justify-between text-slate-400 transition-all"
        >
          <span className="text-xs font-medium">Prendre une note, liste de courses, rappel...</span>
          <Plus className="w-4 h-4 text-slate-300" />
        </div>
      ) : (
        <form onSubmit={handleSaveNote} className="bg-slate-900 border border-slate-600 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
          <input
            type="text"
            placeholder="Titre"
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            className="w-full bg-transparent text-white font-black text-xs focus:outline-none placeholder:text-slate-500"
            autoFocus
          />
          <textarea
            placeholder="Écrivez votre note ici..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            className="w-full bg-transparent text-slate-200 text-xs focus:outline-none placeholder:text-slate-500 resize-none h-20"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <select
              value={noteCategory}
              onChange={e => setNoteCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-700 text-white rounded-xl text-[10px] font-bold hover:bg-slate-600 cursor-pointer shadow-md"
              >
                Terminer
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. FILTRES DE CATÉGORIES DINAMIQUES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
            filterCategory === 'all' 
              ? 'bg-slate-700 text-white border-slate-500 shadow-md' 
              : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          Toutes
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
              filterCategory === cat.id 
                ? 'bg-slate-700 text-white border-slate-500 shadow-md' 
                : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. GRILLE DES NOTES (STYLE GOOGLE KEEP) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <p>Aucune note enregistrée dans cette catégorie.</p>
          </div>
        ) : (
          filteredNotes.map(note => {
            const catObj = categories.find(c => c.id === note.category);
            const catLabel = catObj ? catObj.label : note.category;

            return (
              <div 
                key={note.id}
                className="bg-gradient-to-br from-slate-800 via-slate-800/90 to-slate-900 border border-slate-700 hover:border-slate-500 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 transition-all relative group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-black text-white tracking-wide">{note.title}</h3>
                    <button
                      onClick={(e) => handleTogglePin(note.id, e)}
                      className={`text-slate-400 hover:text-white transition-colors cursor-pointer ${note.pinned ? 'text-amber-300' : ''}`}
                      title="Épingler"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed font-normal">
                    {note.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border-slate-700">
                    {catLabel}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-slate-400">{note.createdAt}</span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer ml-1"
                      title="Supprimer la note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default HomePulsePage;