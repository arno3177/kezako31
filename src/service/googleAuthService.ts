const TOKEN_KEY = 'google_workspace_access_token';
const TOKEN_EXPIRY_KEY = 'google_workspace_token_expiry';

export const GoogleAuthService = {
  getStoredToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    // Vérifier si le token n'a pas expiré (valide 1 heure)
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

  initGoogleTokenClient(clientId: string, scope: string, callback: (token: string) => void) {
    if (!(window as any).google) {
      console.error("Le script Google Identity Services n'est pas chargé.");
      return null;
    }

    return (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scope,
      // 'popup' fonctionne bien sur le web. 
      // Si sur l'APK Android le bouton ne fait toujours rien, remplace par 'redirect'
      ux_mode: 'redirect', 
      callback: (response: any) => {
        if (response && response.access_token) {
          this.storeToken(response.access_token, response.expires_in);
          callback(response.access_token);
        }
      },
    });
  }
};