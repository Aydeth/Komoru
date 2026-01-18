import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography
              component={Link}
              to="/"
              variant="h6"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}
            >
              🎮 Komoru
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography
                component={Link}
                to="/"
                sx={{
                  textDecoration: 'none',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                Игры
              </Typography>
              <Typography
                component={Link}
                to="/profile"
                sx={{
                  textDecoration: 'none',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                Профиль
              </Typography>
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
          display: 'flex',
          flexDirection: 'column'
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
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;