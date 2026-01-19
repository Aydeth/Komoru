const admin = require('../firebase-admin');

/**
 * Middleware для проверки Firebase токена
 * Добавляет пользователя в req.user
 */
const verifyToken = async (req, res, next) => {
  // Пропускаем публичные маршруты
  const publicRoutes = ['/api/health', '/api/db-check', '/api/games'];
  if (publicRoutes.includes(req.path) || req.path.startsWith('/api/games/') && !req.path.includes('/scores')) {
    return next();
  }
  
  try {
    // Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Требуется авторизация. Добавьте заголовок: Authorization: Bearer <token>'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Токен не предоставлен'
      });
    }
    
    // Проверяем токен
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Добавляем информацию о пользователе в запрос
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Игрок',
      picture: decodedToken.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decodedToken.uid}`
    };
    
    console.log(`🔐 Аутентифицирован пользователь: ${req.user.email} (${req.user.uid})`);
    next();
    
  } catch (error) {
    console.error('❌ Ошибка проверки токена:', error.message);
    
    // Разные статусы для разных ошибок
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Токен просрочен. Пожалуйста, войдите снова'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат токена'
      });
    }
    
    res.status(403).json({
      success: false,
      error: 'Неверный или просроченный токен',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware для опциональной аутентификации
 * Пользователь добавляется если есть, но не требуется
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Игрок',
        picture: decodedToken.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${decodedToken.uid}`
      };
    } else {
      // Гостевой доступ
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Если токен невалидный, продолжаем как гость
    req.user = null;
    next();
  }
};

module.exports = { verifyToken, optionalAuth };