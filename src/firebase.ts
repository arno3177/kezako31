import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAenGkAV5r8iUPEDO12_ccoKojq4myXKIM",
  authDomain: "pulse-32ca1.firebaseapp.com",
  projectId: "pulse-32ca1",
  storageBucket: "pulse-32ca1.appspot.com",
  messagingSenderId: "95625812104",
  appId: "1:95625812104:web:19f24aee4578bd3010a73d",
  measurementId: "G-DPD28CWZ74"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Ajout des permissions pour lire Gmail et Google Calendar
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };