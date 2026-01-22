import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
  handleMenuClose();
  
  if (user) {
    // Переходим на профиль пользователя с флагом noBackButton
    navigate(`/user/${user.id}`, { 
      state: { noBackButton: true },
      replace: false // Не заменяем историю, чтобы можно было вернуться
    });
  }
};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Шапка */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
            {/* Логотип */}
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span style={{ fontSize: '1.5em' }}>🎮</span>
              Komoru
            </Typography>
            
            {/* Навигация */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              <Typography
                component={Link}
                to="/"
                sx={{
                  textDecoration: 'none',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                Игры
              </Typography>
              
              {user ? (
                <>
                  {/* Аватар пользователя */}
                  <IconButton
                    onClick={handleMenuOpen}
                    sx={{ 
                      p: 0.5,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <Avatar
                      src={user.avatar}
                      sx={{ 
                        width: 36, 
                        height: 36,
                        border: '2px solid',
                        borderColor: 'primary.light'
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                  
                  {/* Меню пользователя */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1.5,
                        minWidth: 180,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <MenuItem disabled sx={{ opacity: 0.7, py: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </MenuItem>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <MenuItem onClick={handleProfileClick}>
                      <AccountCircleIcon sx={{ mr: 1.5, fontSize: 20 }} />
                      <Typography variant="body2">Профиль</Typography>
                    </MenuItem>
                    
                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                      <ExitToAppIcon sx={{ mr: 1.5, fontSize: 20 }} />
                      <Typography variant="body2">Выйти</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/profile"
                  variant="outlined"
                  size="small"
                  startIcon={<LoginIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  Войти
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Основное содержимое */}
      <Container 
        component="main" 
        maxWidth="lg" 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          px: { xs: 2, sm: 3 }
        }}
      >
        {children}
      </Container>

      {/* Подвал */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Komoru — уютный уголок для мини-игр
          </Typography>
          {!user && (
            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 0.5 }}>
              Войдите, чтобы сохранять прогресс и попадать в лидерборды
            </Typography>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;