# Checklist para probar con Frontend

## ✅ Completado
- [x] Modelo `Lesson` creado en Prisma
- [x] Modelo `LessonProgress` creado en Prisma
- [x] Servicios implementados (VimeoService, LessonService, LessonProgressService)
- [x] Controladores creados
- [x] Rutas configuradas en `app.ts`
- [x] Validaciones con Joi
- [x] Middlewares de autenticación y autorización

## ⚠️ Pendiente

### 1. **Migraciones de Base de Datos**
```bash
# Primero resolver migraciones pendientes
npx prisma migrate resolve --applied 20260206114401_remove_blog_post_is_active
npx prisma migrate resolve --applied 20260206114405_remove_blog_post_is_active

# Luego crear migración para lessons y lesson_progress
npx prisma migrate dev --name add_lessons_and_progress
```

### 2. **Variable de Entorno VIMEO_ACCESS_TOKEN**
Agregar en `.env`:
```env
VIMEO_ACCESS_TOKEN=tu_token_de_vimeo_aqui
```

Para obtener el token:
1. Ve a https://developer.vimeo.com/apps
2. Selecciona tu app "sincoAcademic"
3. Genera un "Personal Access Token"
4. Cópialo a `.env`

### 3. **Regenerar Prisma Client**
```bash
npx prisma generate
```

## 📋 Endpoints Disponibles

### Lecciones (Requieren: Instructor/Admin)
- `GET /api/courses/:courseId/lessons` - Listar lecciones de un curso
- `GET /api/lessons/:id` - Obtener una lección
- `POST /api/courses/:courseId/lessons` - Crear lección
- `PUT /api/lessons/:id` - Actualizar lección
- `DELETE /api/lessons/:id` - Eliminar lección

### Vimeo (Requieren: Instructor/Admin)
- `POST /api/vimeo/upload` - Crear video en Vimeo (retorna upload_link)
- `GET /api/vimeo/videos/:videoId` - Info del video
- `GET /api/vimeo/videos/:videoId/embed` - HTML de embed

### Progreso (Requieren: Estudiante autenticado)
- `GET /api/lessons/:lessonId/progress` - Progreso de una lección
- `GET /api/courses/:courseId/progress` - Progreso de todo el curso
- `PUT /api/lessons/:lessonId/progress` - Actualizar progreso
- `POST /api/lessons/:lessonId/progress/complete` - Marcar como completada
- `GET /api/courses/:courseId/progress/stats` - Estadísticas del curso

## 🔑 Headers Requeridos
```
Authorization: Bearer <token>
Content-Type: application/json
```

## 📝 Ejemplo de Body para Crear Lección
**Nota:** `duration` en **minutos** (enviada desde el front). Ej: 10 = 10 min, 30 = 30 min.
```json
{
  "title": "Introducción al curso",
  "description": "Primera lección del curso",
  "vimeoVideoId": "123456789",
  "duration": 10,
  "order": 1,
  "isPublished": true
}
```

## 📝 Ejemplo de Body para Actualizar Progreso
```json
{
  "progress": 50,
  "lastPosition": 300,
  "timeSpent": 600,
  "completed": false
}
```
