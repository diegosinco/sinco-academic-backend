import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Creando usuarios administradores...');

  const admins = [
    {
      name: 'Julian Chaparro',
      email: 'julian.chaparro@sinco.co',
    },
    {
      name: 'Dayana Lozano',
      email: 'dayana.lozano@sinco.co',
    },
    {
      name: 'Carlos Pinilla',
      email: 'carlos.pinilla@sinco.co',
    },
  ];

  for (const admin of admins) {
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        role: 'admin', // Asegurar que el rol sea admin
        isEmailVerified: true,
      },
      create: {
        name: admin.name,
        email: admin.email,
        password: await hashPassword('password123'), // Contraseña temporal
        role: 'admin',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}`,
        isEmailVerified: true,
      },
    });

    console.log(`✅ Admin creado/actualizado: ${user.email}`);
  }

  console.log('\n🎉 Usuarios administradores creados exitosamente!');
  console.log('📝 Todos los admins tienen la contraseña temporal: password123');
  console.log('⚠️  IMPORTANTE: Cambiar las contraseñas después del primer login');
}

main()
  .catch(async (e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
