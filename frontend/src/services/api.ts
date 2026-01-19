import axios from 'axios';

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

// Добавляем перехватчик для отладки
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
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
  avatar: string;
  level: number;
  xp: number;
  currency: number;
  joinedAt: string;
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
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  },

  // Получить все игры
  getGames: async (): Promise<ApiResponse<Game[]>> => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      console.error('❌ Error in getGames:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  },

  // Получить конкретную игру
  getGame: async (id: string): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.get(`/games/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error in getGame ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
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
    } catch (error) {
      console.error(`❌ Error in getLeaderboard for ${gameId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  },

  // Получить информацию о пользователе (пока заглушка)
  getUser: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/user/me');
      return response.data;
    } catch (error) {
      console.error('❌ Error in getUser:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
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
      // Временный userId - позже заменим на реального пользователя
      const userId = 'guest-123';
      
      const response = await api.post(`/games/${gameId}/scores`, {
        userId,
        score,
        metadata: metadata || {}
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error in saveGameScore:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось сохранить результат'
      };
    }
  },

  // Получить результаты пользователя
  getUserScores: async (userId: string, gameId?: string): Promise<ApiResponse<GameScore[]>> => {
    try {
      const params = gameId ? { gameId } : {};
      const response = await api.get(`/users/${userId}/scores`, { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error in getUserScores:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить результаты'
      };
    }
  },

  // Получить достижения пользователя
  getUserAchievements: async (userId: string): Promise<ApiResponse<Achievement[]>> => {
    try {
      const response = await api.get(`/users/${userId}/achievements`);
      return response.data;
    } catch (error) {
      console.error('❌ Error in getUserAchievements:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить достижения'
      };
    }
  },

  // Обновить информацию о пользователе
  updateUserStats: async (
    userId: string, 
    data: { xp?: number; currency?: number }
  ): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put(`/users/${userId}/stats`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Error in updateUserStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось обновить статистику'
      };
    }
  },

  // Проверить подключение к БД
  checkDatabase: async (): Promise<ApiResponse<{ current_time: string, postgres_version: string }>> => {
    try {
      const response = await api.get('/db-check');
      return response.data;
    } catch (error) {
      console.error('❌ Error in checkDatabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  },

  // Дополнительный метод для проверки CORS
  testCors: async (): Promise<{ ok: boolean; status: number; statusText: string }> => {
    try {
      // Простой запрос для проверки CORS
      const response = await fetch(API_BASE_URL + '/health', {
        method: 'GET',
        mode: 'cors',
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