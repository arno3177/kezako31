import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.kezako31',
  appName: 'MeteoApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
      // ATTENTION : Utilisez 'clientId' et mettez-y votre WEB Client ID (pas l'Android Client ID) !
      clientId: '962997405081-07u2hc9umk6c7jh9elv3e05env16kf10.apps.googleusercontent.com',
    },
  },
};

export default config; 
