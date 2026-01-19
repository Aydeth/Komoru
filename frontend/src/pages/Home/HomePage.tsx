import React, { useState, useEffect, useCallback } from 'react';
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
  Fade,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiService, Game } from '../../services/api';

const HomePage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  // Максимальное количество попыток
  const MAX_RETRIES = 5;
  // Задержка между попытками (с экспоненциальной задержкой)
  const RETRY_DELAY = 1000 * Math.min(retryCount + 1, 3);

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(false);
      
      console.log(`🔄 Загрузка игр (попытка ${retryCount + 1}/${MAX_RETRIES})...`);
      const response = await apiService.getGames();
      console.log('📦 Ответ от API:', response);
      
      if (response.success && response.data) {
        setGames(response.data);
        setRetryCount(0); // Сбрасываем счетчик при успехе
        console.log(`✅ Загружено ${response.data.length} игр`);
      } else {
        throw new Error(response.error || 'Не удалось загрузить игры');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке игр';
      setError(errorMessage);
      console.error(`❌ Ошибка загрузки (попытка ${retryCount + 1}):`, err);
      
      // Если есть еще попытки - планируем повтор
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`⏱️  Повтор через ${RETRY_DELAY}мс...`);
        setIsRetrying(true);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Автоматический повтор при ошибке
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (error && retryCount < MAX_RETRIES - 1 && !loading) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadGames();
      }, RETRY_DELAY);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [error, retryCount, loading, loadGames]);

  // Первоначальная загрузка
  useEffect(() => {
    loadGames();
  }, []);

  const handleRetry = () => {
    setRetryCount(0);
    loadGames();
  };

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  // Показываем загрузку во время первой попытки или повторных попыток
  if (loading && games.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          gap: 3
        }}>
          <CircularProgress size={60} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Загружаем игры...
            </Typography>
            {isRetrying && (
              <Typography variant="body2" color="text.secondary">
                Попытка {retryCount + 2} из {MAX_RETRIES}...
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {error && retryCount >= MAX_RETRIES - 1 && (
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Повторить
              </Button>
            }
            sx={{ mb: 4 }}
          >
            <Typography fontWeight={600}>Не удалось загрузить игры</Typography>
            <Typography variant="body2" mt={0.5}>
              {error} (попыток: {MAX_RETRIES})
            </Typography>
          </Alert>
        )}
        
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

        <Fade in={games.length > 0}>
          <Box>
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
                          label={game.difficulty === 'easy' ? 'Легко' : game.difficulty === 'medium' ? 'Средне' : 'Сложно'}
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
          </Box>
        </Fade>

        {games.length === 0 && !loading && error && retryCount >= MAX_RETRIES - 1 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              🎮 Не удалось загрузить игры
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
        )}
      </Box>
    </Container>
  );
};

export default HomePage;