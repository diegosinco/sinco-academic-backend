import { CourseLevel, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - comentar si quieres mantener datos)
  // await prisma.orderItem.deleteMany();
  // await prisma.enrollment.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.cartItem.deleteMany();
  // await prisma.cart.deleteMany();
  // await prisma.blogPost.deleteMany();
  // await prisma.course.deleteMany();
  // await prisma.blogCategory.deleteMany();
  // await prisma.courseCategory.deleteMany();
  // await prisma.refreshToken.deleteMany();
  // await prisma.user.deleteMany();

  // Crear usuarios de ejemplo
  console.log('👤 Creando usuarios...');
  
  const instructor1 = await prisma.user.upsert({
    where: { email: 'instructor1@example.com' },
    update: {},
    create: {
      name: 'María García',
      email: 'instructor1@example.com',
      password: await hashPassword('password123'),
      role: 'instructor',
      avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia',
      isEmailVerified: true,
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: 'instructor2@example.com' },
    update: {},
    create: {
      name: 'Carlos Rodríguez',
      email: 'instructor2@example.com',
      password: await hashPassword('password123'),
      role: 'instructor',
      avatar: 'https://ui-avatars.com/api/?name=Carlos+Rodriguez',
      isEmailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@example.com',
      password: await hashPassword('admin123'),
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin',
      isEmailVerified: true,
    },
  });

  console.log('✅ Usuario admin creado:', admin.email);

  // Categorías: ejecutar antes "npm run seed:categories" para tener módulos SINCO ERP
  const categoriaDefault = await prisma.courseCategory.findFirst({
    where: { slug: 'adpro' },
  });

  // Crear cursos (requiere categorías - ejecutar "npm run seed:categories" primero)
  if (categoriaDefault) {
    console.log('📖 Creando cursos...');
    const cursos = [
    {
      title: 'JavaScript Moderno desde Cero',
      slug: 'javascript-moderno-desde-cero',
      description: 'Aprende JavaScript desde los fundamentos hasta las características más modernas de ES6+. Incluye async/await, destructuring, módulos y mucho más.',
      shortDescription: 'Domina JavaScript desde cero hasta nivel avanzado',
      instructorId: instructor1.id,
      categoryId: categoriaDefault.id,
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      level: 'beginner' as CourseLevel,
      duration: 12,
      rating: 4.8,
      reviewsCount: 125,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'React Avanzado con TypeScript',
      slug: 'react-avanzado-typescript',
      description: 'Curso avanzado de React utilizando TypeScript. Aprende hooks avanzados, context API, state management, y mejores prácticas.',
      shortDescription: 'Lleva tus habilidades de React al siguiente nivel',
      instructorId: instructor1.id,
      categoryId: categoriaDefault.id,
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      level: 'advanced' as CourseLevel,
      duration: 20,
      rating: 4.9,
      reviewsCount: 89,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Next.js 14: Desarrollo Full Stack',
      slug: 'nextjs-14-desarrollo-full-stack',
      description: 'Masterclass completo de Next.js 14. Aprende Server Components, App Router, API Routes, y despliegue en producción.',
      shortDescription: 'Crea aplicaciones full stack con Next.js 14',
      instructorId: instructor1.id,
      categoryId: categoriaDefault.id,
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      level: 'intermediate' as CourseLevel,
      duration: 15,
      rating: 4.7,
      reviewsCount: 203,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'React Native: Apps Móviles',
      slug: 'react-native-apps-moviles',
      description: 'Desarrolla aplicaciones móviles nativas para iOS y Android usando React Native. Incluye navegación, APIs nativas, y publicación en stores.',
      shortDescription: 'Desarrolla apps móviles multiplataforma',
      instructorId: instructor2.id,
      categoryId: categoriaDefault.id,
      price: 69.99,
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      level: 'intermediate' as CourseLevel,
      duration: 18,
      rating: 4.6,
      reviewsCount: 156,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Python para Data Science',
      slug: 'python-data-science',
      description: 'Aprende Python desde cero aplicado a Data Science. Incluye pandas, numpy, matplotlib, y machine learning básico.',
      shortDescription: 'Domina Python para análisis de datos',
      instructorId: instructor2.id,
      categoryId: categoriaDefault.id,
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
      level: 'beginner' as CourseLevel,
      duration: 14,
      rating: 4.5,
      reviewsCount: 178,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Diseño UI/UX con Figma',
      slug: 'diseno-ui-ux-figma',
      description: 'Aprende diseño de interfaces y experiencia de usuario usando Figma. Desde wireframes hasta prototipos interactivos.',
      shortDescription: 'Crea diseños profesionales con Figma',
      instructorId: instructor1.id,
      categoryId: categoriaDefault.id,
      price: 54.99,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      level: 'beginner' as CourseLevel,
      duration: 10,
      rating: 4.7,
      reviewsCount: 142,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Node.js y Express: Backend Profesional',
      slug: 'nodejs-express-backend',
      description: 'Desarrolla APIs RESTful profesionales con Node.js y Express. Incluye autenticación JWT, bases de datos, y deployment.',
      shortDescription: 'Convierte en experto en desarrollo backend',
      instructorId: instructor2.id,
      categoryId: categoriaDefault.id,
      price: 74.99,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      level: 'intermediate' as CourseLevel,
      duration: 16,
      rating: 4.8,
      reviewsCount: 234,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Vue.js 3: Framework Moderno',
      slug: 'vuejs-3-framework-moderno',
      description: 'Aprende Vue.js 3 con Composition API. Crea aplicaciones reactivas y escalables con el framework progresivo de JavaScript.',
      shortDescription: 'Master Vue.js 3 y Composition API',
      instructorId: instructor1.id,
      categoryId: categoriaDefault.id,
      price: 64.99,
      image: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800',
      level: 'beginner' as CourseLevel,
      duration: 12,
      rating: 4.6,
      reviewsCount: 98,
      isPublished: true,
      publishedAt: new Date(),
    },
  ];

  for (const curso of cursos) {
    await prisma.course.upsert({
      where: { slug: curso.slug },
      update: {},
      create: curso,
    });
    console.log(`  ✅ Curso creado: ${curso.title}`);
  }
  } else {
    console.warn('⚠️  Saltando cursos: ejecuta "npm run seed:categories" primero.');
  }

  // Crear categorías de blog
  console.log('📝 Creando categorías de blog...');
  
  const blogCatTecnologia = await prisma.blogCategory.upsert({
    where: { slug: 'tecnologia' },
    update: {},
    create: {
      name: 'Tecnología',
      slug: 'tecnologia',
      description: 'Noticias y artículos sobre tecnología',
    },
  });

  const blogCatEducacion = await prisma.blogCategory.upsert({
    where: { slug: 'educacion' },
    update: {},
    create: {
      name: 'Educación',
      slug: 'educacion',
      description: 'Tips y guías educativas',
    },
  });

  // Crear posts de blog
  console.log('📰 Creando posts de blog...');

  const posts = [
    {
      title: 'Las 10 tendencias de desarrollo web en 2024',
      slug: '10-tendencias-desarrollo-web-2024',
      content: 'El desarrollo web continúa evolucionando rápidamente. En este artículo exploramos las principales tendencias que están definiendo el futuro del desarrollo web, desde frameworks modernos hasta nuevas metodologías de trabajo...',
      excerpt: 'Descubre las tecnologías y metodologías que están transformando el desarrollo web este año.',
      authorId: instructor1.id,
      categoryId: blogCatTecnologia.id,
      featuredImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      tags: ['desarrollo web', 'tendencias', 'tecnología'],
      isPublished: true,
      publishedAt: new Date(),
      views: 1523,
    },
    {
      title: 'Cómo aprender programación desde cero',
      slug: 'como-aprender-programacion-desde-cero',
      content: 'Aprender programación puede parecer abrumador al principio, pero con el enfoque correcto es completamente alcanzable. En esta guía completa te mostramos paso a paso cómo comenzar tu viaje en el mundo de la programación...',
      excerpt: 'Una guía completa para empezar tu carrera como desarrollador.',
      authorId: instructor2.id,
      categoryId: blogCatEducacion.id,
      featuredImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      tags: ['aprender', 'programación', 'guía'],
      isPublished: true,
      publishedAt: new Date(),
      views: 2341,
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
    console.log(`  ✅ Post creado: ${post.title}`);
  }

  console.log('✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


