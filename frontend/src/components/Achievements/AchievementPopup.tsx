import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface AchievementPopupProps {
  achievement: {
    title: string;
    icon: string;
    xp_reward: number;
    description?: string;
  };
  onClose: () => void;
  duration?: number;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(Math.floor(duration / 1000));

  console.log('🎪 AchievementPopup рендерится с достижением:', achievement.title);

  // Таймер обратного отсчета
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Автоматическое скрытие
  useEffect(() => {
    console.log(`⏱️ Таймер запущен: ${duration}мс`);
    
    const timer = setTimeout(() => {
      console.log('⏰ Таймер сработал, скрываем попап');
      handleClose();
    }, duration);

    return () => {
      console.log('🧹 Очистка таймера');
      clearTimeout(timer);
    };
  }, [duration]);

  // Ручное закрытие
  const handleClose = () => {
    console.log('👆 Закрытие попапа');
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Даем время на анимацию исчезновения
  };

  if (!isVisible) {
    console.log('👻 Попап невидим');
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'slideInDown 0.5s ease-out forwards',
        '@keyframes slideInDown': {
          from: {
            transform: 'translateY(-100px)',
            opacity: 0,
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1,
          }
        }
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 400,
          width: '90%',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: 'primary.main',
          pointerEvents: 'auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-100px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Заголовок */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600}>
              Получено достижение!
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {timeLeft}с
            </Typography>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Содержимое */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" sx={{ fontSize: '2.5rem' }}>
              {achievement.icon}
            </Typography>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" fontWeight={600}>
                {achievement.title}
              </Typography>
              
              {achievement.description && (
                <Typography variant="body2" color="text.secondary">
                  {achievement.description}
                </Typography>
              )}
            </Box>
            
            <Box
              sx={{
                bgcolor: 'success.50',
                color: 'success.700',
                py: 0.5,
                px: 1.5,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.200',
                minWidth: 70,
                textAlign: 'center'
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                +{achievement.xp_reward} XP
              </Typography>
            </Box>
          </Box>

          {/* Прогрессбар */}
          <Box
            sx={{
              height: 4,
              bgcolor: 'primary.100',
              borderRadius: 2,
              overflow: 'hidden',
              mt: 1
            }}
          >
            <Box
              sx={{
                height: '100%',
                bgcolor: 'primary.main',
                width: `${(timeLeft * 1000 / duration) * 100}%`,
                transition: 'width 1s linear'
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            Нажмите ✕ чтобы закрыть или подождите {timeLeft} секунд
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AchievementPopup;