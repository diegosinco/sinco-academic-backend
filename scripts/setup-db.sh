#!/bin/bash

# Script para configurar la base de datos por primera vez
# Uso: ./scripts/setup-db.sh

set -e

echo "🔧 Configurando base de datos..."

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "❌ Error: El archivo .env no existe"
    echo "📝 Copia .env.example a .env y configura DATABASE_URL"
    exit 1
fi

# Verificar que DATABASE_URL está configurado
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ Error: DATABASE_URL no está configurado en .env"
    echo "📝 Agrega tu connection string de PostgreSQL"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Generar Prisma Client
echo "📦 Generando Prisma Client..."
npx prisma generate

# Crear y aplicar migraciones
echo "🚀 Creando migración inicial..."
npx prisma migrate dev --name init

echo "✅ Base de datos configurada exitosamente!"
echo ""
echo "📊 Puedes abrir Prisma Studio para ver los datos:"
echo "   npm run prisma:studio"



