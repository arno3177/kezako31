import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export const GoogleAuthWidget: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Erreur de connexion Google :", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    }
  };

  return (
    <div className="bg-[#151824] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
      <div className="flex items-center space-x-2 text-indigo-400 border-b border-slate-800 pb-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-white">Authentification Google</h2>
      </div>

      {user ? (
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-500" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="font-bold text-white text-xs">{user.displayName}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Connectez-vous avec votre compte Google pour débloquer l'accès au module **Quantum AI** en toute sécurité.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-xs"
          >
            <LogIn className="w-4 h-4 text-indigo-600" />
            <span>Se connecter avec Google</span>
          </button>
        </div>
      )}
    </div>
  );
};