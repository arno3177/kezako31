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
    //console.log("[Auth] Init démarrée. Natif :", Capacitor.isNativePlatform());
    if (Capacitor.isNativePlatform()) {
      try {
        //console.log("[Auth] Appel de GoogleAuth.initialize()...");
        await GoogleAuth.initialize({
          clientId: '95625812104-rp6p68va6ob5ev2i3vp80he98p4uukgd.apps.googleusercontent.com',
          scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
          grantOfflineAccess: true,
        });
        //console.log("[Auth] GoogleAuth.initialize() réussi !");
      } catch (e: any) {
        //console.error("[Auth] Erreur init GoogleAuth natif:", JSON.stringify(e));
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
      //console.log("[Auth] signIn() déclenché.");
      
      if (Capacitor.isNativePlatform()) {
        //console.log("[Auth] Avant GoogleAuth.signIn()...");
        
       // Forcer l'appel natif avec un timeout de sécurité pour voir s'il freeze
        const googleUser = await GoogleAuth.signIn();
        
        //console.log("[Auth] Après GoogleAuth.signIn() ! Réponse :", JSON.stringify(googleUser));
        
        const accessToken = googleUser?.authentication?.accessToken;
        if (accessToken) {
          this.storeToken(accessToken);
          return accessToken;
        }
      } else {
        ////console.log("[Auth] Mode Web détecté.");
        await loadGoogleScript();
        
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
    } catch (error: any) {
      const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
     return null;
    }
  }
};