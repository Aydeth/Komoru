const express = require('express');
const router = express.Router();
const db = require('./db');

// Middleware для проверки администратора
const verifyAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  
  if (adminToken === process.env.ADMIN_TOKEN) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Требуется токен администратора'
    });
  }
};

// Полная очистка базы данных
router.post('/reset-database', verifyAdmin, async (req, res) => {
  let client;
  try {
    console.log('🔄 Запрос на сброс базы данных от администратора');
    
    client = await db.pool.connect();
    await client.query('BEGIN');
    
    // 1. Удаляем пользовательские данные
    await client.query('TRUNCATE TABLE game_sessions CASCADE');
    await client.query('TRUNCATE TABLE game_scores CASCADE');
    await client.query('TRUNCATE TABLE user_achievements CASCADE');
    await client.query('TRUNCATE TABLE user_quest_progress CASCADE');
    await client.query('DELETE FROM user_currency');
    await client.query('DELETE FROM users');
    
    // 2. Сбрасываем sequences
    await client.query('ALTER SEQUENCE game_sessions_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE game_scores_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE user_quest_progress_id_seq RESTART WITH 1');
    
    // 3. Пересоздаем тестовые данные если нужно
    await client.query(`
      INSERT INTO games (id, title, description, icon, color, difficulty) VALUES
      ('snake', 'Змейка', 'Классическая змейка для релакса', '🐍', '#2E7D32', 'easy'),
      ('puzzle15', 'Пятнашки', 'Успокаивающая головоломка', '🧩', '#1565C0', 'medium'),
      ('memory', 'Память', 'Тренировка памяти на карточках', '🧠', '#7B1FA2', 'easy'),
      ('arkanoid', 'Арканоид', 'Разбивайте блоки мячиком', '🕹️', '#D32F2F', 'medium')
      ON CONFLICT (id) DO NOTHING;
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ База данных успешно сброшена');
    
    res.json({
      success: true,
      message: 'База данных успешно сброшена. Все пользовательские данные удалены.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('❌ Ошибка сброса базы данных:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сброса базы данных',
      details: error.message
    });
  } finally {
    if (client) client.release();
  }
});

// Статистика базы данных
router.get('/stats', verifyAdmin, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM game_sessions) as sessions_count,
        (SELECT COUNT(*) FROM game_scores) as scores_count,
        (SELECT COUNT(*) FROM user_achievements) as achievements_count,
        (SELECT COUNT(*) FROM achievements) as total_achievements
    `);
    
    res.json({
      success: true,
      data: stats.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

module.exports = router;