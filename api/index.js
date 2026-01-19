"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = require("../src/app");
const database_1 = require("../src/config/database");
// Conectar a la base de datos al inicializar la función serverless
let isConnected = false;
async function ensureDatabaseConnection() {
    if (!isConnected) {
        try {
            await (0, database_1.connectDatabase)();
            isConnected = true;
        }
        catch (error) {
            console.error('Error connecting to database:', error);
            isConnected = false;
            throw error;
        }
    }
}
// Crear la app Express una sola vez (reutilizable entre invocaciones)
let appInstance = null;
function getApp() {
    if (!appInstance) {
        appInstance = (0, app_1.createApp)();
    }
    return appInstance;
}
// Exportar el handler para Vercel
async function handler(req, res) {
    try {
        // Asegurar conexión a la base de datos
        await ensureDatabaseConnection();
        // Obtener la instancia de la app Express
        const app = getApp();
        // Ejecutar la app como handler
        return app(req, res);
    }
    catch (error) {
        console.error('Error in serverless handler:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
//# sourceMappingURL=index.js.map