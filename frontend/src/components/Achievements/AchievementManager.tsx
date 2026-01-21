import React, { useEffect } from 'react';
import { useAchievements } from '../../contexts/AchievementContext';
import { setAchievementCallback } from '../../services/api';

interface AchievementManagerProps {
  children: React.ReactNode;
}

const AchievementManager: React.FC<AchievementManagerProps> = ({ children }) => {
  const { showAchievement } = useAchievements();

  useEffect(() => {
    // Устанавливаем callback, который будет вызываться при получении достижения
    const callback = (achievement: any) => {
      console.log('🎯 Callback достижения вызван:', achievement);
      showAchievement(achievement);
    };
    
    setAchievementCallback(callback);

    return () => {
      // Используем пустую функцию для очистки
      setAchievementCallback(() => {});
    };
  }, [showAchievement]);

  return <>{children}</>;
};

export default AchievementManager;