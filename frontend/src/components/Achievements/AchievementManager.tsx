import React, { useEffect } from 'react';
import { useAchievements } from '../../contexts/AchievementContext';
import { apiService } from '../../services/api';

interface AchievementManagerProps {
  children: React.ReactNode;
}

const AchievementManager: React.FC<AchievementManagerProps> = ({ children }) => {
  const { showAchievement } = useAchievements();

  useEffect(() => {
    // Устанавливаем callback в apiService
    apiService.setShowAchievementCallback((achievement) => {
      console.log('🎯 Callback достижения вызван из AchievementManager:', achievement);
      showAchievement(achievement);
    });

    return () => {
      // Очищаем callback
      apiService.setShowAchievementCallback(() => {});
    };
  }, [showAchievement]);

  return <>{children}</>;
};

export default AchievementManager;