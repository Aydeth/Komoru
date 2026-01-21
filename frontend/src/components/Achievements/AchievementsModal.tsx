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
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { apiService } from '../../services/api';

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

interface ExtendedAchievement {
  id: number;
  title: string;
  description?: string;
  xp_reward: number;
  game_id: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
  is_secret?: boolean;
  achievement_type?: string;
  game_title?: string;
  unlocked_at?: string;
  unlocked?: boolean;
  is_visible?: boolean;
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
    { id: 'unlocked', label: 'Полученные', icon: '🔓' },
    { id: 'locked', label: 'Неполученные', icon: '🔒' },
  ];

  // Загрузка достижений
  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Загрузка списка достижений...');
      
      // Используем правильный API endpoint
      const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://komoru-api.onrender.com';
      const url = `${apiUrl}/api/achievements`;
      
      console.log('📡 Запрос по URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Получены данные достижений:', data);
      
      if (data.success) {
        const allAchievements = data.data?.achievements || [];
        setAchievements(allAchievements);
        
        // Получаем разблокированные достижения пользователя
        if (userId) {
          // Для других пользователей
          const userAchievementsResponse = await fetch(`${apiUrl}/api/users/${userId}/achievements`);
          if (userAchievementsResponse.ok) {
            const userData = await userAchievementsResponse.json();
            if (userData.success) {
              const userUnlocked = userData.data?.achievements?.recent?.map((a: any) => a.id) || [];
              setUnlockedIds(userUnlocked);
            }
          }
        } else {
          // Для текущего пользователя
          const userResponse = await apiService.getUserAchievements();
          if (userResponse.success && userResponse.data) {
            const userUnlocked = userResponse.data
              .filter(a => a.unlocked_at)
              .map(a => a.id);
            setUnlockedIds(userUnlocked);
          }
        }
      } else {
        throw new Error(data.error || 'Не удалось загрузить достижения');
      }
      
    } catch (err) {
      console.error('❌ Ошибка загрузки достижений:', err);
      setError('Не удалось загрузить достижения. Попробуйте позже.');
      
      // Fallback: создаем тестовые данные
      const fallbackAchievements: ExtendedAchievement[] = [
        {
          id: 1,
          title: 'Первая игра',
          description: 'Сыграйте в свою первую игру',
          xp_reward: 50,
          game_id: null,
          icon: '🎮',
          condition_type: 'play_count',
          condition_value: 1,
          achievement_type: 'one_time',
          unlocked: true
        },
        {
          id: 2,
          title: 'Мастер змейки',
          description: 'Наберите 1000 очков в Змейке',
          xp_reward: 200,
          game_id: 'snake',
          icon: '🐍',
          condition_type: 'score_above',
          condition_value: 1000,
          achievement_type: 'game',
          unlocked: false
        },
        {
          id: 3,
          title: 'Головоломщик',
          description: 'Соберите пятнашки за 5 минут',
          xp_reward: 150,
          game_id: 'puzzle15',
          icon: '🧩',
          condition_type: 'score_above',
          condition_value: 300,
          achievement_type: 'game',
          unlocked: false
        },
        {
          id: 4,
          title: 'Коллекционер',
          description: 'Получите 5 достижений',
          xp_reward: 300,
          game_id: null,
          icon: '🏆',
          condition_type: 'collection',
          condition_value: 5,
          achievement_type: 'chain',
          unlocked: false
        },
        {
          id: 5,
          title: 'Богач',
          description: 'Накопите 500 кристаллов',
          xp_reward: 250,
          game_id: null,
          icon: '💎',
          condition_type: 'collection',
          condition_value: 500,
          achievement_type: 'progressive',
          unlocked: false
        },
      ];
      
      setAchievements(fallbackAchievements);
      setUnlockedIds([1]); // Первое достижение разблокировано
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAchievements();
    }
  }, [open, userId]);

  // Фильтрация достижений по категории
  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return unlockedIds.includes(achievement.id);
    if (activeTab === 'locked') return !unlockedIds.includes(achievement.id);
    
    // Проверяем наличие achievement_type
    const type = achievement.achievement_type || 'game';
    return type === activeTab;
  });

  // Расчет прогресса
  const totalAchievements = achievements.length;
  const unlockedAchievements = unlockedIds.length;
  const progressPercentage = totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;

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
              Прогресс: {unlockedAchievements} из {totalAchievements}
            </Typography>
            <Chip
              label={`${progressPercentage}%`}
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
            mb: 1
          }}>
            <Box
              sx={{
                height: '100%',
                bgcolor: 'primary.main',
                width: `${progressPercentage}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            {unlockedAchievements === totalAchievements && totalAchievements > 0 
              ? '🎉 Все достижения получены!' 
              : `Осталось получить ${totalAchievements - unlockedAchievements} достижений`}
          </Typography>
        </Box>

        {/* Табы */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, overflowX: 'auto' }}>
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
                minWidth: 'auto',
                px: 2,
              }
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category.id}
                icon={<span style={{ fontSize: '1rem', marginRight: '4px' }}>{category.icon}</span>}
                label={category.label}
                value={category.id}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 0.5
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Содержимое */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
              <CircularProgress />
              <Typography color="text.secondary">Загружаем достижения...</Typography>
            </Box>
          ) : error ? (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={loadAchievements}>
                  Повторить
                </Button>
              }
            >
              {error}
            </Alert>
          ) : filteredAchievements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <LockIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                {activeTab === 'locked' ? 'Пока нет заблокированных достижений' : 
                 activeTab === 'unlocked' ? 'Пока нет полученных достижений' : 
                 'Достижения не найдены'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Играйте в игры, чтобы получать достижения!
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
                        opacity: isUnlocked ? 1 : 0.8,
                        position: 'relative',
                        overflow: 'visible',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        }
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
                            zIndex: 1,
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
                        
                        {achievement.achievement_type && (
                          <Chip
                            label={achievement.achievement_type}
                            size="small"
                            variant="filled"
                            sx={{
                              mt: 1,
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: 'grey.100',
                              color: 'grey.700'
                            }}
                          />
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
            {totalAchievements > 0 
              ? `Всего достижений: ${totalAchievements} • Получено: ${unlockedAchievements} • Осталось: ${totalAchievements - unlockedAchievements}`
              : 'Играйте в игры, чтобы получать достижения!'
            }
          </Typography>
        </Box>
      </Paper>
    </Modal>
  );
};

export default AchievementsModal;