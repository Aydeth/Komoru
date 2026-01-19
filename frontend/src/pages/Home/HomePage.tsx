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
      const response = await apiService.getGames();
      
      if (response.success && response.data) {
        setGames(response.data);
      } else {
        setError(response.error || 'Не удалось загрузить игры');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке игр';
      setError(errorMessage);
      console.error('Load games error:', err);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Повторить
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        🎮 Уютный игровой уголок
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Выберите игру, чтобы расслабиться и отдохнуть. Минимализм и спокойствие — наш стиль.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
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
            }}
          >
            <CardActionArea
              onClick={() => handleGameClick(game.id)}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ mb: 2, fontSize: '3rem' }}>
                  {game.icon}
                </Typography>
                <Typography variant="h6" component="div" gutterBottom>
                  {game.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {game.description}
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Chip
                    label={game.difficulty === 'easy' ? 'Легко' : 'Средне'}
                    size="small"
                    sx={{
                      backgroundColor: `${game.color}20`,
                      color: game.color,
                      border: `1px solid ${game.color}40`,
                    }}
                  />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default HomePage;