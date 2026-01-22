import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProfileRedirect: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('🔀 Перенаправление с /profile на профиль пользователя');
  }, []);

  if (!user) {
    // Если пользователь не авторизован, перенаправляем на /profile (текущая страница)
    // чтобы показать страницу входа
    return null; // Или <Navigate to="/profile" state={{ noBackButton: true }} />;
  }

  // Перенаправляем на профиль пользователя с флагом, чтобы не показывать кнопку "Назад"
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
};

export default ProfileRedirect;