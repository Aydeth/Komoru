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
  // Для локальной разработки с CORS
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

// API методы
export const apiService = {
  // Проверка здоровья сервера
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Получить все игры
  getGames: async (): Promise<{ success: boolean; data: Game[]; count: number }> => {
    try {
      const response = await api.get('/games');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get games:', error);
      throw error;
    }
  },

  // Получить конкретную игру
  getGame: async (id: string): Promise<{ success: boolean; data: Game }> => {
    try {
      const response = await api.get(`/games/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to get game ${id}:`, error);
      throw error;
    }
  },

  // Получить лидерборд игры
  getLeaderboard: async (
    gameId: string, 
    limit?: number
  ): Promise<{ success: boolean; game_id: string; data: LeaderboardEntry[] }> => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/games/${gameId}/leaderboard`, { params });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to get leaderboard for ${gameId}:`, error);
      throw error;
    }
  },

  // Получить информацию о пользователе (пока заглушка)
  getUser: async (): Promise<{ success: boolean; data: User }> => {
    try {
      const response = await api.get('/user/me');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      throw error;
    }
  },

  // Дополнительный метод для проверки CORS
  testCors: async () => {
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