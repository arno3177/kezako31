import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

const TOKEN_KEY = 'google_workspace_access_token';
const TOKEN_EXPIRY_KEY = 'google_workspace_token_expiry';

// Fonction utilitaire pour charger le script Google GSI sur le web à la volée
const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) {
      // Attendre un peu si le script est déjà en cours de chargement
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
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.initialize();
      } catch (e) {
        console.error("Erreur init GoogleAuth natif:", e);
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
      this.clearToken();
      return null;
    }
    return token;
  },

  storeToken(token: string, expiresIn: number = 3600) {
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  async signIn(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        // --- MOBILE (APK Android / iOS) ---
        const googleUser = await GoogleAuth.signIn();
        const accessToken = googleUser.authentication.accessToken;
        if (accessToken) {
          this.storeToken(accessToken);
          return accessToken;
        }
      } else {
        // --- WEB (Localhost) ---
        await loadGoogleScript();
        
        if (!(window as any).google?.accounts?.oauth2) {
          throw new Error("L'API Google Identity Services n'est pas disponible.");
        }

        return new Promise((resolve) => {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: '95625812104-rp6p68va6ob5ev2i3vp80he98p4uukgd.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/gmail.readonly',
            callback: (response: any) => {
              if (response && response.access_token) {
                this.storeToken(response.access_token, response.expires_in);
                resolve(response.access_token);
              } else {
                resolve(null);
              }
            },
          });
          client.requestAccessToken({ prompt: '' });
        });
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la connexion Google:", error);
      return null;
    }
  }
};