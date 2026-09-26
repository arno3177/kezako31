import React, { useState, useEffect } from 'react';
import { 
  Home, Plus, Trash2, Pin, Tag, Settings, Palette, List, AlignLeft, Check, Edit2
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

const STORAGE_KEY_KEEP_NOTES = 'homepulse_keep_notes_true_metallic_v1';
const STORAGE_KEY_CATEGORIES = 'homepulse_categories_true_metallic_v1';

// PALETTE GRIS MÉTALLIQUE ÉQUILIBRÉ (Ni trop sombre, ni trop clair)
const NOTE_COLORS = [
  { id: 'titanium', name: 'Titane Brossé', bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900', border: 'border-slate-500 text-slate-100' },
  { id: 'amber', name: 'Ambre Métal', bg: 'bg-gradient-to-br from-slate-700 via-amber-950/60 to-slate-900', border: 'border-amber-500/60 text-amber-100' },
  { id: 'emerald', name: 'Menthe Métal', bg: 'bg-gradient-to-br from-slate-700 via-emerald-950/60 to-slate-900', border: 'border-emerald-500/60 text-emerald-100' },
  { id: 'purple', name: 'Améthyste Métal', bg: 'bg-gradient-to-br from-slate-700 via-purple-950/60 to-slate-900', border: 'border-purple-500/60 text-purple-100' },
  { id: 'sky', name: 'Acier Bleu', bg: 'bg-gradient-to-br from-slate-700 via-sky-950/60 to-slate-900', border: 'border-sky-500/60 text-sky-100' },
  { id: 'rose', name: 'Titane Rosé', bg: 'bg-gradient-to-br from-slate-700 via-rose-950/60 to-slate-900', border: 'border-rose-500/60 text-rose-100' },
  { id: 'orange', name: 'Cuivre Bruni', bg: 'bg-gradient-to-br from-slate-700 via-orange-950/60 to-slate-900', border: 'border-orange-500/60 text-orange-100' },
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

  // Édition directe inline d'un élément de liste (checklist)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inlineItemText, setInlineItemText] = useState<string>('');

  // Champs modale nouvelle note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  
  const [noteCategory, setNoteCategory] = useState<string>(categories[0]?.id || 'maintenance');
  const [noteColor, setNoteColor] = useState<string>('titanium');
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
    setNoteColor('titanium');
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

  const handleSaveInlineItem = (noteId: string, itemId: string) => {
    if (!inlineItemText.trim()) return;
    setNotes(prev => prev.map(n => {
      if (n.id === noteId && n.items) {
        const updatedItems = n.items.map(item => item.id === itemId ? { ...item, text: inlineItemText.trim() } : item);
        return { ...n, items: updatedItems };
      }
      return n;
    }));
    setEditingItemId(null);
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
    return found ? `${found.bg} ${found.border} shadow-xl` : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-500 text-slate-100 shadow-xl';
  };

  return (
    <div 
      className="space-y-4 text-xs animate-fade-in text-slate-200 w-full max-w-xl mx-auto pb-28 px-2 font-sans bg-[#262b36] min-h-screen pt-4" 
      onClick={() => { 
        setActivePaletteNoteId(null); 
        if (editingTextNoteId) setEditingTextNoteId(null);
        if (editingItemId) setEditingItemId(null);
      }}
    >
      
      {/* 1. EN-TÊTE DU MODULE (GRIS MÉTALLIQUE ÉQUILIBRÉ) */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border border-slate-500/80 rounded-3xl p-5 shadow-xl space-y-3.5 relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-slate-500/50 text-slate-200 shadow-inner">
              <Home className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide text-white">HomePulse & Notes Habitat</h1>
              <p className="text-[11px] text-slate-300 font-medium">Notes & Listes (Gris Métallique)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCatManager(true); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500/60 text-slate-200 transition-colors cursor-pointer shadow-sm"
              title="Gérer les catégories"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500/60 text-slate-200 font-bold transition-colors cursor-pointer text-xs shadow-sm"
            >
              ← Retour
            </button>
          </div>
        </div>
      </div>

      {/* MODAL GESTION DES CATÉGORIES */}
      {showCatManager && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="bg-slate-800 border border-slate-500 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-200">
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
                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-400"
              />
              <button type="submit" className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md border border-slate-400">
                Ajouter
              </button>
            </form>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-slate-900/80 border border-slate-700 px-3 py-2 rounded-xl">
                  <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                  {categories.length > 1 && (
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setShowCatManager(false)} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer border border-slate-600">
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
          className="bg-slate-800 border border-slate-500 hover:border-slate-300 rounded-2xl p-4 shadow-md cursor-pointer flex items-center justify-between text-slate-300 transition-all font-semibold"
        >
          <span className="text-xs">Prendre une note, liste de courses, rappel...</span>
          <Plus className="w-4 h-4 text-slate-200" />
        </div>
      ) : (
        <form onSubmit={handleSaveNewNote} onClick={e => e.stopPropagation()} className="bg-slate-800 border border-slate-400 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in text-slate-100">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <input
              type="text"
              placeholder="Titre"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              className="w-full bg-transparent text-white font-black text-xs focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
            <div className="flex items-center bg-slate-900 border border-slate-600 rounded-xl p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setNoteType('text')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${noteType === 'text' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Texte libre"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setNoteType('bullets')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${noteType === 'bullets' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
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
              className="w-full bg-transparent text-slate-200 text-xs focus:outline-none placeholder:text-slate-400 resize-none h-24 font-normal leading-relaxed"
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
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm border border-slate-400"
                >
                  Ajouter
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {checklistItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-900/70 border border-slate-700 px-3 py-1.5 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItemInEditor(item.id)}
                        className="w-3.5 h-3.5 rounded border-slate-500 text-slate-600 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-xs truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-200 font-medium'}`}>
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

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <select
                value={noteCategory}
                onChange={e => setNoteCategory(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-slate-200 text-[10px] rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>

              <select
                value={noteColor}
                onChange={e => setNoteColor(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-slate-200 text-[10px] rounded-xl px-2.5 py-1.5 focus:outline-none font-bold"
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
                className="px-3 py-1.5 bg-slate-900 text-slate-300 hover:bg-slate-700 rounded-xl text-[10px] font-bold cursor-pointer border border-slate-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-[10px] font-bold cursor-pointer shadow-md border border-slate-400"
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
              ? 'bg-slate-600 text-white border-slate-400 shadow-md' 
              : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
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
                ? 'bg-slate-600 text-white border-slate-400 shadow-md' 
                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 4. GRILLE DES NOTES (GRIS MÉTALLIQUE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-slate-800 border border-slate-600 rounded-3xl p-8 text-center text-slate-400 shadow-sm">
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
                className={`${getNoteColorStyle(note.color)} border rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 transition-all relative group h-auto backdrop-blur-sm`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-black tracking-wide text-white">{note.title}</h3>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePaletteNoteId(isPaletteOpen ? null : note.id); }}
                        className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer bg-slate-900/50 border border-slate-500/50"
                        title="Changer la couleur"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleTogglePin(note.id, e)}
                        className={`text-slate-300 hover:text-white transition-colors cursor-pointer p-1 rounded-lg bg-slate-900/50 border border-slate-500/50 ${note.pinned ? 'text-amber-300 bg-amber-500/20 border-amber-400' : ''}`}
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
                          className="w-full bg-slate-900/80 border border-slate-500 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-slate-300 resize-none h-24 leading-relaxed font-medium shadow-inner"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingTextNoteId(null)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer border border-slate-700"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveInlineText(note.id)}
                            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-sm border border-slate-400"
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
                        className="text-[11px] text-slate-200 whitespace-pre-line leading-relaxed font-medium cursor-text max-h-48 overflow-y-auto p-1.5 rounded-lg hover:bg-slate-900/30 transition-colors scrollbar-thin"
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
                          className="flex-1 bg-slate-900/60 border border-slate-600 rounded-xl px-2.5 py-1 text-[11px] text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
                        />
                      </form>

                      {/* Éléments actifs */}
                      {activeItems.map(item => {
                        const isEditingThisItem = editingItemId === item.id;
                        return (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between text-[11px] text-slate-200 group/item py-1 px-1.5 rounded-lg hover:bg-slate-900/30 transition-colors"
                          >
                            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                              <div 
                                onClick={(e) => handleToggleChecklistItemDirect(note.id, item.id, e)}
                                className="w-4 h-4 rounded border border-slate-400 bg-slate-900/60 flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                              >
                                {item.completed && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {isEditingThisItem ? (
                                <input
                                  type="text"
                                  value={inlineItemText}
                                  onChange={(e) => setInlineItemText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineItem(note.id, item.id);
                                    if (e.key === 'Escape') setEditingItemId(null);
                                  }}
                                  onBlur={() => handleSaveInlineItem(note.id, item.id)}
                                  className="flex-1 bg-slate-900 border border-slate-400 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none shadow-xs"
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItemId(item.id);
                                    setInlineItemText(item.text);
                                  }}
                                  className="font-medium truncate flex-1 cursor-text text-slate-200"
                                  title="Cliquer pour modifier cet élément"
                                >
                                  {item.text}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItemId(item.id);
                                  setInlineItemText(item.text);
                                }}
                                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                                title="Modifier"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteChecklistItemDirect(note.id, item.id, e)}
                                className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                title="Supprimer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Éléments cochés */}
                      {completedItems.length > 0 && (
                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1">Terminés ({completedItems.length})</span>
                          {completedItems.map(item => {
                            const isEditingThisItem = editingItemId === item.id;
                            return (
                              <div 
                                key={item.id} 
                                className="flex items-center justify-between text-[11px] text-slate-400 group/item py-1 px-1.5 rounded-lg hover:bg-slate-900/30 transition-colors"
                              >
                                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                  <div 
                                    onClick={(e) => handleToggleChecklistItemDirect(note.id, item.id, e)}
                                    className="w-4 h-4 rounded border border-slate-500 bg-slate-900 flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                                  >
                                    <Check className="w-3 h-3 text-slate-300" />
                                  </div>

                                  {isEditingThisItem ? (
                                    <input
                                      type="text"
                                      value={inlineItemText}
                                      onChange={(e) => setInlineItemText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveInlineItem(note.id, item.id);
                                        if (e.key === 'Escape') setEditingItemId(null);
                                      }}
                                      onBlur={() => handleSaveInlineItem(note.id, item.id)}
                                      className="flex-1 bg-slate-900 border border-slate-400 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none shadow-xs"
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingItemId(item.id);
                                        setInlineItemText(item.text);
                                      }}
                                      className="line-through truncate flex-1 cursor-text text-slate-400"
                                      title="Cliquer pour modifier cet élément"
                                    >
                                      {item.text}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingItemId(item.id);
                                      setInlineItemText(item.text);
                                    }}
                                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteChecklistItemDirect(note.id, item.id, e)}
                                    className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                    title="Supprimer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SÉLECTEUR DE COULEUR FLOTTANT */}
                {isPaletteOpen && (
                  <div onClick={e => e.stopPropagation()} className="absolute top-10 right-2 bg-slate-800 border border-slate-500 rounded-2xl p-2.5 shadow-2xl flex items-center gap-2 z-20 animate-fade-in">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleChangeNoteColor(note.id, c.id)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          c.id === 'titanium' ? 'bg-slate-600 border-slate-400' :
                          c.id === 'amber' ? 'bg-amber-600 border-amber-400' :
                          c.id === 'emerald' ? 'bg-emerald-600 border-emerald-400' :
                          c.id === 'purple' ? 'bg-purple-600 border-purple-400' :
                          c.id === 'sky' ? 'bg-sky-600 border-sky-400' :
                          c.id === 'rose' ? 'bg-rose-600 border-rose-400' : 'bg-orange-600 border-orange-400'
                        } hover:scale-125 shadow-xs`}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md border font-bold uppercase tracking-wider bg-slate-900/60 text-slate-200 border-slate-600">
                    {catLabel}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <span className="text-[9px] text-slate-400 font-mono">{note.createdAt}</span>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer ml-1"
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