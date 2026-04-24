# Job Platform — Microservice Architecture

```
react-fe (React + Vite)
    ↓ HTTP
graphql-bff (Apollo Server)
    ↓ gRPC
┌─────────────────┬─────────────────┬──────────────────┬─────────────────────┐
│ company-service  │  job-service    │  user-service    │ subscription-service│
│ :50051           │  :50052         │  :50053          │ :50054              │
│ company_db       │  job_db         │  user_db         │ subscription_db     │
└─────────────────┴─────────────────┴──────────────────┴─────────────────────┘
         └──────────────── PostgreSQL (shared) ─────────────────┘
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 20+ (only if running without Docker)

## Services

| Service              | Port  | DB              | Description                       |
| -------------------- | ----- | --------------- | --------------------------------- |
| company-service      | 50051 | company_db      | Company CRUD                      |
| job-service          | 50052 | job_db          | Jobs + applications               |
| user-service         | 50053 | user_db         | Users (talent/job hunters) + auth |
| subscription-service | 50054 | subscription_db | Plans, usage limits               |
| graphql-bff          | 4000  | —               | GraphQL gateway → gRPC            |
| react-fe             | 3000  | —               | React SPA                         |
| postgres             | 5450  | —               | Shared PostgreSQL (4 databases)   |
| nats                 | 4222  | —               | Message broker (async events)     |
| jaeger               | 16686 | —               | Distributed tracing UI            |

## Subscription Plans

| Plan               | Price     | Limit                 |
| ------------------ | --------- | --------------------- |
| TALENT_HUNTER_FREE | Free      | 10 job posts/month    |
| TALENT_HUNTER_PRO  | $30/month | Unlimited job posts   |
| JOB_HUNTER_FREE    | Free      | 10 job applies/month  |
| JOB_HUNTER_PRO     | $5/month  | Unlimited job applies |

---

## Development (hot-reload)

Start the full stack with auto-reload on code changes:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**What you get:**

- Edit backend `.js` files → service auto-restarts (nodemon)
- Edit React `.jsx` files → browser updates instantly (Vite HMR)
- No Docker rebuild needed for code changes

**Access:**
| URL | What |
|-----|------|
| http://localhost:3000 | React frontend |
| http://localhost:4000/graphql | GraphQL playground |
| http://localhost:16686 | Jaeger tracing UI |

**Stop:**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

---

## Production (local)

Build and run optimized containers:

```bash
docker compose up --build -d
```

**Access:**
| URL | What |
|-----|------|
| http://localhost:3000 | React app (nginx) |
| http://localhost:4000/graphql | GraphQL API |
| http://localhost:16686 | Jaeger tracing UI |

**Stop:**

```bash
docker compose down
```

**Stop and delete all data:**

```bash
docker compose down -v
```

---

## Production (cloud deployment)

### Option A: Single VPS (cheapest, ~$10-20/mo)

1. Get a VPS (DigitalOcean, Hetzner, AWS EC2) with Docker installed
2. Copy the project to the server
3. Create `.env` file from `.env.example` with real secrets
4. Run:

```bash
docker compose up -d --build
```

5. Add a reverse proxy (Caddy/nginx) for HTTPS

### Option B: Kubernetes (~$35-85/mo)

K8s manifests are in `k8s/`. Deploy order:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml        # Edit with real passwords first!
kubectl apply -f k8s/databases/
kubectl apply -f k8s/services/
```

See [k8s/README.md](k8s/README.md) for details.

---

## Connecting to the Database

Single shared PostgreSQL with 4 databases:

| Database        | Host      | Port |
| --------------- | --------- | ---- |
| company_db      | localhost | 5450 |
| job_db          | localhost | 5450 |
| user_db         | localhost | 5450 |
| subscription_db | localhost | 5450 |

**Credentials:** `postgres` / `postgres`

```bash
# Quick terminal access
docker compose exec postgres psql -U postgres -d job_db -c "SELECT * FROM jobs;"
```

---

## Environment Variables

See `.env.example` for all configurable values. Key ones:

| Variable                      | Default                   | Description         |
| ----------------------------- | ------------------------- | ------------------- |
| `JWT_SECRET`                  | `change-me-in-production` | JWT signing key     |
| `POSTGRES_PASSWORD`           | `postgres`                | Database password   |
| `NATS_URL`                    | `nats://nats:4222`        | NATS message broker |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://jaeger:4318`      | Tracing collector   |

---

## Project Structure

```
protos/                        # Protobuf contracts (source of truth)
  company.proto
  job.proto
  user.proto
  subscription.proto
shared/                        # Shared modules (logger, health, events, etc.)
services/
  company-service/             # gRPC service → company_db
  job-service/                 # gRPC service → job_db (jobs + applications)
  user-service/                # gRPC service → user_db (auth + profiles)
  subscription-service/        # gRPC service → subscription_db (plans + usage)
graphql-bff/                   # Apollo Server → all gRPC services
react-fe/                      # React + Vite SPA
docker-compose.yml             # Production stack
docker-compose.dev.yml         # Dev overrides (hot-reload)
k8s/                           # Kubernetes manifests
.github/workflows/ci.yml       # CI/CD pipeline
```
