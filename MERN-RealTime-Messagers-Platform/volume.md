# Docker Volume Notes (This Project)

## 1) What is a Docker volume?
A Docker volume is persistent storage managed by Docker.

Simple meaning:
- Container = worker
- Volume = hard drive
- Worker can be deleted and recreated, but hard drive keeps data

---

## 2) Which volume is used in this project?
Volume name:
- postgres_data

It is declared in docker-compose.yml:

```yaml
volumes:
  postgres_data:
```

---

## 3) Which container uses this volume?
The Postgres container uses it.

Service/container:
- service: postgres
- container_name: chat-postgres

Mount mapping in docker-compose.yml:

```yaml
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Meaning:
- Left side (postgres_data) = Docker named volume
- Right side (/var/lib/postgresql/data) = folder inside Postgres container

---

## 4) What is /var/lib/postgresql/data?
This is the default PostgreSQL data folder inside the container.
Postgres stores DB files there (tables, indexes, logs, metadata).

Because this folder is mounted to postgres_data, your DB data stays persistent.

---

## 5) Is volume created inside container?
No.

Correct model:
- Docker engine creates and manages the volume (host side)
- Docker mounts that volume into the Postgres container path
- Postgres reads/writes through that mounted path

So Postgres uses the volume, but Docker owns/creates it.

---

## 6) Why no volume for chat-app?
Because chat-app is usually stateless in production.

- App code is baked into image during build
- App container can be recreated anytime
- Database state must persist, so volume is needed for Postgres

When app volume may be needed:
- Development live-reload with bind mounts
- If app writes important local files (uploads/logs) that must persist

---

## 7) Data flow (simple)
1. chat-app sends query to postgres
2. Postgres writes data at /var/lib/postgresql/data
3. That path is mounted to postgres_data
4. Data persists even if container is recreated

Important:
- It is not two separate copies.
- It is one mounted storage view used by the container.

---

## 8) Containers in this stack
Two main containers:
- chat-app
- chat-postgres

---

## 9) Commands you can use
Start stack:

```bash
docker compose --env-file .env.docker up -d
```

Check running services:

```bash
docker compose ps
```

List volumes:

```bash
docker volume ls
```

Inspect this volume:

```bash
docker volume inspect postgres_data
```

Stop containers but keep data:

```bash
docker compose down
```

Stop and delete containers + volume data:

```bash
docker compose down -v
```

---

## 10) Step-by-step implementation summary
1. Decide Postgres data must persist
2. Declare named volume:
   - postgres_data
3. Mount volume in postgres service:
   - postgres_data:/var/lib/postgresql/data
4. Set Postgres env values (PG_USER, PG_PASSWORD, PG_DATABASE)
5. Run compose up
6. Verify with compose ps and volume ls

---

## Final one-line summary
In this project, postgres_data is the persistent disk for chat-postgres, mounted at /var/lib/postgresql/data, so your database survives container recreation.
