import React, { useState, useEffect } from 'react';
import { GoogleAuthService } from '../service/googleAuthService';
import { ShieldCheck, LogIn, RefreshCw } from 'lucide-react';

interface WorkspaceProps {
  clientId: string;
  onAuthenticated: (token: string) => void;
}

export const WorkspaceAuth: React.FC<WorkspaceProps> = ({ onAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Initialisation du plugin au chargement
    GoogleAuthService.init();

    const existingToken = GoogleAuthService.getStoredToken();
    if (existingToken) {
      setIsAuthenticated(true);
      onAuthenticated(existingToken);
    }
    setIsInitializing(false);
  }, [onAuthenticated]);

  const handleManualLogin = async () => {
    const token = await GoogleAuthService.signIn();
    if (token) {
      setIsAuthenticated(true);
      onAuthenticated(token);
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
    <div className="flex items-center">
      {isAuthenticated ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Workspace Connecté</span>
        </div>
      ) : (
        <button
          onClick={handleManualLogin}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Connexion Google Workspace</span>
        </button>
      )}
    </div>
  );
};