const { Pool } = require('pg');
require('dotenv').config();

async function autoMigrateDatabase() {
  let pool;
  
  try {
    console.log('🔧 Начинаем автоматическую проверку и исправление БД...');
    
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    
    // 1. Проверяем таблицу achievements
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'achievements'
      )
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('⚠️  Таблица achievements не существует!');
      client.release();
      return;
    }
    
    // 2. Проверяем колонки
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'achievements'
      ORDER BY ordinal_position
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Найдены колонки:', existingColumns);
    
    // 3. Список необходимых колонок
    const requiredColumns = [
      { name: 'achievement_type', type: 'VARCHAR(50) DEFAULT \'game\'' },
      { name: 'sort_order', type: 'INTEGER DEFAULT 0' },
      { name: 'is_hidden', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT TRUE' }
    ];
    
    // 4. Добавляем недостающие колонки
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`🛠️  Добавляем колонку: ${column.name}`);
        
        try {
          await client.query(`ALTER TABLE achievements ADD COLUMN ${column.name} ${column.type}`);
          console.log(`   ✅ Колонка ${column.name} добавлена`);
        } catch (err) {
          console.log(`   ⚠️  Ошибка добавления ${column.name}:`, err.message);
        }
      }
    }
    
    // 5. Обновляем существующие записи (только если есть нужные колонки)
    const hasAchievementType = existingColumns.includes('achievement_type') || 
                               requiredColumns.some(c => c.name === 'achievement_type' && !existingColumns.includes(c.name));
    const hasSortOrder = existingColumns.includes('sort_order') || 
                        requiredColumns.some(c => c.name === 'sort_order' && !existingColumns.includes(c.name));
    
    if (hasAchievementType && hasSortOrder) {
      try {
        const updateResult = await client.query(`
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
        
        if (updateResult.rowCount > 0) {
          console.log(`✅ Обновлено ${updateResult.rowCount} существующих достижений`);
        }
      } catch (err) {
        console.log('⚠️  Не удалось обновить существующие записи:', err.message);
      }
    }
    
    // 6. Добавляем новые достижения
    const newAchievements = [
      ['Игрок недели', 'Сыграйте 7 дней подряд', 300, null, '🔥', 'streak_days', 7, 'progressive', 6, false],
      ['Активный игрок', 'Сыграйте 20 игр', 250, null, '🎯', 'play_count', 20, 'progressive', 7, false],
      ['Точность мастера', 'Достигните точности 95% в любой игре', 200, null, '🎯', 'accuracy_above', 95, 'progressive', 8, false],
      ['Коллекционер II', 'Получите 10 достижений', 500, null, '🏆', 'collection', 10, 'chain', 9, false],
      ['Коллекционер III', 'Получите 20 достижений', 1000, null, '🏆', 'collection', 20, 'chain', 10, false],
      ['Полуночник', 'Сыграйте между полуночью и 5 утра', 400, null, '🌙', 'play_at_night', 1, 'secret', 99, true],
      ['Перфекционист', 'Завершите игру без ошибок', 350, null, '⭐', 'perfect_game', 1, 'secret', 99, true],
      ['Новичок', 'Достигните 5 уровня', 200, null, '🥉', 'level_reached', 5, 'one_time', 11, false],
      ['Опытный', 'Достигните 10 уровня', 400, null, '🥈', 'level_reached', 10, 'one_time', 12, false],
      ['Мастер', 'Достигните 15 уровня', 600, null, '🥇', 'level_reached', 15, 'one_time', 13, false],
      ['Змеиный путь', 'Наберите 500 очков в Змейке', 150, 'snake', '🐍', 'score_above', 500, 'game', 14, false],
      ['Память гения', 'Найдите все пары за 60 секунд', 200, 'memory', '🧠', 'time_under', 60, 'game', 15, false],
      ['Память мастера', 'Пройти игру Память на сложном уровне', 300, 'memory', '🧠', 'difficulty_complete', 3, 'game', 16, false]
    ];
    
    let addedCount = 0;
    for (const achievement of newAchievements) {
      try {
        // Проверяем существование достижения
        const existsResult = await client.query(
          'SELECT id FROM achievements WHERE title = $1',
          [achievement[0]]
        );
        
        if (existsResult.rows.length === 0) {
          // Вставляем достижение
          const result = await client.query(
            `INSERT INTO achievements (
              title, description, xp_reward, game_id, icon, 
              condition_type, condition_value, achievement_type, sort_order, is_hidden, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)`,
            achievement
          );
          
          if (result.rowCount > 0) {
            addedCount++;
            console.log(`   ➕ Добавлено: ${achievement[0]}`);
          }
        }
      } catch (err) {
        console.log(`⚠️  Ошибка добавления "${achievement[0]}":`, err.message);
        
        // Пробуем упрощённую вставку без новых колонок
        try {
          const simpleResult = await client.query(
            `INSERT INTO achievements (title, description, xp_reward, game_id, icon, condition_type, condition_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (title) DO NOTHING`,
            achievement.slice(0, 7)
          );
          
          if (simpleResult.rowCount > 0) {
            addedCount++;
            console.log(`   ➕ Добавлено (упрощённо): ${achievement[0]}`);
          }
        } catch (simpleErr) {
          console.log(`   ❌ Не удалось добавить даже упрощённо: ${achievement[0]}`);
        }
      }
    }
    
    console.log(`✅ Всего добавлено новых достижений: ${addedCount}`);
    
    // 7. Проверяем наличие колонки is_active и устанавливаем всем TRUE если есть
    const finalColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'achievements'
    `);
    
    const finalColumnNames = finalColumns.rows.map(row => row.column_name);
    
    if (finalColumnNames.includes('is_active')) {
      try {
        await client.query(`
          UPDATE achievements 
          SET is_active = TRUE 
          WHERE is_active IS NULL OR is_active = FALSE
        `);
        console.log('✅ Установлен is_active = TRUE для всех достижений');
      } catch (err) {
        console.log('⚠️  Не удалось обновить is_active:', err.message);
      }
    }
    
    // 8. Итоговая статистика
    const totalResult = await client.query('SELECT COUNT(*) as total FROM achievements');
    console.log(`📊 Всего достижений в БД: ${totalResult.rows[0].total}`);
    
    // Статистика по типам если есть колонка
    if (finalColumnNames.includes('achievement_type')) {
      try {
        const typeResult = await client.query(`
          SELECT achievement_type, COUNT(*) as count 
          FROM achievements 
          GROUP BY achievement_type
          ORDER BY count DESC
        `);
        
        console.log('📈 Статистика по типам:');
        typeResult.rows.forEach(row => {
          console.log(`   • ${row.achievement_type}: ${row.count}`);
        });
      } catch (err) {
        console.log('⚠️  Не удалось получить статистику по типам:', err.message);
      }
    }
    
    client.release();
    console.log('🎉 Автоматическая миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка автоматической миграции:', error.message);
    console.error('Stack trace:', error.stack);
    // Не прерываем выполнение - API должен работать
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Для запуска напрямую (тестирование)
if (require.main === module) {
  autoMigrateDatabase().then(() => {
    console.log('🚀 Миграция завершена');
    process.exit(0);
  }).catch(err => {
    console.error('💥 Критическая ошибка:', err);
    process.exit(1);
  });
}

module.exports = autoMigrateDatabase;