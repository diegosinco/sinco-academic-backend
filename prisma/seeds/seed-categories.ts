import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed específico: solo categorías de cursos (módulos SINCO ERP)
 * Ejecutar: npm run seed:categories
 */
const categorias = [
  { slug: 'adpro', name: 'Administración de Proyectos de Construcción', color: '#177981' },
  { slug: 'srm', name: 'Gestión de relacionamiento de Proveedores', color: '#177981' },
  { slug: 'sgp', name: 'Sistema de Gestión de Proyectos', color: '#668C4C' },
  { slug: 'cbr', name: 'Comercialización de Bienes Raíces', color: '#A7485D' },
  { slug: 'crm', name: 'Gestión de Relación con los Clientes', color: '#A7485D' },
  { slug: 'm&e', name: 'Maquinaria y Equipo', color: '#DFC860' },
  { slug: 'abr', name: 'Administración de Bienes Raíces', color: '#BF6848' },
  { slug: 'adc', name: 'Administración de Cobros', color: '#3841A4' },
  { slug: 'a&f', name: 'Administrativo y Financiero', color: '#89A8BB' },
  { slug: 'f&c', name: 'Facturación y Cartera', color: '#12497A' },
  { slug: 'fe', name: 'Facturación Electrónica', color: '#12497A' },
  { slug: 're', name: 'Recepción Electrónica', color: '#12497A' },
  { slug: 'sgd', name: 'Sistema de Gestión Documental', color: '#5B884E' },
  { slug: 'sgc', name: 'Sistema de Gestión de Calidad', color: '#647D38' },
  { slug: 'sst', name: 'Seguridad y Salud en el Trabajo', color: '#647D38' },
  { slug: 'capta', name: 'Gestión y Análisis de Solicitudes', color: '#3F5C81' },
];

async function main() {
  console.log('📚 Seed: categorías de cursos (SINCO ERP)...');
  for (const cat of categorias) {
    await prisma.courseCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color } as Prisma.CourseCategoryUpdateInput,
      create: {
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
      } as Prisma.CourseCategoryCreateInput,
    });
    console.log(`  ✅ ${cat.slug}: ${cat.name}`);
  }
  console.log('✅ Seed categorías completado.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
