import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Button, Box } from '@mui/material';

// Контексты
import { AuthProvider } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';

// Страницы
import HomePage from './pages/Home/HomePage';
import GamePage from './pages/Game/GamePage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserProfilePage from './pages/User/UserProfilePage';

import AchievementTestButton from './components/Debug/AchievementTestButton';

// Компоненты
import Layout from './components/Layout/Layout';

// Тема
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#1565C0',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

// Тестовый компонент для спама достижениями
const TestSpamButton: React.FC = () => {
  const [showButton, setShowButton] = React.useState(true);
  const [counter, setCounter] = React.useState(0);
  
  // Динамический импорт для избежания циклических зависимостей
  const showTestAchievement = React.useCallback(() => {
    // Импортируем динамически
    import('./contexts/AchievementContext').then(module => {
      // В реальном приложении нужно получить контекст иначе
      // Для теста создаем мок
      console.log('🧪 Тест: показать достижение');
      
      // Создаем тестовые достижения
      const testAchievements = [
        { id: Date.now() + 1, title: 'Первая игра', icon: '🎮', xp_reward: 50, description: 'Начало пути!' },
        { id: Date.now() + 2, title: 'Мастер змейки', icon: '🐍', xp_reward: 200, description: '1000 очков в змейке' },
        { id: Date.now() + 3, title: 'Головоломщик', icon: '🧩', xp_reward: 150, description: 'Собрал пятнашки' },
      ];
      
      // Находим глобальный контекст (костыль для теста)
      const event = new CustomEvent('show-test-achievement', { 
        detail: testAchievements[Math.floor(Math.random() * testAchievements.length)] 
      });
      window.dispatchEvent(event);
    });
  }, []);

  // Слушаем события для теста
  React.useEffect(() => {
    const handleTestAchievement = (event: any) => {
      console.log('🎯 Получено тестовое событие:', event.detail);
      setCounter(prev => prev + 1);
    };
    
    window.addEventListener('show-test-achievement', handleTestAchievement);
    
    return () => {
      window.removeEventListener('show-test-achievement', handleTestAchievement);
    };
  }, []);

  // Скрываем кнопку в продакшене
  if (!showButton || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9997 }}>
      <Button
        variant="contained"
        color="warning"
        onClick={showTestAchievement}
        sx={{ mb: 1 }}
      >
        🧪 Тест попапа ({counter})
      </Button>
      <Box sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
        Клик - случайное достижение
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AchievementProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game/:id" element={<GamePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/user/:userId" element={<UserProfilePage />} />
              </Routes>
            </Layout>
          </Router>
          <AchievementTestButton />
        </AchievementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;