# MONELC

Aplicacion Next.js para monitorear maquinas por empresa, con autenticacion propia y persistencia en PostgreSQL.

## Variables de entorno

Copiar `.env.example` a `.env.local` para desarrollo fuera de Docker:

```bash
DATABASE_URL=postgresql://monelc:monelc@localhost:5432/monelc
AUTH_SECRET=change-this-auth-secret
AUTH_COOKIE_SECURE=false
```

## Correr local con Docker

Levanta la app y PostgreSQL:

```bash
docker compose up --build
```

Servicios:

- App: [http://localhost:3000](http://localhost:3000)
- PostgreSQL: `localhost:5433`

La app crea las tablas automaticamente al iniciar.

## Correr local sin Docker

1. Tener PostgreSQL disponible y configurar `DATABASE_URL`.
2. Instalar dependencias:

```bash
npm ci
```

3. Levantar desarrollo:

```bash
npm run dev
```

## Produccion en VPS

Con 2 GB de RAM conviene usar una sola instancia de PostgreSQL compartida entre apps y separar por base de datos o usuarios.

Esquema recomendado:

- PostgreSQL nativo instalado en Ubuntu
- Docker solo para la app
- Sin contenedor `postgres` en produccion

Pasos recomendados para esta app:

1. Crear una base y usuario dedicados en tu PostgreSQL compartido.
2. Configurar `DATABASE_URL` y `AUTH_SECRET`.
3. Construir y correr solo la app.

En produccion deja `AUTH_COOKIE_SECURE=true` o simplemente no la definas si vas detras de HTTPS.

### Opcion prolija con Docker Compose

Usa [docker-compose.prod.yml](C:/Users/Javi/Desktop/ELC-NEXT-PRUEBARAPIDA/Eleconar-Test-Webhook/docker-compose.prod.yml), que levanta solo la app y usa el PostgreSQL nativo de la VPS por `127.0.0.1`.

```bash
cd ~/eleconar-monitor-cf
cat > .env.prod <<'EOF'
DATABASE_URL=postgresql://monelc:tu_password@127.0.0.1:5432/monelc
AUTH_SECRET=cambia-este-secreto-largo
AUTH_COOKIE_SECURE=false
EOF

sudo docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Con dominio y HTTPS, cambia:

```bash
AUTH_COOKIE_SECURE=true
```

Verificacion:

```bash
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml ps
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f app
curl http://127.0.0.1:3000
```

### Opcion directa con docker run

```bash
cd ~/eleconar-monitor-cf
sudo docker build -t monelc-app .
sudo docker run -d \
  --name monelc-app \
  --network host \
  -e DATABASE_URL='postgresql://monelc:tu_password@127.0.0.1:5432/monelc' \
  -e AUTH_SECRET='cambia-este-secreto-largo' \
  -e AUTH_COOKIE_SECURE='false' \
  --restart unless-stopped \
  monelc-app
```

### Si habias levantado Postgres en Docker por error

```bash
sudo docker compose down
sudo docker rm -f monelc-postgres 2>/dev/null || true
sudo docker volume rm eleconar-test-webhook_postgres_data 2>/dev/null || true
```

## Endpoints

- `POST /api/webhook`
- `GET /api/events/[namecompany]`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
