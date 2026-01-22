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

-- 3. Таблица рекордов (лидерборд) - ЛУЧШИЕ РЕЗУЛЬТАТЫ
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    session_duration INTEGER, -- Длительность сессии в секундах
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

-- 9. Таблица игровых сессий (ВСЕ сыгранные игры)
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) REFERENCES games(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    session_duration INTEGER, -- Длительность сессии в секундах
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- Индексы для игровых сессий
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_user ON game_sessions(game_id, user_id);

-- ============================================
-- ДОБАВЛЕНИЕ ДОПОЛНИТЕЛЬНЫХ ПОЛЕЙ К СУЩЕСТВУЮЩИМ ТАБЛИЦАМ
-- ============================================

-- Добавляем поля в таблицу achievements если их нет
DO $$ 
BEGIN
    -- Добавляем поле для типа достижения если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'achievement_type') THEN
        ALTER TABLE achievements ADD COLUMN achievement_type VARCHAR(50) DEFAULT 'game';
    END IF;
    
    -- Добавляем поле для сортировки если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'sort_order') THEN
        ALTER TABLE achievements ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    
    -- Добавляем поле для скрытых достижений если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'is_hidden') THEN
        ALTER TABLE achievements ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Добавляем поле активности если его нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'achievements' AND column_name = 'is_active') THEN
        ALTER TABLE achievements ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

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

-- ============================================
-- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩИХ ДОСТИЖЕНИЙ
-- ============================================

-- 1. Обновляем существующие достижения с типами
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
WHERE achievement_type IS NULL OR sort_order = 0;

-- 2. Добавляем новые достижения (если их ещё нет)
INSERT INTO achievements (title, description, xp_reward, game_id, icon, condition_type, condition_value, achievement_type, sort_order, is_hidden) VALUES
-- Прогрессивные достижения
('Игрок недели', 'Сыграйте 7 дней подряд', 300, NULL, '🔥', 'streak_days', 7, 'progressive', 6, false),
('Активный игрок', 'Сыграйте 20 игр', 250, NULL, '🎯', 'play_count', 20, 'progressive', 7, false),
('Точность мастера', 'Достигните точности 95% в любой игре', 200, NULL, '🎯', 'accuracy_above', 95, 'progressive', 8, false),

-- Цепочка достижений
('Коллекционер II', 'Получите 10 достижений', 500, NULL, '🏆', 'collection', 10, 'chain', 9, false),
('Коллекционер III', 'Получите 20 достижений', 1000, NULL, '🏆', 'collection', 20, 'chain', 10, false),

-- Секретные достижения
('Полуночник', 'Сыграйте между полуночью и 5 утра', 400, NULL, '🌙', 'play_at_night', 1, 'secret', 99, true),
('Перфекционист', 'Завершите игру без ошибок', 350, NULL, '⭐', 'perfect_game', 1, 'secret', 99, true),

-- Достижения по уровням
('Новичок', 'Достигните 5 уровня', 200, NULL, '🥉', 'level_reached', 5, 'one_time', 11, false),
('Опытный', 'Достигните 10 уровня', 400, NULL, '🥈', 'level_reached', 10, 'one_time', 12, false),
('Мастер', 'Достигните 15 уровня', 600, NULL, '🥇', 'level_reached', 15, 'one_time', 13, false),

-- Достижения для игр
('Змеиный путь', 'Наберите 500 очков в Змейке', 150, 'snake', '🐍', 'score_above', 500, 'game', 14, false),
('Память гения', 'Найдите все пары за 60 секунд', 200, 'memory', '🧠', 'time_under', 60, 'game', 15, false),
('Память мастера', 'Пройти игру Память на сложном уровне', 300, 'memory', '🧠', 'difficulty_complete', 3, 'game', 16, false)
ON CONFLICT (title) DO NOTHING;

-- ============================================
-- СОЗДАНИЕ ДОПОЛНИТЕЛЬНЫХ ИНДЕКСОВ
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_achievements_type') THEN
        CREATE INDEX idx_achievements_type ON achievements(achievement_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_achievements_game') THEN
        CREATE INDEX idx_achievements_game ON achievements(game_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_achievements_sort') THEN
        CREATE INDEX idx_achievements_sort ON achievements(sort_order);
    END IF;
END $$;

-- ============================================
-- ВЫВОД ИНФОРМАЦИИ ОБ ОБНОВЛЕНИИ
-- ============================================

SELECT 
    '✅ Система достижений обновлена!' as message,
    COUNT(*) as total_achievements,
    SUM(CASE WHEN achievement_type = 'game' THEN 1 ELSE 0 END) as game_achievements,
    SUM(CASE WHEN achievement_type = 'secret' THEN 1 ELSE 0 END) as secret_achievements,
    SUM(CASE WHEN achievement_type = 'progressive' THEN 1 ELSE 0 END) as progressive_achievements,
    SUM(CASE WHEN is_hidden = TRUE THEN 1 ELSE 0 END) as hidden_achievements
FROM achievements;

-- Выводим информацию о созданных таблицах
SELECT 
    '📊 База данных Komoru инициализирована!' as message,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM games) as total_games,
    (SELECT COUNT(*) FROM achievements) as total_achievements,
    (SELECT COUNT(*) FROM game_scores) as total_records,
    (SELECT COUNT(*) FROM game_sessions) as total_sessions;