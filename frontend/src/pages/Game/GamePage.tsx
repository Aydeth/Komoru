import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Fade,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { apiService, Game, LeaderboardEntry } from '../../services/api';
import SimpleSnakeGame from '../../games/snake/SimpleSnakeGame';
import MemoryGame from '../../games/memory/MemoryGame';
import Notification from '../../components/UI/Notification';

const GamePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<Game | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000 * Math.min(retryCount + 1, 3);

  const loadGameData = useCallback(async (gameId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Загрузка данных игры ${gameId} (попытка ${retryCount + 1}/${MAX_RETRIES})...`);
      
      // Загружаем информацию об игре
      const gameResponse = await apiService.getGame(gameId);
      if (gameResponse.success && gameResponse.data) {
        setGame(gameResponse.data);
        
        // Загружаем лидерборд
        const leaderboardResponse = await apiService.getLeaderboard(gameId);
        if (leaderboardResponse.success && leaderboardResponse.data) {
          setLeaderboard(leaderboardResponse.data);
        }
        
        setRetryCount(0); // Сбрасываем счетчик при успехе
        console.log(`✅ Данные игры ${gameId} загружены`);
        console.log('📊 Данные лидерборда RAW:', leaderboardResponse);
      } else {
        throw new Error(gameResponse.error || 'Игра не найдена');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при загрузке данных игры';
      setError(errorMessage);
      console.error(`❌ Ошибка загрузки данных игры (попытка ${retryCount + 1}):`, err);
      
      // Если есть еще попытки - планируем повтор
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`⏱️  Повтор через ${RETRY_DELAY}мс...`);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Автоматический повтор при ошибке
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (error && retryCount < MAX_RETRIES - 1 && !loading && id && !showGame) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        loadGameData(id);
      }, RETRY_DELAY);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [error, retryCount, loading, id, showGame, loadGameData]);

  // Загрузка данных при изменении ID
  useEffect(() => {
    if (id && !showGame) {
      setRetryCount(0); // Сбрасываем счетчик при смене игры
      loadGameData(id);
    }
  }, [id, showGame, loadGameData]);

  const handlePlayClick = () => {
    setShowGame(true);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleGameEnd = async (score: number, metadata?: Record<string, any>) => {
  try {
    if (!id) return;
    
    // Получаем длительность сессии из metadata (приходит из игр)
    const sessionDuration = metadata?.session_duration || 0;
    
    // Пробуем сохранить результат
    const response = await apiService.saveGameScore(id, score, {
      ...metadata,
      session_duration: sessionDuration, // ← ДОБАВЛЯЕМ ЭТО
      timestamp: new Date().toISOString(),
      gameVersion: '1.0.0'
    });
    
    if (response.success) {
      setNotification({
        show: true,
        message: `🎉 Результат сохранен: ${score} очков!`,
        type: 'success'
      });
      
      // Обновляем лидерборд с задержкой
      setTimeout(() => {
        if (id) {
          loadGameData(id);
        }
      }, 1000);
    } else if (response.error?.includes('Требуется авторизация')) {
      setNotification({
        show: true,
        message: `Вы набрали ${score} очков! Войдите, чтобы сохранить результат.`,
        type: 'warning'
      });
    } else {
      setNotification({
        show: true,
        message: `Вы набрали ${score} очков!`,
        type: 'info'
      });
    }
  } catch (error) {
    console.error('Error saving game result:', error);
    setNotification({
      show: true,
      message: `Вы набрали ${score} очков!`,
      type: 'info'
    });
  }
};

  const handleRetry = () => {
    setRetryCount(0);
    if (id) {
      loadGameData(id);
    }
  };

  // Если играем в змейку
  if (showGame && id === 'snake') {
    return (
      <Box>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={5000}
            onClose={() => setNotification(prev => ({ ...prev, show: false }))}
          />
        )}
        <SimpleSnakeGame 
          onBack={() => setShowGame(false)}
          onGameEnd={handleGameEnd}
        />
      </Box>
    );
  }

  if (showGame && id === 'memory') {
    return (
      <Box>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={5000}
            onClose={() => setNotification(prev => ({ ...prev, show: false }))}
          />
        )}
        <MemoryGame 
          onBack={() => setShowGame(false)}
          onGameEnd={handleGameEnd}
        />
      </Box>
    );
  }

  if (loading && !game) {
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
              Загружаем данные игры...
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

  if (error || !game) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackClick}
            sx={{ mb: 3 }}
          >
            Назад к играм
          </Button>
          
          {retryCount < MAX_RETRIES - 1 ? (
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
          ) : (
            <Alert 
              severity="error" 
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Повторить
                </Button>
              }
              sx={{ mb: 4 }}
            >
              <Typography fontWeight={600}>Не удалось загрузить игру</Typography>
              <Typography variant="body2" mt={0.5}>
                {error || 'Игра не найдена'} (попыток: {MAX_RETRIES})
              </Typography>
            </Alert>
          )}
          
          {retryCount >= MAX_RETRIES - 1 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                🎮 Не удалось загрузить игру
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
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {notification.show && (
          <Notification
            message={notification.message}
            type={notification.type}
            duration={5000}
            onClose={() => setNotification(prev => ({ ...prev, show: false }))}
          />
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
        
        {/* Кнопка назад */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 3 }}
        >
          Назад к играм
        </Button>

        <Fade in={!!game}>
          <Box>
            {/* Заголовок игры */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: `${game.color}10` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h1" sx={{ mr: 2, fontSize: '3rem' }}>
                  {game.icon}
                </Typography>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    {game.title}
                  </Typography>
                  <Chip
                    label={game.difficulty === 'easy' ? 'Легко' : 'Средне'}
                    size="small"
                    sx={{
                      backgroundColor: `${game.color}30`,
                      color: game.color,
                    }}
                  />
                </Box>
              </Box>
              
              <Typography variant="body1" paragraph>
                {game.description}
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                onClick={handlePlayClick}
                sx={{
                  mt: 2,
                  bgcolor: game.color,
                  '&:hover': { bgcolor: game.color, opacity: 0.9 },
                }}
              >
                🎮 Играть
              </Button>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { md: '2fr 1fr' }, gap: 4 }}>
              {/* Левая колонка - Лидерборд */}
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  🏆 Лидерборд
                </Typography>
                
                {leaderboard.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Игрок</TableCell>
                          <TableCell align="right">Счёт</TableCell>
                          <TableCell>Дата</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaderboard.map((entry, index) => {
                          const userId = entry.user_id || 
                                        entry.username?.replace(/\s+/g, '_').toLowerCase() || 
                                        `player_${index + 1}`;
                          
                          const displayName = entry.username || `Игрок ${index + 1}`;
                          
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                <Typography variant="h6" color="text.secondary">
                                  {index + 1}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => {
                                    if (entry.user_id) {
                                      navigate(`/user/${entry.user_id}`);
                                    } else {
                                      // Fallback на случай, если что-то пошло не так
                                      navigate(`/user/unknown_${index}`);
                                    }
                                  }}
                                  sx={{
                                    textTransform: 'none',
                                    color: 'inherit',
                                    justifyContent: 'flex-start',
                                    padding: 0,
                                    minWidth: 0,
                                    '&:hover': {
                                      backgroundColor: 'transparent',
                                      opacity: 0.8
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar
                                      src={entry.avatar_url || undefined}
                                      sx={{ 
                                        width: 32, 
                                        height: 32, 
                                        mr: 1,
                                        bgcolor: entry.avatar_url ? 'transparent' : 'primary.main'
                                      }}
                                    >
                                      {entry.username.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {entry.username}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Уровень {entry.level}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Button>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="h6" color="primary">
                                  {entry.score.toLocaleString()}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(entry.created_at).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Пока нет результатов. Будьте первым!
                    </Typography>
                  </Paper>
                )}
              </Box>

              {/* Правая колонка - Информация */}
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                  ℹ️ Информация
                </Typography>
                
                <Card elevation={0} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Управление
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {game.id === 'snake' && 'Используйте стрелки для управления змейкой'}
                      {game.id === 'puzzle15' && 'Перетаскивайте плитки мышкой или используйте стрелки'}
                      {game.id === 'memory' && 'Кликайте по карточкам, чтобы найти пары'}
                      {game.id === 'arkanoid' && 'Двигайте платформу мышкой или стрелками'}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Награды
                    </Typography>
                    <Typography variant="body2">
                      • 💎 +10 кристаллов за каждую игру
                      <br />
                      • 🏆 Достижения за высокие результаты
                      <br />
                      • 📈 Опыт для повышения уровня
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Container>
  );
};

export default GamePage;