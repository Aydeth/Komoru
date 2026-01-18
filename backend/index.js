const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Создаем приложение
const app = express();
const PORT = process.env.PORT || 3001;

// Мидлвары
app.use(cors()); // Разрешаем запросы с любых доменов
app.use(express.json()); // Позволяем читать JSON из запросов

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

// 2. Список игр (заглушка)
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

// 3. Информация о пользователе (заглушка)
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

// 4. Обработка несуществующих маршрутов (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl,
    suggestion: 'Попробуйте /api/health для проверки сервера'
  });
});

// 5. Обработка ошибок (global error handler)
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
🕐  Время запуска: ${new Date().toLocaleTimeString()}
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
  `);
});

// Экспортируем для тестов (если понадобится)
module.exports = app;