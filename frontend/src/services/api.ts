import axios from 'axios';

// Базовый URL нашего бэкенда на Render
const API_BASE_URL = 'https://komoru-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// API методы
export const apiService = {
  // Проверка здоровья сервера
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Получить все игры
  getGames: async (): Promise<{ success: boolean; data: Game[]; count: number }> => {
    const response = await api.get('/games');
    return response.data;
  },

  // Получить конкретную игру
  getGame: async (id: string): Promise<{ success: boolean; data: Game }> => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },

  // Получить лидерборд игры
  getLeaderboard: async (
    gameId: string, 
    limit?: number
  ): Promise<{ success: boolean; game_id: string; data: LeaderboardEntry[] }> => {
    const params = limit ? { limit } : {};
    const response = await api.get(`/games/${gameId}/leaderboard`, { params });
    return response.data;
  },

  // Получить информацию о пользователе (пока заглушка)
  getUser: async () => {
    const response = await api.get('/user/me');
    return response.data;
  },
};

export default apiService;