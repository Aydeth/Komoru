import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Контексты
import { AuthProvider } from './contexts/AuthContext';
import { AchievementProvider } from './contexts/AchievementContext';

// Компоненты
import AchievementManager from './components/Achievements/AchievementManager';
import DebugPanel from './components/Debug/DebugPanel'; // ДОБАВИТЬ

// Страницы
import HomePage from './pages/Home/HomePage';
import GamePage from './pages/Game/GamePage';
import ProfilePage from './pages/Profile/ProfilePage';
import UserProfilePage from './pages/User/UserProfilePage';

// Компоненты
import Layout from './components/Layout/Layout';

import SimpleTestPopup from './components/Debug/SimpleTestPopup';

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
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/user/:userId" element={<UserProfilePage />} />
                </Routes>
              </Layout>
            </Router>
            <>
              <DebugPanel />
              <SimpleTestPopup />
            </>
          </AchievementManager>
        </AchievementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;