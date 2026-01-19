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

// Перехватчик для добавления токена
api.interceptors.request.use(
  (config) => {
    // Добавляем Firebase токен из localStorage
    const userStr = localStorage.getItem('komoru_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id && user.id !== 'guest-123') {
          // Для реальных пользователей добавляем заголовок
          config.headers['X-User-ID'] = user.id;
        }
      } catch (e) {
        console.warn('Не удалось распарсить пользователя');
      }
    }
    
    return config;
  },
  (error) => {
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

// API методы
export const apiService = {
  // Проверка здоровья сервера
  checkHealth: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Сервер не отвечает'
      };
    }
  },

  // Получить все игры
  getGames: async (): Promise<ApiResponse<Game[]>> => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось загрузить игры'
      };
    }
  },

  // Получить конкретную игру
  getGame: async (id: string): Promise<ApiResponse<Game>> => {
    try {
      const response = await api.get(`/games/${id}`);
      return response.data;
    } catch (error) {
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
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось загрузить лидерборд'
      };
    }
  },

  // Получить информацию о пользователе (РЕАЛЬНЫЙ ЗАПРОС)
  getUser: async (): Promise<ApiResponse<User>> => {
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
  },

  // Сохранить результат игры (для реального пользователя)
  saveGameScore: async (
    gameId: string,
    score: number,
    metadata?: Record<string, any>
  ): Promise<ApiResponse<GameScore>> => {
    try {
      // Получаем userId из localStorage
      const userStr = localStorage.getItem('komoru_user');
      const userId = userStr ? JSON.parse(userStr).id : 'guest-123';
      
      console.log(`💾 Сохранение результата для пользователя: ${userId}`);
      
      const response = await api.post(`/games/${gameId}/scores`, {
        userId,
        score,
        metadata: metadata || {}
      });
      
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Не удалось сохранить результат'
      };
    }
  },

  // Получить результаты пользователя (РЕАЛЬНЫЙ ЗАПРОС)
  getUserScores: async (): Promise<ApiResponse<GameScore[]>> => {
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
  },

  // Получить достижения пользователя (РЕАЛЬНЫЙ ЗАПРОС)
  getUserAchievements: async (): Promise<ApiResponse<Achievement[]>> => {
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
  },

  // Синхронизация пользователя с бэкендом
  syncUser: async (userData: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/users/sync', userData);
      console.log('🔄 Пользователь синхронизирован:', response.data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Ошибка синхронизации'
      };
    }
  }
};

export default apiService;