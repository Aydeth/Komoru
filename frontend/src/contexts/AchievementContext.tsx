import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
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
  const [achievementsQueue, setAchievementsQueue] = useState<Achievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const isShowingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showAchievement = useCallback((achievement: Achievement) => {
    console.log('🎯 showAchievement вызван с достижением:', achievement);
    
    // Всегда добавляем в очередь
    setAchievementsQueue(prev => [...prev, achievement]);
    
    // Если ничего не показывается - начинаем показ
    if (!isShowingRef.current) {
      processNextAchievement();
    }
  }, []);

  const processNextAchievement = useCallback(() => {
    console.log('🔄 Обработка следующего достижения');
    
    if (achievementsQueue.length === 0) {
      console.log('📭 Очередь пуста');
      isShowingRef.current = false;
      setCurrentAchievement(null);
      return;
    }
    
    // Берем первое достижение из очереди
    const [nextAchievement, ...rest] = achievementsQueue;
    console.log('📤 Показываем:', nextAchievement.title);
    
    setCurrentAchievement(nextAchievement);
    setAchievementsQueue(rest);
    isShowingRef.current = true;
    
    // Автоматическое закрытие через 5 секунд
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Автоматическое закрытие:', nextAchievement.title);
      handleClose();
    }, 5000);
  }, [achievementsQueue]);

  const handleClose = useCallback(() => {
    console.log('❌ Закрытие текущего попапа');
    
    // Очищаем таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Сбрасываем текущее достижение
    setCurrentAchievement(null);
    
    // Показываем следующее через небольшую паузу
    setTimeout(() => {
      processNextAchievement();
    }, 300);
  }, [processNextAchievement]);

  const clearAchievements = useCallback(() => {
    console.log('🧹 Очистка всех достижений');
    setAchievementsQueue([]);
    setCurrentAchievement(null);
    isShowingRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Очищаем таймер при размонтировании
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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
        />
      )}
      
      {/* Показываем количество в очереди (опционально) */}
      {achievementsQueue.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 20,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 9998,
        }}>
          В очереди: {achievementsQueue.length}
        </div>
      )}
    </AchievementContext.Provider>
  );
};