import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Container,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Google, Login } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // После успешного входа редиректим откуда пришли или на главную
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: 'background.paper' }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
              bgcolor: 'primary.50',
              color: 'primary.main'
            }}
          >
            <Login fontSize="large" />
          </Avatar>
          
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            👋 Добро пожаловать в Komoru!
          </Typography>
          
          <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
            Войдите, чтобы сохранять прогресс, зарабатывать достижения и попадать в лидерборды.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Преимущества входа:
            </Typography>
            <Typography variant="body2">
              • 💾 Сохранение прогресса
              <br />
              • 🏆 Достижения и награды
              <br />
              • 📊 Личный профиль
              <br />
              • 🏅 Места в лидербордах
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Google />}
            sx={{
              mt: 2,
              py: 1.5,
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              minWidth: 240
            }}
          >
            {loading ? 'Вход...' : 'Войти через Google'}
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            Мы используем только ваш email и имя для создания профиля
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthPage;