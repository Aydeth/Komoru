import React, { useState, useEffect } from 'react';
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
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (id && !showGame) {
      loadGameData(id);
    }
  }, [id, showGame]);

  const loadGameData = async (gameId: string) => {
    try {
      setLoading(true);
      
      // Загружаем информацию об игре
      const gameResponse = await apiService.getGame(gameId);
      if (gameResponse.success && gameResponse.data) {
        setGame(gameResponse.data);
        
        // Загружаем лидерборд
        const leaderboardResponse = await apiService.getLeaderboard(gameId);
        if (leaderboardResponse.success && leaderboardResponse.data) {
          setLeaderboard(leaderboardResponse.data);
        }
      } else {
        setError(gameResponse.error || 'Игра не найдена');
      }
    } catch (err) {
      setError('Ошибка при загрузке данных игры');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = () => {
    setShowGame(true);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const handleGameEnd = async (score: number, metadata?: Record<string, any>) => {
    try {
      console.log('Game ended with score:', score, 'metadata:', metadata);
      
      // Попробуем сохранить результат
      const response = await apiService.saveGameScore(id!, score, {
        ...metadata,
        timestamp: new Date().toISOString()
      });
      
      if (response.success) {
        setNotification({
          show: true,
          message: `🎉 Результат сохранен: ${score} очков!`,
          type: 'success'
        });
        
        // Обновляем лидерборд через 2 секунды
        setTimeout(() => {
          if (id) loadGameData(id);
        }, 2000);
      } else {
        setNotification({
          show: true,
          message: `Вы набрали ${score} очков! (результат пока не сохранен)`,
          type: 'warning'
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !game) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Назад к играм
        </Button>
        <Alert severity="error">
          {error || 'Игра не найдена'}
        </Alert>
      </Box>
    );
  }

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
      
      {/* Кнопка назад */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{ mb: 3 }}
      >
        Назад к играм
      </Button>

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
                  {leaderboard.map((entry, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="h6" color="text.secondary">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={entry.avatar_url || undefined}
                            sx={{ width: 32, height: 32, mr: 1 }}
                          >
                            {entry.username.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {entry.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Уровень {entry.level}
                            </Typography>
                          </Box>
                        </Box>
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
                  ))}
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
  );
};

export default GamePage;