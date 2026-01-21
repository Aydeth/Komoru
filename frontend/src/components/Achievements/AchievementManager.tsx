// components/Achievements/AchievementManager.tsx
import React, { useEffect } from 'react';
import { useAchievements } from '../../contexts/AchievementContext';
import { apiService } from '../../services/api';

interface AchievementManagerProps {
  children: React.ReactNode;
}

const AchievementManager: React.FC<AchievementManagerProps> = ({ children }) => {
  const { showAchievement } = useAchievements();

  useEffect(() => {
    console.log('🔗 AchievementManager: Регистрируем callback в apiService');
    
    // Регистрируем callback в apiService
    const unregister = apiService.registerAchievementCallback((achievement) => {
      console.log('🎯 Callback из apiService вызван, показываем достижение:', achievement);
      showAchievement(achievement);
    });

    // Очистка при размонтировании
    return () => {
      console.log('🔗 AchievementManager: Удаляем callback');
      unregister();
    };
  }, [showAchievement]);

  return <>{children}</>;
};

export default AchievementManager;