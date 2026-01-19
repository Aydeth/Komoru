import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDW9WaRtt1k05wUluw4FO57-lUSyz1GGPI",
  authDomain: "komoru-games.firebaseapp.com",
  projectId: "komoru-games",
  storageBucket: "komoru-games.firebasestorage.app",
  messagingSenderId: "652317600487",
  appId: "1:652317600487:web:46f3d412296b9e416e1042",
  measurementId: "G-6SB18KWK6G"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Экспорт сервисов
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Настройки провайдера
googleProvider.setCustomParameters({
  prompt: 'select_account'
});