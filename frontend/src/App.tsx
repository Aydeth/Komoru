import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Страницы
import HomePage from './pages/Home/HomePage';
//import GamePage from './pages/Game/GamePage';
//import ProfilePage from './pages/Profile/ProfilePage';

// Компоненты
import Layout from './components/Layout/Layout';

// Тема для минималистичного дизайна
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Зеленый как у змейки
    },
    secondary: {
      main: '#1565C0', // Синий как у пятнашек
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
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;