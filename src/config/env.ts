import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/sinco_academic',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Dominios permitidos para CORS (separados por coma)
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',
          'https://sinco-academic-frontend.vercel.app',
        ],
  },
  
  azure: {
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'uploads',
  },
};

