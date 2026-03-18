# Docker Runbook (MERN-RealTime-Messagers-Platform)

## 1) Objective
Containerize the full project so it can run with Docker using:
- One backend container
- One frontend container (Nginx serving React build)
- One PostgreSQL container

## 2) Files Created
- `backend/Dockerfile`
- `client/Dockerfile`
- `client/nginx.conf`
- `.dockerignore`
- `docker-compose.yml`
- `.env.docker`
- `.env.docker.example`

## 3) How Each File Was Created

### `backend/Dockerfile`
Created as a backend runtime image:
1. Uses `node:20-alpine`
2. Installs production dependencies with `npm ci --omit=dev`
3. Copies backend source
4. Exposes port `3001` 
5. Starts with `npm start`

### `client/Dockerfile` + `client/nginx.conf`
Created as a frontend build + serve image:
1. Build stage uses `node:20-alpine` and runs `npm run build`
2. Runtime stage uses `nginx:alpine`
3. Copies built `dist` to `/usr/share/nginx/html`
4. Nginx serves SPA and proxies:
   - `/api/*` -> `backend:3001`
   - `/socket.io/*` -> `backend:3001`

### `.dockerignore`
Created to exclude unnecessary files from Docker build context:
- `**/node_modules`
- `**/dist`
- `.git`, `.gitignore`
- local env files

### `docker-compose.yml`
Created with three services:
1. **postgres**
   - Image: `postgres:16-alpine`
   - Loads user/password/db from env vars
   - Uses a named volume for persistent data
   - Includes health check using `pg_isready`
2. **backend**
   - Built from `backend/Dockerfile`
   - Depends on healthy postgres
   - Reads env values from `.env.docker`
   - Host/container mapping: `3002:3001`
3. **frontend**
   - Built from `client/Dockerfile`
   - Depends on backend
   - Host/container mapping: `8080:80`

### `.env.docker`
Created as runtime environment values for Docker Compose:
- Node env and app port
- Postgres host/user/password/database
- JWT values
- frontend origin

### `.env.docker.example`
Created as a shareable template for teammates.

## 4) Commands Used

### Validate Compose Config
```powershell
docker compose --env-file .env.docker config
```

### Build and Start
```powershell
docker compose --env-file .env.docker up -d --build
```

### Check Running Services
```powershell
docker compose --env-file .env.docker ps
```

### View Logs
```powershell
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f frontend
```

### Stop Services
```powershell
docker compose --env-file .env.docker down
```

## 5) Verification
- App URL: `http://localhost:8080`
- API Health URL: `http://localhost:8080/health`

Expected health response:
```json
{"message":"Server is healthy","status":"OK"}
```

## 6) Issues Faced and Fixes

### Issue 1: Env file not found
Error:
`couldn't find env file: C:\Users\HP\.env.docker`

Cause:
- Command was run from `C:\Users\HP` instead of project root.

Fix:
- Run compose from `C:\Users\HP\Desktop\chatApplication\MERN-RealTime-Messagers-Platform`.

### Issue 2: Port 3001 already in use
Error:
- Port bind failure for `0.0.0.0:3001`

Cause:
- Existing local Node process already listening on 3001.

Fix:
- Updated compose app mapping from `3001:3001` to `3002:3001`.

## 7) Current State
- `chat-postgres`: running and healthy
- `chat-backend`: running
- `chat-frontend`: running
- Docker images created for backend and frontend and visible in `docker image ls`
