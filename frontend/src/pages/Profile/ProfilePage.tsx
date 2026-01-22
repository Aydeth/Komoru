import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Container,
  Alert,
  CircularProgress,
  Fade,
  Tabs,
  Tab,
} from '@mui/material';
import {
  EmojiEvents,
  Diamond,
  TrendingUp,
  CalendarToday,
  Star,
  Games,
  Login,
  Google,
  MilitaryTech,
  Score,
  History,
  ViewList,
  AccessTime,
  MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import AchievementsModal from '../../components/Achievements/AchievementsModal';
import { useAchievements } from '../../contexts/AchievementContext';

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

// Функция для преобразования типа достижения
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

interface UserProfileData {
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
    unique_games?: number;
  };
  achievements: {
    total: number;
    by_type: Record<string, any[]>;
    recent: any[];
  };
}

const ProfilePage: React.FC = () => {
  const { user: authUser, signInWithGoogle, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stats, setStats] = useState({
    totalScore: 0,
    bestGame: { game: '', score: 0 },
    gamesPlayed: 0,
    achievementsCount: 0,
  });
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000 * Math.min(retryCount + 1, 3);

  const loadUserData = useCallback(async () => {
    if (!authUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Загрузка профиля пользователя ${authUser.id} (попытка ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Используем тот же endpoint, что и UserProfilePage
      const response = await apiService.getUserAchievementsById(authUser.id);
      
      if (response.success && response.data) {
        const data = response.data;
        
        // Формируем данные в том же формате, что и UserProfilePage
        const userProfile: UserProfileData = {
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
            games_played: parseInt(data.stats.games_played) || 0,
            total_score: parseInt(data.stats.total_score) || 0,
            achievement_types: data.stats.achievement_types || 0,
            currency: data.user.currency || 0,
            unique_games: data.stats.unique_games || 0,
          },
          achievements: {
            total: data.achievements.total || 0,
            by_type: data.achievements.by_type || {},
            recent: data.achievements.recent || [],
          },
        };
        
        setProfile(userProfile);
        
        // Загружаем результаты игр для отображения
        const scoresResponse = await apiService.getUserScores();
        if (scoresResponse.success && scoresResponse.data) {
          setScores(scoresResponse.data);
          
          // Рассчитываем лучшую игру
          const bestGame = scoresResponse.data.reduce((best, score) => 
            score.score > best.score ? { game: score.game_title || score.game_id, score: score.score } : best,
            { game: '', score: 0 }
          );
          
          setStats({
            totalScore: userProfile.stats.total_score,
            bestGame,
            gamesPlayed: userProfile.stats.games_played,
            achievementsCount: userProfile.stats.total_achievements,
          });
        }
        
        setRetryCount(0);
        console.log(`✅ Профиль пользователя ${authUser.id} загружен`);
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
  }, [authUser, retryCount]);

  // Автоматический повтор при ошибке
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (error && retryCount < MAX_RETRIES - 1 && !loading && authUser) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadUserData();
      }, RETRY_DELAY);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [error, retryCount, loading, authUser, loadUserData]);

  // Загрузка данных при изменении пользователя
  useEffect(() => {
    if (authUser) {
      setRetryCount(0);
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [authUser, loadUserData]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadUserData();
  };

  // Расчет прогресса до следующего уровня
  const xpForNextLevel = (profile?.user.level || 1) * 1000;
  const xpProgress = Math.min(((profile?.user.xp || 0) / xpForNextLevel) * 100, 100);
  const currency = profile?.stats.currency || profile?.user.currency || 0;

  if (authLoading || (loading && !profile)) {
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
              Загружаем данные профиля...
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

  if (!authUser) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                bgcolor: 'primary.50',
                color: 'primary.main'
              }}
            >
              <Login fontSize="large" />
            </Avatar>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              👋 Добро пожаловать в Komoru!
            </Typography>
            
            <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
              Войдите, чтобы сохранять прогресс, зарабатывать достижения и попадать в лидерборды.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Преимущества входа:
              </Typography>
              <Typography variant="body2">
                • 💾 Сохранение прогресса
                <br />
                • 🏆 Достижения и награды
                <br />
                • 📊 Личный профиль
                <br />
                • 🏅 Места в лидербордах
              </Typography>
            </Alert>
            
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              startIcon={<Google />}
              sx={{
                mt: 2,
                py: 1.5,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              Войти через Google
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
              Мы используем только ваш email и имя для создания профиля
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (error && retryCount >= MAX_RETRIES - 1) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Повторить
              </Button>
            }
            sx={{ mb: 4 }}
          >
            <Typography fontWeight={600}>Не удалось загрузить данные профиля</Typography>
            <Typography variant="body2" mt={0.5}>
              {error} (попыток: {MAX_RETRIES})
            </Typography>
          </Alert>
          
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              📊 Не удалось загрузить профиль
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Проверьте подключение к интернету и повторите попытку
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
          <Alert severity="error">
            Не удалось загрузить данные профиля
          </Alert>
        </Box>
      </Container>
    );
  }

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

        <Fade in={!!profile}>
          <Box>
            {/* Заголовок профиля */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.50', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={authUser.avatar}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    border: '4px solid white',
                    boxShadow: 3
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                    {authUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {authUser.email}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                    <Chip
                      icon={<TrendingUp />}
                      label={`Уровень ${profile.user.level}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      icon={<EmojiEvents />}
                      label={`${profile.stats.total_achievements} достижений`}
                      sx={{ 
                        bgcolor: 'warning.50', 
                        color: 'warning.700',
                        fontWeight: 600 
                      }}
                    />
                    <Chip
                      icon={<MonetizationOn />}
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
                <Tab icon={<Score />} label="Статистика" />
                <Tab icon={<EmojiEvents />} label="Достижения" />
                <Tab icon={<AccessTime />} label="Активность" />
              </Tabs>
            </Paper>

            {/* Содержимое табов */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  📊 Статистика
                </Typography>
                
                {/* Статистика в Box */}
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
                      <Score color="primary" sx={{ fontSize: 48, mb: 2 }} />
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
                      <Games color="secondary" sx={{ fontSize: 48, mb: 2 }} />
                      <Typography variant="h3" color="secondary" sx={{ fontWeight: 700, mb: 1 }}>
                        {profile.stats.games_played}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Игровых сессий
                      </Typography>
                      {profile.stats.unique_games && profile.stats.unique_games > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          ({profile.stats.unique_games} уникальных игр)
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Достижения */}
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <EmojiEvents color="success" sx={{ fontSize: 48, mb: 2 }} />
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
                      <MonetizationOn color="warning" sx={{ fontSize: 48, mb: 2 }} />
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
                    startIcon={<ViewList />}
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
                    ))}
                  </Box>
                ) : (
                  <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" gutterBottom>
                      Пока нет достижений
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Играйте в игры, чтобы получать достижения!
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
                        <Games /> Игровая активность
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Score color="action" />
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
                            <Games color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Игровых сессий"
                            secondary={profile.stats.games_played}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <AccessTime color="action" />
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
                        <TrendingUp /> Прогресс
                      </Typography>
                      <List disablePadding>
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <EmojiEvents color="action" />
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
                            <MonetizationOn color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Кристаллы"
                            secondary={`${currency} 💎`}
                          />
                        </ListItem>
                        <Divider />
                        <ListItem disableGutters sx={{ py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Diamond color="action" />
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

                {/* Последние игры */}
                <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
                  🎮 Последние игры
                </Typography>
                
                {scores.length > 0 ? (
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <List>
                        {scores.slice(0, 5).map((score, index) => (
                          <React.Fragment key={score.id}>
                            <ListItem>
                              <ListItemIcon>
                                <Typography variant="h6" color="text.secondary">
                                  {index + 1}
                                </Typography>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {score.game_title || score.game_id}
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                                      {score.score.toLocaleString()}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(score.created_at).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            {index < scores.length - 1 && index < 4 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                ) : (
                  <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <History sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" gutterBottom>
                      Пока нет сыгранных игр
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Сыграйте в игру, чтобы увидеть здесь свои результаты
                    </Typography>
                  </Paper>
                )}
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
              userId={authUser.id}
            />
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default ProfilePage;