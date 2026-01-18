const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  let pool;
  
  try {
    console.log('🔄 Инициализация базы данных Komoru...');
    
    // Используем DATABASE_URL из переменных окружения
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL не указан в .env файле');
      console.log('💡 Для локальной разработки создайте файл .env с DATABASE_URL');
      console.log('💡 Для удаленной БД добавьте DATABASE_URL в настройки Render');
      process.exit(1);
    }
    
    console.log('📡 Подключение к базе данных...');
    
    // Создаем пул соединений
    pool = new Pool({
      connectionString: connectionString,
      ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
    });
    
    // Проверяем подключение
    const client = await pool.connect();
    console.log('✅ Подключение к базе данных успешно');
    
    // Читаем SQL файл
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📄 Выполняем SQL скрипт...');
    
    // Выполняем SQL
    await client.query(sql);
    
    console.log('✅ База данных успешно инициализирована!');
    console.log('📊 Созданы таблицы: users, games, game_scores, achievements и др.');
    console.log('🎮 Добавлены тестовые игры и достижения');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Возможные решения:');
      console.log('1. Для локальной разработки: установите PostgreSQL локально');
      console.log('2. Для удаленной БД: проверьте DATABASE_URL в настройках Render');
      console.log('3. Убедитесь, что база данных на Render запущена');
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
  initDatabase().then(() => {
    console.log('🎉 Инициализация завершена');
    process.exit(0);
  });
}

module.exports = initDatabase;