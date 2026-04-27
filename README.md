# Job Platform — Microservice Architecture

```
react-fe (React + Vite)
    ↓ HTTP
┌───────────────────────────────────┐
│  graphql-bff (Apollo Server)      │  document-service (Express HTTP)
│       ↓ gRPC                      │  :5000 — file upload & download
├─────────────────┬─────────────────┼──────────────────┬─────────────────────┐
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

| Service              | Port  | Protocol | DB              | Description                                      |
| -------------------- | ----- | -------- | --------------- | ------------------------------------------------ |
| company-service      | 50051 | gRPC     | company_db      | Companies, reviews, interview experiences         |
| job-service          | 50052 | gRPC     | job_db          | Jobs + applications                               |
| user-service         | 50053 | gRPC     | user_db         | Users (talent/job hunters) + auth                 |
| subscription-service | 50054 | gRPC     | subscription_db | Plans, usage limits                               |
| document-service     | 5000  | HTTP     | —               | File upload & download (CVs)                      |
| graphql-bff          | 4000  | HTTP     | —               | GraphQL gateway → gRPC (circuit breaker, tracing) |
| react-fe             | 3000  | HTTP     | —               | React SPA                                         |
| postgres             | 5450  | TCP      | —               | Shared PostgreSQL (4 databases)                   |
| nats                 | 4222  | TCP      | —               | Message broker (async events)                     |
| jaeger               | 16686 | HTTP     | —               | Distributed tracing UI                            |

## Subscription Plans

| Plan               | Price     | Limit                 |
| ------------------ | --------- | --------------------- |
| TALENT_HUNTER_FREE | Free      | 10 job posts/month    |
| TALENT_HUNTER_PRO  | $30/month | Unlimited job posts   |
| JOB_HUNTER_FREE    | Free      | 10 job applies/month  |
| JOB_HUNTER_PRO     | $5/month  | Unlimited job applies |

## Document Service (CV Upload)

The `document-service` is a standalone HTTP microservice for file storage. Unlike the other backend services (which use gRPC), it uses plain HTTP since browsers need to upload/download files directly.

**Endpoints:**

| Method | Path               | Auth   | Description                           |
| ------ | ------------------ | ------ | ------------------------------------- |
| POST   | `/upload`          | JWT    | Upload a file (PDF/DOC/DOCX, max 5MB) |
| GET    | `/documents/:file` | Public | Download a previously uploaded file   |
| GET    | `/health`          | Public | Health check                          |

**Upload request:**

```bash
curl -X POST http://localhost:5000/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@resume.pdf"
# → { "url": "/documents/abc123.pdf", "filename": "abc123.pdf", "size": 102400 }
```

**How it works:**

- Job hunters attach a CV (PDF or Word) when applying for a job
- The frontend uploads directly to `document-service` (bypasses the BFF)
- The returned URL is saved as `resumeUrl` in the application record via GraphQL
- Talent hunters see a "Download CV" link when viewing applications on their dashboard
- Files are stored on disk in a Docker volume (`doc-uploads`) for persistence

---

## Development (hot-reload)

Start the full stack with auto-reload on code changes:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**What you get:**

- Edit backend `.ts` files → service auto-restarts (`tsx --watch`)
- Edit React `.jsx` files → browser updates instantly (Vite HMR)
- No Docker rebuild needed for code changes (source is volume-mounted)

**Access:**
| URL | What |
|-----|------|
| http://localhost:3001 | React frontend (dev) |
| http://localhost:4000/graphql | GraphQL playground |
| http://localhost:5000 | Document service (file upload/download) |
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
  company.proto                #   Companies, reviews, interview experiences
  job.proto                    #   Jobs + applications
  user.proto                   #   Users + auth
  subscription.proto           #   Plans + usage tracking
scripts/
  proto-gen.sh                 # Generate TS from .proto files (protoc + ts-proto)
shared/
  proto-generated/             # Auto-generated TS from protoc (do not edit)
  proto-types/                 # Re-exports + PromiseClient interfaces
  src/                         # Shared modules (logger, health, events, etc.)
services/
  company-service/             # gRPC service → company_db (TypeScript)
  job-service/                 # gRPC service → job_db (TypeScript)
  user-service/                # gRPC service → user_db (TypeScript)
  subscription-service/        # gRPC service → subscription_db (TypeScript)
  document-service/            # HTTP service — file upload & download (CVs)
graphql-bff/                   # Apollo Server → all gRPC services
react-fe/                      # React + Vite SPA
docker-compose.yml             # Production stack
docker-compose.dev.yml         # Dev overrides (hot-reload via tsx --watch)
e2e-tests/                     # Playwright end-to-end tests (53 tests)
k8s/                           # Kubernetes manifests
.github/workflows/ci.yml       # CI/CD pipeline
NewFeature.md                  # Step-by-step guide for adding new features
```

## Proto-Gen Workflow

All service contracts are defined in `.proto` files and compiled to TypeScript:

```bash
# Regenerate TypeScript from proto definitions
bash scripts/proto-gen.sh
```

This runs `protoc` with `ts-proto` to generate `shared/proto-generated/*.ts` containing:
- TypeScript interfaces for all messages
- `encode()` / `decode()` / `fromPartial()` for each message
- `ServiceDefinition` + `ServiceServer` types for gRPC

After generating, update `shared/proto-types/*.ts` to re-export new types and add methods to the `PromiseClient` interface.

## E2E Tests (Playwright)

End-to-end tests covering all user flows for unauthenticated users, job hunters, and talent hunters.

### Setup

```bash
cd e2e-tests
npm install
npx playwright install chromium
```

### Run

```bash
# Headless (CI-friendly)
npx playwright test

# With Playwright UI (interactive test runner)
npx playwright test --ui

# With visible browser
npx playwright test --headed

# Step-through debugger
npx playwright test --debug
```

### Test Suites

| Suite                   | File                              | Tests | Coverage                                                        |
| ----------------------- | --------------------------------- | ----- | --------------------------------------------------------------- |
| Unauthenticated         | `unauthenticated.spec.js`         | 8     | Home, jobs, companies, pricing, login/register pages            |
| Job Hunter              | `job-hunter.spec.js`              | 14    | Register, login, browse/filter/apply jobs, dashboard, subscribe |
| Talent Hunter           | `talent-hunter.spec.js`           | 12    | Register + company, post job, dashboard, view applications      |
| Cross-Role              | `cross-role.spec.js`              | 5     | TH posts job → JH applies → TH sees application, company filter |
| Reviews                 | `reviews.spec.js`                 | 7     | Submit review, star ratings, average rating, role restrictions   |
| Interview Experiences   | `interview-experiences.spec.js`   | 7     | Submit experience, difficulty, avg difficulty, role restrictions |

**Total: 53 tests**

> **Note:** Tests run against `http://127.0.0.1:3001` (Vite dev server). Make sure Docker services are up before running.
