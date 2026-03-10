# Implementación de OAuth (Google y Microsoft) - Backend

## Objetivo
Implementar autenticación OAuth con Google y Microsoft/Outlook que permita a los usuarios iniciar sesión con sus cuentas de estos proveedores, **sin duplicar usuarios** si ya tienen una cuenta registrada con email/password tradicional.

## Requisitos

### 1. Endpoints necesarios

#### Google OAuth
- `GET /api/auth/google` - Iniciar flujo de autenticación con Google
- `GET /api/auth/google/callback` - Callback de Google (maneja el código de autorización)

#### Microsoft OAuth
- `GET /api/auth/microsoft` - Iniciar flujo de autenticación con Microsoft
- `GET /api/auth/microsoft/callback` - Callback de Microsoft (maneja el código de autorización)

### 2. Estructura de base de datos

Agregar los siguientes campos a la tabla/modelo de usuarios (si no existen):

```typescript
// Campos adicionales para OAuth
googleId?: string | null;        // ID único de Google
microsoftId?: string | null;     // ID único de Microsoft
oauthProvider?: 'google' | 'microsoft' | null;  // Proveedor OAuth vinculado
password?: string | null;        // Debe ser nullable (usuarios OAuth no tienen password)
```

**Nota importante:** El campo `email` debe ser único en la base de datos para evitar duplicados.

### 3. Lógica de unificación de cuentas (CRÍTICO)

**El backend DEBE verificar si el email ya existe antes de crear un nuevo usuario.**

#### Flujo recomendado:

```typescript
async function handleOAuthCallback(provider: 'google' | 'microsoft', oauthData: any) {
  const email = oauthData.email; // Email del proveedor OAuth
  const providerId = provider === 'google' ? oauthData.id : oauthData.id;
  
  // 1. Buscar usuario existente por email
  let user = await User.findOne({ where: { email } });
  
  if (user) {
    // 2. Usuario ya existe: VINCULAR OAuth a la cuenta existente
    // NO crear nuevo usuario
    user[`${provider}Id`] = providerId;
    user.oauthProvider = provider;
    await user.save();
    
    // Generar token JWT para el usuario existente
    const token = generateJWT(user);
    return { token, user };
  } else {
    // 3. Usuario NO existe: Crear nuevo usuario con datos de OAuth
    user = await User.create({
      email: email,
      name: oauthData.name || oauthData.displayName,
      username: oauthData.email?.split('@')[0] || generateUsername(),
      avatar: oauthData.picture || oauthData.photo || null,
      [`${provider}Id`]: providerId,
      oauthProvider: provider,
      password: null, // Usuarios OAuth no tienen password
      role: 'user', // Rol por defecto
      isActive: true,
    });
    
    // Generar token JWT para el nuevo usuario
    const token = generateJWT(user);
    return { token, user };
  }
}
```

### 4. Configuración de proveedores OAuth

#### Google OAuth
- Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
- Habilitar Google+ API
- Crear credenciales OAuth 2.0
- Configurar URIs de redirección autorizados:
  - Desarrollo: `http://localhost:3000/api/auth/google/callback`
  - Producción: `https://tu-dominio.com/api/auth/google/callback`
- Obtener: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

#### Microsoft OAuth
- Registrar aplicación en [Azure Portal](https://portal.azure.com/)
- Configurar permisos: `openid`, `email`, `profile`
- Configurar URIs de redirección:
  - Desarrollo: `http://localhost:3000/api/auth/microsoft/callback`
  - Producción: `https://tu-dominio.com/api/auth/microsoft/callback`
- Obtener: `MICROSOFT_CLIENT_ID` y `MICROSOFT_CLIENT_SECRET`

### 5. Estructura de respuesta esperada

Los endpoints de callback deben retornar:

```json
{
  "success": true,
  "token": "jwt-token-aqui",
  "user": {
    "id": "user-id",
    "email": "usuario@example.com",
    "name": "Nombre Usuario",
    "username": "usuario",
    "role": "user",
    "avatar": "https://...",
    "oauthProvider": "google" // o "microsoft"
  }
}
```

**IMPORTANTE:** Después de autenticar, el backend debe redirigir al frontend con el token en la URL o en una cookie HTTP-only:

**Opción 1: Token en query param (menos seguro pero más simple)**
```
Redirect: https://tu-dominio.com/login?token=jwt-token&success=true
```

**Opción 2: Cookie HTTP-only (más seguro, recomendado)**
```
Set-Cookie: auth_token=jwt-token; HttpOnly; Secure; SameSite=Lax
Redirect: https://tu-dominio.com/login?success=true
```

### 6. Manejo de errores

Si hay un error durante el proceso OAuth, redirigir al frontend con mensaje de error:

```
Redirect: https://tu-dominio.com/login?error=Error al autenticar con Google
```

### 7. Validaciones importantes

1. **Email único:** Verificar que el email sea único antes de crear usuario
2. **Vincular cuentas:** Si el email ya existe, vincular OAuth a la cuenta existente
3. **Datos del proveedor:** Validar que el proveedor OAuth retorne email válido
4. **Token seguro:** Generar JWT con la misma estructura que el login tradicional

### 8. Variables de entorno necesarias

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=tu-microsoft-client-id
MICROSOFT_CLIENT_SECRET=tu-microsoft-client-secret

# URL base del frontend (para redirecciones)
FRONTEND_URL=http://localhost:3000  # Desarrollo
# FRONTEND_URL=https://tu-dominio.com  # Producción
```

### 9. Librerías recomendadas

- **Node.js/Express:**
  - `passport` + `passport-google-oauth20` para Google
  - `passport` + `passport-microsoft` para Microsoft
  - O usar directamente `google-auth-library` y `@azure/msal-node`

- **NestJS:**
  - `@nestjs/passport` + `passport-google-oauth20`
  - `@nestjs/passport` + `passport-microsoft`

### 10. Testing

Probar los siguientes escenarios:

1. ✅ Usuario nuevo con Google → Crea cuenta nueva
2. ✅ Usuario nuevo con Microsoft → Crea cuenta nueva
3. ✅ Usuario existente (email/password) hace login con Google (mismo email) → Vincula OAuth, NO duplica
4. ✅ Usuario existente (email/password) hace login con Microsoft (mismo email) → Vincula OAuth, NO duplica
5. ✅ Usuario con OAuth Google puede hacer login con Google nuevamente
6. ✅ Usuario con OAuth Microsoft puede hacer login con Microsoft nuevamente
7. ✅ Usuario con cuenta vinculada puede usar email/password O OAuth

## Resumen de endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/google` | Inicia flujo OAuth con Google |
| GET | `/api/auth/google/callback` | Callback de Google, retorna token |
| GET | `/api/auth/microsoft` | Inicia flujo OAuth con Microsoft |
| GET | `/api/auth/microsoft/callback` | Callback de Microsoft, retorna token |

## Notas adicionales

- El frontend redirigirá a estos endpoints cuando el usuario haga clic en "Continuar con Google" o "Continuar con Microsoft"
- Los callbacks deben redirigir de vuelta al frontend con el token
- El token debe tener la misma estructura que el token del login tradicional para mantener compatibilidad
- Considerar implementar un endpoint para "desvincular" OAuth de una cuenta si es necesario

---

**¿Preguntas?** Si necesitas aclaraciones sobre algún punto, avísame.
