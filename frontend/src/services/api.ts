import axios from 'axios';
import { useAchievements } from '../contexts/AchievementContext';
import { auth } from '../firebase/config';

// Базовый URL нашего бэкенда на Render
const API_BASE_URL = 'https://komoru-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

// Перехватчик для добавления Firebase токена
api.interceptors.request.use(
  async (config) => {
    // Получаем токен из Firebase
    const user = auth.currentUser;
    
    if (user) {
      try {
        const token = await user.getIdToken();
        
        // Добавляем токен в заголовок Authorization
        config.headers['Authorization'] = `Bearer ${token}`;
        
        console.log('🔐 Добавлен Firebase токен в запрос');
      } catch (error) {
        console.warn('⚠️ Не удалось получить токен:', error);
      }
    }
    
    // Получаем пользователя из localStorage для userId
    const userStr = localStorage.getItem('komoru_user');
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        
        // Добавляем userId как заголовок X-User-ID
        if (userData.id && userData.id !== 'guest-123') {
          config.headers['X-User-ID'] = userData.id;
        }
        
        // Также добавляем как query параметр для надёжности
        if (config.url?.includes('/api/achievements') || 
            config.url?.includes('/api/user') ||
            config.url?.includes('/api/users/current')) {
          
          config.params = {
            ...config.params,
            userId: userData.id
          };
        }
        
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить пользователя из localStorage');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавить retry логику
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 5xx или таймаут - пробуем повторить
    if ((error.code === 'ECONNABORTED' || error.response?.status >= 500) && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Интерфейсы
export interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: string;
  is_active: boolean;
}

export interface LeaderboardEntry {
  score: number;
  created_at: string;
  username: string;
  avatar_url: string | null;
  level: number;
  user_id: string;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
  level: number;
  xp: number;
  currency: number;
  joinedAt: string;
  gamesPlayed?: number;
  achievements?: number;
}

export interface GameScore {
  id: number;
  user_id: string;
  game_id: string;
  score: number;
  metadata: Record<string, any>;
  created_at: string;
  game_title?: string;
  game_icon?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  xp_reward: number;
  game_id: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
  is_secret: boolean;
  unlocked_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Класс для работы с API
class ApiService {
  private showAchievementCallback: ((achievement: any) => void) | null = null;

  // Метод для установки callback
  setShowAchievementCallback(callback: (achievement: any) => void) {
    this.showAchievementCallback = callback;
  }

  // Проверка здоровья сервера
  checkHealth = async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Сервер не отвечает'
      };
    }
  };

  // Получить все игры
  getGames = async (): Promise<ApiResponse<Game[]>> => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось загрузить игры'
      };
    }
  };

  // Получить конкретную игру
  getGame = async (id: string): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.get(`/games/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Игра не найдена'
      };
    }
  };

  // Получить лидерборд игры
  getLeaderboard = async (
    gameId: string, 
    limit?: number
  ): Promise<ApiResponse<LeaderboardEntry[]>> => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/games/${gameId}/leaderboard`, { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось загрузить лидерборд'
      };
    }
  };

  // Получить информацию о пользователе
  getUser = async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/user/me');
      console.log('👤 Данные пользователя:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return {
        success: false,
        error: 'Не удалось загрузить информацию о пользователе'
      };
    }
  };

  getUserById = async (userId: string): Promise<ApiResponse<any>> => {
    try {
      console.log(`👤 Загрузка данных пользователя ${userId}...`);
      const response = await api.get(`/users/${userId}/achievements`);
      console.log('📦 Данные пользователя получены:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки пользователя:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Не удалось загрузить данные пользователя'
      };
    }
  };

  getUserAchievementsById = async (userId: string): Promise<ApiResponse<any>> => {
    try {
      console.log(`🏆 Загрузка достижений пользователя ${userId}...`);
      const response = await api.get(`/users/${userId}/achievements`);
      console.log('📦 Достижения пользователя получены:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Ошибка загрузки достижений:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Не удалось загрузить достижения пользователя'
      };
    }
  };

  private achievementCallbacks: ((achievement: any) => void)[] = [];

  // Метод для регистрации callback
  registerAchievementCallback(callback: (achievement: any) => void): () => void {
    this.achievementCallbacks.push(callback);
    
    // Возвращаем функцию для удаления callback
    return () => {
      this.achievementCallbacks = this.achievementCallbacks.filter(cb => cb !== callback);
    };
  }

  // Вызываем все зарегистрированные callbacks
  private triggerAchievementCallbacks(achievement: any) {
    console.log('🎯 Вызываем callbacks для достижения:', achievement.title);
    this.achievementCallbacks.forEach(callback => {
      try {
        callback(achievement);
      } catch (error) {
        console.error('Ошибка в callback достижения:', error);
      }
    });
  }

  // Сохранить результат игры
saveGameScore = async (
  gameId: string,
  score: number,
  metadata?: Record<string, any>
): Promise<ApiResponse<GameScore>> => {
  try {
    console.log(`💾 Сохранение результата (игра: ${gameId}, счёт: ${score})`);
    
    // НЕ отправляем userId в теле запроса - он берется из токена на бэкенде
    const response = await api.post(`/games/${gameId}/scores`, {
      score,
      metadata: metadata || {}
    });
    
    console.log('✅ Результат сохранен:', response.data);
    
    // Если есть разблокированное достижение - вызываем callbacks
    if (response.data.unlocked_achievement) {
      console.log('🎉 Получено новое достижение, вызываем callbacks');
      this.triggerAchievementCallbacks(response.data.unlocked_achievement);
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Ошибка сохранения:', error.response?.data || error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: 'Требуется авторизация для сохранения результатов'
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || 'Не удалось сохранить результат'
    };
  }
};

  // Получить результаты пользователя
  getUserScores = async (): Promise<ApiResponse<GameScore[]>> => {
    try {
      const response = await api.get('/users/current/scores');
      console.log('🎮 Результаты игр:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения результатов:', error);
      return {
        success: false,
        error: 'Не удалось загрузить результаты'
      };
    }
  };

  // Получить достижения пользователя
  getUserAchievements = async (): Promise<ApiResponse<Achievement[]>> => {
    try {
      const response = await api.get('/users/current/achievements');
      console.log('🏆 Достижения:', response.data);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения достижений:', error);
      return {
        success: false,
        error: 'Не удалось загрузить достижения'
      };
    }
  };

// Синхронизация пользователя с бэкендом
syncUser = async (userData: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<ApiResponse<any>> => {
  try {
    // Токен будет автоматически добавлен перехватчиком
    const response = await api.post('/users/sync', {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL
    });
    
    console.log('🔄 Пользователь синхронизирован:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Ошибка синхронизации:', error.response?.data || error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: 'Ошибка авторизации. Пожалуйста, войдите снова'
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.error || 'Ошибка синхронизации'
    };
  }
};

  // Получить все достижения
  getAllAchievements = async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/achievements');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось загрузить все достижения'
      };
    }
  };
}

// Создаем экземпляр и экспортируем
export const apiService = new ApiService();
export default apiService;