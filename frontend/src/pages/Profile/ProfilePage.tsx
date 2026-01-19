import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, User as ApiUser } from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    achievements: 0,
    rank: 'Новичок',
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // TODO: Загрузить реальные данные пользователя с нашего API
        // const response = await apiService.getUser();
        // if (response.success && response.data) {
        //   setApiUser(response.data);
        // }
        
        // Временные данные
        const tempUser: ApiUser = {
          id: user.id,
          username: user.name,
          avatar: user.avatar,
          level: Math.floor(Math.random() * 10) + 1,
          xp: Math.floor(Math.random() * 5000),
          currency: Math.floor(Math.random() * 1000),
          joinedAt: new Date().toISOString()
        };
        
        setApiUser(tempUser);
        setStats({
          gamesPlayed: Math.floor(Math.random() * 50) + 10,
          totalScore: Math.floor(Math.random() * 100000) + 5000,
          achievements: Math.floor(Math.random() * 10) + 1,
          rank: tempUser.level > 5 ? 'Опытный' : 'Новичок',
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      alert('Ошибка при входе. Попробуйте еще раз.');
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
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
            
            <Typography variant="h4" gutterBottom>
              👋 Добро пожаловать в Komoru!
            </Typography>
            
            <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
              Войдите, чтобы сохранять прогресс, зарабатывать достижения и попадать в лидерборды.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Преимущества входа:</strong>
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
                fontSize: '1.1rem'
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

  // Расчет прогресса до следующего уровня
  const xpForNextLevel = (apiUser?.level || 1) * 1000;
  const xpProgress = ((apiUser?.xp || 0) / xpForNextLevel) * 100;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Заголовок профиля */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.50', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Avatar
              src={user.avatar}
              sx={{ 
                width: 100, 
                height: 100, 
                border: '4px solid white',
                boxShadow: 2
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                <Chip
                  icon={<TrendingUp />}
                  label={`Уровень ${apiUser?.level || 1}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  icon={<Diamond />}
                  label={`${apiUser?.currency || 0} 💎`}
                  sx={{ bgcolor: 'gold.50', color: 'gold.700' }}
                />
                <Chip
                  icon={<Star />}
                  label={stats.rank}
                  color="secondary"
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3 
        }}>
          {/* Левая колонка - Прогресс */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              📊 Прогресс
            </Typography>
            
            <Card elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Опыт: {apiUser?.xp || 0} / {xpForNextLevel}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {Math.floor(xpProgress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={xpProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  До уровня {(apiUser?.level || 1) + 1}
                </Typography>
              </CardContent>
            </Card>

            {/* Статистика */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 4 }}>
              📈 Статистика
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 2 
            }}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" color="primary">
                  {stats.gamesPlayed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Игр сыграно
                </Typography>
              </Paper>
              
              <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" color="primary">
                  {stats.totalScore.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Всего очков
                </Typography>
              </Paper>
              
              <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" color="primary">
                  {stats.achievements}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Достижений
                </Typography>
              </Paper>
              
              <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" color="primary">
                  {apiUser?.level || 1}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Уровень
                </Typography>
              </Paper>
            </Box>

            {/* Последние достижения */}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 4 }}>
              🏆 Достижения
            </Typography>
            
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Первая игра"
                    secondary="Сыграйте в свою первую игру • +50 XP"
                  />
                  <Chip label="Получено" size="small" color="success" variant="outlined" />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Коллекционер"
                    secondary="Получите 5 достижений • +300 XP"
                  />
                  <Chip 
                    label={stats.achievements >= 5 ? "Получено" : `${stats.achievements}/5`} 
                    size="small" 
                    variant="outlined" 
                    color={stats.achievements >= 5 ? "success" : "default"} 
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
                <ListItem>
                  <ListItemIcon>
                    <EmojiEvents color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Мастер змейки"
                    secondary="Наберите 1000 очков в Змейке • +200 XP"
                  />
                  <Chip label="В процессе" size="small" variant="outlined" />
                </ListItem>
              </List>
            </Paper>
          </Box>

          {/* Правая колонка - Информация */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              👤 Информация
            </Typography>
            
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CalendarToday color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Дата регистрации"
                      secondary={new Date(apiUser?.joinedAt || new Date()).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    />
                  </ListItem>
                  <Divider variant="inset" />
                  <ListItem>
                    <ListItemIcon>
                      <Games color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Любимая игра"
                      secondary="Змейка"
                    />
                  </ListItem>
                  <Divider variant="inset" />
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Лучший результат"
                      secondary="1,250 очков (Змейка)"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Кристаллы и валюта */}
            <Card elevation={0} variant="outlined" sx={{ mt: 3, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Diamond sx={{ mr: 1, color: 'gold' }} />
                  Кристаллы: {apiUser?.currency || 0} 💎
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Зарабатывайте кристаллы, играя в игры и выполняя задания.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" fullWidth>
                    Ежедневные задания
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default ProfilePage;