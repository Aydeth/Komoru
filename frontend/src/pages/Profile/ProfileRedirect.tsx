import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProfileRedirect: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🔀 Перенаправление с /profile на профиль пользователя или /auth');
  }, []);

  if (user) {
    // Если пользователь авторизован, перенаправляем на его профиль
    return (
      <Navigate 
        to={`/user/${user.id}`} 
        replace 
        state={{ 
          noBackButton: true,
          from: location.pathname 
        }} 
      />
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
};

export default ProfileRedirect;