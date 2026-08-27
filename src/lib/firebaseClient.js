import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = !!(config.apiKey && config.projectId);

// Se as variáveis de ambiente não estiverem configuradas, `db` fica null e o app
// cai automaticamente no localStorage do navegador — ver a lógica de persistência em App.jsx.
export const db = isConfigured
  ? getFirestore(getApps().length ? getApps()[0] : initializeApp(config))
  : null;
