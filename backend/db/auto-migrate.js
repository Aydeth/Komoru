const { Pool } = require('pg');
require('dotenv').config();

async function autoMigrateDatabase() {
  let pool;
  
  try {
    console.log('🔧 Проверка и автоматическое исправление структуры БД...');
    
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    // 1. Проверяем структуру achievements
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'achievements'
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Существующие колонки в achievements:', existingColumns);
    
    const requiredColumns = ['achievement_type', 'sort_order', 'is_hidden'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`🛠️  Добавляем недостающие колонки: ${missingColumns.join(', ')}`);
      
      // Добавляем колонки
      if (missingColumns.includes('achievement_type')) {
        await client.query(`ALTER TABLE achievements ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50) DEFAULT 'game'`);
      }
      if (missingColumns.includes('sort_order')) {
        await client.query(`ALTER TABLE achievements ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
      }
      if (missingColumns.includes('is_hidden')) {
        await client.query(`ALTER TABLE achievements ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE`);
      }
      
      console.log('✅ Недостающие колонки добавлены');
    }
    
    // 2. Обновляем существующие записи
    await client.query(`
      UPDATE achievements SET 
        achievement_type = CASE 
          WHEN title = 'Первая игра' THEN 'one_time'
          WHEN title = 'Коллекционер' THEN 'chain'
          WHEN title LIKE 'Мастер%' THEN 'game'
          WHEN title LIKE 'Головоломщик' THEN 'game'
          WHEN title LIKE 'Богач' THEN 'progressive'
          ELSE 'game'
        END,
        sort_order = CASE 
          WHEN title = 'Первая игра' THEN 1
          WHEN title = 'Мастер змейки' THEN 2
          WHEN title = 'Головоломщик' THEN 3
          WHEN title = 'Коллекционер' THEN 4
          WHEN title = 'Богач' THEN 5
          ELSE 10
        END
      WHERE achievement_type IS NULL OR sort_order = 0
    `);
    
    console.log('✅ Существующие достижения обновлены');
    
    // 3. Добавляем новые достижения если их нет
    const newAchievements = [
      ['Игрок недели', 'Сыграйте 7 дней подряд', 300, NULL, '🔥', 'streak_days', 7, 'progressive', 6, false],
      ['Активный игрок', 'Сыграйте 20 игр', 250, NULL, '🎯', 'play_count', 20, 'progressive', 7, false],
      ['Точность мастера', 'Достигните точности 95% в любой игре', 200, NULL, '🎯', 'accuracy_above', 95, 'progressive', 8, false],
      ['Коллекционер II', 'Получите 10 достижений', 500, NULL, '🏆', 'collection', 10, 'chain', 9, false],
      ['Коллекционер III', 'Получите 20 достижений', 1000, NULL, '🏆', 'collection', 20, 'chain', 10, false],
      ['Полуночник', 'Сыграйте между полуночью и 5 утра', 400, NULL, '🌙', 'play_at_night', 1, 'secret', 99, true],
      ['Перфекционист', 'Завершите игру без ошибок', 350, NULL, '⭐', 'perfect_game', 1, 'secret', 99, true],
      ['Новичок', 'Достигните 5 уровня', 200, NULL, '🥉', 'level_reached', 5, 'one_time', 11, false],
      ['Опытный', 'Достигните 10 уровня', 400, NULL, '🥈', 'level_reached', 10, 'one_time', 12, false],
      ['Мастер', 'Достигните 15 уровня', 600, NULL, '🥇', 'level_reached', 15, 'one_time', 13, false],
      ['Змеиный путь', 'Наберите 500 очков в Змейке', 150, 'snake', '🐍', 'score_above', 500, 'game', 14, false],
      ['Память гения', 'Найдите все пары за 60 секунд', 200, 'memory', '🧠', 'time_under', 60, 'game', 15, false],
      ['Память мастера', 'Пройти игру Память на сложном уровне', 300, 'memory', '🧠', 'difficulty_complete', 3, 'game', 16, false]
    ];
    
    let addedCount = 0;
    for (const achievement of newAchievements) {
      const [title, description, xp_reward, game_id, icon, condition_type, condition_value, achievement_type, sort_order, is_hidden] = achievement;
      
      const result = await client.query(
        `INSERT INTO achievements (title, description, xp_reward, game_id, icon, condition_type, condition_value, achievement_type, sort_order, is_hidden)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (title) DO NOTHING`,
        [title, description, xp_reward, game_id, icon, condition_type, condition_value, achievement_type, sort_order, is_hidden]
      );
      
      if (result.rowCount > 0) {
        addedCount++;
      }
    }
    
    console.log(`✅ Добавлено новых достижений: ${addedCount}`);
    
    // 4. Проверяем итог
    const totalResult = await client.query('SELECT COUNT(*) as total FROM achievements');
    const typeResult = await client.query(`
      SELECT achievement_type, COUNT(*) as count 
      FROM achievements 
      GROUP BY achievement_type
    `);
    
    console.log(`📊 Итоговая статистика:`);
    console.log(`   • Всего достижений: ${totalResult.rows[0].total}`);
    typeResult.rows.forEach(row => {
      console.log(`   • ${row.achievement_type}: ${row.count}`);
    });
    
    client.release();
    console.log('🎉 Автоматическая миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка автоматической миграции:', error.message);
    // НЕ выходим с ошибкой - API должен продолжить работу
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

module.exports = autoMigrateDatabase;