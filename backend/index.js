const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db'); // Подключаем нашу базу данных
require('./firebase-admin');
const { verifyToken, optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // РАЗРЕШАЕМ ВСЕ ДОМЕНЫ (для разработки)
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
/*
const allowedOrigins = [
  'https://komoru-sage.vercel.app',
  'https://komoru.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
*/
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

// 6. Информация о пользователе (РЕАЛЬНАЯ ИЗ БАЗЫ)
app.get('/api/user/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const result = await db.query(`
      SELECT 
        u.*,
        uc.balance as currency_balance,
        (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id) as achievements_count,
        (SELECT COUNT(*) FROM game_scores gs WHERE gs.user_id = u.id) as games_played
      FROM users u
      LEFT JOIN user_currency uc ON u.id = uc.user_id
      WHERE u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      // Создаем пользователя, если его нет
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден. Пожалуйста, синхронизируйтесь через /api/users/sync'
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
        currency: user.currency_balance || 0,
        achievements: user.achievements_count || 0,
        gamesPlayed: user.games_played || 0,
        joinedAt: user.created_at
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

// 7. Сохранить результат игры (ТЕПЕРЬ С АВТОРИЗАЦИЕЙ)
app.post('/api/games/:id/scores', verifyToken, async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const { score, metadata = {} } = req.body;
    const userId = req.user.uid; // Берем из токена!

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
      message: 'Результат сохранен!',
      newRecord: result.rows[0].score === score
    });

  } catch (error) {
    console.error('❌ Ошибка при сохранении результата:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось сохранить результат'
    });
  }
});

// 8. Получить результаты пользователя
app.get('/api/users/:userId/scores', async (req, res) => {
  try {
    const { userId } = req.params;
    const { gameId } = req.query;

    let query = `
      SELECT gs.*, g.title as game_title, g.icon as game_icon
      FROM game_scores gs
      JOIN games g ON gs.game_id = g.id
      WHERE gs.user_id = $1
    `;
    let params = [userId];

    if (gameId) {
      query += ' AND gs.game_id = $2';
      params.push(gameId);
    }

    query += ' ORDER BY gs.score DESC';

    const result = await db.query(query, params);

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

// 9. Получить достижения пользователя
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC`,
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

// Синхронизация пользователя с Firebase
app.post('/api/users/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;
    
    console.log(`🔄 Синхронизация пользователя: ${email}`);
    
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
    `, [uid, email, name, picture]);
    
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