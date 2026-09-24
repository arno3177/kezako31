import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Trash2, Pin, Tag, Settings, Palette, List, AlignLeft, Check
} from 'lucide-react';
import { WeatherData, AppSettings } from '../types';

interface HomePulsePageProps {
  currentWeather: WeatherData | null;
  onBack: () => void;
  language?: AppSettings['language'];
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface KeepNote {
  id: string;
  title: string;
  content: string;
  items?: ChecklistItem[];
  category: string;
  color: string;
  type: 'text' | 'bullets';
  pinned: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  label: string;
}

const STORAGE_KEY_KEEP_NOTES = 'homepulse_keep_notes_v10';
const STORAGE_KEY_CATEGORIES = 'homepulse_categories_v10';

const NOTE_COLORS = [
  { id: 'slate', name: 'Gris Acier', bg: 'from-slate-800 via-slate-800/90 to-slate-900', border: 'border-slate-600' },
  { id: 'amber', name: 'Jaune Solaire', bg: 'from-amber-950/80 via-amber-900/40 to-slate-900', border: 'border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)]' },
  { id: 'emerald', name: 'Vert Menthe / Jardin', bg: 'from-emerald-950/80 via-emerald-900/40 to-slate-900', border: 'border-emerald-400/60 shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
  { id: 'purple', name: 'Violet Électrique', bg: 'from-purple-950/80 via-purple-900/40 to-slate-900', border: 'border-purple-400/60 shadow-[0_0_15px_rgba(192,132,252,0.15)]' },
  { id: 'sky', name: 'Bleu Lagon', bg: 'from-sky-950/80 via-sky-900/40 to-slate-900', border: 'border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.15)]' },
  { id: 'rose', name: 'Rose Corail', bg: 'from-rose-950/80 via-rose-900/40 to-slate-900', border: 'border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]' },
  { id: 'orange', name: 'Orange Vif', bg: 'from-orange-950/80 via-orange-900/40 to-slate-900', border: 'border-orange-400/60 shadow-[0_0_15px_rgba(251,146,60,0.15)]' },
];

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
    color: 'amber',
    type: 'text',
    pinned: true,
    createdAt: '2026-09-20'
  },
  {
    id: '2',
    title: 'Liste de courses rapide',
    content: '',
    items: [
      { id: 'item-1', text: 'Lait d\'avoine', completed: false },
      { id: 'item-2', text: 'Café en grains', completed: true },
      { id: 'item-3', text: 'Légumes de saison', completed: false }
    ],
    category: 'courses',
    color: 'emerald',
    type: 'bullets',
    pinned: true,
    createdAt: '2026-09-23'
  }
];

export const HomePulsePage: React.FC<HomePulsePageProps> = ({
  currentWeather: _currentWeather,
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
  const [activePaletteNoteId, setActivePaletteNoteId] = useState<string | null>(null);

  // Édition directe inline des notes texte
  const [editingTextNoteId, setEditingTextNoteId] = useState<string | null>(null);
  const [inlineTextContent, setInlineTextContent] = useState<string>('');

  // Champs modale nouvelle note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  
  const [noteCategory, setNoteCategory] = useState<string>(categories[0]?.id || 'maintenance');
  const [noteColor, setNoteColor] = useState<string>('amber');
  const [noteType, setNoteType] = useState<'text' | 'bullets'>('text');

  // Ajout rapide sur les cartes listes
  const [quickItemInputs, setQuickItemInputs] = useState<Record<string, string>>({});

  // Gestion des catégories
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

  const handleOpenCreator = () => {
    setNoteTitle('');
    setNoteContent('');
    setChecklistItems([]);
    setNewItemText('');
    setNoteCategory(categories[0]?.id || 'maintenance');
    setNoteColor('amber');
    setNoteType('text');
    setShowEditor(true);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setChecklistItems(prev => [
      ...prev,
      { id: Date.now().toString(), text: newItemText.trim(), completed: false }
    ]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleChecklistItemInEditor = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleToggleChecklistItemDirect = (noteId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => {
      if (n.id === noteId && n.items) {
        const updatedItems = n.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
        return { ...n, items: updatedItems };
      }
      return n;
    }));
  };

  const handleDeleteChecklistItemDirect = (noteId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => {
      if (n.id === noteId && n.items) {
        const updatedItems = n.items.filter(item => item.id !== itemId);
        return { ...n, items: updatedItems };
      }
      return n;
    }));
  };

  const handleAddQuickItemDirect = (noteId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = quickItemInputs[noteId]?.trim();
    if (!text) return;

    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        const newItem: ChecklistItem = { id: Date.now().toString(), text, completed: false };
        const currentItems = n.items || [];
        return { ...n, items: [...currentItems, newItem] };
      }
      return n;
    }));

    setQuickItemInputs(prev => ({ ...prev, [noteId]: '' }));
  };

  const handleSaveInlineText = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: inlineTextContent } : n));
    setEditingTextNoteId(null);
  };

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim() && checklistItems.length === 0) return;

    const newNote: KeepNote = {
      id: Date.now().toString(),
      title: noteTitle.trim() || 'Sans titre',
      content: noteType === 'text' ? noteContent.trim() : '',
      items: noteType === 'bullets' ? checklistItems : undefined,
      category: noteCategory,
      color: noteColor,
      type: noteType,
      pinned: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [newNote, ...prev]);
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

  const handleChangeNoteColor = (id: string, colorId: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color: colorId } : n));
    setActivePaletteNoteId(null);
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
    if (categories.length <= 1) return;
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

  const getNoteColorStyle = (colorId: string) => {
    const found = NOTE_COLORS.find(c => c.id === colorId);
    return found ? `${found.bg} ${found.border}` : 'from-slate-800 via-slate-800/90 to-slate-900 border-slate-600';
  };

  return (
    <div className="space-y-4 text-xs animate-fade-in text-slate-100 w-full max-w-xl mx-auto pb-24 px-1 font-sans" onClick={() => { setActivePaletteNoteId(null); if (editingTextNoteId) setEditingTextNoteId(null); }}>
      
      {/* 1. EN-TÊTE DU MODULE */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-800 to-indigo-950/80 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl space-y-3.5 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 shadow-inner">
              <Home className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wide">HomePulse & Notes Habitat</h1>
              <p className="text-[11px] text-indigo-200 font-medium">Notes libres adaptatives, listes et rappels</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCatManager(true); }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 border border-indigo-500/40 text-indigo-300 transition-colors cursor-pointer"
              title="Gérer les catégories"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-indigo-500/40 text-indigo-300 font-bold transition-colors cursor-pointer text-xs shadow-sm"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GESTION DES CATÉGORIES */}
      {showCatManager && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-500/30 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-300" /> Gérer les Catégories
              </h3>
              <button onClick={() => setShowCatManager(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                placeholder="Nouvelle catégorie (ex: Bricolage)..."
                value={newCatLabel}
                onChange={e => setNewCatLabel(e.target.value)}
                className="flex-1 bg-slate-800 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
              <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md">
                Ajouter
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-slate-800/80 border border-indigo-500/30 px-3 py-2 rounded-xl">
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

      {/* 2. BARRE DE CRÉATION DE NOTE */}
      {!showEditor ? (
        <div 
          onClick={handleOpenCreator}
          className="bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 rounded-2xl p-3.5 shadow-xl cursor-pointer flex items-center justify-between text-indigo-200 transition-all"
        >
          <span className="text-xs font-semibold">Prendre une note, liste de courses, rappel...</span>
          <Plus className="w-4 h-4 text-indigo-400" />
        </div>
      ) : (
        <form onSubmit={handleSaveNewNote} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-indigo-500/60 rounded-2xl p-4 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <input
              type="text"
              placeholder="Titre"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              className="w-full bg-transparent text-white font-black text-xs focus:outline-none placeholder:text-slate-500"
              autoFocus
            />
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setNoteType('text')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${noteType === 'text' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Texte libre"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setNoteType('bullets')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${noteType === 'bullets' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Liste à cocher"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {noteType === 'text' ? (
            <textarea
              placeholder="Écrivez votre note ici..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              className="w-full bg-transparent text-slate-200 text-xs focus:outline-none placeholder:text-slate-500 resize-none h-24 font-normal leading-relaxed"
            />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un élément à la liste..."
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(e); }}}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {checklistItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItemInEditor(item.id)}
                        className="w-3.5 h-3.5 rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-xs truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <select
                value={noteCategory}
                onChange={e => setNoteCategory(e.target.value)}
                className="bg-slate-800 border border-indigo-500/40 text-indigo-200 text-[10px] rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>

              <select
                value={noteColor}
                onChange={e => setNoteColor(e.target.value)}
                className="bg-slate-800 border border-indigo-500/40 text-indigo-200 text-[10px] rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {NOTE_COLORS.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

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
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold cursor-pointer shadow-md"
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
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' 
              : 'bg-slate-900/90 text-slate-400 border-indigo-500/30 hover:text-white'
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
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' 
                : 'bg-slate-900/90 text-slate-400 border-indigo-500/30 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. GRILLE DES NOTES AVEC HAUTEUR ADAPTATIVE ET MAX-H LIMITÉE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
            <p>Aucune note enregistrée dans cette catégorie.</p>
          </div>
        ) : (
          filteredNotes.map(note => {
            const catObj = categories.find(c => c.id === note.category);
            const catLabel = catObj ? catObj.label : note.category;
            const isPaletteOpen = activePaletteNoteId === note.id;
            const isEditingText = editingTextNoteId === note.id;

            const activeItems = note.items ? note.items.filter(i => !i.completed) : [];
            const completedItems = note.items ? note.items.filter(i => i.completed) : [];

            return (
              <div 
                key={note.id}
                className={`bg-gradient-to-br ${getNoteColorStyle(note.color)} border rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-3 transition-all relative group h-auto`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-black text-white tracking-wide">{note.title}</h3>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePaletteNoteId(isPaletteOpen ? null : note.id); }}
                        className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer bg-black/30"
                        title="Changer la couleur"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleTogglePin(note.id, e)}
                        className={`text-slate-300 hover:text-white transition-colors cursor-pointer p-1 rounded-lg bg-black/30 ${note.pinned ? 'text-amber-300 bg-amber-500/20' : ''}`}
                        title="Épingler"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {note.type === 'text' ? (
                    isEditingText ? (
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <textarea
                          value={inlineTextContent}
                          onChange={(e) => setInlineTextContent(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-white/60 resize-none h-24 leading-relaxed font-medium"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingTextNoteId(null)}
                            className="px-2.5 py-1 bg-black/30 hover:bg-black/50 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveInlineText(note.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-md"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTextNoteId(note.id);
                          setInlineTextContent(note.content);
                        }}
                        className="text-[11px] text-slate-200 whitespace-pre-line leading-relaxed font-medium cursor-text max-h-48 overflow-y-auto p-1 rounded-lg hover:bg-white/5 transition-colors scrollbar-thin"
                        title="Cliquer pour modifier directement"
                      >
                        {note.content || <span className="italic text-slate-400">Cliquer pour ajouter du texte...</span>}
                      </div>
                    )
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin" onClick={e => e.stopPropagation()}>
                      {/* Champ de saisie rapide direct */}
                      <form onSubmit={(e) => handleAddQuickItemDirect(note.id, e)} className="flex gap-1.5 pb-1">
                        <input
                          type="text"
                          placeholder="+ Ajouter un élément..."
                          value={quickItemInputs[note.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuickItemInputs(prev => ({ ...prev, [note.id]: val }));
                          }}
                          className="flex-1 bg-black/30 border border-white/15 rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-slate-400 focus:outline-none focus:border-white/40"
                        />
                      </form>

                      {/* Éléments actifs */}
                      {activeItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between text-[11px] text-slate-200 group/item py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <div 
                            onClick={(e) => handleToggleChecklistItemDirect(note.id, item.id, e)}
                            className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0"
                          >
                            <div className="w-4 h-4 rounded border border-slate-400 bg-black/30 flex items-center justify-center shrink-0">
                              {item.completed && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-medium truncate">{item.text}</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteChecklistItemDirect(note.id, item.id, e)}
                            className="text-slate-400 hover:text-rose-300 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Supprimer l'élément"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* Éléments cochés */}
                      {completedItems.length > 0 && (
                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1">Terminés ({completedItems.length})</span>
                          {completedItems.map(item => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between text-[11px] text-slate-400 group/item py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <div 
                                onClick={(e) => handleToggleChecklistItemDirect(note.id, item.id, e)}
                                className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0"
                              >
                                <div className="w-4 h-4 rounded border border-indigo-500/60 bg-indigo-950/60 flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3 text-indigo-400" />
                                </div>
                                <span className="line-through truncate flex-1">{item.text}</span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteChecklistItemDirect(note.id, item.id, e)}
                                className="text-slate-500 hover:text-rose-300 p-1 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer shrink-0"
                                title="Supprimer l'élément"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SÉLECTEUR DE COULEUR FLOTTANT */}
                {isPaletteOpen && (
                  <div onClick={e => e.stopPropagation()} className="absolute top-10 right-2 bg-slate-900 border border-indigo-500/50 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 z-20 animate-fade-in">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleChangeNoteColor(note.id, c.id)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          c.id === 'slate' ? 'bg-slate-700 border-slate-400' :
                          c.id === 'amber' ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_#fbbf24]' :
                          c.id === 'emerald' ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_8px_#34d399]' :
                          c.id === 'purple' ? 'bg-purple-400 border-purple-200 shadow-[0_0_8px_#c084fc]' :
                          c.id === 'sky' ? 'bg-sky-400 border-sky-200 shadow-[0_0_8px_#38bdf8]' :
                          c.id === 'rose' ? 'bg-rose-400 border-rose-200 shadow-[0_0_8px_#f43f5e]' : 'bg-orange-400 border-orange-200 shadow-[0_0_8px_#fb923c]'
                        } hover:scale-125`}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider bg-black/40 text-white border-white/20">
                    {catLabel}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] text-slate-300 font-mono">{note.createdAt}</span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer ml-1"
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