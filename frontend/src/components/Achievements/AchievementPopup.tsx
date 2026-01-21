import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Slide,
  Fade,
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
  const [visible, setVisible] = useState(true);
  const [slideIn, setSlideIn] = useState(true);

  // Автоматическое скрытие через duration миллисекунд
  useEffect(() => {
    const timer = setTimeout(() => {
      setSlideIn(false);
      // Ждём окончания анимации скрытия
      setTimeout(() => {
        setVisible(false);
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Ручное закрытие
  const handleClose = () => {
    setSlideIn(false);
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 300);
  };

  if (!visible) return null;

  return (
    <Fade in={visible}>
      <Slide direction="down" in={slideIn} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 20,
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none'
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
              pointerEvents: 'auto'
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
                  Получено достижение
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

              {/* Прогрессбар (опционально) */}
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
                    width: '100%',
                    animation: 'progress 5s linear forwards',
                    '@keyframes progress': {
                      '0%': { width: '0%' },
                      '100%': { width: '100%' }
                    }
                  }}
                />
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Уведомление скроется через {duration / 1000} сек
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Slide>
    </Fade>
  );
};

export default AchievementPopup;