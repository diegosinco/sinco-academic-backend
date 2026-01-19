import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos\n');
      console.log('💡 Ejecuta: npm run seed para crear usuarios de prueba');
      return;
    }

    console.log(`✅ Se encontraron ${users.length} usuarios:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Email verificado: ${user.isEmailVerified ? '✅' : '❌'}`);
      console.log(`   Creado: ${user.createdAt.toLocaleDateString()}\n`);
    });

    // Buscar específicamente el admin
    const admin = users.find((u) => u.email === 'admin@example.com');
    
    if (!admin) {
      console.log('⚠️  El usuario admin (admin@example.com) NO está en la base de datos\n');
      console.log('💡 Ejecuta: npm run seed para crearlo');
    } else {
      console.log('✅ Usuario admin encontrado:', admin.email);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();


