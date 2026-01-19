import axios from 'axios';

// Базовый URL нашего бэкенда на Render
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://komoru-api.onrender.com/api';

console.log('🌍 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    // Добавляем токен из localStorage
    const userStr = localStorage.getItem('komoru_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить пользователя из localStorage');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Перехватчик ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        url: error.config.url,
        error: error.response.data?.error || 'Unknown error'
      });
      
      // Автоматический логаут при 401
      if (error.response.status === 401) {
        console.log('🔒 Сессия истекла, требуется повторный вход');
        localStorage.removeItem('komoru_user');
        window.dispatchEvent(new Event('storage'));
      }
    } else if (error.request) {
      console.error('❌ No response received from server');
      console.log('💡 Проверьте:');
      console.log('1. Сервер запущен на', API_BASE_URL);
      console.log('2. CORS настройки на сервере');
      console.log('3. Сетевое подключение');
    } else {
      console.error('❌ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Интерфейсы для TypeScript
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
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  currency: number;
  joinedAt: string;
  gamesPlayed?: number;
  achievements?: number;
  rank?: string;
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

export interface SyncUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// API методы
export const apiService = {
  // Проверка здоровья сервера
  checkHealth: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('❌ Error in checkHealth:', error);
      return {
        success: false,
        error: 'Сервер не отвечает'
      };
    }
  },

  // Получить все игры
  getGames: async (): Promise<ApiResponse<Game[]>> => {
    try {
      console.log('🎮 Загружаем игры с', `${API_BASE_URL}/games`);
      const response = await api.get('/games');
      console.log('✅ Игры загружены:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getGames:', error.message);
      console.error('Full error:', error);
      
      // Возвращаем заглушку, если сервер недоступен
      return {
        success: false,
        error: 'Не удалось загрузить игры. Проверьте подключение к серверу.',
        data: [] // Пустой массив вместо undefined
      };
    }
  },

  // Получить конкретную игру
  getGame: async (id: string): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.get(`/games/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error in getGame ${id}:`, error);
      return {
        success: false,
        error: 'Игра не найдена'
      };
    }
  },

  // Получить лидерборд игры
  getLeaderboard: async (
    gameId: string, 
    limit?: number
  ): Promise<ApiResponse<LeaderboardEntry[]>> => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/games/${gameId}/leaderboard`, { params });
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error in getLeaderboard for ${gameId}:`, error);
      return {
        success: false,
        error: 'Не удалось загрузить лидерборд',
        data: [] // Пустой массив вместо undefined
      };
    }
  },

  // Получить информацию о пользователе
  getUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/user/me');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getUser:', error);
      
      // Если пользователь не авторизован, возвращаем ошибку
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Требуется авторизация'
        };
      }
      
      return {
        success: false,
        error: 'Не удалось загрузить информацию о пользователе'
      };
    }
  },

  // Сохранить результат игры
  saveGameScore: async (
    gameId: string,
    score: number,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<GameScore>> => {
    try {
      const response = await api.post(`/games/${gameId}/scores`, {
        score,
        metadata: metadata || {}
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in saveGameScore:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Требуется авторизация для сохранения результатов'
        };
      }
      
      return {
        success: false,
        error: 'Не удалось сохранить результат'
      };
    }
  },

  // Получить результаты пользователя
  getUserScores: async (userId?: string): Promise<ApiResponse<GameScore[]>> => {
    try {
      const endpoint = userId ? `/users/${userId}/scores` : '/users/current/scores';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getUserScores:', error);
      return {
        success: false,
        error: 'Не удалось загрузить результаты',
        data: [] // Пустой массив вместо undefined
      };
    }
  },

  // Получить достижения пользователя
  getUserAchievements: async (userId?: string): Promise<ApiResponse<Achievement[]>> => {
    try {
      const endpoint = userId ? `/users/${userId}/achievements` : '/users/current/achievements';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getUserAchievements:', error);
      return {
        success: false,
        error: 'Не удалось загрузить достижения',
        data: [] // Пустой массив вместо undefined
      };
    }
  },

  // Синхронизация пользователя с бэкендом
  syncUser: async (userData: SyncUserData): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/users/sync', userData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error syncing user:', error);
      return {
        success: false,
        error: 'Ошибка синхронизации'
      };
    }
  },

  // Получить топ игроков (глобальный)
  getTopPlayers: async (limit?: number): Promise<ApiResponse<any>> => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get('/leaderboard/global', { params });
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in getTopPlayers:', error);
      return {
        success: false,
        error: 'Не удалось загрузить топ игроков',
        data: [] // Пустой массив вместо undefined
      };
    }
  },

  // Проверить подключение к БД
  checkDatabase: async (): Promise<ApiResponse<{ current_time: string, postgres_version: string }>> => {
    try {
      const response = await api.get('/db-check');
      return response.data;
    } catch (error: any) {
      console.error('❌ Error in checkDatabase:', error);
      return {
        success: false,
        error: 'Не удалось подключиться к базе данных'
      };
    }
  },

  // Проверка CORS
  testCors: async (): Promise<{ ok: boolean; status: number; statusText: string }> => {
    try {
      const response = await fetch(API_BASE_URL + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      console.error('❌ CORS Test failed:', error);
      throw error;
    }
  }
};

export default apiService;