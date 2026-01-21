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
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({
  achievement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  console.log('🎪 AchievementPopup рендерится с достижением:', achievement.title);

  // Ручное закрытие
  const handleClose = () => {
    console.log('👆 Ручное закрытие попапа');
    setIsClosing(true);
    
    // Анимация исчезновения
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  // Автоматическое закрытие через 5 секунд (управляется из контекста)
  useEffect(() => {
    console.log('⏱️ Попап появился, автоматическое закрытие через 5 секунд');
  }, []);

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
        animation: isClosing ? 'slideOutUp 0.3s ease-in forwards' : 'slideInDown 0.5s ease-out forwards',
        '@keyframes slideInDown': {
          from: {
            transform: 'translateY(-100px)',
            opacity: 0,
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1,
          }
        },
        '@keyframes slideOutUp': {
          from: {
            transform: 'translateY(0)',
            opacity: 1,
          },
          to: {
            transform: 'translateY(-100px)',
            opacity: 0,
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
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? 'translateY(-100px)' : 'translateY(0)',
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

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            Нажмите ✕ чтобы закрыть
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AchievementPopup;