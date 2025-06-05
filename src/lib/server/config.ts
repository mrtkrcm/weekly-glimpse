import { env as privateEnv } from '$env/dynamic/private';

export const serverConfig = {
  socket: {
    path: privateEnv.SOCKET_PATH || '/socket.io/',
    port: Number(privateEnv.PORT) || 30001,
    host: privateEnv.HOST || 'localhost'
  },
  auth: {
    google: {
      clientId: privateEnv.GOOGLE_CLIENT_ID,
      clientSecret: privateEnv.GOOGLE_CLIENT_SECRET,
    }
  },
  database: {
    url: privateEnv.DATABASE_URL,
    ssl: privateEnv.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    logger: privateEnv.NODE_ENV === 'development'
  },
  email: {
    service: privateEnv.EMAIL_SERVICE || 'sendgrid',
    apiKey: privateEnv.EMAIL_API_KEY || '',
    from: privateEnv.EMAIL_FROM || 'no-reply@weeklyglimpse.com',
    replyTo: privateEnv.EMAIL_REPLY_TO || 'support@weeklyglimpse.com'
  },
  monitoring: {
    sentry: {
      dsn: privateEnv.SENTRY_DSN
    }
  },
  env: {
    mode: privateEnv.NODE_ENV || 'development',
    isDevelopment: privateEnv.NODE_ENV === 'development',
    isProduction: privateEnv.NODE_ENV === 'production',
    isTest: privateEnv.NODE_ENV === 'test'
  },
  test: {
    email: privateEnv.TEST_USER_EMAIL,
    password: privateEnv.TEST_USER_PASSWORD,
    userId: privateEnv.TEST_USER_ID
  }
} as const;

export default {};
