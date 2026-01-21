import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { apiService, Achievement as ApiAchievement } from '../../services/api';

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

interface AchievementCategory {
  id: string;
  label: string;
  icon: string;
}

// Исправленный интерфейс - делаем is_secret необязательным
interface ExtendedAchievement {
  id: number;
  title: string;
  description?: string;
  xp_reward: number;
  game_id: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
  is_secret?: boolean; // Делаем необязательным
  achievement_type?: string;
  game_title?: string;
  unlocked_at?: string;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ open, onClose, userId }) => {
  const [achievements, setAchievements] = useState<ExtendedAchievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Категории достижений
  const categories: AchievementCategory[] = [
    { id: 'all', label: 'Все', icon: '🏆' },
    { id: 'game', label: 'Игровые', icon: '🎮' },
    { id: 'one_time', label: 'Единоразовые', icon: '⭐' },
    { id: 'progressive', label: 'Прогрессивные', icon: '📈' },
    { id: 'secret', label: 'Секретные', icon: '🔒' },
  ];

  // Загрузка достижений
  useEffect(() => {
    if (open) {
      loadAchievements();
    }
  }, [open, userId]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем все достижения
      const response = await apiService.getUserAchievements();
      
      if (response.success && response.data) {
        const unlocked = response.data
          .filter(a => a.unlocked_at)
          .map(a => a.id);
        
        setUnlockedIds(unlocked);
        
        // Получаем полный список достижений
        const allAchievementsResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/achievements${userId ? `?user_id=${userId}` : ''}`
        );
        
        if (allAchievementsResponse.ok) {
          const data = await allAchievementsResponse.json();
          setAchievements(data.data?.achievements || []);
        } else {
          // Fallback: используем только разблокированные
          setAchievements(response.data as unknown as ExtendedAchievement[]);
        }
      }
    } catch (err) {
      setError('Не удалось загрузить достижения');
      console.error('Ошибка загрузки достижений:', err);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация достижений по категории
  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return unlockedIds.includes(achievement.id);
    if (activeTab === 'locked') return !unlockedIds.includes(achievement.id);
    
    // Проверяем наличие achievement_type
    const type = achievement.achievement_type || 'game';
    return type === activeTab;
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Заголовок */}
        <Box
          sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEventsIcon fontSize="large" />
            <Typography variant="h5" fontWeight={600}>
              Достижения
            </Typography>
          </Box>
          
          <IconButton
            onClick={onClose}
            sx={{ color: 'primary.contrastText' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Прогресс */}
        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Прогресс: {unlockedIds.length} из {achievements.length}
            </Typography>
            <Chip
              label={`${achievements.length > 0 ? Math.round((unlockedIds.length / achievements.length) * 100) : 0}%`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          
          <Box sx={{ 
            height: 8, 
            bgcolor: 'grey.200', 
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <Box
              sx={{
                height: '100%',
                bgcolor: 'primary.main',
                width: `${achievements.length > 0 ? (unlockedIds.length / achievements.length) * 100 : 0}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
        </Box>

        {/* Табы */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category.id}
                icon={<span style={{ fontSize: '1.25rem' }}>{category.icon}</span>}
                label={category.label}
                value={category.id}
              />
            ))}
          </Tabs>
        </Box>

        {/* Содержимое */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : filteredAchievements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LockIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography color="text.secondary">
                {activeTab === 'locked' ? 'Пока нет заблокированных достижений' : 'Достижения не найдены'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: '1fr 1fr 1fr'
              },
              gap: 2
            }}>
              {filteredAchievements.map((achievement) => {
                const isUnlocked = unlockedIds.includes(achievement.id);
                const isVisible = !achievement.is_secret || isUnlocked;

                if (!isVisible) return null;

                return (
                  <Box key={achievement.id}>
                    <Card
                      sx={{
                        height: '100%',
                        opacity: isUnlocked ? 1 : 0.7,
                        position: 'relative',
                        overflow: 'visible',
                      }}
                    >
                      {isUnlocked && (
                        <Chip
                          label="Получено"
                          color="success"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: 10,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      
                      <CardContent sx={{ textAlign: 'center', pt: isUnlocked ? 4 : 2 }}>
                        <Typography variant="h2" sx={{ mb: 1, fontSize: '3rem' }}>
                          {achievement.icon}
                        </Typography>
                        
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {achievement.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                          {achievement.description || 'Описание отсутствует'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            icon={isUnlocked ? <LockOpenIcon /> : <LockIcon />}
                            label={isUnlocked ? 'Разблокировано' : 'Заблокировано'}
                            size="small"
                            color={isUnlocked ? 'success' : 'default'}
                            variant="outlined"
                          />
                          
                          <Chip
                            label={`+${achievement.xp_reward} XP`}
                            size="small"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        
                        {achievement.game_id && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Игра: {achievement.game_id}
                          </Typography>
                        )}
                        
                        {isUnlocked && achievement.unlocked_at && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Получено: {new Date(achievement.unlocked_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Подвал */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" align="center">
            Играйте в игры, чтобы получать новые достижения!
          </Typography>
        </Box>
      </Paper>
    </Modal>
  );
};

export default AchievementsModal;