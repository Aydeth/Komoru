import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ScoreIcon from '@mui/icons-material/Score';
import GamesIcon from '@mui/icons-material/Games';
import { apiService } from '../../services/api';

interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
}

interface UserStats {
  total_achievements: number;
  games_played: number;
  total_score: number;
  achievement_types: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  game_title?: string;
  unlocked_at: string;
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUserProfile(userId);
    }
  }, [userId]);

  const loadUserProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Здесь будет вызов нового API /api/users/{userId}/achievements
      // Пока используем заглушку
      console.log(`Загрузка профиля пользователя ${id}`);
      
      // Временная заглушка
      setTimeout(() => {
        setUser({
          id: id,
          username: 'Игрок',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
          level: Math.floor(Math.random() * 10) + 1,
          xp: Math.floor(Math.random() * 1000)
        });
        
        setStats({
          total_achievements: Math.floor(Math.random() * 10),
          games_played: Math.floor(Math.random() * 50),
          total_score: Math.floor(Math.random() * 10000),
          achievement_types: 3
        });
        
        setLoading(false);
      }, 500);
      
    } catch (err) {
      setError('Не удалось загрузить профиль пользователя');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, mt: 2 }}
        >
          Назад
        </Button>
        <Alert severity="error">
          {error || 'Пользователь не найден'}
        </Alert>
      </Container>
    );
  }

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

        {/* Заголовок профиля */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.50', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
            <Avatar
              src={user.avatar}
              sx={{ 
                width: 100, 
                height: 100, 
                border: '4px solid white',
                boxShadow: 3
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: {user.id.substring(0, 8)}...
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                <Chip
                  icon={<MilitaryTechIcon />}
                  label={`Уровень ${user.level}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                <Chip
                  icon={<EmojiEventsIcon />}
                  label={`${stats?.total_achievements || 0} достижений`}
                  sx={{ 
                    bgcolor: 'warning.50', 
                    color: 'warning.700',
                    fontWeight: 600 
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Статистика */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          📊 Статистика
        </Typography>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '1fr 1fr 1fr 1fr'
          },
          gap: 2,
          mb: 4
        }}>
          {/* Очки */}
          <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <ScoreIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {stats?.total_score.toLocaleString() || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Всего очков
            </Typography>
          </Paper>
          
          {/* Игры */}
          <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <GamesIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 700 }}>
              {stats?.games_played || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Игр сыграно
            </Typography>
          </Paper>
          
          {/* Достижения */}
          <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <EmojiEventsIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {stats?.total_achievements || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Достижений
            </Typography>
          </Paper>
          
          {/* Типы */}
          <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <MilitaryTechIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
              {stats?.achievement_types || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Типов достижений
            </Typography>
          </Paper>
        </Box>

        {/* Достижения */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          🏆 Последние достижения
        </Typography>
        
        {achievements.length > 0 ? (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr'
            },
            gap: 2
          }}>
            {achievements.map((achievement) => (
              <Card variant="outlined" key={achievement.id} sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4" sx={{ mr: 2 }}>
                      {achievement.icon}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div">
                        {achievement.title}
                      </Typography>
                      {achievement.game_title && (
                        <Typography variant="caption" color="text.secondary">
                          {achievement.game_title}
                        </Typography>
                      )}
                    </Box>
                    <Chip 
                      label={`+${achievement.xp_reward} XP`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {achievement.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Получено: {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              У пользователя пока нет достижений
            </Typography>
          </Paper>
        )}

        <Divider sx={{ my: 4 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          Профиль пользователя • ID: {user.id}
        </Typography>
      </Box>
    </Container>
  );
};

export default UserProfilePage;