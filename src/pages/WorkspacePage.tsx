import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { Calendar, Mail, CheckSquare, ExternalLink, User, Plus, Trash2, HardDrive, RefreshCw, Terminal } from 'lucide-react';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const WorkspacePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [isCheckingGmail, setIsCheckingGmail] = useState<boolean>(false);
  const [debugLog, setDebugLog] = useState<string>('En attente de connexion...');
  
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('google_access_token');
  });

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('workspace_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Connexion Google et capture des tokens
  const handleGoogleLogin = async () => {
    try {
      setDebugLog('Tentative de connexion Google avec scope Gmail...');
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      googleProvider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, googleProvider);
      
      const credential = (window as any).firebase?.auth?.GoogleAuthProvider?.credentialFromResult(result);
      let token = result ? (credential?.accessToken || (result as any)._tokenResponse?.oauthAccessToken) : null;
      
      if (!token && (result as any)._tokenResponse?.oauthAccessToken) {
        token = (result as any)._tokenResponse.oauthAccessToken;
      }

      if (token) {
        setGoogleAccessToken(token);
        localStorage.setItem('google_access_token', token);
        setDebugLog(`Token récupéré avec succès : ${token.substring(0, 15)}...`);
        fetchUnreadEmailsCount(token);
      } else {
        setDebugLog('Connexion réussie mais token OAuth Gmail introuvable dans la réponse.');
      }
    } catch (error: any) {
      console.error("Erreur de connexion Google:", error);
      setDebugLog(`Erreur de connexion : ${error.message || error}`);
    }
  };

  // Interrogation de l'API Gmail avec journalisation
  const fetchUnreadEmailsCount = async (token?: string) => {
    const tokenToUse = token || googleAccessToken;
    if (!tokenToUse) {
      setDebugLog('Aucun googleAccessToken disponible pour effectuer le fetch.');
      setUnreadCount(null);
      setIsCheckingGmail(false);
      return;
    }

    setIsCheckingGmail(true);
    setDebugLog('Appel de l\'API Gmail (labels/UNREAD)...');

    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels/UNREAD', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.messagesUnread ?? 0);
        setDebugLog(`Succès API ! Réponse brute : ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        setDebugLog(`Erreur API Gmail [Statut ${response.status}] : ${errorText}`);
        if (response.status === 401) {
          setGoogleAccessToken(null);
          localStorage.removeItem('google_access_token');
        }
        setUnreadCount(null);
      }
    } catch (error: any) {
      setDebugLog(`Erreur réseau : ${error.message || error}`);
      setUnreadCount(null);
    } finally {
      setIsCheckingGmail(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken && currentUser) {
      fetchUnreadEmailsCount(googleAccessToken);
    }
  }, [googleAccessToken, currentUser]);

  const handleGmailClick = async () => {
    if (!googleAccessToken) {
      await handleGoogleLogin();
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const appUrl = Capacitor.getPlatform() === 'android' ? 'com.google.android.gm' : 'googlegmail://';
        const { value: canOpen } = await AppLauncher.canOpenUrl({ url: appUrl });
        if (canOpen) {
          await AppLauncher.openUrl({ url: appUrl });
          return;
        }
      }
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    } catch (error) {
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenApp = async (appUrl: string, webUrl: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value: canOpen } = await AppLauncher.canOpenUrl({ url: appUrl });
        if (canOpen) {
          await AppLauncher.openUrl({ url: appUrl });
          return;
        }
      }
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
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
    tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
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
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Google: Connecté
              </span>
              {!googleAccessToken && (
                <button
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer text-[10px]"
                >
                  Autoriser Gmail
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              Se connecter avec Google
            </button>
          )}
        </div>
      </div>

      {/* GRILLE DES RACCOURCIS GOOGLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Raccourci Gmail */}
        <div
          onClick={handleGmailClick}
          className="bg-[#151824] hover:bg-[#1a1f30] border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all flex items-center justify-between group cursor-pointer relative"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 group-hover:scale-105 transition-transform relative">
              <Mail className="w-5 h-5" />
              {unreadCount !== null && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-md animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Gmail</h2>
                {googleAccessToken && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchUnreadEmailsCount();
                    }}
                    className="text-slate-400 hover:text-indigo-400 p-0.5 transition-colors"
                    title="Actualiser les messages non lus"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingGmail ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {unreadCount !== null
                  ? (unreadCount > 0 ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Aucun message non lu')
                  : (googleAccessToken ? 'Vérification...' : 'Cliquez pour lier Gmail')}
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
        </div>

        {/* Calendar */}
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

        {/* Google Drive */}
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

      {/* CONSOLE DE DÉBOGAGE GMAIL / TOKEN */}
      <div className="bg-[#0b0e14] border border-indigo-500/30 rounded-2xl p-4 shadow-lg space-y-2 font-mono">
        <div className="flex items-center justify-between border-b border-indigo-950 pb-2">
          <span className="text-indigo-400 font-bold flex items-center gap-1.5 text-[11px]">
            <Terminal className="w-3.5 h-3.5" /> Console de Débogage OAuth & Gmail API
          </span>
          <button
            onClick={() => fetchUnreadEmailsCount()}
            className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 hover:bg-indigo-900 transition-colors text-[9px]"
          >
            Tester l'appel API
          </button>
        </div>
        <div className="space-y-1 text-[10px]">
          <p className="text-slate-400">
            <strong className="text-slate-200">Token stocké :</strong> {googleAccessToken ? `${googleAccessToken.substring(0, 25)}...` : 'Aucun (null)'}
          </p>
          <p className="text-slate-400">
            <strong className="text-slate-200">Statut / Log :</strong> <span className="text-emerald-300">{debugLog}</span>
          </p>
        </div>
      </div>

    </div>
  );
};

export default WorkspacePage;