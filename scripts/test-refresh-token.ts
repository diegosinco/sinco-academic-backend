import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testRefreshToken() {
  try {
    console.log('🧪 Probando refresh token...\n');

    // 1. Login
    console.log('1️⃣ Haciendo login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com', // Cambia por tu email
        password: 'admin123', // Cambia por tu password
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Error en login:', loginData);
      return;
    }

    console.log('✅ Login exitoso');
    const { accessToken, refreshToken } = loginData.data;
    console.log('Access Token:', accessToken.substring(0, 50) + '...');
    console.log('Refresh Token:', refreshToken.substring(0, 50) + '...\n');

    // 2. Probar refresh token inmediatamente
    console.log('2️⃣ Probando refresh token...');
    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    });

    const refreshData = await refreshResponse.json();
    
    if (!refreshData.success) {
      console.error('❌ Error en refresh:', refreshData);
      return;
    }

    console.log('✅ Refresh token exitoso');
    console.log('Nuevo Access Token:', refreshData.data.accessToken.substring(0, 50) + '...\n');

    // 3. Verificar que el nuevo token funciona
    console.log('3️⃣ Verificando nuevo access token...');
    const verifyResponse = await fetch(`${API_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refreshData.data.accessToken}`,
      },
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      console.log('✅ Nuevo access token funciona correctamente');
      console.log('Usuario:', verifyData.data.name, `(${verifyData.data.email})`);
    } else {
      console.error('❌ El nuevo token no funciona:', verifyData);
    }

    console.log('\n✅ Prueba completada exitosamente');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testRefreshToken();
