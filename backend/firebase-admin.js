const admin = require('firebase-admin');

// Проверяем, что переменные окружения установлены
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Отсутствует переменная окружения: ${envVar}`);
    console.error('💡 Добавьте её в настройках Render -> Environment');
  }
}

// Инициализируем Firebase Admin только один раз
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Важно: заменяем escaped \n на настоящие переносы строк
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      // Опционально: настройки базы данных, если будете использовать Firestore
      // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    
    console.log('✅ Firebase Admin SDK успешно инициализирован');
    console.log(`📧 Service account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    
  } catch (error) {
    console.error('❌ Ошибка инициализации Firebase Admin:', error.message);
    console.log('\n💡 Проверьте:');
    console.log('1. Правильность FIREBASE_PRIVATE_KEY в Render');
    console.log('2. Что ключ содержит правильные переносы строк (\\n)');
    console.log('3. Что service account активирован в Firebase Console');
    
    // В режиме разработки можно продолжить без Firebase
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

module.exports = admin;