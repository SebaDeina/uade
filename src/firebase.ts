import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDGcb113MTmwcXlsVICMTGqyIAwhMHCYe4',
  authDomain: 'uade-b250c.firebaseapp.com',
  projectId: 'uade-b250c',
  storageBucket: 'uade-b250c.firebasestorage.app',
  messagingSenderId: '862940907072',
  appId: '1:862940907072:web:f77a70357cfb3a353181a5',
  measurementId: 'G-NNGTZKJZFG',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
