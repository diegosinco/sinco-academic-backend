# Sinco Academic Backend

Backend API REST para la plataforma académica Sinco, desarrollado con Express.js, TypeScript y MongoDB.

## 🏗️ Arquitectura

El proyecto sigue una arquitectura limpia con separación de responsabilidades:

```
src/
├── config/           # Configuración (DB, variables de entorno)
├── controllers/      # Controladores (manejan requests/responses)
├── middlewares/      # Middlewares (auth, validación, errores)
├── prisma/           # Schema de Prisma (modelos)
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio (separada de controladores)
├── utils/            # Utilidades y helpers
├── app.ts            # Configuración de Express
└── server.ts         # Punto de entrada
```

### Principios de Diseño

- **Controladores**: Solo manejan HTTP (request/response), sin lógica de negocio
- **Servicios**: Contienen toda la lógica de negocio y acceso a datos
- **Modelos**: Definiciones de esquemas de base de datos
- **Rutas**: Solo definen endpoints y middlewares
- **Middlewares**: Funciones reutilizables (auth, validación, errores)

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus configuraciones
```

## ⚙️ Configuración

### Base de Datos

**Necesitas una base de datos PostgreSQL.** Si no la tienes instalada localmente, consulta `DATABASE_SETUP.md` para opciones (Docker, servicios cloud gratuitos, etc.).

Edita el archivo `.env` con tus configuraciones:

```env
PORT=3001
NODE_ENV=
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=
```

**Nota**: El backend usa el puerto 3001 por defecto (el frontend Next.js usa 3000)

Luego ejecuta las migraciones:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## 📜 Scripts

```bash
# Desarrollo (con hot-reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start

# Verificar tipos
npm run type-check

# Linter
npm run lint

# Prisma
npm run prisma:generate  # Generar Prisma Client
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
```

## 🔌 APIs Implementadas

### Autenticación (`/api/auth`)

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/refresh-token` - Renovar access token
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/forgot-password` - Solicitar recuperación de contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Usuario (`/api/users`)

- `GET /api/users/profile` - Obtener perfil (requiere auth)
- `PUT /api/users/profile` - Actualizar perfil (requiere auth)
- `GET /api/users/courses` - Cursos inscritos (requiere auth)
- `GET /api/users/certificates` - Certificados (requiere auth)
- `GET /api/users/orders` - Pedidos del usuario (requiere auth)

### Cursos (`/api/courses`)

- `GET /api/courses` - Listado de cursos (con filtros)
- `GET /api/courses/:slug` - Detalle de curso por slug
- `GET /api/courses/categories` - Categorías de cursos

**Filtros disponibles:**
- `category` - Slug de categoría
- `level` - beginner, intermediate, advanced
- `search` - Búsqueda por texto
- `minPrice`, `maxPrice` - Rango de precios
- `page`, `limit` - Paginación

### Blog (`/api/blog`)

- `GET /api/blog` - Listado de posts (con filtros)
- `GET /api/blog/:slug` - Detalle de post por slug
- `GET /api/blog/categories` - Categorías del blog

**Filtros disponibles:**
- `category` - Slug de categoría
- `search` - Búsqueda por texto
- `page`, `limit` - Paginación

### E-commerce (`/api/ecommerce`)

- `GET /api/ecommerce/cart` - Obtener carrito (requiere auth)
- `POST /api/ecommerce/cart` - Agregar curso al carrito (requiere auth)
- `DELETE /api/ecommerce/cart/:courseId` - Remover del carrito (requiere auth)
- `DELETE /api/ecommerce/cart` - Vaciar carrito (requiere auth)
- `POST /api/ecommerce/coupons/validate` - Validar cupón
- `POST /api/ecommerce/checkout` - Procesar compra (requiere auth)
- `GET /api/ecommerce/orders` - Listado de pedidos (requiere auth)

## 🔐 Autenticación

El sistema usa JWT con access tokens y refresh tokens:

1. **Access Token**: Válido por 15 minutos (configurable)
2. **Refresh Token**: Válido por 7 días (configurable)

### Uso en requests

```
Authorization: Bearer <access_token>
```

### Refresh Token Flow

1. Cliente envía refresh token a `/api/auth/refresh-token`
2. Servidor valida y retorna nuevo access token
3. Cliente usa nuevo access token para requests autenticados

## 📦 Modelos de Datos

- **User** - Usuarios del sistema
- **RefreshToken** - Tokens de refresh
- **Course** - Cursos
- **CourseCategory** - Categorías de cursos
- **BlogPost** - Posts del blog
- **BlogCategory** - Categorías del blog
- **Cart** - Carrito de compras
- **CartItem** - Items del carrito
- **Order** - Pedidos
- **OrderItem** - Items de pedidos
- **Coupon** - Cupones de descuento
- **Enrollment** - Inscripciones a cursos

Los modelos están definidos en `prisma/schema.prisma`. Para aplicar cambios:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## 🛠️ Tecnologías

- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **PostgreSQL + Prisma** - Base de datos y ORM
- **JWT** - Autenticación
- **Joi** - Validación de datos
- **Bcrypt** - Hash de contraseñas
- **Helmet** - Seguridad HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logging HTTP

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT para autenticación
- Helmet para headers de seguridad
- Validación de datos con Joi
- Manejo centralizado de errores
- CORS configurado

## 📚 Documentación de API (Swagger)

La documentación interactiva de la API está disponible en `/api-docs`, pero **solo es accesible para administradores**.

### Cómo acceder:

1. **Obtén un token de administrador:**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@sinco.co",
     "password": "tu-password"
   }
   ```

2. **Accede a Swagger con el token:**
   - Abre tu navegador en: `http://localhost:3001/api-docs`
   - En la interfaz de Swagger, haz clic en el botón **"Authorize"** (🔒)
   - Ingresa: `Bearer <tu-access-token>`
   - Haz clic en **"Authorize"** y luego en **"Close"**

3. **Ahora puedes explorar y probar todos los endpoints**

### Nota de Seguridad:
- Solo usuarios con rol `admin` pueden acceder a la documentación
- Si intentas acceder sin autenticación o con un rol diferente, verás un mensaje de error
- El token debe estar activo (no expirado)

## 📝 Notas

- Las contraseñas se hashean usando bcrypt antes de guardar
- Los refresh tokens se almacenan en la base de datos con expiración automática
- Los modelos incluyen timestamps automáticos (createdAt, updatedAt)
- Los índices están configurados para optimizar búsquedas
- Las relaciones están definidas en Prisma schema con integridad referencial

## 🚧 Próximos Pasos

- [ ] Implementar sistema de pagos (Stripe/PayPal)
- [ ] Agregar tests unitarios e integración
- [ ] Implementar rate limiting
- [ ] Agregar sistema de notificaciones
- [ ] Implementar subida de archivos
- [ ] Agregar sistema de reviews/ratings para cursos
- [ ] Implementar sistema de certificados (PDF generation)

