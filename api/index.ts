import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';

// Conectar a la base de datos al inicializar la función serverless
let isConnected = false;

async function ensureDatabaseConnection() {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (error) {
      console.error('Error connecting to database:', error);
      isConnected = false;
      throw error;
    }
  }
}

// Crear la app Express una sola vez (reutilizable entre invocaciones)
let appInstance: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appInstance) {
    try {
      appInstance = createApp();
    } catch (error) {
      console.error('Error creating app:', error);
      throw error;
    }
  }
  return appInstance;
}

// Exportar el handler para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Asegurar conexión a la base de datos
    await ensureDatabaseConnection();
    
    // Obtener la instancia de la app Express
    const app = getApp();
    
    // Ejecutar la app como handler
    return app(req, res);
  } catch (error: any) {
    console.error('Error in serverless handler:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    
    // Si la respuesta ya fue enviada, no intentar enviar otra
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.message : undefined
      });
    }
  }
}
