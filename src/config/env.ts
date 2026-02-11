import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// La validación se hace al acceder a las variables (getRequiredEnv)
// Esto evita process.exit() pero garantiza que las variables estén configuradas en producción

// Función helper para obtener variables requeridas
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable de entorno requerida faltante: ${key}`);
  }
  return value;
}

// Función helper para obtener variables opcionales
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isProduction,
  
  database: {
    url: isProduction 
      ? getRequiredEnv('DATABASE_URL')
      : getOptionalEnv('DATABASE_URL', 'postgresql://user:password@localhost:5432/sinco_academic'),
  },
  
  jwt: {
    secret: isProduction
      ? getRequiredEnv('JWT_SECRET')
      : getOptionalEnv('JWT_SECRET', 'dev-secret-only-for-local-development'),
    refreshSecret: isProduction
      ? getRequiredEnv('JWT_REFRESH_SECRET')
      : getOptionalEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-only-for-local-development'),
    expiresIn: getOptionalEnv('JWT_EXPIRE', '15m'),
    refreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRE', '7d'),
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
  
  vimeo: {
    accessToken: isProduction
      ? getRequiredEnv('VIMEO_ACCESS_TOKEN')
      : getOptionalEnv('VIMEO_ACCESS_TOKEN', ''),
  },
};

