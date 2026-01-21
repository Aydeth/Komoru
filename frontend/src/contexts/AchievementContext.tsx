import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AchievementPopup from '../components/Achievements/AchievementPopup';

interface Achievement {
  id: number;
  title: string;
  icon: string;
  xp_reward: number;
  description?: string;
  achievement_type?: string;
  is_secret?: boolean;
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
  const [isShowing, setIsShowing] = useState(false);

  const showAchievement = useCallback((achievement: Achievement) => {
    console.log('🎯 showAchievement вызван с достижением:', achievement);
    
    // Если уже показываем достижение, добавляем в очередь
    if (isShowing) {
      console.log('📥 Добавляем в очередь:', achievement.title);
      setAchievements(prev => [...prev, achievement]);
    } else {
      // Иначе показываем сразу
      console.log('🎪 Показываем достижение:', achievement.title);
      setCurrentAchievement(achievement);
      setIsShowing(true);
    }
  }, [isShowing]);

  const showNextAchievement = useCallback(() => {
    console.log('🔄 Показываем следующее достижение из очереди');
    
    if (achievements.length > 0) {
      const [next, ...rest] = achievements;
      console.log('📤 Берем из очереди:', next.title);
      setCurrentAchievement(next);
      setAchievements(rest);
      setIsShowing(true);
    } else {
      console.log('📭 Очередь пуста, скрываем попап');
      setCurrentAchievement(null);
      setIsShowing(false);
    }
  }, [achievements]);

  const handleClose = useCallback(() => {
    console.log('❌ Закрытие попапа, показываем следующее');
    setIsShowing(false);
    
    // Показываем следующее достижение через задержку
    setTimeout(() => {
      showNextAchievement();
    }, 500); // Задержка для плавного перехода
  }, [showNextAchievement]);

  const clearAchievements = useCallback(() => {
    console.log('🧹 Очистка всех достижений');
    setAchievements([]);
    setCurrentAchievement(null);
    setIsShowing(false);
  }, []);

  const value = {
    showAchievement,
    clearAchievements
  };

  return (
    <AchievementContext.Provider value={value}>
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