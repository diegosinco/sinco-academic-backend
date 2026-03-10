#!/usr/bin/env tsx
/**
 * Trae la data de Neon a la base local (Docker).
 * Uso: npm run db:restore-from-neon
 *
 * Requiere en .env:
 *   DATABASE_URL_NEON  - conexión a Neon (origen)
 *   DATABASE_URL      - conexión local (destino, ej. localhost:5433)
 *
 * También requiere: pg_dump y psql (cliente PostgreSQL)
 *   macOS: brew install libpq && brew link --force libpq
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { config } from 'dotenv';

config();

const NEON_URL = process.env.DATABASE_URL_NEON;
const LOCAL_URL = process.env.DATABASE_URL;

if (!NEON_URL) {
  console.error('❌ Falta DATABASE_URL_NEON en .env');
  console.error('   Ejemplo: DATABASE_URL_NEON=postgresql://user:pass@host.neon.tech/dbname?sslmode=require');
  process.exit(1);
}

if (!LOCAL_URL) {
  console.error('❌ Falta DATABASE_URL en .env');
  process.exit(1);
}

// URL para conectar a la DB "postgres" y poder hacer DROP/CREATE
const adminUrl = LOCAL_URL.replace(/\/[^/?#]+([?#]|$)/, '/postgres$1');

const tmpDir = mkdtempSync(join(tmpdir(), 'neon-restore-'));
const dumpPath = join(tmpDir, 'neon-dump.sql');

try {
  console.log('📥 Haciendo dump desde Neon...');
  execSync(`pg_dump "${NEON_URL}" --no-owner --no-acl -f "${dumpPath}"`, {
    stdio: 'inherit',
    maxBuffer: 100 * 1024 * 1024,
  });

  console.log('🔄 Restaurando en base local (recreando DB)...');

  // Terminar conexiones y recrear la DB
  const dbName = 'sinco_academic';
  execSync(
    `psql "${adminUrl}" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();" 2>/dev/null || true`,
    { stdio: 'pipe' }
  );
  execSync(`psql "${adminUrl}" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${dbName};"`, {
    stdio: 'inherit',
  });
  execSync(`psql "${adminUrl}" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${dbName};"`, {
    stdio: 'inherit',
  });

  console.log('📤 Cargando dump en base local...');
  execSync(`psql "${LOCAL_URL}" -v ON_ERROR_STOP=1 -f "${dumpPath}"`, {
    stdio: 'inherit',
    maxBuffer: 100 * 1024 * 1024,
  });

  console.log('✅ Data de Neon restaurada en base local.');
} catch (err) {
  console.error('❌ Error:', (err as Error).message);
  process.exit(1);
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
