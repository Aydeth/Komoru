const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // Подключаем нашу базу данных

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== МАРШРУТЫ API ====================

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

// 3. Список игр ИЗ БАЗЫ ДАННЫХ
app.get('/api/games', async (req, res) => {
  try {
    // Получаем только активные игры из базы
    const result = await db.query(`
      SELECT id, title, description, icon, color, difficulty, is_active
      FROM games 
      WHERE is_active = TRUE
      ORDER BY created_at
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Ошибка при получении игр:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить игры',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. Получение конкретной игры по ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM games WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка при получении игры:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить игру'
    });
  }
});

// 5. Топ рекордов для конкретной игры
app.get('/api/games/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Проверяем, существует ли игра
    const gameCheck = await db.query(
      'SELECT id FROM games WHERE id = $1',
      [id]
    );
    
    if (gameCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }
    
    // Получаем топ рекордов с именами пользователей
    const result = await db.query(`
      SELECT 
        gs.score,
        gs.created_at,
        u.username,
        u.avatar_url,
        u.level
      FROM game_scores gs
      JOIN users u ON gs.user_id = u.id
      WHERE gs.game_id = $1
      ORDER BY gs.score DESC
      LIMIT $2
    `, [id, limit]);
    
    res.json({
      success: true,
      game_id: id,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Ошибка при получении лидерборда:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить лидерборд'
    });
  }
});

// 6. Информация о пользователе (пока заглушка - потом подключим Firebase)
app.get('/api/user/me', (req, res) => {
  // TODO: После подключения Firebase будем получать реального пользователя
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

// ==================== АДМИН-МАРШРУТЫ (для разработки) ====================

// Маршрут для проверки структуры БД (только для разработки)
app.get('/api/admin/tables', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    res.json({
      success: true,
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Проверка тестовых данных в базе
app.get('/api/admin/test-data', async (req, res) => {
  try {
    // Проверяем игры
    const gamesResult = await db.query('SELECT id, title FROM games');
    
    // Проверяем достижения
    const achievementsResult = await db.query('SELECT id, title FROM achievements');
    
    res.json({
      success: true,
      games_count: gamesResult.rows.length,
      games: gamesResult.rows,
      achievements_count: achievementsResult.rows.length,
      achievements: achievementsResult.rows.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Возможно, таблицы не созданы' 
    });
  }
});

// =========== ВАЖНО: ЭТОТ МАРШРУТ ОПАСЕН! ИСПОЛЬЗОВАТЬ ТОЛЬКО ДЛЯ ОТЛАДКИ ===========
// ВАЖНО: ТОЛЬКО ДЛЯ ОТЛАДКИ! ПОТОМ УДАЛИТЬ ИЛИ ЗАЩИТИТЬ!
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DB_INIT === 'true') {
  app.post('/api/admin/reset-db', async (req, res) => {
    try {
      // Проверка токена
      const authHeader = req.headers.authorization;
      const expectedToken = process.env.ADMIN_TOKEN;
      
      if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      
      // Удаляем все таблицы (осторожно!)
      const dropTablesSQL = `
        DROP TABLE IF EXISTS user_quest_progress CASCADE;
        DROP TABLE IF EXISTS daily_quests CASCADE;
        DROP TABLE IF EXISTS user_currency CASCADE;
        DROP TABLE IF EXISTS user_achievements CASCADE;
        DROP TABLE IF EXISTS achievements CASCADE;
        DROP TABLE IF EXISTS game_scores CASCADE;
        DROP TABLE IF EXISTS games CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `;
      
      await db.query(dropTablesSQL);
      
      // Запускаем нормальную инициализацию
      const initDatabase = require('./db/init-db');
      await initDatabase();
      
      res.json({ 
        success: true, 
        message: 'База данных полностью пересоздана' 
      });
      
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
// =========== КОНЕЦ ОПАСНОГО МАРШРУТА ===========

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка несуществующих маршрутов (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Маршрут не найден',
    path: req.originalUrl,
    suggestion: 'Попробуйте /api/health для проверки сервера'
  });
});

// Обработка ошибок (global error handler)
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== ЗАПУСК СЕРВЕРА ====================
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