import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.kezako31',
  appName: 'MeteoApp',
  webDir: 'dist',
  server: {
    // Permet d'éviter les problèmes de localhost en production mobile
    androidScheme: 'https'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
      androidClientId: '95625812104-rp6p68va6ob5ev2i3vp80he98p4uukgd.apps.googleusercontent.com',
    },
  },
};

export default config;