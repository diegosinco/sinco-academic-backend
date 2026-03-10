# 🔐 Guía: Cómo usar Swagger con autenticación

## Paso 1: Obtener el token de administrador

### Opción A: Desde el navegador (Consola del navegador)

1. Abre tu aplicación frontend
2. Abre la consola del navegador (F12)
3. Ejecuta este código en la consola:

```javascript
// Hacer login
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'tu-email-admin@sinco.co',
    password: 'tu-password'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Token obtenido:', data.data.accessToken);
  // Copia este token
  navigator.clipboard.writeText(data.data.accessToken);
  console.log('📋 Token copiado al portapapeles!');
});
```

### Opción B: Desde Postman/Thunder Client

```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "tu-email-admin@sinco.co",
  "password": "tu-password"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

**Copia el `accessToken`** (el string largo que empieza con `eyJ...`)

---

## Paso 2: Acceder a Swagger

1. Abre tu navegador en: **http://localhost:3001/api-docs**

2. Si no estás autenticado, verás un mensaje de error. **Esto es normal**.

---

## Paso 3: Autorizar en Swagger

1. **Busca el botón "Authorize" 🔒** en la parte superior derecha de Swagger UI

2. **Haz clic en "Authorize"**

3. Se abrirá un modal. Verás un campo que dice algo como:
   ```
   bearerAuth (http, Bearer)
   Value: [campo vacío]
   ```

4. **En el campo "Value", ingresa SOLO el token** (sin la palabra "Bearer"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtazJydGI1YjAwMDBvbTRma2ViOGxneG4iLCJlbWFpbCI6ImFkbWluQHNpbmNvLmNvIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE3MDI0NjkyLCJleHAiOjE3MTcwMjU1OTJ9.abc123...
   ```

   ⚠️ **IMPORTANTE**: 
   - NO escribas "Bearer" antes del token
   - Solo pega el token directamente
   - Swagger automáticamente agregará "Bearer " al inicio

5. **Haz clic en "Authorize"** (botón dentro del modal)

6. **Haz clic en "Close"** para cerrar el modal

---

## Paso 4: ¡Listo! 🎉

Ahora puedes:
- ✅ Ver todos los endpoints documentados
- ✅ Expandir cada endpoint para ver detalles
- ✅ Probar endpoints directamente desde Swagger
- ✅ Ver ejemplos de requests y responses

---

## 🔍 Verificar que funciona

1. Busca cualquier endpoint que requiera autenticación (tiene un 🔒)
2. Haz clic en "Try it out"
3. Haz clic en "Execute"
4. Deberías ver una respuesta exitosa (200, 201, etc.)

---

## ❌ Problemas comunes

### "401 - No autorizado"
- El token expiró (los tokens duran 15 minutos)
- Solución: Obtén un nuevo token haciendo login de nuevo

### "403 - Prohibido"
- El usuario no es administrador
- Solución: Usa una cuenta con rol `admin`

### No veo el botón "Authorize"
- Asegúrate de estar en `/api-docs` (no en otra ruta)
- Recarga la página

### El token no funciona
- Verifica que copiaste el token completo (es muy largo)
- Asegúrate de NO incluir "Bearer" al pegar el token
- Verifica que el token no haya expirado

---

## 💡 Tip: Token en el portapapeles

Si usas la consola del navegador con el código de arriba, el token se copiará automáticamente al portapapeles. Solo pégalo en Swagger (Ctrl+V / Cmd+V).
