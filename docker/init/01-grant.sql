-- Asegura que el usuario de la app tenga todos los permisos en la DB y schema public.
-- Se ejecuta solo la primera vez que se crea el volumen (contenedor nuevo).
GRANT ALL PRIVILEGES ON DATABASE sinco_academic TO sinco;
\c sinco_academic
GRANT ALL ON SCHEMA public TO sinco;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sinco;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sinco;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sinco;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sinco;
