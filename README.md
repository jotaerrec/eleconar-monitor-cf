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

Pasos recomendados para esta app:

1. Crear una base y usuario dedicados en tu PostgreSQL compartido.
2. Configurar `DATABASE_URL` y `AUTH_SECRET`.
3. Construir la imagen.
4. Correr el contenedor de la app apuntando al PostgreSQL existente.

En produccion deja `AUTH_COOKIE_SECURE=true` o simplemente no la definas si vas detras de HTTPS.

Ejemplo:

```bash
docker build -t monelc-app .
docker run -d \
  --name monelc-app \
  -p 3000:3000 \
  -e DATABASE_URL='postgresql://monelc:tu_password@tu_host_postgres:5432/monelc' \
  -e AUTH_SECRET='cambia-este-secreto' \
  -e AUTH_COOKIE_SECURE='true' \
  --restart unless-stopped \
  monelc-app
```

## Endpoints

- `POST /api/webhook`
- `GET /api/events/[namecompany]`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
