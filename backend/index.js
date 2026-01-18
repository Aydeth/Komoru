const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // Подключаем нашу базу данных

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== МАРШРУТЫ ====================

// 1. Проверка работы сервера
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Komoru API жив и работает! 🎮',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 2. Проверка подключения к базе данных
app.get('/api/db-check', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as postgres_version');
    res.json({
      success: true,
      message: '✅ Подключение к базе данных успешно',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка базы данных:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка подключения к базе данных',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 3. Список игр (заглушка)
app.get('/api/games', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'snake',
        title: 'Змейка',
        description: 'Классическая змейка для релакса',
        icon: '🐍',
        color: '#2E7D32',
        difficulty: 'easy'
      },
      {
        id: 'puzzle15',
        title: 'Пятнашки',
        description: 'Успокаивающая головоломка',
        icon: '🧩',
        color: '#1565C0',
        difficulty: 'medium'
      }
    ]
  });
});

// 4. Информация о пользователе (заглушка)
app.get('/api/user/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'guest-123',
      username: 'Гость Komoru',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=komoru',
      level: 1,
      xp: 0,
      currency: 50,
      joinedAt: '2024-01-01'
    }
  });
});

// 5. Обработка несуществующих маршрутов (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl,
    suggestion: 'Попробуйте /api/health для проверки сервера'
  });
});

// 6. Обработка ошибок (global error handler)
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== ЗАПУСК ====================
app.listen(PORT, () => {
  console.log(`
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
🚀  Komoru Backend запущен!
📍  Порт: ${PORT}
🔗  Локально: http://localhost:${PORT}
📊  Проверка: http://localhost:${PORT}/api/health
📊  Проверка БД: http://localhost:${PORT}/api/db-check
🕐  Время запуска: ${new Date().toLocaleTimeString()}
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
  `);
});

module.exports = app;