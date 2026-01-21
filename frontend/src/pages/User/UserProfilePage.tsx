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
import ViewListIcon from '@mui/icons-material/ViewList';
import AchievementsModal from '../../components/Achievements/AchievementsModal';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile(userId);
    }
  }, [userId]);

  const loadUserProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Используем реальный API endpoint
      const response = await fetch(
        `https://komoru-api.onrender.com/api/users/${id}/achievements`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setUser(data.data.user);
          setStats(data.data.stats);
          setAchievements(data.data.achievements.recent || []);
        } else {
          throw new Error(data.error || 'Пользователь не найден');
        }
      } else {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      
      // Fallback: показываем заглушку если API не готов
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
      
    } finally {
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
                <Chip
                  icon={<GamesIcon />}
                  label={`${stats?.games_played || 0} игр`}
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
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
              {stats?.total_score?.toLocaleString() || 0}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            🏆 Последние достижения
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ViewListIcon />}
            onClick={() => setAchievementsModalOpen(true)}
          >
            Все достижения
          </Button>
        </Box>
        
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

        {/* Модальное окно достижений */}
        <AchievementsModal
          open={achievementsModalOpen}
          onClose={() => setAchievementsModalOpen(false)}
          userId={userId}
        />
      </Box>
    </Container>
  );
};

export default UserProfilePage;