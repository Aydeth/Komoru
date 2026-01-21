import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, Button, Box } from '@mui/material';

// Контексты
import { AuthProvider } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';

// Компоненты
import { useAchievements } from './contexts/AchievementContext'; // ДЛЯ ТЕСТА

// Страницы
import HomePage from './pages/Home/HomePage';
import GamePage from './pages/Game/GamePage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserProfilePage from './pages/User/UserProfilePage';

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
  const { showAchievement } = useAchievements();
  const [spamCount, setSpamCount] = React.useState(0);
  
  const spamAchievements = () => {
    const achievements = [
      { id: 1, title: 'Первая игра', icon: '🎮', xp_reward: 50, description: 'Начало пути!' },
      { id: 2, title: 'Мастер змейки', icon: '🐍', xp_reward: 200, description: '1000 очков в змейке' },
      { id: 3, title: 'Головоломщик', icon: '🧩', xp_reward: 150, description: 'Собрал пятнашки' },
      { id: 4, title: 'Память гения', icon: '🧠', xp_reward: 200, description: 'Все пары за 60 секунд' },
      { id: 5, title: 'Коллекционер', icon: '🏆', xp_reward: 300, description: '5 достижений' },
      { id: 6, title: 'Богач', icon: '💎', xp_reward: 250, description: '500 кристаллов' },
      { id: 7, title: 'Активный игрок', icon: '🎯', xp_reward: 250, description: '20 игр' },
      { id: 8, title: 'Новичок', icon: '🥉', xp_reward: 200, description: '5 уровень' },
      { id: 9, title: 'Опытный', icon: '🥈', xp_reward: 400, description: '10 уровень' },
      { id: 10, title: 'Мастер', icon: '🥇', xp_reward: 600, description: '15 уровень' },
    ];
    
    // Спамим 3 случайных достижения
    const randomIndices = new Set<number>();
    while (randomIndices.size < 3) {
      randomIndices.add(Math.floor(Math.random() * achievements.length));
    }
    
    Array.from(randomIndices).forEach(index => {
      setTimeout(() => {
        showAchievement(achievements[index]);
      }, Math.random() * 300); // Немного разносим по времени
    });
    
    setSpamCount(prev => prev + 3);
  };
  
  return (
    <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 9998 }}>
      <Button
        variant="contained"
        color="warning"
        onClick={spamAchievements}
        sx={{ mb: 1 }}
      >
        🧪 Спам достижениями ({spamCount})
      </Button>
      <Box sx={{ fontSize: '12px', color: 'text.secondary', mt: 0.5 }}>
        Клик - 3 случайных достижения
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
          {/* Тестовая кнопка для спама */}
          <TestSpamButton />
        </AchievementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;