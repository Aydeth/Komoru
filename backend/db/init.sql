-- ============================================
-- Komoru Database Schema
-- Минималистичная платформа для мини-игр
-- ============================================

-- 1. Таблица пользователей (будем заполнять через Firebase Auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL DEFAULT 'Игрок',
    avatar_url TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    total_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблица игр
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(7),
    difficulty VARCHAR(20) DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблица рекордов (лидерборд)
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id) -- Один рекорд на игру для пользователя
);

-- 4. Таблица достижений
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    game_id VARCHAR(50) REFERENCES games(id) ON DELETE SET NULL,
    icon VARCHAR(10) DEFAULT '🏆',
    condition_type VARCHAR(50), -- 'score_above', 'play_count', 'collection'
    condition_value INTEGER,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Таблица полученных достижений
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- 6. Таблица валюты (кристаллы 💎)
CREATE TABLE IF NOT EXISTS user_currency (
    user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Таблица ежедневных заданий
CREATE TABLE IF NOT EXISTS daily_quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    currency_reward INTEGER NOT NULL DEFAULT 10,
    goal_type VARCHAR(50) NOT NULL, -- 'play_games', 'score_above', 'win_streak'
    goal_target INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Таблица прогресса по заданиям
CREATE TABLE IF NOT EXISTS user_quest_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    quest_id INTEGER REFERENCES daily_quests(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ БЫСТРОГО ПОИСКА
-- ============================================

-- Для быстрого поиска рекордов по игре
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);

-- Для поиска достижений по игре
CREATE INDEX IF NOT EXISTS idx_achievements_game_id ON achievements(game_id);

-- Для поиска пользователей по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- ============================================

-- Вставляем тестовые игры
INSERT INTO games (id, title, description, icon, color, difficulty) VALUES
('snake', 'Змейка', 'Классическая змейка для релакса', '🐍', '#2E7D32', 'easy'),
('puzzle15', 'Пятнашки', 'Успокаивающая головоломка', '🧩', '#1565C0', 'medium'),
('memory', 'Память', 'Тренировка памяти на карточках', '🧠', '#7B1FA2', 'easy'),
('arkanoid', 'Арканоид', 'Разбивайте блоки мячиком', '🕹️', '#D32F2F', 'medium')
ON CONFLICT (id) DO NOTHING;

-- Вставляем тестовые достижения
INSERT INTO achievements (title, description, xp_reward, game_id, icon, condition_type, condition_value) VALUES
('Первая игра', 'Сыграйте в свою первую игру', 50, NULL, '🎮', 'play_count', 1),
('Мастер змейки', 'Наберите 1000 очков в Змейке', 200, 'snake', '🐍', 'score_above', 1000),
('Головоломщик', 'Соберите пятнашки за 5 минут', 150, 'puzzle15', '🧩', 'score_above', 300),
('Коллекционер', 'Получите 5 достижений', 300, NULL, '🏆', 'collection', 5),
('Богач', 'Накопите 500 кристаллов', 250, NULL, '💎', 'collection', 500)
ON CONFLICT DO NOTHING;

-- Вставляем тестовые задания
INSERT INTO daily_quests (title, description, currency_reward, goal_type, goal_target) VALUES
('Новичок', 'Сыграйте в 3 разные игры', 30, 'play_games', 3),
('Опытный игрок', 'Наберите 5000 очков в любых играх', 50, 'score_above', 5000),
('Энтузиаст', 'Заработайте 3 достижения', 40, 'collection', 3),
('Мастер дня', 'Попадите в топ-10 любой игры', 100, 'score_above', 1)
ON CONFLICT DO NOTHING;