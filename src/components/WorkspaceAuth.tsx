import React, { useState, useEffect } from 'react';
import { GoogleAuthService } from '../service/googleAuthService';
import { ShieldCheck, LogIn, RefreshCw, Terminal } from 'lucide-react';

interface WorkspaceProps {
  clientId: string;
  onAuthenticated: (token: string) => void;
}

export const WorkspaceAuth: React.FC<WorkspaceProps> = ({ onAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);

  // Fonction propre pour ajouter un log sans perturber React
  const addLog = (message: string, isError: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    setLogs((prev) => [formatted, ...prev.slice(0, 11)]);
    if (isError) {
      console.error(message);
    } else {
      console.log(message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        addLog("Initialisation du service d'authentification...");
        await GoogleAuthService.init();

        const existingToken = GoogleAuthService.getStoredToken();
        if (existingToken && isMounted) {
          addLog("Token existant trouvé et valide.");
          setIsAuthenticated(true);
          onAuthenticated(existingToken);
        }
      } catch (err: any) {
        addLog(`Erreur init: ${err?.message || err}`, true);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [onAuthenticated]);

  const handleManualLogin = async () => {
    addLog("Clic détecté : Lancement de la connexion...");
    try {
      const token = await GoogleAuthService.signIn();
      if (token) {
        addLog("Connexion réussie ! Token récupéré.");
        setIsAuthenticated(true);
        onAuthenticated(token);
      } else {
        addLog("Échec : Aucun token renvoyé.", true);
      }
    } catch (err: any) {
      addLog(`Erreur signIn: ${err?.message || err}`, true);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Vérification de la session...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <div className="flex items-center">
        {isAuthenticated ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Workspace Connecté</span>
          </div>
        ) : (
          <button
            onClick={handleManualLogin}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer w-full justify-center"
          >
            <LogIn className="w-4 h-4" />
            <span>Connexion Google Workspace</span>
          </button>
        )}
      </div>

      {/* Fenêtre de logs visuelle intégrée sans risque de boucle React */}
      <div className="bg-slate-900/95 border border-slate-700/50 rounded-lg p-2.5 text-[10px] text-slate-300 font-mono max-h-40 overflow-y-auto shadow-inner text-left">
        <div className="flex items-center gap-1 text-slate-400 font-bold mb-1 border-b border-slate-800 pb-1">
          <Terminal className="w-3 h-3" />
          <span>Console de Debug APK :</span>
        </div>
        {logs.length === 0 ? (
          <p className="text-slate-500 italic">En attente d'actions...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`py-0.5 break-all ${log.includes('Erreur') || log.includes('Échec') ? 'text-red-400 font-bold' : 'text-emerald-300'}`}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};