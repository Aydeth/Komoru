import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Alert,
  Container,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface MemoryGameProps {
  onBack?: () => void;
  onGameEnd?: (score: number, metadata?: Record<string, any>) => void;
}

interface CardType {
  id: number;
  value: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
  '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦄', '🐴', '🦋', '🐌', '🐞',
  '🐜', '🦂', '🦀', '🐙', '🦑', '🐋', '🐬', '🐟', '🐠', '🐡', '🦈', '🐊'
];

const GRID_SIZES = [
  { rows: 4, cols: 4, totalCards: 16, pairs: 8, difficulty: 'легко' },
  { rows: 6, cols: 6, totalCards: 36, pairs: 18, difficulty: 'средне' },
  { rows: 8, cols: 8, totalCards: 64, pairs: 32, difficulty: 'сложно' }
];

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, onGameEnd }) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameEndCalled, setGameEndCalled] = useState(false);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [difficulty, setDifficulty] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const scores = JSON.parse(localStorage.getItem('memory_high_scores') || '{"easy": 0, "medium": 0, "hard": 0}');
    return scores;
  });

  // Инициализация игры
  const initializeGame = useCallback(() => {
    const gridSize = GRID_SIZES[difficulty];
    const pairs = gridSize.pairs;
    
    // Выбираем уникальные эмодзи для игры
    const shuffledEmojis = [...EMOJIS].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, pairs);
    
    // Создаем пары карточек
    const gameCards: CardType[] = [];
    let cardId = 0;
    
    // Создаем пары
    for (let i = 0; i < 2; i++) {
      selectedEmojis.forEach(emoji => {
        gameCards.push({
          id: cardId++,
          value: emoji,
          icon: emoji,
          isFlipped: false,
          isMatched: false,
        });
      });
    }
    
    // Перемешиваем карточки
    const shuffledCards = [...gameCards].sort(() => Math.random() - 0.5);
    
    setCards(shuffledCards);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setGameOver(false);
    setGameEndCalled(false);
    setTime(0);
    setTimerActive(false);
  }, [difficulty]);

  // Инициализация при загрузке и изменении сложности
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && !gameOver) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameOver]);

  // Проверка конца игры (с защитой от повторного вызова)
  useEffect(() => {
    const totalPairs = GRID_SIZES[difficulty].pairs;
    
    // Проверяем, что игра завершена, но ещё не вызывали onGameEnd
    if (matches === totalPairs && gameStarted && !gameOver && !gameEndCalled) {
      console.log('🎮 Игра Memory завершена! Вызываем onGameEnd...');
      
      setGameOver(true);
      setTimerActive(false);
      setGameEndCalled(true); // Защита от повторного вызова
      
      // Расчет очков
      const score = calculateScore();
      
      // Обновление рекорда
      const difficultyKey = ['easy', 'medium', 'hard'][difficulty] as keyof typeof highScore;
      if (score > highScore[difficultyKey]) {
        const newHighScores = { ...highScore, [difficultyKey]: score };
        setHighScore(newHighScores);
        localStorage.setItem('memory_high_scores', JSON.stringify(newHighScores));
      }
      
      if (onGameEnd) {
        onGameEnd(score, {
          difficulty: difficultyKey,
          time,
          moves,
          accuracy: moves > 0 ? ((matches * 2) / moves) * 100 : 0,
          gameVersion: '1.1.0',
          session_duration: time
        });
      }
    }
  }, [matches, gameStarted, gameOver, gameEndCalled, difficulty, time, moves, highScore, onGameEnd]);

  const calculateScore = () => {
    const baseScore = 1000;
    const timeBonus = Math.max(0, 500 - time * 10);
    const movesBonus = Math.max(0, 500 - moves * 5);
    const difficultyMultiplier = [1, 1.5, 2][difficulty];
    
    return Math.round((baseScore + timeBonus + movesBonus) * difficultyMultiplier);
  };

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
      setTimerActive(true);
    }

    // Проверяем условия для клика
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || selectedCards.length >= 2 || gameOver) {
      return;
    }

    // Переворачиваем карту
    const newCards = cards.map(card => 
      card.id === cardId ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);
    
    // Добавляем карту в выбранные
    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    // Если выбрано 2 карты
    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard?.value === secondCard?.value) {
        // Карты совпали
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          ));
          setMatches(prev => prev + 1);
          setSelectedCards([]);
        }, 500);
      } else {
        // Карты не совпали
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === firstId || card.id === secondId 
              ? { ...card, isFlipped: false }
              : card
          ));
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setTimerActive(true);
  };

  const pauseGame = () => {
    setTimerActive(false);
  };

  const resumeGame = () => {
    setTimerActive(true);
  };

  const restartGame = () => {
    initializeGame();
    setGameEndCalled(false);
  };

  const changeDifficulty = (newDifficulty: number) => {
    setDifficulty(newDifficulty);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentGrid = GRID_SIZES[difficulty];
  const difficultyKey = ['easy', 'medium', 'hard'][difficulty];
  const score = calculateScore();
  const accuracy = moves > 0 ? ((matches * 2) / moves) * 100 : 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Панель управления */}
        {onBack && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 3 }}
          >
            Назад
          </Button>
        )}

        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#E3F2FD', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ color: '#1565C0', fontWeight: 600 }}>
                🧠 Игра на память
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Найдите все пары одинаковых карточек
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">
                  Сложность
                </Typography>
                <Typography variant="h6" sx={{ color: '#1565C0' }}>
                  {currentGrid.difficulty}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">
                  Время
                </Typography>
                <Typography variant="h6" sx={{ color: '#1565C0', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimerIcon fontSize="small" />
                  {formatTime(time)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text.secondary">
                  Ходы
                </Typography>
                <Typography variant="h6" sx={{ color: '#1565C0' }}>
                  {moves}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="caption" color="text-secondary">
                  Рекорд
                </Typography>
                <Typography variant="h6" sx={{ color: '#FF9800' }}>
                  {highScore[difficultyKey].toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Прогресс */}
        {gameStarted && !gameOver && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#F5F5F5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Прогресс: {matches} / {currentGrid.pairs} пар
              </Typography>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(matches / currentGrid.pairs) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="primary">
                {Math.round((matches / currentGrid.pairs) * 100)}%
              </Typography>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Точность: {accuracy.toFixed(1)}% • Предполагаемый счёт: {score.toLocaleString()}
            </Typography>
          </Paper>
        )}

        {/* Игровое поле */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#FAFAFA' }}>
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: `repeat(${currentGrid.cols}, 1fr)`,
            gap: 2,
            justifyContent: 'center',
            maxWidth: currentGrid.cols * 80,
            mx: 'auto'
          }}>
            {cards.map((card) => (
              <Box key={card.id}>
                <Card
                  sx={{
                    width: 70,
                    height: 90,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.5s',
                    transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    cursor: card.isMatched ? 'default' : 'pointer',
                    opacity: card.isMatched ? 0.7 : 1,
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCardClick(card.id)}
                    disabled={card.isMatched || gameOver}
                    sx={{ height: '100%' }}
                  >
                    {/* Задняя сторона карты */}
                    {!card.isFlipped && (
                      <CardContent
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#1565C0',
                          background: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4" sx={{ color: 'white', opacity: 0.9 }}>
                          ?
                        </Typography>
                      </CardContent>
                    )}
                    
                    {/* Передняя сторона карты */}
                    {card.isFlipped && (
                      <CardContent
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: card.isMatched ? '#C8E6C9' : 'white',
                          border: `2px solid ${card.isMatched ? '#4CAF50' : '#E0E0E0'}`,
                          borderRadius: 1,
                          transform: 'rotateY(180deg)',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <Typography variant="h3">
                          {card.icon}
                        </Typography>
                      </CardContent>
                    )}
                  </CardActionArea>
                </Card>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Управление сложностью */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#FFF3E0', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#EF6C00' }}>
            🎯 Сложность
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {GRID_SIZES.map((grid, index) => (
              <Button
                key={index}
                variant={difficulty === index ? "contained" : "outlined"}
                onClick={() => changeDifficulty(index)}
                disabled={gameStarted && !gameOver}
                sx={{
                  borderRadius: 2,
                  bgcolor: difficulty === index ? '#FF9800' : 'transparent',
                  color: difficulty === index ? 'white' : '#EF6C00',
                  borderColor: '#FF9800',
                  '&:hover': {
                    bgcolor: difficulty === index ? '#F57C00' : '#FFECB3',
                  }
                }}
              >
                {grid.difficulty} ({grid.rows}x{grid.cols})
              </Button>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {currentGrid.pairs} пар • {currentGrid.totalCards} карточек • Сложность влияет на количество очков
          </Typography>
        </Paper>

        {/* Управление игрой */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#F5F5F5', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {!gameStarted ? (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={startGame}
                sx={{
                  bgcolor: '#4CAF50',
                  '&:hover': { bgcolor: '#388E3C' },
                  px: 4
                }}
              >
                Начать игру
              </Button>
            ) : !gameOver ? (
              <>
                <Button
                  variant="contained"
                  startIcon={timerActive ? <PauseIcon /> : <PlayArrowIcon />}
                  onClick={timerActive ? pauseGame : resumeGame}
                  sx={{
                    bgcolor: '#2196F3',
                    '&:hover': { bgcolor: '#1976D2' }
                  }}
                >
                  {timerActive ? 'Пауза' : 'Продолжить'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RestartAltIcon />}
                  onClick={restartGame}
                  sx={{
                    borderColor: '#FF9800',
                    color: '#FF9800',
                    '&:hover': { borderColor: '#F57C00', bgcolor: '#FFF3E0' }
                  }}
                >
                  Заново
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<EmojiEventsIcon />}
                  onClick={restartGame}
                  sx={{
                    bgcolor: '#FF9800',
                    '&:hover': { bgcolor: '#F57C00' },
                    px: 4
                }}
                >
                  Играть снова
                </Button>
              </>
            )}
          </Box>
        </Paper>

        {/* Результаты игры */}
        {gameOver && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#E8F5E9', borderRadius: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 1 }}>
              🏆 Игра завершена!
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 2,
              mt: 2 
            }}>
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Счёт
                </Typography>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                  {score.toLocaleString()}
                </Typography>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Время
                </Typography>
                <Typography variant="h5" sx={{ color: '#1565C0' }}>
                  {formatTime(time)}
                </Typography>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Ходы
                </Typography>
                <Typography variant="h5" sx={{ color: '#1565C0' }}>
                  {moves}
                </Typography>
              </Paper>
              
              <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Точность
                </Typography>
                <Typography variant="h5" sx={{ color: '#4CAF50' }}>
                  {accuracy.toFixed(1)}%
                </Typography>
              </Paper>
            </Box>
            
            <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
              {score > highScore[difficultyKey] ? (
                <Typography>
                  <strong>🎉 Новый рекорд!</strong> Поздравляем с лучшим результатом!
                </Typography>
              ) : (
                <Typography>
                  Отличная игра! Ваш лучший результат: {highScore[difficultyKey].toLocaleString()} очков.
                </Typography>
              )}
            </Alert>
          </Paper>
        )}

        {/* Инструкция */}
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #E0E0E0', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#1565C0' }}>
            🎮 Как играть
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3 
          }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#1565C0' }}>
                Правила
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><Typography variant="body2">Найдите все пары одинаковых карточек</Typography></li>
                <li><Typography variant="body2">Нажмите на карточку, чтобы перевернуть её</Typography></li>
                <li><Typography variant="body2">За один ход можно открыть только 2 карточки</Typography></li>
                <li><Typography variant="body2">Совпавшие карточки остаются открытыми</Typography></li>
                <li><Typography variant="body2">Игра завершается, когда найдены все пары</Typography></li>
              </ul>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#1565C0' }}>
                Подсказки
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li><Typography variant="body2">Меньше ходов = больше очков</Typography></li>
                <li><Typography variant="body2">Меньше времени = больше очков</Typography></li>
                <li><Typography variant="body2">Высокая сложность = множитель очков</Typography></li>
                <li><Typography variant="body2">Рекорды сохраняются отдельно для каждой сложности</Typography></li>
                <li><Typography variant="body2">На сложном уровне нужно найти 32 пары в сетке 8x8</Typography></li>
              </ul>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default MemoryGame;