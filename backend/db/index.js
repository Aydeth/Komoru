const { Pool } = require('pg');
require('dotenv').config();

// Создаем пул соединений с базой данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Для Render.com нужно добавить SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Проверка подключения к базе
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('✅ Успешное подключение к PostgreSQL');
    release();
  }
});

// Экспортируем пул для использования в других файлах
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};