import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Синхронизация пользователя с нашим бэкендом
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      
      // Отправляем данные пользователя на наш бэкенд
      // (Пока заглушка - нужно будет создать эндпоинт на бэкенде)
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Игрок',
        avatar: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + firebaseUser.uid,
        token
      };

      setUser(userData);
      
      // Сохраняем в localStorage
      localStorage.setItem('komoru_user', JSON.stringify(userData));
      
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };

  // Вход через Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(result.user);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('komoru_user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Обновление профиля
  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('komoru_user', JSON.stringify(updatedUser));
  };

  // Слушатель состояния аутентификации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        // Проверяем, есть ли сохраненный пользователь в localStorage
        const savedUser = localStorage.getItem('komoru_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('komoru_user');
          }
        } else {
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};