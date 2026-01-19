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
  refreshToken: () => Promise<string | null>;
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
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Функция для обновления токена
  const refreshToken = async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    
    try {
      const newToken = await firebaseUser.getIdToken(true);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  // Синхронизация пользователя с нашим бэкендом
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();
      
      const userData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Игрок',
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
        token
      };

      setUser(userData);
      
      // Сохраняем в localStorage
      localStorage.setItem('komoru_user', JSON.stringify(userData));
      
      // Настраиваем автоматическое обновление токена каждые 55 минут
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      
      const interval = setInterval(async () => {
        const refreshedToken = await refreshToken();
        if (refreshedToken) {
          const updatedUser = { ...userData, token: refreshedToken };
          setUser(updatedUser);
          localStorage.setItem('komoru_user', JSON.stringify(updatedUser));
        }
      }, 55 * 60 * 1000); // 55 минут
      
      setTokenRefreshInterval(interval);
      
      // Синхронизируем с нашим бэкендом
      try {
        await apiService.syncUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        console.log('✅ Пользователь синхронизирован с бэкендом');
      } catch (syncError) {
        console.warn('⚠️ Не удалось синхронизировать с бэкендом:', syncError);
        // Продолжаем работу, даже если синхронизация не удалась
      }
      
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
      
      // Преобразуем ошибку в человекочитаемый вид
      let errorMessage = 'Ошибка при входе через Google';
      
      if (error instanceof Error) {
        if (error.message.includes('popup-closed-by-user')) {
          errorMessage = 'Вход отменен пользователем';
        } else if (error.message.includes('account-exists-with-different-credential')) {
          errorMessage = 'Аккаунт уже существует с другими учетными данными';
        } else if (error.message.includes('auth/network-request-failed')) {
          errorMessage = 'Проблемы с сетью. Проверьте подключение к интернету';
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Выход
  const logout = async () => {
    try {
      setLoading(true);
      
      // Очищаем интервал обновления токена
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        setTokenRefreshInterval(null);
      }
      
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

  // Восстановление сессии из localStorage
  const restoreSession = () => {
    const savedUser = localStorage.getItem('komoru_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('komoru_user');
      }
    }
  };

  // Слушатель состояния аутентификации Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        // Если пользователь вышел в Firebase, очищаем и у нас
        setUser(null);
        localStorage.removeItem('komoru_user');
        
        // Очищаем интервал
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          setTokenRefreshInterval(null);
        }
      }
      
      setLoading(false);
    });

    // Восстанавливаем сессию при загрузке
    restoreSession();
    
    // Начальная установка loading
    setLoading(false);

    return () => {
      unsubscribe();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    logout,
    updateUserProfile,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};