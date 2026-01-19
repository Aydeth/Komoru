const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== НАСТРОЙКИ CORS ====================
const allowedOrigins = [
  'https://komoru-sage.vercel.app',
  'https://komoru.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Кастомный CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Разрешаем запросы из списка allowedOrigins
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, x-user-id'
  );
  res.header('Access-Control-Expose-Headers', 'X-User-ID');
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// ==================== МАРШРУТЫ API ====================

// 1. Проверка работы сервера
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Komoru API жив и работает! 🎮',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: '✅ Настроен для Vercel'
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
      error: 'Ошибка подключения к базе данных'
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
      error: 'Не удалось загрузить игры'
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

// ==================== ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ USER ID ====================
const getUserId = (req) => {
  console.log('🔍 Поиск userId:');
  console.log('- Headers:', req.headers);
  console.log('- Query:', req.query);
  
  // 1. Пробуем получить из заголовка X-User-ID
  const userIdFromHeader = req.headers['x-user-id'];
  if (userIdFromHeader) {
    console.log(`✅ Найден в заголовке: ${userIdFromHeader}`);
    return userIdFromHeader;
  }
  
  // 2. Пробуем получить из query параметра
  if (req.query.userId) {
    console.log(`✅ Найден в query: ${req.query.userId}`);
    return req.query.userId;
  }
  
  // 3. По умолчанию - гость
  console.log('⚠️  UserId не найден, используем гостя');
  return 'guest-123';
};

// 6. Получить информацию о реальном пользователе
app.get('/api/user/me', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log(`👤 Запрос данных пользователя: ${userId}`);
    
    if (userId === 'guest-123') {
      // Гостевой доступ
      return res.json({
        success: true,
        data: {
          id: 'guest-123',
          username: 'Гость Komoru',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=komoru',
          email: '',
          level: 1,
          xp: 0,
          currency: 0,
          joinedAt: new Date().toISOString(),
          gamesPlayed: 0,
          achievements: 0
        }
      });
    }
    
    // Поиск реального пользователя
    const result = await db.query(`
      SELECT 
        u.*,
        uc.balance as currency,
        (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count,
        (SELECT COUNT(*) FROM game_scores gs WHERE gs.user_id = u.id) as games_played
      FROM users u
      LEFT JOIN user_currency uc ON u.id = uc.user_id
      WHERE u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      // Пользователь не найден в нашей БД
      return res.json({
        success: true,
        data: {
          id: userId,
          username: 'Новый игрок',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          email: '',
          level: 1,
          xp: 0,
          currency: 0,
          joinedAt: new Date().toISOString(),
          gamesPlayed: 0,
          achievements: 0
        }
      });
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar_url,
        email: user.email,
        level: user.level,
        xp: user.total_xp,
        currency: user.currency || 0,
        joinedAt: user.created_at,
        gamesPlayed: user.games_played || 0,
        achievements: user.achievements_count || 0
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить информацию о пользователе'
    });
  }
});

// ==================== API ДЛЯ ИГР ====================

// 7. Сохранить результат игры
app.post('/api/games/:id/scores', async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const { userId, score, metadata = {} } = req.body;

    // Временная проверка
    if (!userId || userId === 'guest-123') {
      return res.status(400).json({
        success: false,
        error: 'Требуется авторизация для сохранения результатов'
      });
    }

    // Проверяем, существует ли игра
    const gameCheck = await db.query(
      'SELECT id FROM games WHERE id = $1 AND is_active = TRUE',
      [gameId]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }

    // Сохраняем результат
    const result = await db.query(
      `INSERT INTO game_scores (user_id, game_id, score, metadata) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, game_id) 
       DO UPDATE SET 
         score = GREATEST(game_scores.score, EXCLUDED.score),
         metadata = EXCLUDED.metadata,
         created_at = CASE 
           WHEN EXCLUDED.score > game_scores.score THEN CURRENT_TIMESTAMP 
           ELSE game_scores.created_at 
         END
       RETURNING *`,
      [userId, gameId, score, JSON.stringify(metadata)]
    );

    // Проверяем достижения
    await checkAchievements(userId, gameId, score, metadata);

    // Обновляем общий опыт пользователя
    await updateUserXP(userId);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Результат сохранен!'
    });

  } catch (error) {
    console.error('❌ Ошибка при сохранении результата:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось сохранить результат'
    });
  }
});

// 8. Получить результаты текущего пользователя
app.get('/api/users/current/scores', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    console.log(`🎮 Запрос результатов для пользователя: ${userId}`);
    
    const result = await db.query(`
      SELECT gs.*, g.title as game_title, g.icon as game_icon
      FROM game_scores gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.user_id = $1
      ORDER BY gs.created_at DESC
      LIMIT 10
    `, [userId]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Ошибка при получении результатов:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить результаты'
    });
  }
});

// 9. Получить достижения текущего пользователя
app.get('/api/users/current/achievements', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    const result = await db.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC
       LIMIT 10`,
      [userId]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('❌ Ошибка при получении достижений:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить достижения'
    });
  }
});

// 10. Синхронизация пользователя с Firebase
app.post('/api/users/sync', async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    
    console.log(`🔄 Синхронизация пользователя: ${email} (${uid})`);
    
    // Создаем или обновляем пользователя в нашей БД
    const result = await db.query(`
      INSERT INTO users (id, email, username, avatar_url, last_login)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        last_login = CURRENT_TIMESTAMP
      RETURNING *
    `, [uid, email, displayName || 'Игрок', photoURL]);
    
    // Создаем запись валюты, если её нет
    await db.query(`
      INSERT INTO user_currency (user_id, balance)
      VALUES ($1, 0)
      ON CONFLICT (user_id) DO NOTHING
    `, [uid]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Пользователь синхронизирован'
    });
    
  } catch (error) {
    console.error('❌ Ошибка синхронизации пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка синхронизации пользователя'
    });
  }
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Проверка достижений
async function checkAchievements(userId, gameId, score, metadata) {
  try {
    // Получаем все достижения для этой игры
    const achievements = await db.query(
      `SELECT * FROM achievements 
       WHERE (game_id = $1 OR game_id IS NULL) 
       AND is_active = TRUE`,
      [gameId]
    );

    for (const achievement of achievements.rows) {
      // Проверяем, получено ли уже достижение
      const alreadyUnlocked = await db.query(
        'SELECT 1 FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievement.id]
      );

      if (alreadyUnlocked.rows.length > 0) continue;

      let shouldUnlock = false;

      // Проверяем условия достижения
      switch (achievement.condition_type) {
        case 'score_above':
          shouldUnlock = score >= achievement.condition_value;
          break;
        case 'play_count':
          // Здесь нужно считать количество игр - упрощенная версия
          const playCount = metadata.playCount || 1;
          shouldUnlock = playCount >= achievement.condition_value;
          break;
        case 'collection':
          // Подсчитываем количество достижений пользователя
          const userAchievements = await db.query(
            'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
            [userId]
          );
          shouldUnlock = parseInt(userAchievements.rows[0].count) >= achievement.condition_value;
          break;
      }

      if (shouldUnlock) {
        // Разблокируем достижение
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [userId, achievement.id]
        );

        // Добавляем опыт пользователю
        await db.query(
          'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
          [achievement.xp_reward, userId]
        );

        console.log(`🏆 Достижение разблокировано: ${achievement.title} для пользователя ${userId}`);
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке достижений:', error);
  }
}

// Обновление опыта и уровня пользователя
async function updateUserXP(userId) {
  try {
    // Получаем текущий опыт пользователя
    const userResult = await db.query(
      'SELECT total_xp, level FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const { total_xp, level } = userResult.rows[0];
    
    // Формула для уровней: каждый уровень требует на 500 XP больше
    const xpForNextLevel = level * 500;
    
    if (total_xp >= xpForNextLevel) {
      // Повышаем уровень
      await db.query(
        'UPDATE users SET level = level + 1 WHERE id = $1',
        [userId]
      );
      console.log(`📈 Пользователь ${userId} повысил уровень до ${level + 1}`);
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении опыта:', error);
  }
}

// ==================== ЗАПУСК СЕРВЕРА ====================
app.listen(PORT, () => {
  console.log(`
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
🚀  Komoru Backend запущен!
📍  Порт: ${PORT}
🌍  Разрешённые домены:
   - https://komoru-sage.vercel.app
   - https://komoru.vercel.app  
   - http://localhost:3000
   - http://localhost:3001
📊  Проверка: https://komoru-api.onrender.com/api/health
🕐  Время запуска: ${new Date().toLocaleTimeString()}
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
  `);
});

module.exports = app;