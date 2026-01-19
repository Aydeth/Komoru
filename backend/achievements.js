const db = require('./db');

class AchievementSystem {
  constructor() {
    this.achievementHandlers = {
      'game_score': this.handleGameScore.bind(this),
      'total_games': this.handleTotalGames.bind(this),
      'game_complete': this.handleGameComplete.bind(this),
      'login_count': this.handleLoginCount.bind(this),
      'login_streak': this.handleLoginStreak.bind(this),
      'achievement_count': this.handleAchievementCount.bind(this),
      'game_time': this.handleGameTime.bind(this),
      'game_speed': this.handleGameSpeed.bind(this),
      'secret_found': this.handleSecretFound.bind(this),
      'random_event': this.handleRandomEvent.bind(this),
      'night_play': this.handleNightPlay.bind(this)
    };
  }

  // Проверяем достижения после игры
  async checkGameAchievements(userId, gameId, score, metadata = {}) {
    try {
      console.log(`🔍 Проверка достижений для ${userId} в игре ${gameId}`);
      
      const unlockedAchievements = [];
      
      // Получаем все достижения для этой игры и общие
      const achievements = await db.query(`
        SELECT * FROM achievements 
        WHERE (game_id = $1 OR game_id IS NULL)
        AND is_active = TRUE
      `, [gameId]);
      
      // Записываем событие игры
      await this.recordGameEvent(userId, gameId, score, metadata);
      
      // Проверяем каждое достижение
      for (const achievement of achievements.rows) {
        const alreadyUnlocked = await this.isAchievementUnlocked(userId, achievement.id);
        if (alreadyUnlocked) continue;
        
        const handler = this.achievementHandlers[achievement.condition_type];
        if (handler) {
          const shouldUnlock = await handler(userId, achievement, gameId, score, metadata);
          
          if (shouldUnlock) {
            await this.unlockAchievement(userId, achievement);
            unlockedAchievements.push(achievement);
            
            console.log(`🏆 Разблокировано: ${achievement.title} для ${userId}`);
          }
        }
      }
      
      return unlockedAchievements;
      
    } catch (error) {
      console.error('❌ Ошибка при проверке достижений:', error);
      return [];
    }
  }

  // Разблокировать достижение
  async unlockAchievement(userId, achievement) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Добавляем в user_achievements
      await client.query(
        `INSERT INTO user_achievements (user_id, achievement_id) 
         VALUES ($1, $2) 
         ON CONFLICT DO NOTHING`,
        [userId, achievement.id]
      );
      
      // Добавляем опыт пользователю
      await client.query(
        `UPDATE users SET total_xp = total_xp + $1 WHERE id = $2`,
        [achievement.xp_reward, userId]
      );
      
      // Добавляем кристаллы за секретные достижения
      if (achievement.is_secret) {
        await client.query(
          `UPDATE user_currency SET balance = balance + 50 WHERE user_id = $1`,
          [userId]
        );
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Проверяем, разблокировано ли уже достижение
  async isAchievementUnlocked(userId, achievementId) {
    const result = await db.query(
      `SELECT 1 FROM user_achievements 
       WHERE user_id = $1 AND achievement_id = $2`,
      [userId, achievementId]
    );
    return result.rows.length > 0;
  }

  // Записываем событие игры
  async recordGameEvent(userId, gameId, score, metadata) {
    try {
      // Событие "сыграна игра"
      await db.query(
        `INSERT INTO achievement_events (user_id, event_type, event_value, game_id)
         VALUES ($1, 'game_played', 1, $2)`,
        [userId, gameId]
      );
      
      // Событие "набраны очки"
      await db.query(
        `INSERT INTO achievement_events (user_id, event_type, event_value, game_id)
         VALUES ($1, 'score_achieved', $2, $3)`,
        [userId, score, gameId]
      );
      
      // Проверяем ночную игру
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 0 && hour < 5) {
        await db.query(
          `INSERT INTO achievement_events (user_id, event_type, event_value)
           VALUES ($1, 'night_play', 1)`,
          [userId]
        );
      }
      
    } catch (error) {
      console.error('❌ Ошибка записи события:', error);
    }
  }

  // ==================== ОБРАБОТЧИКИ УСЛОВИЙ ====================

  async handleGameScore(userId, achievement, gameId, score) {
    return score >= achievement.condition_value;
  }

  async handleTotalGames(userId, achievement) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM achievement_events 
       WHERE user_id = $1 AND event_type = 'game_played'`,
      [userId]
    );
    return parseInt(result.rows[0].count) >= achievement.condition_value;
  }

  async handleGameComplete(userId, achievement, gameId) {
    if (achievement.game_id && achievement.game_id !== gameId) return false;
    
    // Для памяти: condition_value = 1(легко), 2(средне), 3(сложно)
    const result = await db.query(
      `SELECT COUNT(*) as count FROM game_scores 
       WHERE user_id = $1 AND game_id = $2 AND score > 0`,
      [userId, gameId || achievement.game_id]
    );
    
    return parseInt(result.rows[0].count) >= achievement.condition_value;
  }

  async handleLoginCount(userId, achievement) {
    // В реальном приложении тут была бы проверка входа
    // Сейчас просто проверяем, есть ли пользователь
    const result = await db.query(
      `SELECT 1 FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows.length > 0;
  }

  async handleLoginStreak(userId, achievement) {
    // Упрощенная реализация - всегда возвращаем true для теста
    // В реальном приложении тут была бы проверка ежедневных входов
    return Math.random() > 0.5; // 50% шанс для демонстрации
  }

  async handleAchievementCount(userId, achievement) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count) >= achievement.condition_value;
  }

  async handleGameTime(userId, achievement, gameId, score, metadata) {
    const time = metadata.time || 0;
    return time <= achievement.condition_value;
  }

  async handleGameSpeed(userId, achievement, gameId, score, metadata) {
    const speed = metadata.speed || 0;
    return speed >= achievement.condition_value;
  }

  async handleSecretFound(userId) {
    // Всегда true, если вызвали этот метод
    return true;
  }

  async handleRandomEvent(userId) {
    // 30% шанс получить случайное достижение
    return Math.random() < 0.3;
  }

  async handleNightPlay(userId) {
    const result = await db.query(
      `SELECT 1 FROM achievement_events 
       WHERE user_id = $1 AND event_type = 'night_play'`,
      [userId]
    );
    return result.rows.length > 0;
  }

  // ==================== API МЕТОДЫ ====================

  async getUserAchievements(userId) {
    const result = await db.query(
      `SELECT 
        a.*,
        ua.unlocked_at,
        ap.progress,
        CASE 
          WHEN ua.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       LEFT JOIN achievement_progress ap ON a.id = ap.achievement_id AND ap.user_id = $1
       WHERE a.is_active = TRUE
       ORDER BY 
         CASE WHEN ua.user_id IS NOT NULL THEN 0 ELSE 1 END,
         a.is_secret,
         a.xp_reward DESC`,
      [userId]
    );
    
    return result.rows;
  }

  async getRecentUnlocks(userId, limit = 5) {
    const result = await db.query(
      `SELECT a.*, ua.unlocked_at
       FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.unlocked_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    
    return result.rows;
  }

  async getAchievementStats(userId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_achievements,
        COUNT(CASE WHEN ua.user_id = $1 THEN 1 END) as unlocked_count,
        COUNT(CASE WHEN a.is_secret AND ua.user_id = $1 THEN 1 END) as secret_unlocked
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       WHERE a.is_active = TRUE`,
      [userId]
    );
    
    return result.rows[0];
  }
}

module.exports = new AchievementSystem();