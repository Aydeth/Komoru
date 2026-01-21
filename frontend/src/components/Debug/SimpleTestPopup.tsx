import React, { useState } from 'react';
import { Button, Box, Paper, Typography } from '@mui/material';
import { useAchievements } from '../../contexts/AchievementContext';

const SimpleTestPopup: React.FC = () => {
  const { showAchievement } = useAchievements();
  const [showDebug, setShowDebug] = useState(false);

  const testPopup = () => {
    console.log('🧪 Тест: вызываем showAchievement');
    
    const testAchievement = {
      id: 999,
      title: 'ТЕСТОВОЕ ДОСТИЖЕНИЕ',
      icon: '🎉',
      xp_reward: 100,
      description: 'Если вы видите это, значит попапы работают!'
    };
    
    showAchievement(testAchievement);
    setShowDebug(true);
    setTimeout(() => setShowDebug(false), 1000);
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 9999 }}>
      <Button
        variant="contained"
        color="secondary"
        onClick={testPopup}
        sx={{ mb: 1 }}
      >
        🧪 Тест попапа
      </Button>
      
      {showDebug && (
        <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Typography variant="caption">
            Команда отправлена. Проверьте консоль.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SimpleTestPopup;