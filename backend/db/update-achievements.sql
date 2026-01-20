-- ============================================
-- Обновление таблицы достижений
-- Добавляем тип достижения и сортировку
-- ============================================

-- 1. Добавляем поле для типа достижения
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50) DEFAULT 'game',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 2. Обновляем существующие достижения с типами
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
  END;

-- 3. Добавляем новые достижения
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

-- 4. Создаем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_game ON achievements(game_id);
CREATE INDEX IF NOT EXISTS idx_achievements_sort ON achievements(sort_order);

-- 5. Проверяем обновления
SELECT 
    id, 
    title, 
    achievement_type, 
    game_id,
    xp_reward,
    is_hidden,
    sort_order
FROM achievements 
ORDER BY sort_order, id;