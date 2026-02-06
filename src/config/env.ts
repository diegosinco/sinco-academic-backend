import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

/**
 * Valida que las variables de entorno críticas estén configuradas en producción
 * En entornos serverless (Vercel, AWS Lambda, etc.), no hacer process.exit()
 * ya que causa FUNCTION_INVOCATION_FAILED
 */
function validateProductionEnv(): void {
  // En producción, solo hacer warnings, nunca hacer exit
  // Esto evita FUNCTION_INVOCATION_FAILED en Vercel y otros serverless
  if (!isProduction) return;

  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.includes('default') || value.includes('change-in-production')) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn('⚠️  ADVERTENCIA: Variables de entorno faltantes o con valores por defecto:');
    missing.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('⚠️  La aplicación puede fallar si estas variables no están configuradas correctamente.');
    // NO hacer process.exit(1) - esto causa FUNCTION_INVOCATION_FAILED en serverless
  }

  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName]?.includes('default') || process.env[varName]?.includes('change-in-production')) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ ERROR CRÍTICO: Variables de entorno faltantes o con valores por defecto en producción:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n⚠️  La aplicación puede fallar si estas variables no están configuradas correctamente.');
    // NO hacer process.exit(1) en producción porque puede causar problemas en serverless
    // La aplicación fallará naturalmente cuando intente usar estas variables
    // En servidores tradicionales, el administrador verá el error y lo corregirá
  }
}

// Validar en producción
validateProductionEnv();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isProduction,
  
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

