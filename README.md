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
```

## Services

| Service | Port | DB | Description |
|---------|------|----|-------------|
| company-service | 50051 | company_db | Company CRUD |
| job-service | 50052 | job_db | Jobs + applications |
| user-service | 50053 | user_db | Users (talent/job hunters) + auth |
| subscription-service | 50054 | subscription_db | Plans, usage limits |
| graphql-bff | 4000 | — | GraphQL gateway → gRPC |
| react-fe | 3000 | — | React SPA |

## Subscription Plans

| Plan | Price | Limit |
|------|-------|-------|
| TALENT_HUNTER_FREE | Free | 10 job posts/month |
| TALENT_HUNTER_PRO | $30/month | Unlimited job posts |
| JOB_HUNTER_FREE | Free | 10 job applies/month |
| JOB_HUNTER_PRO | $5/month | Unlimited job applies |

## Quick Start

```bash
# Run everything with Docker
docker compose up --build

# Access
# Frontend: http://localhost:3000
# GraphQL Playground: http://localhost:4000/graphql
```

## Local Development

```bash
# Install all dependencies
npm run install:all

# Start databases (Docker)
docker compose up company-db job-db user-db subscription-db -d

# Run services (each in a separate terminal)
npm run dev:company
npm run dev:job
npm run dev:user
npm run dev:subscription
npm run dev:bff
npm run dev:fe
```

## Project Structure

```
protos/                        # Protobuf contracts (source of truth)
  company.proto
  job.proto
  user.proto
  subscription.proto
services/
  company-service/             # gRPC service → company_db
  job-service/                 # gRPC service → job_db (jobs + applications)
  user-service/                # gRPC service → user_db (auth + profiles)
  subscription-service/        # gRPC service → subscription_db (plans + usage)
graphql-bff/                   # Apollo Server → all gRPC services
react-fe/                      # React + Vite SPA
docker-compose.yml             # Full stack orchestration
```
