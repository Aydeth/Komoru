// contexts/AchievementContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AchievementPopup from '../components/Achievements/AchievementPopup';

interface Achievement {
  id: number;
  title: string;
  icon: string;
  xp_reward: number;
  description?: string;
}

interface AchievementContextType {
  showAchievement: (achievement: Achievement) => void;
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
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);
  const [isShowing, setIsShowing] = useState(false);

  const showAchievement = useCallback((achievement: Achievement) => {
    console.log('🎯 AchievementProvider.showAchievement вызван:', achievement.title);
    
    // Добавляем достижение в очередь
    setQueue(prev => [...prev, achievement]);
  }, []);

  const processQueue = useCallback(() => {
    console.log('🔄 processQueue, в очереди:', queue.length);
    
    // Если сейчас что-то показывается или очередь пуста - выходим
    if (isShowing || queue.length === 0) {
      return;
    }
    
    // Берем первое достижение из очереди
    const nextAchievement = queue[0];
    console.log('📤 Показываем достижение:', nextAchievement.title);
    
    setCurrent(nextAchievement);
    setIsShowing(true);
    
    // Удаляем из очереди
    setQueue(prev => prev.slice(1));
  }, [queue, isShowing]);

  const handleClose = useCallback(() => {
    console.log('❌ Закрытие попапа');
    setCurrent(null);
    setIsShowing(false);
    
    // Даем время на анимацию, затем обрабатываем очередь
    setTimeout(() => {
      processQueue();
    }, 300);
  }, [processQueue]);

  // Обрабатываем очередь при изменении
  React.useEffect(() => {
    processQueue();
  }, [queue, isShowing, processQueue]);

  return (
    <AchievementContext.Provider value={{ showAchievement }}>
      {children}
      
      {/* Показываем текущее достижение */}
      {current && (
        <AchievementPopup
          achievement={current}
          onClose={handleClose}
        />
      )}
      
      {/* Индикатор очереди (только для разработки) */}
      {process.env.NODE_ENV === 'development' && queue.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 20,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 9998,
        }}>
          В очереди: {queue.length}
        </div>
      )}
    </AchievementContext.Provider>
  );
};