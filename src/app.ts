import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import 'express-async-errors';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

// Importar rutas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import blogRoutes from './routes/blog.routes';
import ecommerceRoutes from './routes/ecommerce.routes';
import adminRoutes from './routes/admin.routes';

export const createApp = (): Express => {
  const app = express();

  // Middlewares de seguridad y configuración
  app.use(helmet());
  app.use(compression());
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(cors({
    origin: config.frontend.url,
    credentials: true,
  }));
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


