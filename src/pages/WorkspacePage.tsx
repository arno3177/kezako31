import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { Calendar, Mail, CheckSquare, ExternalLink, User, Plus, Trash2, HardDrive } from 'lucide-react';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const WorkspacePage: React.FC = () => {
  const currentUser = auth.currentUser;
  
  // Gestion d'une liste de tâches / notes personnelles locales
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('workspace_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Vérifier la météo et les trajets au Luxembourg', completed: true },
      { id: '2', text: 'Consulter les actualités du jour', completed: false },
      { id: '3', text: 'Préparer la réunion de la semaine', completed: false }
    ];
  });
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    localStorage.setItem('workspace_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Fonction pour ouvrir l'application native ou basculer sur le Web
  const handleOpenApp = async (appUrl: string, webUrl: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value: canOpen } = await AppLauncher.canOpenUrl({ url: appUrl });
        if (canOpen) {
          await AppLauncher.openUrl({ url: appUrl });
          return;
        }
      }
      // Fallback sur le navigateur web si non natif ou app non installée
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.warn('Erreur ouverture application, bascule web:', error);
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-xs pb-10">
      
      {/* EN-TÊTE DU TABLEAU DE BORD */}
      <div className="bg-gradient-to-r from-[#16182a] via-[#1a1f38] to-[#16182a] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">Tableau de bord Workspace</h1>
            <p className="text-[11px] text-slate-400">
              {currentUser ? `Bienvenue, ${currentUser.displayName || currentUser.email}` : 'Espace personnel de productivité'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Connecté et Sécurisé
          </span>
        </div>
      </div>

      {/* GRILLE DES RACCOURCIS GOOGLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Raccourci Gmail */}
        <div
          onClick={() => handleOpenApp(
            Capacitor.getPlatform() === 'android' ? 'com.google.android.gm' : 'googlegmail://',
            'https://mail.google.com'
          )}
          className="bg-[#151824] hover:bg-[#1a1f30] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gmail</h2>
              <p className="text-[10px] text-slate-400">Ouvrir l'application</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </div>

        {/* Raccourci Calendar */}
        <div
          onClick={() => handleOpenApp(
            Capacitor.getPlatform() === 'android' ? 'com.google.android.calendar' : 'googlecalendar://',
            'https://calendar.google.com'
          )}
          className="bg-[#151824] hover:bg-[#1a1f30] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Calendar</h2>
              <p className="text-[10px] text-slate-400">Ouvrir votre agenda</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </div>

        {/* Raccourci Google Drive */}
        <div
          onClick={() => handleOpenApp(
            Capacitor.getPlatform() === 'android' ? 'com.google.android.apps.docs' : 'googledrive://',
            'https://drive.google.com'
          )}
          className="bg-[#151824] hover:bg-[#1a1f30] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Drive</h2>
              <p className="text-[10px] text-slate-400">Accéder aux fichiers</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </div>

      </div>

      {/* SECTION TÂCHES ET NOTES PERSONNELLES */}
      <div className="bg-[#151824] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-400" /> Mes Tâches & Rappels Rapides
          </h2>
          <span className="text-[10px] text-slate-400">Sauvegarde locale instantanée</span>
        </div>

        {/* Formulaire ajout tâche */}
        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Ajouter une nouvelle tâche rapide..."
            className="flex-1 p-3 bg-[#0d0f17] border border-slate-800 text-white placeholder-slate-500 rounded-xl focus:border-indigo-500 focus:outline-none text-xs"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </form>

        {/* Liste des tâches */}
        <div className="space-y-2 pt-2">
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Aucune tâche pour le moment.</p>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl bg-[#0d0f17] border transition-all flex items-center justify-between ${
                  task.completed ? 'border-emerald-500/20 opacity-60' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => toggleTask(task.id)}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                  <span className={`text-xs ${task.completed ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default WorkspacePage;