import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService, Game } from '../../services/api';

const HomePage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Загрузка игр...');
      const response = await apiService.getGames();
      console.log('📦 Ответ от API:', response);
      
      if (response.success && response.data) {
        setGames(response.data);
        console.log(`✅ Загружено ${response.data.length} игр`);
      } else {
        setError(response.error || 'Не удалось загрузить игры');
        console.error('❌ Ошибка загрузки игр:', response.error);
        
        // Показываем заглушки, если сервер недоступен
        if (!response.data) {
          setGames([
            {
              id: 'snake',
              title: 'Змейка',
              description: 'Классическая змейка для релакса',
              icon: '🐍',
              color: '#2E7D32',
              difficulty: 'easy',
              is_active: true
            },
            {
              id: 'memory',
              title: 'Память',
              description: 'Тренировка памяти на карточках',
              icon: '🧠',
              color: '#7B1FA2',
              difficulty: 'easy',
              is_active: true
            }
          ]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке игр';
      setError(errorMessage);
      console.error('❌ Load games error:', err);
      
      // Показываем заглушки при ошибке
      setGames([
        {
          id: 'snake',
          title: 'Змейка',
          description: 'Классическая змейка для релакса',
          icon: '🐍',
          color: '#2E7D32',
          difficulty: 'easy',
          is_active: true
        },
        {
          id: 'memory',
          title: 'Память',
          description: 'Тренировка памяти на карточках',
          icon: '🧠',
          color: '#7B1FA2',
          difficulty: 'easy',
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    loadGames();
  };

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {error && games.length === 0 && (
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Повторить
              </Button>
            }
            sx={{ mb: 4 }}
          >
            {error}
          </Alert>
        )}
        
        {error && games.length > 0 && (
          <Alert 
            severity="warning"
            sx={{ mb: 4 }}
          >
            Используются локальные игры. {error}
          </Alert>
        )}

        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          🎮 Уютный игровой уголок
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Выберите игру, чтобы расслабиться и отдохнуть. Минимализм и спокойствие — наш стиль.
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: '1fr 1fr', 
            md: '1fr 1fr 1fr 1fr' 
          },
          gap: 3 
        }}>
          {games.map((game) => (
            <Card
              key={game.id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
                opacity: game.is_active ? 1 : 0.7
              }}
            >
              <CardActionArea
                onClick={() => handleGameClick(game.id)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                disabled={!game.is_active}
              >
                <CardContent sx={{ 
                  flexGrow: 1, 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <Typography variant="h2" sx={{ mb: 2, fontSize: '3rem' }}>
                    {game.icon}
                  </Typography>
                  <Typography variant="h6" component="div" gutterBottom>
                    {game.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                    {game.description}
                  </Typography>
                  <Box sx={{ mt: 'auto', width: '100%' }}>
                    <Chip
                      label={game.difficulty === 'easy' ? 'Легко' : 'Средне'}
                      size="small"
                      sx={{
                        backgroundColor: `${game.color}20`,
                        color: game.color,
                        border: `1px solid ${game.color}40`,
                      }}
                    />
                    {!game.is_active && (
                      <Chip
                        label="Скоро"
                        size="small"
                        color="secondary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {games.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              🎮 Игры не найдены
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Попробуйте обновить страницу или проверьте подключение к серверу
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleRetry}
              sx={{ mt: 2 }}
            >
              Обновить
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;