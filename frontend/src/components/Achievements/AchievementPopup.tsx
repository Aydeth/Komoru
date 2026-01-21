// components/Achievements/AchievementPopup.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface AchievementPopupProps {
  achievement: {
    id: number;
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
  const [visible, setVisible] = useState(true);
  const [slideIn, setSlideIn] = useState(true);

  console.log('🎪 AchievementPopup рендерится для:', achievement.title);

  // Автоматическое закрытие через 5 секунд
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏰ Автоматическое закрытие попапа');
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    console.log('👆 Закрытие попапа');
    setSlideIn(false);
    
    // Ждем завершения анимации, затем вызываем onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
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
          elevation={8}
          sx={{
            maxWidth: 400,
            width: '90%',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '3px solid',
            borderColor: 'primary.main',
            pointerEvents: 'auto',
            animation: 'slideInDown 0.5s ease-out',
          }}
        >
          {/* Заголовок */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEventsIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
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
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1 }}>
              <Typography variant="h2" sx={{ fontSize: '3rem', animation: 'pulse 2s infinite' }}>
                {achievement.icon}
              </Typography>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" component="div" fontWeight={700} gutterBottom>
                  {achievement.title}
                </Typography>
                
                {achievement.description && (
                  <Typography variant="body1" color="text.secondary">
                    {achievement.description}
                  </Typography>
                )}
              </Box>
              
              <Box
                sx={{
                  bgcolor: 'success.50',
                  color: 'success.700',
                  py: 1,
                  px: 2,
                  borderRadius: 1.5,
                  border: '2px solid',
                  borderColor: 'success.200',
                  minWidth: 80,
                  textAlign: 'center'
                }}
              >
                <Typography variant="h6" fontWeight={800}>
                  +{achievement.xp_reward} XP
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Slide>
  );
};

export default AchievementPopup;