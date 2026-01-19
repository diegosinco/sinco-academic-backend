import { PrismaClient } from '@prisma/client';

// Configuración mejorada de Prisma Client con manejo de conexiones
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejar desconexión limpia
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    // Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ Error: DATABASE_URL no está configurado en las variables de entorno');
      console.error('📝 Por favor, configura DATABASE_URL en tu archivo .env');
      process.exit(1);
    }

    // Intentar conectar con timeout
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: No se pudo conectar a la base de datos en 10 segundos')), 10000)
      ),
    ]);

    // Verificar conexión con una query simple
    await prisma.$queryRaw`SELECT 1`;
    
    console.log('✅ Base de datos PostgreSQL conectada exitosamente');
  } catch (error: any) {
    console.error('❌ Error al conectar a la base de datos:');
    
    if (error.message?.includes('Timeout')) {
      console.error('   ⏱️  La conexión tardó demasiado. Verifica:');
      console.error('   - Que la base de datos esté activa (si usas Neon/Supabase, puede estar pausada)');
      console.error('   - Que la URL de conexión sea correcta');
      console.error('   - Que no haya problemas de red o firewall');
    } else if (error.message?.includes('P1001')) {
      console.error('   🔌 No se puede alcanzar el servidor de base de datos. Verifica:');
      console.error('   - Que el servidor de PostgreSQL esté corriendo');
      console.error('   - Que la URL de conexión sea correcta');
    } else if (error.message?.includes('P1000')) {
      console.error('   🔐 Error de autenticación. Verifica:');
      console.error('   - Usuario y contraseña en DATABASE_URL');
    } else if (error.message?.includes('Closed')) {
      console.error('   🔒 La conexión está cerrada. Esto puede pasar si:');
      console.error('   - La base de datos en Neon/Supabase está pausada (actívala desde el dashboard)');
      console.error('   - El servidor se desconectó inesperadamente');
      console.error('   - Hay un problema de red');
    } else {
      console.error('   📋 Detalles:', error.message || error);
    }
    
    console.error('\n💡 Tip: Si usas Neon, verifica que la base de datos no esté pausada');
    console.error('💡 Ejecuta: npm run db:test para probar la conexión');
    
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de la base de datos');
  } catch (error) {
    console.error('❌ Error al desconectar de la base de datos:', error);
  }
};
