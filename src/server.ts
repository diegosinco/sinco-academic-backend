import { createApp } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Conectar a la base de datos
    await connectDatabase();

    // Crear aplicación Express
    const app = createApp();

    // Iniciar servidor
    const port = config.port;
    app.listen(port, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
      console.log(`📝 Ambiente: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();



