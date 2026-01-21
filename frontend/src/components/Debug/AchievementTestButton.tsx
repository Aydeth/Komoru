import React from 'react';
import { Button, Box } from '@mui/material';
import { useAchievements } from '../../contexts/AchievementContext';

const AchievementTestButton: React.FC = () => {
  const { showAchievement } = useAchievements();
  const [counter, setCounter] = React.useState(0);

  const testAchievements = [
    { id: 1, title: 'Первая игра', icon: '🎮', xp_reward: 50, description: 'Начало пути!' },
    { id: 2, title: 'Мастер змейки', icon: '🐍', xp_reward: 200, description: '1000 очков в змейке' },
    { id: 3, title: 'Головоломщик', icon: '🧩', xp_reward: 150, description: 'Собрал пятнашки' },
    { id: 4, title: 'Память гения', icon: '🧠', xp_reward: 200, description: 'Все пары за 60 секунд' },
    { id: 5, title: 'Коллекционер', icon: '🏆', xp_reward: 300, description: '5 достижений' },
  ];

  const handleClick = () => {
    const randomIndex = Math.floor(Math.random() * testAchievements.length);
    const achievement = {
      ...testAchievements[randomIndex],
      id: Date.now() + randomIndex // Уникальный ID
    };
    
    console.log('🧪 Тест: показываем достижение', achievement);
    showAchievement(achievement);
    setCounter(prev => prev + 1);
  };

  // Скрываем в продакшене
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9997 }}>
      <Button
        variant="contained"
        color="warning"
        onClick={handleClick}
        sx={{ mb: 1 }}
      >
        🧪 Тест попапа ({counter})
      </Button>
      <Box sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
        Клик - случайное достижение
      </Box>
    </Box>
  );
};

export default AchievementTestButton;