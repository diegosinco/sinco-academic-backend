import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimit';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import blogRoutes from './routes/blog.routes';
import ecommerceRoutes from './routes/ecommerce.routes';
import adminRoutes from './routes/admin.routes';

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
      
      // Permitir subdominios de vercel.app para preview deployments
      if (origin.includes('.vercel.app')) {
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
  app.options('*', (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = config.frontend.allowedOrigins || [config.frontend.url];
    
    // Permitir si está en la lista o es un subdominio de vercel.app
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) || origin.includes('.vercel.app');
      if (isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 horas
    res.sendStatus(204);
  });

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
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rutas de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/courses', courseRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/ecommerce', ecommerceRoutes);
  app.use('/api/admin', adminRoutes);

  // Ruta de health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Manejo de errores (debe ir al final)
  app.use(errorHandler);

  return app;
};


