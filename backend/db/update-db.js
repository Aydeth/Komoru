const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function updateDatabase() {
  let pool;
  
  try {
    console.log('🔄 Обновление базы данных Komoru (достижения)...');
    
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL не указан в .env файле');
      process.exit(1);
    }
    
    console.log('📡 Подключение к базе данных...');
    
    pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    console.log('✅ Подключение к базе данных успешно');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, 'update-achievements.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📄 Выполняем SQL скрипт обновления...');
    
    // Выполняем SQL
    await client.query(sql);
    
    // Проверяем результат
    const result = await client.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN achievement_type = 'game' THEN 1 ELSE 0 END) as game_achievements,
             SUM(CASE WHEN achievement_type = 'secret' THEN 1 ELSE 0 END) as secret_achievements,
             SUM(CASE WHEN achievement_type = 'progressive' THEN 1 ELSE 0 END) as progressive_achievements
      FROM achievements
    `);
    
    console.log('✅ База данных успешно обновлена!');
    console.log('📊 Статистика достижений:');
    console.log(`   • Всего: ${result.rows[0].total}`);
    console.log(`   • Игровых: ${result.rows[0].game_achievements}`);
    console.log(`   • Секретных: ${result.rows[0].secret_achievements}`);
    console.log(`   • Прогрессивных: ${result.rows[0].progressive_achievements}`);
    console.log('🎮 Добавлены новые типы достижений: game, progressive, secret, one_time, chain');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка обновления базы данных:');
    console.error(error.message);
    console.error(error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Проверьте:');
      console.log('1. Что база данных на Render запущена');
      console.log('2. Что DATABASE_URL правильный в настройках Render');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Если файл запущен напрямую
if (require.main === module) {
  updateDatabase().then(() => {
    console.log('🎉 Обновление завершено');
    process.exit(0);
  });
}

module.exports = updateDatabase;