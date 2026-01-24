const rateLimit = require('express-rate-limit');

// Ограничение для сохранения результатов игр
const gameScoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // максимум 50 запросов за 15 минут
  message: {
    success: false,
    error: 'Слишком много запросов на сохранение результатов. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Используем userId из аутентифицированного пользователя как ключ
    return req.user ? req.user.uid : req.ip;
  }
});

// Ограничение для синхронизации пользователей
const userSyncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 синхронизаций в час
  message: {
    success: false,
    error: 'Слишком много запросов на синхронизацию. Попробуйте позже.'
  }
});

module.exports = { gameScoreLimiter, userSyncLimiter };