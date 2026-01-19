import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  console.log('🔍 Probando conexión a la base de datos...\n');

  // 1. Verificar DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL no está configurado en .env');
    console.log('\n📝 Solución:');
    console.log('   1. Copia .env.example a .env');
    console.log('   2. Configura DATABASE_URL con tu string de conexión');
    process.exit(1);
  }

  // Ocultar password en el output
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`📋 DATABASE_URL configurado: ${maskedUrl}\n`);

  // 2. Intentar conectar
  try {
    console.log('🔌 Intentando conectar...');
    await prisma.$connect();
    console.log('✅ Conexión establecida exitosamente\n');

    // 3. Probar query simple
    console.log('🧪 Probando query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query ejecutada exitosamente:', result);

    // 4. Verificar tablas
    console.log('\n📊 Verificando tablas...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No se encontraron tablas. Ejecuta migraciones:');
      console.log('   npm run prisma:migrate');
    } else {
      console.log(`✅ Se encontraron ${tables.length} tablas:`);
      tables.forEach((table) => {
        console.log(`   - ${table.tablename}`);
      });
    }

    // 5. Verificar usuarios
    console.log('\n👥 Verificando usuarios...');
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios en la base de datos: ${userCount}`);
    
    if (userCount === 0) {
      console.log('💡 Tip: Ejecuta "npm run seed" para crear datos de prueba');
    }

    console.log('\n🎉 ¡Todo funciona correctamente!');
  } catch (error: any) {
    console.error('\n❌ Error de conexión:\n');
    
    if (error.code === 'P1001') {
      console.error('   🔌 No se puede alcanzar el servidor de base de datos');
      console.error('   💡 Verifica:');
      console.error('      - Que el servidor PostgreSQL esté corriendo');
      console.error('      - Que la URL de conexión sea correcta');
      console.error('      - Que no haya problemas de firewall');
    } else if (error.code === 'P1000') {
      console.error('   🔐 Error de autenticación');
      console.error('   💡 Verifica usuario y contraseña en DATABASE_URL');
    } else if (error.message?.includes('Closed') || error.code === 'ECONNREFUSED') {
      console.error('   🔒 La conexión está cerrada o rechazada');
      console.error('   💡 Si usas Neon/Supabase:');
      console.error('      1. Ve al dashboard de tu proveedor');
      console.error('      2. Verifica que la base de datos esté activa (no pausada)');
      console.error('      3. Copia nuevamente el connection string');
    } else {
      console.error(`   📋 Código: ${error.code || 'N/A'}`);
      console.error(`   📋 Mensaje: ${error.message}`);
    }
    
    console.error('\n💡 Soluciones comunes:');
    console.error('   - Si usas Neon: Verifica que la DB no esté pausada');
    console.error('   - Regenera Prisma Client: npm run prisma:generate');
    console.error('   - Verifica tu .env tiene DATABASE_URL configurado');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch((error) => {
  console.error('Error inesperado:', error);
  process.exit(1);
});


