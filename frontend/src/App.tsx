import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Контексты
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';

// Компоненты
import AchievementManager from './components/Achievements/AchievementManager';

// Страницы
import HomePage from './pages/Home/HomePage';
import GamePage from './pages/Game/GamePage';
import AuthPage from './pages/Auth/AuthPage';
import UserProfilePage from './pages/User/UserProfilePage';
import ProfileRedirect from './pages/Profile/ProfileRedirect';

// Компоненты
import Layout from './components/Layout/Layout';

// Компонент для защиты маршрута /auth
const ProtectedAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    // Если пользователь уже авторизован, перенаправляем на его профиль
    return <Navigate to={`/user/${user.id}`} replace />;
  }
  
  return <>{children}</>;
};

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AchievementProvider>
          <AchievementManager>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/game/:id" element={<GamePage />} />
                  <Route 
                    path="/auth" 
                    element={
                      <ProtectedAuthRoute>
                        <AuthPage />
                      </ProtectedAuthRoute>
                    } 
                  />
                  <Route path="/profile" element={<ProfileRedirect />} />
                  <Route path="/user/:userId" element={<UserProfilePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          </AchievementManager>
        </AchievementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;