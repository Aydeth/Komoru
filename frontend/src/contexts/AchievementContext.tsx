import React, { createContext, useContext, useState, ReactNode } from 'react';
import AchievementPopup from '../components/Achievements/AchievementPopup';
import { setAchievementCallback } from '../services/api'; // Добавь импорт

interface Achievement {
  id: number;
  title: string;
  icon: string;
  xp_reward: number;
  description?: string;
  achievement_type?: string;
}

interface AchievementContextType {
  showAchievement: (achievement: Achievement) => void;
  clearAchievements: () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider');
  }
  return context;
};

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

  const showAchievement = (achievement: Achievement) => {
    // Добавляем в очередь
    setAchievements(prev => [...prev, achievement]);
    
    // Если нет текущего показанного - показываем сразу
    if (!currentAchievement) {
      showNextAchievement();
    }
  };

  const showNextAchievement = () => {
    if (achievements.length > 0) {
      const [next, ...rest] = achievements;
      setCurrentAchievement(next);
      setAchievements(rest);
    } else {
      setCurrentAchievement(null);
    }
  };

  const handleClose = () => {
    setCurrentAchievement(null);
    // Показываем следующее достижение через небольшую задержку
    setTimeout(() => {
      showNextAchievement();
    }, 500);
  };

  const clearAchievements = () => {
    setAchievements([]);
    setCurrentAchievement(null);
  };

  return (
    <AchievementContext.Provider value={{ showAchievement, clearAchievements }}>
      {children}
      
      {/* Показываем текущее достижение */}
      {currentAchievement && (
        <AchievementPopup
          achievement={currentAchievement}
          onClose={handleClose}
          duration={5000}
        />
      )}
    </AchievementContext.Provider>
  );
};