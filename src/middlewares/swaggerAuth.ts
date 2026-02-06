import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware para proteger Swagger solo para administradores
 * Este middleware se ejecuta DESPUÉS de authenticate, por lo que req.user ya existe
 * Solo verifica que el usuario sea administrador
 */
export const swaggerAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;

  // Verificar que el usuario esté autenticado (debería estar por authenticate)
  if (!authReq.user) {
    res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Acceso Restringido - Swagger API</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container {
            background: white;
            padding: 50px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
            width: 100%;
          }
          h1 { 
            color: #333; 
            margin-bottom: 20px; 
            font-size: 28px;
          }
          p { 
            color: #666; 
            margin-bottom: 20px; 
            line-height: 1.6;
          }
          .error { 
            color: #d32f2f; 
            margin-top: 20px; 
            font-weight: bold;
            font-size: 18px;
          }
          .info { 
            background: #e3f2fd;
            color: #1976d2; 
            margin-top: 20px; 
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            border-left: 4px solid #1976d2;
          }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
          }
          .steps {
            text-align: left;
            margin-top: 30px;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
          }
          .steps ol {
            margin-left: 20px;
            margin-top: 10px;
          }
          .steps li {
            margin-bottom: 10px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔒 Acceso Restringido</h1>
          <p>Esta documentación está disponible solo para administradores.</p>
          <p class="error">401 - Token de autenticación requerido</p>
          <div class="info">
            <strong>¿Cómo obtener acceso?</strong>
            <div class="steps">
              <ol>
                <li>Haz login como administrador en: <code>POST /api/auth/login</code></li>
                <li>Copia el <code>accessToken</code> de la respuesta</li>
                <li>Recarga esta página agregando el header: <code>Authorization: Bearer &lt;token&gt;</code></li>
                <li>O usa una extensión del navegador como "ModHeader" para agregar el header automáticamente</li>
              </ol>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Verificar que el usuario sea administrador
  if (authReq.user.role !== 'admin') {
    res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Acceso Denegado - Swagger API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 { color: #333; margin-bottom: 20px; }
          p { color: #666; margin-bottom: 30px; }
          .error { color: #d32f2f; margin-top: 20px; }
          .role { background: #f0f0f0; padding: 10px; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚫 Acceso Denegado</h1>
          <p>Esta documentación está disponible solo para administradores.</p>
          <p>Tu rol actual: <span class="role">${authReq.user.role}</span></p>
          <p class="error">403 - Prohibido</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Usuario es administrador, permitir acceso
  next();
};
