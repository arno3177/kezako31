import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

const TOKEN_KEY = 'google_workspace_access_token';
const TOKEN_EXPIRY_KEY = 'google_workspace_token_expiry';

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.accounts) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

export const GoogleAuthService = {
  async init() {
    console.log("[Auth] Initialisation, plateforme native ?", Capacitor.isNativePlatform());
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.initialize();
      } catch (e) {
        console.error("[Auth] Erreur init GoogleAuth natif:", e);
      }
    } else {
      await loadGoogleScript();
    }
  },

  getStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token || !expiry) return null;
    if (Date.now() > parseInt(expiry, 10)) {
      console.log("[Auth] Token expiré, suppression.");
      this.clearToken();
      return null;
    }
    return token;
  },

  storeToken(token: string, expiresIn: number = 3600) {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    console.log("[Auth] Token stocké avec succès dans localStorage.");
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  async signIn(): Promise<string | null> {
    try {
      console.log("[Auth] Tentative de connexion lancée...");
      
      if (Capacitor.isNativePlatform()) {
        console.log("[Auth] Appel de GoogleAuth.signIn() en mode natif...");
        const googleUser = await GoogleAuth.signIn();
        console.log("[Auth] Réponse native reçue :", googleUser);
        
        const accessToken = googleUser.authentication?.accessToken;
        if (accessToken) {
          this.storeToken(accessToken);
          return accessToken;
        } else {
          console.error("[Auth] Aucun accessToken trouvé dans la réponse native.");
        }
      } else {
        console.log("[Auth] Lancement du client GSI Web (popup)...");
        await loadGoogleScript();
        
        if (!(window as any).google?.accounts?.oauth2) {
          throw new Error("L'API Google Identity Services n'est pas disponible.");
        }

        return new Promise((resolve) => {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: '95625812104-rp6p68va6ob5ev2i3vp80he98p4uukgd.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            callback: (response: any) => {
              console.log("[Auth] Callback GSI Web reçu :", response);
              if (response && response.access_token) {
                this.storeToken(response.access_token, response.expires_in);
                resolve(response.access_token);
              } else {
                console.error("[Auth] Réponse GSI invalide ou pas d'access_token :", response);
                resolve(null);
              }
            },
          });
          client.requestAccessToken({ prompt: '' });
        });
      }
      return null;
    } catch (error) {
      console.error("[Auth] Erreur critique lors de la connexion Google:", error);
      return null;
    }
  }
};