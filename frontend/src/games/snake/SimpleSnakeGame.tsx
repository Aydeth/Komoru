import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Paper, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface SnakeGameProps {
  onBack?: () => void;
  onGameEnd?: (score: number, metadata?: Record<string, any>) => void;
}

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const INITIAL_SPEED = 150;

const SimpleSnakeGame: React.FC<SnakeGameProps> = ({ onBack, onGameEnd }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 });
  const [nextDirection, setNextDirection] = useState<Position>({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snake_high_score') || '0');
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [justAte, setJustAte] = useState(false);

  // Используем useRef для отслеживания последнего направления
  const directionRef = useRef(direction);

  // Генерация еды (только один раз при инициализации и после съедения)
  const generateFood = useCallback(() => {
    let newFood: Position;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT),
      };
      attempts++;
      if (attempts > 1000) break;
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    
    setFood(newFood);
    setJustAte(false); // Сбрасываем флаг съедения
  }, [snake]);

  // Инициализация
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snake_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Генерируем еду при старте и при рестарте
  useEffect(() => {
    if (!isPlaying && !gameOver) {
      generateFood();
    }
  }, [isPlaying, gameOver, generateFood]);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (directionRef.current.y === 0) {
            setNextDirection({ x: 0, y: -1 });
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (directionRef.current.y === 0) {
            setNextDirection({ x: 0, y: 1 });
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (directionRef.current.x === 0) {
            setNextDirection({ x: -1, y: 0 });
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (directionRef.current.x === 0) {
            setNextDirection({ x: 1, y: 0 });
            e.preventDefault();
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'r':
        case 'R':
          if (gameOver) {
            startGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Обновляем directionRef при изменении direction
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Игровой цикл
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        // Обновляем направление на основе nextDirection
        const newDirection = { ...nextDirection };
        setDirection(newDirection);
        
        const head = { ...prevSnake[0] };
        head.x += newDirection.x;
        head.y += newDirection.y;

        // Проверка столкновений
        if (
          head.x < 0 || head.x >= GRID_WIDTH ||
          head.y < 0 || head.y >= GRID_HEIGHT ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          setIsPlaying(false);
          if (onGameEnd) {
            onGameEnd(score, {
              playCount: 1,
              snakeLength: snake.length,
              speed: Math.round((300 - speed) / 300 * 100),
              highScore: score > highScore,
              gameVersion: '1.0.0'
            });
          }
          return prevSnake;
        }

        let newSnake = [head, ...prevSnake];
        let ateFood = false;

        // Проверка съедания еды
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          ateFood = true;
          setJustAte(true);
          
          if (newScore > highScore) {
            const updatedHighScore = newScore;
            setHighScore(updatedHighScore);
            localStorage.setItem('snake_high_score', updatedHighScore.toString());
          }
          
          // Генерируем новую еду
          setTimeout(() => {
            generateFood();
          }, 0);
        } else {
          // Удаляем хвост, если не съели еду
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, nextDirection, food, score, highScore, onGameEnd, speed, generateFood, snake]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    generateFood();
  };

  const increaseSpeed = () => {
    setSpeed(prev => Math.max(50, prev - 20));
  };

  const decreaseSpeed = () => {
    setSpeed(prev => Math.min(300, prev + 20));
  };

  // Функции для мобильного управления
  const moveUp = () => {
    if (directionRef.current.y === 0) {
      setNextDirection({ x: 0, y: -1 });
    }
  };

  const moveDown = () => {
    if (directionRef.current.y === 0) {
      setNextDirection({ x: 0, y: 1 });
    }
  };

  const moveLeft = () => {
    if (directionRef.current.x === 0) {
      setNextDirection({ x: -1, y: 0 });
    }
  };

  const moveRight = () => {
    if (directionRef.current.x === 0) {
      setNextDirection({ x: 1, y: 0 });
    }
  };

  // Цвета в пастельных тонах
  const colors = {
    background: '#FFFFFF',
    gridLine: '#E0E0E0',
    snakeHead: '#81C784', // Пастельный зеленый
    snakeBody: '#A5D6A7', // Более светлый пастельный зеленый
    food: '#EF9A9A', // Пастельный красный
    border: '#2E7D32',
    text: '#1B5E20',
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Панель управления */}
      {onBack && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 2 }}
        >
          Назад
        </Button>
      )}

      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#E8F5E9' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" color="primary" sx={{ color: colors.text }}>
              🐍 Змейка
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isPlaying ? 'Игра идёт...' : 'Нажмите "Начать игру"'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Счёт
              </Typography>
              <Typography variant="h5" sx={{ color: colors.text }}>
                {score}
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Рекорд
              </Typography>
              <Typography variant="h5" sx={{ color: '#FF9800' }}>
                {highScore}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Игровое поле */}
      <Paper elevation={1} sx={{ overflow: 'hidden', borderRadius: 2, mb: 2, border: `2px solid ${colors.border}` }}>
        <Box sx={{ 
          width: GRID_WIDTH * GRID_SIZE,
          height: GRID_HEIGHT * GRID_SIZE,
          margin: '0 auto',
          position: 'relative',
          backgroundColor: colors.background,
          // Сетка на фоне
          backgroundImage: `
            linear-gradient(${colors.gridLine} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.gridLine} 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}>
          {/* Змейка */}
          {snake.map((segment, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: segment.x * GRID_SIZE,
                top: segment.y * GRID_SIZE,
                width: GRID_SIZE - 2,
                height: GRID_SIZE - 2,
                backgroundColor: index === 0 ? colors.snakeHead : colors.snakeBody,
                border: `1px solid ${index === 0 ? '#4CAF50' : '#81C784'}`,
                borderRadius: index === 0 ? '6px' : '3px',
                boxShadow: index === 0 ? '0 0 4px rgba(76, 175, 80, 0.5)' : 'none',
                zIndex: 2,
              }}
            />
          ))}
          
          {/* Еда */}
          {!justAte && (
            <Box
              sx={{
                position: 'absolute',
                left: food.x * GRID_SIZE,
                top: food.y * GRID_SIZE,
                width: GRID_SIZE - 2,
                height: GRID_SIZE - 2,
                backgroundColor: colors.food,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                border: '1px solid #F44336',
                boxShadow: '0 0 6px rgba(239, 154, 154, 0.8)',
                zIndex: 3,
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.1)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              🍎
            </Box>
          )}

          {/* Оверлей при паузе/конце игры */}
          {!isPlaying && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.text,
                zIndex: 10,
              }}
            >
              {gameOver ? (
                <>
                  <Typography variant="h4" gutterBottom sx={{ color: '#D32F2F' }}>
                    🎮 Игра окончена!
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Ваш счёт: <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>{score}</span>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Рекорд: <span style={{ color: '#FF9800', fontWeight: 'bold' }}>{highScore}</span>
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={startGame}
                    sx={{ 
                      mt: 2,
                      bgcolor: '#4CAF50',
                      '&:hover': { bgcolor: '#388E3C' }
                    }}
                  >
                    Играть снова
                  </Button>
                </>
              ) : (
                <>
                  <Typography variant="h4" gutterBottom sx={{ color: colors.text }}>
                    🐍 Змейка
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', maxWidth: 300 }}>
                    Собирайте яблоки 🍎, чтобы расти. Избегайте стен и себя!
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={startGame}
                    sx={{ 
                      mt: 2,
                      bgcolor: '#4CAF50',
                      '&:hover': { bgcolor: '#388E3C' }
                    }}
                  >
                    🎮 Начать игру
                  </Button>
                  <Typography variant="caption" sx={{ mt: 2, color: 'grey.600' }}>
                    Нажмите ПРОБЕЛ для паузы во время игры
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Мобильное управление */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#F5F5F5', display: { xs: 'block', md: 'none' } }}>
        <Typography variant="subtitle2" gutterBottom align="center">
          📱 Мобильное управление
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {/* Вверх */}
          <IconButton
            onClick={moveUp}
            disabled={!isPlaying || gameOver}
            sx={{ 
              bgcolor: '#E8F5E9',
              '&:hover': { bgcolor: '#C8E6C9' },
              width: 60,
              height: 60,
            }}
          >
            <ArrowUpwardIcon />
          </IconButton>
          
          {/* Влево/Вправо */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton
              onClick={moveLeft}
              disabled={!isPlaying || gameOver}
              sx={{ 
                bgcolor: '#E8F5E9',
                '&:hover': { bgcolor: '#C8E6C9' },
                width: 60,
                height: 60,
            }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            
            <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                {isPlaying ? 'Игра' : 'Пауза'}
              </Typography>
            </Box>
            
            <IconButton
              onClick={moveRight}
              disabled={!isPlaying || gameOver}
              sx={{ 
                bgcolor: '#E8F5E9',
                '&:hover': { bgcolor: '#C8E6C9' },
                width: 60,
                height: 60,
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
          
          {/* Вниз */}
          <IconButton
            onClick={moveDown}
            disabled={!isPlaying || gameOver}
            sx={{ 
              bgcolor: '#E8F5E9',
              '&:hover': { bgcolor: '#C8E6C9' },
              width: 60,
              height: 60,
            }}
          >
            <ArrowDownwardIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Управление */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#F5F5F5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={gameOver}
              sx={{ 
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#388E3C' }
              }}
            >
              {isPlaying ? '⏸️ Пауза' : '▶️ Продолжить'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={startGame}
              sx={{ 
                borderColor: '#4CAF50',
                color: '#2E7D32',
                '&:hover': { borderColor: '#388E3C', bgcolor: '#E8F5E9' }
              }}
            >
              🔄 Заново
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Скорость:
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={decreaseSpeed}
              sx={{ minWidth: 40 }}
            >
              -
            </Button>
            <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
              {Math.round((300 - speed) / 300 * 100)}%
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={increaseSpeed}
              sx={{ minWidth: 40 }}
            >
              +
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Инструкция */}
      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${colors.gridLine}` }}>
        <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
          🎮 Как играть
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: colors.text }}>
              Управление
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><Typography variant="body2">← → ↑ ↓ - Движение (ПК)</Typography></li>
              <li><Typography variant="body2">Кнопки выше - Движение (мобильные)</Typography></li>
              <li><Typography variant="body2">ПРОБЕЛ - Пауза/Продолжить</Typography></li>
              <li><Typography variant="body2">R - Перезапуск после проигрыша</Typography></li>
            </ul>
          </Box>
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: colors.text }}>
              Правила
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><Typography variant="body2">🍎 = <strong>+10 очков</strong></Typography></li>
              <li><Typography variant="body2">Каждое 🍎 увеличивает змейку</Typography></li>
              <li><Typography variant="body2">Избегайте стен и себя</Typography></li>
              <li><Typography variant="body2">Рекорд сохраняется в браузере</Typography></li>
            </ul>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SimpleSnakeGame;