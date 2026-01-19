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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, User as ApiUser, GameScore, Achievement } from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user: authUser, signInWithGoogle, loading: authLoading } = useAuth();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stats, setStats] = useState({
    totalScore: 0,
    bestGame: { game: '', score: 0 },
    gamesPlayed: 0,
    achievementsCount: 0,
  });

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000 * Math.min(retryCount + 1, 3);

  const loadUserData = useCallback(async () => {
    try {
      if (!authUser) return;
      
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Загрузка данных пользователя (попытка ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Загружаем реальные данные пользователя
      const userResponse = await apiService.getUser();
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        
        // Загружаем реальные результаты игр
        const scoresResponse = await apiService.getUserScores();
        if (scoresResponse.success && scoresResponse.data) {
          setScores(scoresResponse.data);
          
          // Рассчитываем статистику из реальных данных
          const total = scoresResponse.data.reduce((sum, score) => sum + score.score, 0);
          const bestGame = scoresResponse.data.reduce((best, score) => 
            score.score > best.score ? { game: score.game_title || score.game_id, score: score.score } : best,
            { game: '', score: 0 }
          );
          
          setStats({
            totalScore: total,
            bestGame,
            gamesPlayed: userResponse.data.gamesPlayed || 0,
            achievementsCount: userResponse.data.achievements || 0,
          });
        }
        
        // Загружаем реальные достижения
        const achievementsResponse = await apiService.getUserAchievements();
        if (achievementsResponse.success && achievementsResponse.data) {
          setAchievements(achievementsResponse.data);
        }
        
        setRetryCount(0); // Сбрасываем счетчик при успехе
        console.log(`✅ Данные пользователя загружены`);
      } else {
        throw new Error(userResponse.error || 'Не удалось загрузить данные пользователя');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке данных пользователя';
      setError(errorMessage);
      console.error(`❌ Ошибка загрузки данных пользователя (попытка ${retryCount + 1}):`, err);
      
      // Если есть еще попытки - планируем повтор
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
      setRetryCount(0); // Сбрасываем счетчик при смене пользователя
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

  if (authLoading || (loading && !user)) {
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

  // Расчет прогресса до следующего уровня
  const xpForNextLevel = (user?.level || 1) * 1000;
  const xpProgress = Math.min(((user?.xp || 0) / xpForNextLevel) * 100, 100);

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

        <Fade in={!!user}>
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
                      label={`Уровень ${user?.level || 1}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      icon={<Diamond />}
                      label={`${user?.currency || 0} 💎`}
                      sx={{ 
                        bgcolor: 'gold.50', 
                        color: 'gold.700',
                        fontWeight: 600 
                      }}
                    />
                    <Chip
                      icon={<MilitaryTech />}
                      label={`#${Math.floor(Math.random() * 100) + 1} в рейтинге`}
                      color="secondary"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3 
            }}>
              {/* Левая колонка - Прогресс и статистика */}
              <Box sx={{ flex: { md: 2 } }}>
                {/* Прогресс уровня */}
                <Card elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Прогресс уровня
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        {Math.floor(xpProgress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={xpProgress}
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        mb: 1 
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {user?.xp || 0} / {xpForNextLevel} XP
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        До уровня {(user?.level || 1) + 1}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Статистика */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  📈 Статистика
                </Typography>
                
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                  gap: 2,
                  mb: 4
                }}>
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
                    <Score color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                      {stats.totalScore.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Всего очков
                    </Typography>
                  </Paper>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
                    <MilitaryTech color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
                      {stats.bestGame.score.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Лучший результат
                    </Typography>
                    {stats.bestGame.game && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        в {stats.bestGame.game}
                      </Typography>
                    )}
                  </Paper>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
                    <Games color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                      {stats.gamesPlayed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Игр сыграно
                    </Typography>
                  </Paper>
                  
                  <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
                    <EmojiEvents color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                      {stats.achievementsCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Достижений
                    </Typography>
                  </Paper>
                </Box>

                {/* Последние игры */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
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

              {/* Правая колонка - Информация и достижения */}
              <Box sx={{ flex: { md: 1 }, maxWidth: { md: 400 } }}>
                {/* Информация */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  👤 Информация
                </Typography>
                
                <Card elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                  <CardContent>
                    <List disablePadding>
                      <ListItem disableGutters sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <CalendarToday color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Дата регистрации"
                          secondary={
                            user?.joinedAt 
                              ? new Date(user.joinedAt).toLocaleDateString('ru-RU', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Недавно'
                          }
                        />
                      </ListItem>
                      <Divider />
                      <ListItem disableGutters sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <TrendingUp color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Уровень прогресса"
                          secondary={`${user?.xp || 0} XP из ${xpForNextLevel} XP`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem disableGutters sx={{ py: 1.5 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Diamond color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Кристаллы"
                          secondary={`${user?.currency || 0} 💎`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                {/* Достижения */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  🏆 Достижения
                </Typography>
                
                {achievements.length > 0 ? (
                  <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <List disablePadding>
                        {achievements.slice(0, 3).map((achievement, index) => (
                          <React.Fragment key={achievement.id}>
                            <ListItem disableGutters sx={{ py: 1.5 }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                <Typography variant="h5">
                                  {achievement.icon}
                                </Typography>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {achievement.title}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {achievement.description}
                                  </Typography>
                                }
                              />
                              <Chip 
                                label={`+${achievement.xp_reward} XP`} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            </ListItem>
                            {index < achievements.length - 1 && index < 2 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                      {achievements.length > 3 && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            И ещё {achievements.length - 3} достижений
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                    <EmojiEvents sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary" gutterBottom>
                      Достижений пока нет
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Играйте и выполняйте задания, чтобы получить достижения
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default ProfilePage;