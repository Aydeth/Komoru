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
  
  // Используем ref для доступа к актуальной очереди
  const achievementsQueueRef = useRef<Achievement[]>([]);
  
  // Синхронизируем ref с state
  React.useEffect(() => {
    achievementsQueueRef.current = achievementsQueue;
  }, [achievementsQueue]);

  const showAchievement = useCallback((achievement: Achievement) => {
    console.log('🎯 showAchievement вызван с достижением:', achievement);
    
    // Добавляем в очередь
    setAchievementsQueue(prev => {
      const newQueue = [...prev, achievement];
      console.log('📥 Добавлено в очередь. Теперь в очереди:', newQueue.length);
      return newQueue;
    });
    
    // Если ничего не показывается - начинаем показ
    if (!isShowingRef.current) {
      processNextAchievement();
    }
  }, []);

  const processNextAchievement = useCallback(() => {
    console.log('🔄 Обработка следующего достижения');
    console.log('📊 Текущая очередь:', achievementsQueueRef.current.length);
    
    if (achievementsQueueRef.current.length === 0) {
      console.log('📭 Очередь пуста, прекращаем показ');
      isShowingRef.current = false;
      setCurrentAchievement(null);
      return;
    }
    
    // Берем первое достижение из очереди
    const [nextAchievement, ...rest] = achievementsQueueRef.current;
    console.log('📤 Показываем:', nextAchievement.title);
    console.log('📦 Остается в очереди:', rest.length);
    
    // Обновляем state очереди
    setAchievementsQueue(rest);
    
    // Показываем достижение
    setCurrentAchievement(nextAchievement);
    isShowingRef.current = true;
    
    // Автоматическое закрытие через 5 секунд
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Автоматическое закрытие:', nextAchievement.title);
      handleClose();
    }, 5000);
  }, []);

  const handleClose = useCallback(() => {
    console.log('❌ Закрытие текущего попапа');
    
    // Очищаем таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Сбрасываем текущее достижение
    setCurrentAchievement(null);
    isShowingRef.current = false;
    
    // Проверяем через небольшую паузу, есть ли еще достижения
    setTimeout(() => {
      console.log('🔍 Проверяем очередь после закрытия:', achievementsQueueRef.current.length);
      if (achievementsQueueRef.current.length > 0) {
        processNextAchievement();
      }
    }, 300);
  }, [processNextAchievement]);

  const clearAchievements = useCallback(() => {
    console.log('🧹 Очистка всех достижений');
    setAchievementsQueue([]);
    achievementsQueueRef.current = [];
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
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(-10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          }
        } as React.CSSProperties}>
          📥 В очереди: {achievementsQueue.length}
        </div>
      )}
    </AchievementContext.Provider>
  );
};