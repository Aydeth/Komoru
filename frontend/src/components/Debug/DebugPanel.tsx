import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useAchievements } from '../../contexts/AchievementContext';

const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [showTestPopup, setShowTestPopup] = useState(false);
  const { showAchievement } = useAchievements();

  const testAchievements = [
    {
      id: 101,
      title: 'Тест 1: Первая игра',
      icon: '🎮',
      xp_reward: 50,
      description: 'Тестовое достижение для проверки попапа'
    },
    {
      id: 102,
      title: 'Тест 2: Мастер змейки',
      icon: '🐍',
      xp_reward: 200,
      description: 'Набрали 1000 очков в змейке!'
    },
    {
      id: 103,
      title: 'Тест 3: Секретное достижение',
      icon: '🔒',
      xp_reward: 500,
      description: 'Нашли секретное достижение!'
    }
  ];

  const handleTestPopup = (index: number) => {
    showAchievement(testAchievements[index]);
    setShowTestPopup(true);
    setTimeout(() => setShowTestPopup(false), 100);
  };

  // В продакшн-режиме не показываем панель отладки
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          borderRadius: 2,
          overflow: 'hidden',
          width: open ? 300 : 50,
          transition: 'width 0.3s ease',
        }}
      >
        {/* Заголовок */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            cursor: 'pointer',
          }}
          onClick={() => setOpen(!open)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            {open && <Typography variant="body2">Отладка</Typography>}
          </Box>
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>

        {/* Содержимое */}
        <Collapse in={open}>
          <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" gutterBottom color="warning.main">
              🧪 Тестирование попапов
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {testAchievements.map((achievement, index) => (
                <Button
                  key={achievement.id}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => handleTestPopup(index)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  <Box sx={{ mr: 1 }}>{achievement.icon}</Box>
                  {achievement.title}
                </Button>
              ))}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Панель отладки - только для разработки
            </Typography>
          </Box>
        </Collapse>
      </Paper>

      {/* Уведомление о тесте */}
      {showTestPopup && (
        <Alert 
          severity="success"
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 10000,
            animation: 'fadeIn 0.5s',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-20px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          Тестовое достижение отправлено в очередь!
        </Alert>
      )}
    </>
  );
};

export default DebugPanel;