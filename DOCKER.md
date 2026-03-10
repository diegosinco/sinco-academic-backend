# Docker: Base de datos + Backend

PostgreSQL 17.9 y API en contenedores para desarrollo y (tras pruebas) producción.
Versión de Postgres alineada con Neon para migraciones sin conflictos.

## Todo junto (DB + Backend + Frontend)

Desde la carpeta **Sinco/** (padre de backend y frontend):

```bash
cd /ruta/a/Sinco
cp .env.example .env   # y edita con tus valores
docker compose up -d
```

Levanta db, backend y frontend con un solo comando.

## 1. Configurar variables

En tu `.env` agrega o ajusta (puedes mantener el resto de variables):

```env
# Docker Postgres
POSTGRES_USER=sinco
POSTGRES_PASSWORD=tu-password-seguro
POSTGRES_DB=sinco_academic
POSTGRES_PORT=5432

# Para que el backend conecte al contenedor (mismo usuario/password/db)
DATABASE_URL=postgresql://sinco:tu-password-seguro@localhost:5432/sinco_academic
```

Usa el mismo valor en `POSTGRES_PASSWORD` y en la parte de password de `DATABASE_URL`.

## 2. Levantar todo (DB + Backend)

```bash
docker compose up -d
```

O solo la base de datos: `docker compose up -d db`

Comprueba que el contenedor esté en marcha:

```bash
docker compose ps
```

## 3. Aplicar migraciones

Con el contenedor corriendo y `DATABASE_URL` apuntando a `localhost:5432`:

```bash
npm run prisma:migrate:deploy
```

(Si prefieres el flujo de desarrollo con historial de migraciones: `npm run prisma:migrate`.)

## 4. (Opcional) Datos iniciales

```bash
npm run prisma:db:seed
```

## 5. Probar la conexión

```bash
npm run db:test
```

Deberías ver “Conexión establecida exitosamente” y el listado de tablas.

## 6. Backend en Docker

Con `docker compose up -d` el backend ya corre en el contenedor (puerto 3001).

Para desarrollo local (sin Docker para el backend):

```bash
npm run dev
```

Asegúrate de que `DATABASE_URL` apunte a `localhost:5433` (contenedor DB).

## Comandos útiles

| Acción              | Comando                    |
|---------------------|----------------------------|
| Ver logs del contenedor | `docker compose logs -f db` |
| Parar               | `docker compose down`      |
| Parar y borrar datos | `docker compose down -v`   |
| Backup (con pg_dump) | `npm run db:backup`        |

## Producción

Cuando termines de probar y quieras usar este Postgres en producción:

- Cambia `POSTGRES_PASSWORD` por uno fuerte y único.
- Mantén el volumen `postgres_data` (es donde se persisten los datos).
- Configura backups periódicos (por ejemplo con `npm run db:backup` vía cron o tu pipeline).
