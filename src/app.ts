import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimit';
import { prisma } from './config/database';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import blogRoutes from './routes/blog.routes';
import ecommerceRoutes from './routes/ecommerce.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

export const createApp = (): Express => {
  const app = express();

  // Configuración de CORS - DEBE ir PRIMERO para manejar preflight requests
  // Antes de cualquier otro middleware que pueda causar redirects o bloqueos
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir solicitudes sin origen (como apps móviles o Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Lista de orígenes permitidos
      const allowedOrigins = config.frontend.allowedOrigins || [config.frontend.url];
      
      // Verificar si el origen está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Permitir cualquier subdominio de vercel.app (producción y previews)
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      // En desarrollo, permitir localhost con cualquier puerto
      if (!config.isProduction && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      callback(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
  
  // Aplicar CORS antes de cualquier otro middleware
  app.use(cors(corsOptions));
  
  // Manejar preflight requests explícitamente (crítico para Vercel)
  app.options('*', cors(corsOptions));

  // Middlewares de seguridad y configuración (después de CORS)
  app.use(helmet({
    // Configurar helmet para no interferir con CORS
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  
  // Rate limiting general (aplicado a todas las rutas)
  // En desarrollo, puedes desactivarlo o aumentar el límite
  if (config.nodeEnv === 'production') {
    app.use('/api', generalLimiter);
  }
  
  // Configuración de body parser con límites de seguridad
  app.use(express.json({ limit: '10mb' })); // Límite de 10MB para JSON
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Límite de 10MB para URL encoded
  
  // Timeout para requests (30 segundos en producción, 60 en desarrollo)
  app.use((req, res, next) => {
    const timeout = config.nodeEnv === 'production' ? 30000 : 60000; // 30s prod, 60s dev
    req.setTimeout(timeout, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
        });
      }
    });
    next();
  });

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/ecommerce', ecommerceRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  // Health check mejorado - verifica conexión a DB
  app.get('/health', async (_req, res) => {
    try {
      // Verificar conexión a la base de datos
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        database: 'connected',
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        database: 'disconnected',
        message: 'Database connection failed',
      });
    }
  });

  // Swagger UI - Solo disponible en desarrollo
  // En producción, esta ruta no existe por seguridad
  // Importación condicional para no cargar en producción (optimización)
  if (config.nodeEnv !== 'production') {
    // Dynamic import solo en desarrollo - no se carga en producción
    const swaggerUi = require('swagger-ui-express');
    const { swaggerSpec } = require('./config/swagger');
    
    app.use('/api-docs', swaggerUi.serve);
    app.get(
      '/api-docs',
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Sinco Academic API - Documentación',
        customfavIcon: '/favicon.ico',
      })
    );
  } else {
    // En producción, retornar 404 explícitamente
    app.get('/api-docs', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Not Found',
      });
    });
  }

  // Manejo de errores (debe ir al final)
  app.use(errorHandler);

  return app;
};


