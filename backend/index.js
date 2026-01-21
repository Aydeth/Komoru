const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

// ==================== АВТОМАТИЧЕСКАЯ МИГРАЦИЯ БД ====================
const autoMigrateDatabase = require('./db/auto-migrate');

// Запускаем проверку и исправление БД при старте
setTimeout(() => {
  console.log('🔧 Запускаем автоматическую проверку БД...');
  autoMigrateDatabase().then(() => {
    console.log('✅ Проверка БД завершена');
  }).catch(err => {
    console.error('⚠️  Ошибка проверки БД:', err.message);
  });
}, 2000); // Ждём 2 секунды чтобы БД точно была готова

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
  
  // 1. Пробуем получить из тела запроса (для POST /scores)
  if (req.body && req.body.userId) {
    console.log(`✅ Найден в body: ${req.body.userId}`);
    return req.body.userId;
  }
  
  // 2. Пробуем получить из заголовка X-User-ID
  const userIdFromHeader = req.headers['x-user-id'];
  if (userIdFromHeader) {
    console.log(`✅ Найден в заголовке: ${userIdFromHeader}`);
    return userIdFromHeader;
  }
  
  // 3. Пробуем получить из query параметра
  if (req.query.userId) {
    console.log(`✅ Найден в query: ${req.query.userId}`);
    return req.query.userId;
  }
  
  // 4. По умолчанию - гость
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

// 7. Сохранить результат игры (с возвратом разблокированных достижений)
app.post('/api/games/:id/scores', async (req, res) => {
  try {
    const { id: gameId } = req.params;
    const { userId, score, metadata = {} } = req.body;

    console.log(`🎮 Сохранение результата: пользователь ${userId}, игра ${gameId}, счёт ${score}`);

    // Проверка авторизации
    if (!userId || userId === 'guest-123') {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация для сохранения результатов',
        code: 'AUTH_REQUIRED'
      });
    }

    // Проверяем, существует ли игра
    const gameCheck = await db.query(
      'SELECT id, title FROM games WHERE id = $1 AND is_active = TRUE',
      [gameId]
    );

    if (gameCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }

    const gameTitle = gameCheck.rows[0].title;

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

    // Проверяем достижения и получаем информацию о разблокированном
    const unlockedAchievement = await checkAchievements(userId, gameId, score, metadata);

    // Обновляем общий опыт пользователя
    await updateUserXP(userId);

    // Получаем обновлённый опыт пользователя
    const userResult = await db.query(
      'SELECT level, total_xp FROM users WHERE id = $1',
      [userId]
    );

    const response = {
      success: true,
      data: result.rows[0],
      message: `Результат сохранен! Вы набрали ${score} очков в "${gameTitle}"`,
      user: userResult.rows[0] || null
    };

    // Добавляем информацию о разблокированном достижении, если есть
    if (unlockedAchievement) {
      response.unlocked_achievement = unlockedAchievement;
      response.message += ` 🎉 Получено достижение: ${unlockedAchievement.title}!`;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Ошибка при сохранении результата:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось сохранить результат',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// 11. Получить ВСЕ достижения (БЕЗОПАСНАЯ версия без is_active)
app.get('/api/achievements', async (req, res) => {
  let client;
  try {
    const userId = getUserId(req);
    const { game_id } = req.query;
    
    console.log(`📊 Запрос достижений для: ${userId}${game_id ? `, игра: ${game_id}` : ''}`);
    
    client = await db.pool.connect();
    
    // 1. Простейший запрос БЕЗ is_active
    const tableCheck = await client.query(`
      SELECT id, title, xp_reward, icon, game_id 
      FROM achievements 
      LIMIT 10
    `);
    
    console.log(`✅ Таблица существует, записей: ${tableCheck.rows.length}`);
    
    // 2. Проверяем наличие is_active
    let hasIsActive = false;
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'achievements' 
        AND column_name = 'is_active'
      `);
      hasIsActive = columnCheck.rows.length > 0;
    } catch (err) {
      console.log('⚠️  Не удалось проверить колонку is_active:', err.message);
    }
    
    // 3. Строим запрос
    let whereClause = 'WHERE 1=1'; // Всегда истина
    
    if (hasIsActive) {
      whereClause = 'WHERE a.is_active = TRUE';
    }
    
    if (game_id) {
      whereClause += ` AND (a.game_id = $1 OR a.game_id IS NULL)`;
    }
    
    // 4. Основной запрос
    const query = `
      SELECT 
        a.id,
        a.title,
        a.description,
        a.xp_reward,
        a.icon,
        a.game_id,
        g.title as game_title,
        g.icon as game_icon,
        COALESCE(a.achievement_type, 'game') as achievement_type,
        COALESCE(a.sort_order, 0) as sort_order,
        COALESCE(a.is_hidden, false) as is_hidden
      FROM achievements a
      LEFT JOIN games g ON a.game_id = g.id
      ${whereClause}
      ORDER BY COALESCE(a.sort_order, 0) ASC, a.id ASC
    `;
    
    const params = game_id ? [game_id] : [];
    const result = await client.query(query, params);
    
    // 5. Получаем разблокированные
    let unlockedIds = [];
    if (userId && userId !== 'guest-123') {
      try {
        const unlockedResult = await client.query(
          'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
          [userId]
        );
        unlockedIds = unlockedResult.rows.map(row => row.achievement_id);
      } catch (err) {
        console.log('⚠️  Не удалось получить разблокированные:', err.message);
      }
    }
    
    // 6. Формируем ответ
    const achievements = result.rows.map(row => {
      const unlocked = unlockedIds.includes(row.id);
      const isVisible = !row.is_hidden || unlocked;
      
      return {
        ...row,
        unlocked: unlocked,
        is_visible: isVisible
      };
    });
    
    const visibleAchievements = achievements.filter(a => a.is_visible);
    
    res.json({
      success: true,
      data: {
        total: visibleAchievements.length,
        unlocked: visibleAchievements.filter(a => a.unlocked).length,
        locked: visibleAchievements.filter(a => !a.unlocked).length,
        achievements: visibleAchievements,
        debug: {
          has_is_active: hasIsActive,
          user_id: userId,
          total_in_db: result.rows.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка в /api/achievements:', error.message);
    
    // Fallback
    try {
      const fallback = await db.query('SELECT id, title, xp_reward, icon FROM achievements LIMIT 5');
      
      res.json({
        success: true,
        data: {
          total: fallback.rows.length,
          unlocked: 0,
          locked: fallback.rows.length,
          achievements: fallback.rows.map(row => ({
            ...row,
            achievement_type: 'game',
            unlocked: false,
            is_visible: true
          }))
        }
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Не удалось загрузить достижения'
      });
    }
  } finally {
    if (client) {
      client.release();
    }
  }
});

// 12. Получить последние достижения ТЕКУЩЕГО пользователя
app.get('/api/users/current/achievements/latest', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId || userId === 'guest-123') {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'Требуется авторизация'
      });
    }
    
    const limit = parseInt(req.query.limit) || 3;
    
    console.log(`🆕 Последние достижения для авторизованного пользователя: ${userId}`);
    
    const result = await db.query(
      `SELECT 
        a.*,
        ua.unlocked_at,
        g.title as game_title,
        g.icon as game_icon
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      LEFT JOIN games g ON a.game_id = g.id
      WHERE ua.user_id = $1
      ORDER BY ua.unlocked_at DESC
      LIMIT $2`,
      [userId, limit]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении последних достижений:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить последние достижения'
    });
  }
});

// 13. Получить достижения конкретного пользователя (публичный доступ)
app.get('/api/users/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    console.log(`👤 Запрос достижений пользователя: ${userId}`);
    
    // Проверяем существование пользователя
    const userCheck = await db.query(
      'SELECT id, username, avatar_url FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Получаем достижения пользователя
    const achievementsQuery = `
      SELECT 
        a.*,
        ua.unlocked_at,
        g.title as game_title,
        g.icon as game_icon
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      LEFT JOIN games g ON a.game_id = g.id
      WHERE ua.user_id = $1
      AND (COALESCE(a.is_hidden, a.is_secret, FALSE) = FALSE OR $2 = TRUE)
      ORDER BY ua.unlocked_at DESC
      ${limit ? `LIMIT $3` : ''}
    `;
    
    const queryParams = [userId, false]; // false = не владелец (скрываем секретные)
    if (limit) queryParams.push(parseInt(limit));
    
    const achievementsResult = await db.query(
      achievementsQuery,
      queryParams
    );
    
    // Получаем статистику пользователя
    const statsQuery = await db.query(`
      SELECT 
        COUNT(DISTINCT ua.achievement_id) as total_achievements,
        COUNT(DISTINCT gs.game_id) as games_played,
        COALESCE(SUM(gs.score), 0) as total_score,
        u.level,
        u.total_xp
      FROM users u
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN game_scores gs ON u.id = gs.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.level, u.total_xp
    `, [userId]);
    
    const stats = statsQuery.rows[0] || {
      total_achievements: 0,
      games_played: 0,
      total_score: 0,
      level: 1,
      total_xp: 0
    };
    
    // Группируем достижения по типам
    const achievementsByType = {};
    achievementsResult.rows.forEach(achievement => {
      const type = achievement.achievement_type || 'game';
      if (!achievementsByType[type]) {
        achievementsByType[type] = [];
      }
      achievementsByType[type].push(achievement);
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar_url,
          level: stats.level,
          xp: stats.total_xp
        },
        stats: {
          total_achievements: stats.total_achievements,
          games_played: stats.games_played,
          total_score: stats.total_score,
          achievement_types: Object.keys(achievementsByType).length
        },
        achievements: {
          total: achievementsResult.rows.length,
          by_type: achievementsByType,
          recent: achievementsResult.rows.slice(0, 5)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка при получении достижений пользователя:', error);
    res.status(500).json({
      success: false,
      error: 'Не удалось загрузить достижения пользователя'
    });
  }
});

// 15. Получить список всех достижений (упрощенная версия)
app.get('/api/achievements', async (req, res) => {
  try {
    console.log('📊 Запрос списка достижений');
    
    // Простой запрос без сложной логики
    const result = await db.query(`
      SELECT 
        id,
        title,
        description,
        xp_reward,
        icon,
        game_id,
        COALESCE(achievement_type, 'game') as achievement_type,
        COALESCE(is_hidden, FALSE) as is_hidden,
        COALESCE(is_secret, FALSE) as is_secret,
        COALESCE(is_active, TRUE) as is_active
      FROM achievements 
      WHERE COALESCE(is_active, TRUE) = TRUE
      ORDER BY COALESCE(sort_order, 0), id
      LIMIT 20
    `);
    
    // Для текущего пользователя проверяем разблокированные
    const userId = req.headers['x-user-id'] || req.query.userId;
    let unlockedIds = [];
    
    if (userId && userId !== 'guest-123') {
      try {
        const unlockedResult = await db.query(
          'SELECT achievement_id FROM user_achievements WHERE user_id = $1',
          [userId]
        );
        unlockedIds = unlockedResult.rows.map(row => row.achievement_id);
      } catch (err) {
        console.log('⚠️ Не удалось получить разблокированные:', err.message);
      }
    }
    
    const achievements = result.rows.map(row => ({
      ...row,
      unlocked: unlockedIds.includes(row.id),
      is_visible: !row.is_hidden || unlockedIds.includes(row.id)
    }));
    
    res.json({
      success: true,
      data: {
        total: achievements.length,
        unlocked: unlockedIds.length,
        achievements: achievements.filter(a => a.is_visible)
      }
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

// ==================== УЛУЧШЕННАЯ ФУНКЦИЯ ПРОВЕРКИ ДОСТИЖЕНИЙ ====================
async function checkAchievements(userId, gameId, score, metadata) {
  try {
    console.log(`🏆 Проверка достижений для пользователя ${userId}, игра ${gameId}, счёт ${score}`);
    
    // 1. Проверяем структуру БД
    const columnsCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'achievements'
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    const hasNewColumns = existingColumns.includes('achievement_type') && 
                         existingColumns.includes('sort_order') && 
                         existingColumns.includes('is_hidden');
    
    console.log(`📊 Структура БД: новые колонки ${hasNewColumns ? 'ЕСТЬ' : 'ОТСУТСТВУЮТ'}`);
    
    // 2. Получаем пользователя
    const userResult = await db.query(
      'SELECT level, total_xp FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`⚠️  Пользователь ${userId} не найден`);
      return null;
    }
    
    const userLevel = userResult.rows[0].level;
    const userXP = userResult.rows[0].total_xp;
    
    // 3. Получаем достижения в зависимости от структуры БД
    let achievementsQuery;
    let queryParams = [userId];
    
    if (hasNewColumns) {
      // Новая структура - все типы достижений
      achievementsQuery = `
        SELECT a.* 
        FROM achievements a
        WHERE (a.is_active = TRUE OR a.is_active IS NULL)
        AND (
          a.game_id = $1 
          OR a.game_id IS NULL
          OR a.achievement_type IN ('progressive', 'chain', 'one_time', 'secret')
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_achievements ua 
          WHERE ua.user_id = $2 AND ua.achievement_id = a.id
        )
      `;
      queryParams = [gameId, userId];
    } else {
      // Старая структура - только игровые достижения
      achievementsQuery = `
        SELECT a.* 
        FROM achievements a
        WHERE (a.is_active = TRUE OR a.is_active IS NULL)
        AND (a.game_id = $1 OR a.game_id IS NULL)
        AND NOT EXISTS (
          SELECT 1 FROM user_achievements ua 
          WHERE ua.user_id = $2 AND ua.achievement_id = a.id
        )
      `;
      queryParams = [gameId, userId];
    }
    
    const achievements = await db.query(achievementsQuery, queryParams);
    
    console.log(`🔍 Проверяем ${achievements.rows.length} возможных достижений`);
    
    // 4. Получаем статистику пользователя
    const userStats = await db.query(`
      SELECT 
        COUNT(DISTINCT gs.game_id) as games_played_count,
        COUNT(*) as total_games,
        SUM(gs.score) as total_score,
        COUNT(DISTINCT ua.achievement_id) as achievements_count,
        MAX(ua.unlocked_at) as last_achievement_date
      FROM users u
      LEFT JOIN game_scores gs ON u.id = gs.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);
    
    const stats = userStats.rows[0] || {
      games_played_count: 0,
      total_games: 0,
      total_score: 0,
      achievements_count: 0,
      last_achievement_date: null
    };
    
    // 5. Проверяем дополнительные условия
    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 0 && currentHour < 5;
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 6. Проверяем каждое достижение
    for (const achievement of achievements.rows) {
      let shouldUnlock = false;
      let unlockReason = '';
      
      // Проверяем условие достижения
      switch (achievement.condition_type) {
        case 'score_above':
          shouldUnlock = score >= achievement.condition_value;
          unlockReason = `Счёт ${score} >= ${achievement.condition_value}`;
          break;
          
        case 'play_count':
          shouldUnlock = (stats.total_games || 0) >= achievement.condition_value;
          unlockReason = `Игр сыграно ${stats.total_games} >= ${achievement.condition_value}`;
          break;
          
        case 'collection':
          if (!hasNewColumns) continue; // Пропускаем для старой БД
          shouldUnlock = stats.achievements_count >= achievement.condition_value;
          unlockReason = `Достижений ${stats.achievements_count} >= ${achievement.condition_value}`;
          break;
          
        case 'streak_days':
          if (!hasNewColumns) continue;
          // Простая проверка стрика - если играли сегодня и вчера
          const hasStreak = metadata?.streak_days >= achievement.condition_value;
          shouldUnlock = hasStreak;
          unlockReason = `Стрик ${metadata?.streak_days || 0} дней >= ${achievement.condition_value}`;
          break;
          
        case 'accuracy_above':
          if (!hasNewColumns) continue;
          const accuracy = metadata?.accuracy || 0;
          shouldUnlock = accuracy >= achievement.condition_value;
          unlockReason = `Точность ${accuracy}% >= ${achievement.condition_value}%`;
          break;
          
        case 'play_at_night':
          if (!hasNewColumns) continue;
          shouldUnlock = isNightTime;
          unlockReason = `Игра ночью (${currentHour}:00)`;
          break;
          
        case 'perfect_game':
          if (!hasNewColumns) continue;
          const isPerfect = metadata?.perfect_game || (metadata?.errors === 0);
          shouldUnlock = isPerfect;
          unlockReason = 'Игра без ошибок';
          break;
          
        case 'level_reached':
          if (!hasNewColumns) continue;
          shouldUnlock = userLevel >= achievement.condition_value;
          unlockReason = `Уровень ${userLevel} >= ${achievement.condition_value}`;
          break;
          
        case 'time_under':
          if (!hasNewColumns) continue;
          const gameTime = metadata?.time || 0;
          shouldUnlock = gameTime <= achievement.condition_value;
          unlockReason = `Время ${gameTime}сек <= ${achievement.condition_value}сек`;
          break;
          
        case 'difficulty_complete':
          if (!hasNewColumns) continue;
          const difficultyLevel = metadata?.difficulty || 0;
          shouldUnlock = difficultyLevel >= achievement.condition_value;
          unlockReason = `Сложность ${difficultyLevel} >= ${achievement.condition_value}`;
          break;
          
        default:
          // Для старых типов условий или неизвестных
          if (achievement.condition_type && hasNewColumns) {
            console.log(`⚠️  Неизвестный тип условия: ${achievement.condition_type}`);
          }
          continue;
      }
      
      if (shouldUnlock) {
        // Разблокируем достижение
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [userId, achievement.id]
        );
        
        // Добавляем опыт пользователю
        const xpToAdd = achievement.xp_reward || 100;
        await db.query(
          'UPDATE users SET total_xp = total_xp + $1 WHERE id = $2',
          [xpToAdd, userId]
        );
        
        console.log(`🎉 Достижение разблокировано: ${achievement.title}`);
        console.log(`   Причина: ${unlockReason}`);
        console.log(`   Награда: +${xpToAdd} XP`);
        
        // Проверяем, нужно ли повысить уровень
        await updateUserXP(userId);
        
        // Формируем ответ для фронтенда
        const unlockedAchievement = {
          id: achievement.id,
          title: achievement.title,
          description: achievement.description || '',
          icon: achievement.icon || '🏆',
          xp_reward: xpToAdd,
          achievement_type: hasNewColumns ? (achievement.achievement_type || 'game') : 'game',
          is_secret: hasNewColumns ? (achievement.is_hidden || false) : false
        };
        
        return unlockedAchievement;
      }
    }
    
    console.log('📭 Новых достижений не разблокировано');
    return null;
    
  } catch (error) {
    console.error('❌ Ошибка при проверке достижений:', error.message);
    console.error(error.stack);
    return null;
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