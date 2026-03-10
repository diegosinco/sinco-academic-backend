#!/usr/bin/env tsx
/**
 * Crear instructores de prueba
 * Uso: npx tsx scripts/create-instructors.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const INSTRUCTORS = [
  { name: 'Dayana Lozano', email: 'dayana.lozano@sinco.co' },
  { name: 'Carlos Pinilla', email: 'carlos.pinilla@sinco.com.co' },
];

async function main() {
  console.log('👤 Creando instructores...\n');

  for (const instructor of INSTRUCTORS) {
    const user = await prisma.user.upsert({
      where: { email: instructor.email },
      update: { name: instructor.name, role: 'instructor' },
      create: {
        name: instructor.name,
        email: instructor.email,
        password: await hashPassword('password123'),
        role: 'instructor',
        isEmailVerified: true,
      },
    });
    console.log(`✅ ${user.name} (${user.email}) - rol: ${user.role}`);
  }

  console.log('\n🎉 Listo. Contraseña temporal para ambos: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
