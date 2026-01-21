// pages/User/UserProfilePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Fade,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ScoreIcon from '@mui/icons-material/Score';
import GamesIcon from '@mui/icons-material/Games';
import ViewListIcon from '@mui/icons-material/ViewList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DiamondIcon from '@mui/icons-material/Diamond';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { apiService } from '../../services/api';
import AchievementsModal from '../../components/Achievements/AchievementsModal';

// Функция для форматирования больших чисел
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Функция для преобразования типа достижения в читаемый вид
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

interface UserProfile {
  user: {
    id: string;
    username: string;
    avatar: string;
    level: number;
    xp: number;
    currency?: number;
  };
  stats: {
    total_achievements: number;
    games_played: number;
    total_score: number;
    achievement_types: number;
    currency?: number;
  };
  achievements: {
    total: number;
    by_type: Record<string, any[]>;
    recent: any[];
  };
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000 * Math.min(retryCount + 1, 3);

  const loadUserProfile = useCallback(async () => {
  if (!userId) return;
  
  try {
    setLoading(true);
    setError(null);
    
    console.log(`🔄 Загрузка профиля пользователя ${userId} (попытка ${retryCount + 1}/${MAX_RETRIES})...`);
    
    const response = await apiService.getUserAchievementsById(userId);
    
    if (response.success && response.data) {
      const data = response.data;
      
      // Теперь games_played - это реальное количество сессий!
      const userProfile: UserProfile = {
        user: {
          id: data.user.id,
          username: data.user.username || 'Игрок',
          avatar: data.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          level: data.user.level || 1,
          xp: data.user.xp || 0,
          currency: data.user.currency || 0,
        },
        stats: {
          total_achievements: parseInt(data.stats.total_achievements) || 0,
          games_played: parseInt(data.stats.games_played) || 0, // Теперь это сессии!
          total_score: parseInt(data.stats.total_score) || 0,
          achievement_types: data.stats.achievement_types || 0,
          currency: data.user.currency || 0,
        },
        achievements: {
          total: data.achievements.total || 0,
          by_type: data.achievements.by_type || {},
          recent: data.achievements.recent || [],
        },
      };
      
      setProfile(userProfile);
      setRetryCount(0);
      console.log(`✅ Профиль пользователя ${userId} загружен`);
      console.log(`🎮 Игровых сессий: ${userProfile.stats.games_played}`);
    } else {
      throw new Error(response.error || 'Не удалось загрузить профиль');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке профиля';
    setError(errorMessage);
    console.error(`❌ Ошибка загрузки профиля (попытка ${retryCount + 1}):`, err);
    
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`⏱️  Повтор через ${RETRY_DELAY}мс...`);
    }
  } finally {
    setLoading(false);
  }
}, [userId, retryCount]);

  // Автоматический повтор при ошибке
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (error && retryCount < MAX_RETRIES - 1 && !loading && userId) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadUserProfile();
      }, RETRY_DELAY);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [error, retryCount, loading, userId, loadUserProfile]);

  // Загрузка данных при изменении userId
  useEffect(() => {
    if (userId) {
      setRetryCount(0);
      loadUserProfile();
    }
  }, [userId, loadUserProfile]);

  const handleRetry = () => {
    setRetryCount(0);
    loadUserProfile();
  };

  if (loading && !profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 3,
          py: 4
        }}>
          <CircularProgress size={60} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Загружаем профиль пользователя...
            </Typography>
            {retryCount > 0 && (
              <Typography variant="body2" color="text.secondary">
                Попытка {retryCount + 1} из {MAX_RETRIES}...
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    );
  }

  if (error && retryCount >= MAX_RETRIES - 1) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 3 }}
          >
            Назад
          </Button>
          
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Повторить
              </Button>
            }
            sx={{ mb: 4 }}
          >
            <Typography fontWeight={600}>Не удалось загрузить профиль</Typography>
            <Typography variant="body2" mt={0.5}>
              {error} (попыток: {MAX_RETRIES})
            </Typography>
          </Alert>
          
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              👤 Пользователь не найден
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Проверьте правильность ссылки или повторите попытку
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleRetry}
              startIcon={<CircularProgress size={16} color="inherit" />}
              sx={{ mt: 2 }}
            >
              Попробовать снова
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 3 }}
          >
            Назад
          </Button>
          <Alert severity="error">
            Пользователь не найден
          </Alert>
        </Box>
      </Container>
    );
  }

  const currency = profile.stats.currency || profile.user.currency || 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {error && retryCount < MAX_RETRIES - 1 && (
          <Alert 
            severity="warning"
            sx={{ mb: 4 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Box>
                <Typography variant="body2">
                  Проблемы с подключением. Повторяем через {RETRY_DELAY/1000}сек...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Попытка {retryCount + 1} из {MAX_RETRIES}
                </Typography>
              </Box>
            </Box>
          </Alert>
        )}

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Назад
        </Button>

        <Fade in={!!profile}>
          <Box>
            {/* Заголовок профиля */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.50', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={profile.user.avatar}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    border: '4px solid white',
                    boxShadow: 3
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    {profile.user.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ID: {profile.user.id.substring(0, 8)}...
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`Уровень ${profile.user.level}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      icon={<EmojiEventsIcon />}
                      label={`${profile.stats.total_achievements} достижений`}
                      sx={{ 
                        bgcolor: 'warning.50', 
                        color: 'warning.700',
                        fontWeight: 600 
                      }}
                    />
                    <Chip
                      icon={<MonetizationOnIcon />}
                      label={`${currency} 💎`}
                      sx={{ 
                        bgcolor: 'success.50', 
                        color: 'success.700',
                        fontWeight: 600 
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Табы для переключения между разделами */}
            <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }
                }}
              >
                <Tab icon={<ScoreIcon />} label="Статистика" />
                <Tab icon={<EmojiEventsIcon />} label="Достижения" />
                <Tab icon={<AccessTimeIcon />} label="Активность" />
              </Tabs>
            </Paper>

            {/* Содержимое табов */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  📊 Статистика
                </Typography>
                
                {/* Статистика в Box вместо Grid */}
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3, 
                  mb: 4,
                  '& > *': { 
                    flex: '1 1 calc(25% - 24px)',
                    minWidth: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(25% - 24px)' }
                  }
                }}>
                  {/* Очки */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <ScoreIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                        {formatNumber(profile.stats.total_score)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Всего очков
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {profile.stats.total_score.toLocaleString()} точное значение
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  {/* Игровые сессии */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <GamesIcon color="secondary" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h3" color="secondary" sx={{ fontWeight: 700, mb: 1 }}>
                        {profile.stats.games_played}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Игровых сессий
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  {/* Достижения */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <EmojiEventsIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h3" color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                        {profile.stats.total_achievements}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Достижений
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  {/* Кристаллы */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <MonetizationOnIcon color="warning" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h3" color="warning.main" sx={{ fontWeight: 700, mb: 1 }}>
                        {currency}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Кристаллов 💎
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Прогресс уровня */}
                <Card elevation={0} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Прогресс уровня
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h4" color="primary">
                        {profile.user.level}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ 
                          height: 12, 
                          bgcolor: 'grey.200', 
                          borderRadius: 6,
                          overflow: 'hidden'
                        }}>
                          <Box
                            sx={{
                              height: '100%',
                              bgcolor: 'primary.main',
                              width: `${Math.min((profile.user.xp / (profile.user.level * 1000)) * 100, 100)}%`,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="h4" color="primary">
                        {profile.user.level + 1}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {profile.user.xp} XP из {profile.user.level * 1000} XP до следующего уровня
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    🏆 Достижения
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ViewListIcon />}
                    onClick={() => setAchievementsModalOpen(true)}
                  >
                    Все достижения
                  </Button>
                </Box>

                {/* Последние достижения */}
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Последние полученные достижения
                </Typography>
                
                {profile.achievements.recent.length > 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 3,
                    '& > *': {
                      flex: '1 1 calc(33.333% - 24px)',
                      minWidth: { xs: '100%', sm: 'calc(50% - 24px)', md: 'calc(33.333% - 24px)' }
                    }
                  }}>
                    {profile.achievements.recent.slice(0, 6).map((achievement, index) => (
                      <Card key={achievement.id || index} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h2" sx={{ mr: 2 }}>
                              {achievement.icon || '🏆'}
                            </Typography>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" component="div">
                                {achievement.title}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {achievement.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip 
                              label={`+${achievement.xp_reward} XP`} 
                              size="small" 
                              color="primary" 
                            />
                            {achievement.unlocked_at && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(achievement.unlocked_at).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                          {achievement.game_title && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Игра: {achievement.game_title}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" gutterBottom>
                      Пока нет достижений
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  📈 Активность
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 3,
                  '& > *': {
                    flex: '1 1 calc(50% - 24px)',
                    minWidth: { xs: '100%', md: 'calc(50% - 24px)' }
                  }
                }}>
                  {/* Игровая активность */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GamesIcon /> Игровая активность
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <ScoreIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Всего очков"
                            secondary={formatNumber(profile.stats.total_score)}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {profile.stats.total_score.toLocaleString()}
                          </Typography>
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <GamesIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Игровых сессий"
                            secondary={profile.stats.games_played}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <AccessTimeIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Средний счёт за сессию"
                            secondary={profile.stats.games_played > 0 
                              ? formatNumber(Math.round(profile.stats.total_score / profile.stats.games_played))
                              : '0'
                            }
                          />
                          <Typography variant="body2" color="text.secondary">
                            {profile.stats.games_played > 0 
                              ? Math.round(profile.stats.total_score / profile.stats.games_played).toLocaleString()
                              : '0'
                            }
                          </Typography>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>

                  {/* Прогресс достижений */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon /> Прогресс
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <EmojiEventsIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Достижений получено"
                            secondary={`${profile.stats.total_achievements} из ~30`}
                          />
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                            {Math.round((profile.stats.total_achievements / 30) * 100)}%
                          </Typography>
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <MonetizationOnIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Кристаллы"
                            secondary={`${currency} 💎`}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <DiamondIcon color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Уровень"
                            secondary={`${profile.user.level} (${profile.user.xp} XP)`}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            <Typography variant="body2" color="text.secondary" align="center">
              Профиль пользователя • ID: {profile.user.id.substring(0, 12)}...
            </Typography>

            {/* Модальное окно достижений */}
            <AchievementsModal
              open={achievementsModalOpen}
              onClose={() => setAchievementsModalOpen(false)}
              userId={userId}
            />
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default UserProfilePage;