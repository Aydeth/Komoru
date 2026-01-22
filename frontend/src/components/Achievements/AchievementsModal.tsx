// components/Achievements/AchievementsModal.tsx
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

// Вспомогательная функция для преобразования типа достижения
const getAchievementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'game': 'Игровые',
    'one_time': 'Единоразовые',
    'progressive': 'Прогрессивные',
    'secret': 'Секретные',
    'chain': 'Цепочка',
    'collection': 'Коллекция',
  };
  return labels[type] || type;
};

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
      
      console.log('🔄 Загрузка достижений для модального окна...');
      console.log('👤 ID пользователя:', userId || 'текущий пользователь');
      
      if (userId) {
        // Загружаем достижения конкретного пользователя
        console.log(`🏆 Загружаем достижения пользователя ${userId}...`);
        const userResponse = await apiService.getUserAchievementsById(userId);
        
        if (userResponse.success && userResponse.data) {
          const userData = userResponse.data;
          console.log('📦 Данные пользователя получены:', userData);
          
          // Получаем все разблокированные достижения пользователя
          const unlockedAchievements: ExtendedAchievement[] = [];
          const unlockedIdsSet = new Set<number>();
          
          // Проходим по всем типам достижений
          if (userData.achievements?.by_type) {
            Object.values(userData.achievements.by_type).forEach((achievementsArray: any) => {
              if (Array.isArray(achievementsArray)) {
                achievementsArray.forEach((achievement: any) => {
                  unlockedAchievements.push({
                    ...achievement,
                    unlocked: true,
                    unlocked_at: achievement.unlocked_at,
                    is_visible: true
                  });
                  if (achievement.id) {
                    unlockedIdsSet.add(achievement.id);
                  }
                });
              }
            });
          }
          
          // Загружаем ВСЕ достижения чтобы показать и заблокированные
          const allResponse = await apiService.getAllAchievements();
          if (allResponse.success && allResponse.data) {
            const allAchievementsData = allResponse.data?.achievements || [];
            console.log('📊 Всего достижений в системе:', allAchievementsData.length);
            
            // Создаем полный список
            const allAchievementsMap = new Map<number, ExtendedAchievement>();
            
            // Добавляем все достижения
            allAchievementsData.forEach((achievement: any) => {
              if (achievement.id) {
                allAchievementsMap.set(achievement.id, {
                  ...achievement,
                  unlocked: unlockedIdsSet.has(achievement.id),
                  is_visible: !achievement.is_hidden || unlockedIdsSet.has(achievement.id)
                });
              }
            });
            
            // Обновляем разблокированные данными из пользователя
            unlockedAchievements.forEach(achievement => {
              if (achievement.id) {
                allAchievementsMap.set(achievement.id, achievement);
              }
            });
            
            const allAchievementsArray = Array.from(allAchievementsMap.values());
            setAchievements(allAchievementsArray);
            setUnlockedIds(Array.from(unlockedIdsSet));
            
            console.log(`✅ Загружено ${allAchievementsArray.length} достижений`);
            console.log(`🔓 Разблокировано: ${unlockedIdsSet.size}`);
          } else {
            // Если не удалось загрузить все достижения, показываем только разблокированные
            setAchievements(unlockedAchievements);
            setUnlockedIds(Array.from(unlockedIdsSet));
            console.log(`✅ Показаны только разблокированные достижения: ${unlockedAchievements.length}`);
          }
        } else {
          throw new Error(userResponse.error || 'Не удалось загрузить достижения пользователя');
        }
      } else {
        // Загружаем достижения для текущего пользователя (старый код)
        console.log('👤 Загружаем достижения для текущего пользователя');
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
          const allAchievementsData = data.data?.achievements || [];
          const mappedAchievements: ExtendedAchievement[] = allAchievementsData.map((row: any) => ({
            ...row,
            unlocked: false,
            is_visible: !row.is_hidden
          }));
          setAchievements(mappedAchievements);
          
          // Для текущего пользователя получаем ВСЕ достижения (включая секретные)
            if (userId) {
            const userResponse = await apiService.getUserAchievementsById(userId);
            if (userResponse.success && userResponse.data) {
                // Собираем все ID разблокированных достижений
                const unlockedIdsSet = new Set<number>();
                const userAchievements = userResponse.data.achievements;
                
                if (userAchievements?.by_type) {
                Object.values(userAchievements.by_type).forEach((achievementsArray: any) => {
                    if (Array.isArray(achievementsArray)) {
                    achievementsArray.forEach((achievement: any) => {
                        if (achievement.id) {
                        unlockedIdsSet.add(achievement.id);
                        }
                    });
                    }
                });
                }
                
                const userUnlocked = Array.from(unlockedIdsSet);
                setUnlockedIds(userUnlocked);
                
                // Обновляем статус разблокировки
                setAchievements(prev => prev.map(a => ({
                ...a,
                unlocked: userUnlocked.includes(a.id)
                })));
            }
            }
        } else {
          throw new Error(data.error || 'Не удалось загрузить достижения');
        }
      }
      
    } catch (err) {
      console.error('❌ Ошибка загрузки достижений:', err);
      setError('Не удалось загрузить достижения. Попробуйте позже.');
      
      // Fallback с явным указанием типа
      try {
        const fallback = await apiService.getAllAchievements();
        if (fallback.success && fallback.data) {
          const fallbackAchievementsData = fallback.data?.achievements || [];
          const mappedFallbackAchievements: ExtendedAchievement[] = fallbackAchievementsData.map((row: any) => ({
            ...row,
            achievement_type: 'game',
            unlocked: false,
            is_visible: true
          }));
          setAchievements(mappedFallbackAchievements);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback тоже не сработал:', fallbackError);
      }
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
    if (!achievement.is_visible) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'unlocked') return !!achievement.unlocked;
    if (activeTab === 'locked') return !achievement.unlocked;
    
    // Проверяем наличие achievement_type
    const type = achievement.achievement_type || 'game';
    return type === activeTab;
  });

  // Расчет прогресса
  const totalAchievements = achievements.filter(a => a.is_visible).length;
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
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmojiEventsIcon fontSize="large" />
            <Typography variant="h5" fontWeight={600}>
              {userId ? 'Достижения пользователя' : 'Мои достижения'}
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
        <Box sx={{ 
          p: 3, 
          bgcolor: 'background.default',
          flexShrink: 0,
        }}>
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
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          px: 2, 
          overflowX: 'auto',
          flexShrink: 0,
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}>
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
              },
              '& .MuiTabs-scrollButtons': {
                color: 'primary.main',
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
                  gap: 0.5,
                  whiteSpace: 'nowrap',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Содержимое */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 3,
          bgcolor: 'background.default',
        }}>
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
                const isUnlocked = !!achievement.unlocked;

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
                        
                        {achievement.achievement_type && achievement.achievement_type !== 'game' && (
                          <Chip
                            label={getAchievementTypeLabel(achievement.achievement_type)}
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
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderTop: 1, 
          borderColor: 'divider',
          flexShrink: 0,
        }}>
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