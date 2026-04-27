# Adding a New Feature: Step-by-Step Guide

> **Example feature:** Interview Experience (modeled after the existing Review feature)

This guide walks through the **8 layers** you need to touch when adding a new domain feature to this project. Each step builds on the previous one.

---

## Architecture Refresher

```
React FE  →  GraphQL BFF  →  gRPC Service  →  PostgreSQL
   (3001)       (4000)          (50051)
```

- **Proto-first**: Define the data contract in `.proto` files first, then generate TypeScript.
- **gRPC services**: Backend microservices communicate via gRPC.
- **GraphQL BFF**: Translates GraphQL queries/mutations into gRPC calls.
- **React FE**: Calls the BFF via Apollo Client.

---

## Step 1 — Proto Definition

**File:** `protos/company.proto` (or create a new `.proto` file for a new domain)

1. Add new **RPC methods** to the `service` block:

```protobuf
service CompanyService {
  // ... existing RPCs ...
  rpc CreateInterviewExperience (CreateInterviewExperienceRequest) returns (InterviewExperienceResponse);
  rpc ListInterviewExperiences (ListInterviewExperiencesRequest) returns (ListInterviewExperiencesResponse);
}
```

2. Add **message types** for the entity, request, and response:

```protobuf
message InterviewExperience {
  string id = 1;
  string company_id = 2;
  string user_id = 3;
  string position_title = 4;
  int32 difficulty = 5;
  string result = 6;
  string description = 7;
  string interview_date = 8;
  string created_at = 9;
}

message CreateInterviewExperienceRequest {
  string company_id = 1;
  string user_id = 2;
  string position_title = 3;
  int32 difficulty = 4;
  string result = 5;
  string description = 6;
  string interview_date = 7;
}

message InterviewExperienceResponse {
  InterviewExperience interview_experience = 1;
}

message ListInterviewExperiencesRequest {
  string company_id = 1;
  int32 page = 2;
  int32 limit = 3;
}

message ListInterviewExperiencesResponse {
  repeated InterviewExperience interview_experiences = 1;
  int32 total = 2;
  double average_difficulty = 3;
}
```

**Tips:**
- Follow the existing naming pattern (e.g., `Create___Request` → `___Response`)
- Use `repeated` for list fields
- Use `double` for averages, `int32` for counts
- Proto3 defaults: `""` for strings, `0` for numbers, `false` for bools — there is no `null`

---

## Step 2 — Generate TypeScript from Proto

**Run:**

```bash
bash scripts/proto-gen.sh
```

This uses `protoc` + `ts-proto` to generate `shared/proto-generated/company.ts` with:
- TypeScript interfaces for all messages
- `encode()` / `decode()` / `fromPartial()` for each message
- `CompanyServiceService` (ServiceDefinition) + `CompanyServiceServer` types

**Verify:** Check that the new types appear in `shared/proto-generated/company.ts`.

---

## Step 3 — Update Proto Type Exports

**File:** `shared/proto-types/company.ts`

This file re-exports generated types and defines the `CompanyServicePromiseClient` interface used by the BFF.

1. **Add type re-exports:**

```typescript
export type {
  // ... existing types ...
  InterviewExperience,
  CreateInterviewExperienceRequest,
  InterviewExperienceResponse,
  ListInterviewExperiencesRequest,
  ListInterviewExperiencesResponse,
} from "../proto-generated/company";
```

2. **Add methods to `CompanyServicePromiseClient`:**

```typescript
export interface CompanyServicePromiseClient {
  // ... existing methods ...
  createInterviewExperience(request: CreateInterviewExperienceRequest): Promise<InterviewExperienceResponse>;
  listInterviewExperiences(request: ListInterviewExperiencesRequest): Promise<ListInterviewExperiencesResponse>;
}
```

---

## Step 4 — Database Migration

**File:** `services/company-service/migrations/<timestamp>_create_interview_experiences.js`

```javascript
exports.up = function (knex) {
  return knex.schema.createTable("interview_experiences", (table) => {
    table.uuid("id").primary();
    table.uuid("company_id").notNullable()
      .references("id").inTable("companies").onDelete("CASCADE");
    table.uuid("user_id").notNullable();
    table.string("position_title").notNullable();
    table.integer("difficulty").notNullable();
    table.string("result");
    table.text("description");
    table.date("interview_date");
    table.timestamps(true, true);
    table.unique(["company_id", "user_id", "position_title"]);
    table.index("company_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("interview_experiences");
};
```

**Key points:**
- Migration runs automatically on container start (`npx tsx src/migrate.ts`)
- Use `uuid` for IDs, foreign keys with `CASCADE`
- Add unique constraints to prevent duplicates
- Add indexes on frequently-queried columns

---

## Step 5 — Repository (Data Access Layer)

**File:** `services/company-service/src/repository.ts`

Add three things:

### 5a. Row interface (DB shape)

```typescript
interface InterviewExperienceRow {
  id: string;
  company_id: string;
  user_id: string;
  position_title: string;
  difficulty: number;
  result: string | null;
  description: string | null;
  interview_date: Date | null;
  created_at: Date;
}
```

### 5b. Mapper (DB row → Proto message)

```typescript
function toProtoInterviewExperience(row: InterviewExperienceRow): InterviewExperience {
  return {
    id: row.id,
    companyId: row.company_id,       // snake_case → camelCase
    userId: row.user_id,
    positionTitle: row.position_title,
    difficulty: row.difficulty,
    result: row.result ?? "",         // null → "" (proto3 default)
    description: row.description ?? "",
    interviewDate: row.interview_date
      ? row.interview_date.toISOString().split("T")[0]
      : "",
    createdAt: row.created_at?.toISOString() ?? "",
  };
}
```

### 5c. Repository class

```typescript
export class InterviewExperienceRepository {
  constructor(private readonly db: Knex) {}

  async create(data: CreateInterviewExperienceRequest): Promise<InterviewExperience> {
    const id = uuidv4();
    const [row] = await this.db<InterviewExperienceRow>("interview_experiences")
      .insert({
        id,
        company_id: data.companyId,
        user_id: data.userId,
        position_title: data.positionTitle,
        difficulty: data.difficulty,
        result: data.result || null,        // ⚠️ Use || not ?? (see gotcha below)
        description: data.description || null,
        interview_date: data.interviewDate || null,
      })
      .returning("*");
    return toProtoInterviewExperience(row);
  }

  async list(params: ListInterviewExperiencesRequest): Promise<{...}> {
    // pagination + count + average query (see ReviewRepository for pattern)
  }
}
```

> **⚠️ GOTCHA — `||` vs `??` for optional string fields:**
> Proto3 sends empty string `""` as default (not `null`/`undefined`). If you write `data.result ?? null`, the `""` passes through because `??` only catches `null`/`undefined`. PostgreSQL then rejects `""` for date columns. Use `|| null` which catches all falsy values including `""`.

---

## Step 6 — gRPC Handler (Service Layer)

**File:** `services/company-service/src/server.ts`

1. Import the new repository
2. Instantiate it with the DB connection
3. Add handler methods to the gRPC server implementation:

```typescript
const interviewExpRepo = new InterviewExperienceRepository(db);

// In the server implementation object:
createInterviewExperience: async (call, callback) => {
  try {
    const req = call.request;
    if (req.difficulty < 1 || req.difficulty > 5) {
      return callback({ code: grpc.status.INVALID_ARGUMENT, message: "Difficulty must be 1-5" });
    }
    const experience = await interviewExpRepo.create(req);
    callback(null, { interviewExperience: experience });
  } catch (err: any) {
    if (err.code === "23505") {  // unique constraint violation
      return callback({ code: grpc.status.ALREADY_EXISTS, message: "Already submitted" });
    }
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
},

listInterviewExperiences: async (call, callback) => {
  try {
    const result = await interviewExpRepo.list(call.request);
    callback(null, result);
  } catch (err: any) {
    callback({ code: grpc.status.INTERNAL, message: err.message });
  }
},
```

---

## Step 7 — GraphQL BFF

Three files to update:

### 7a. Schema (`graphql-bff/src/schema.ts`)

```graphql
type InterviewExperience {
  id: ID!
  companyId: ID!
  userId: ID!
  positionTitle: String!
  difficulty: Int!
  result: String
  description: String
  interviewDate: String
  createdAt: String
}

type PaginatedInterviewExperiences {
  interviewExperiences: [InterviewExperience!]!
  total: Int!
  averageDifficulty: Float!
}

# Add to Company type:
type Company {
  # ... existing fields ...
  interviewExperiences: PaginatedInterviewExperiences
}

# Add query:
type Query {
  # ... existing queries ...
  interviewExperiences(companyId: ID!, page: Int, limit: Int): PaginatedInterviewExperiences!
}

# Add mutation:
type Mutation {
  # ... existing mutations ...
  createInterviewExperience(
    companyId: ID!
    positionTitle: String!
    difficulty: Int!
    result: String
    description: String
    interviewDate: String
  ): InterviewExperience!
}
```

### 7b. Query Resolver (`graphql-bff/src/resolvers/queries.ts`)

```typescript
interviewExperiences: async (_: any, args: any, context: any) => {
  const { companyId, page = 1, limit = 20 } = args;
  return context.dataSources.companyClient.listInterviewExperiences({
    companyId, page, limit,
  });
},
```

### 7c. Mutation Resolver (`graphql-bff/src/resolvers/mutations.ts`)

```typescript
createInterviewExperience: async (_: any, args: any, context: any) => {
  requireRole(context, "JOB_HUNTER");  // authorization check
  if (args.difficulty < 1 || args.difficulty > 5) {
    throw new Error("Difficulty must be between 1 and 5");
  }
  const res = await context.dataSources.companyClient.createInterviewExperience({
    companyId: args.companyId,
    userId: context.user.id,
    positionTitle: args.positionTitle,
    difficulty: args.difficulty,
    result: args.result ?? "",
    description: args.description ?? "",
    interviewDate: args.interviewDate ?? "",
  });
  return res.interviewExperience;
},
```

### 7d. Field Resolver (`graphql-bff/src/resolvers/fields.ts`)

```typescript
Company: {
  // ... existing field resolvers ...
  interviewExperiences: async (company: any, _: any, context: any) => {
    try {
      return await context.dataSources.companyClient.listInterviewExperiences({
        companyId: company.id, page: 1, limit: 10,
      });
    } catch {
      return { interviewExperiences: [], total: 0, averageDifficulty: 0 };
    }
  },
},
```

**Note:** The BFF's `clients.ts` has a generic `normalizeServiceDefinition()` that handles proto3 serialization for all field types. No changes needed there for new features.

---

## Step 8 — React Frontend

### 8a. GraphQL Operations (`react-fe/src/graphql/queries.js`)

```javascript
export const GET_INTERVIEW_EXPERIENCES = gql`
  query GetInterviewExperiences($companyId: ID!, $page: Int, $limit: Int) {
    interviewExperiences(companyId: $companyId, page: $page, limit: $limit) {
      interviewExperiences { id positionTitle difficulty result description interviewDate createdAt }
      total
      averageDifficulty
    }
  }
`;

export const CREATE_INTERVIEW_EXPERIENCE = gql`
  mutation CreateInterviewExperience(
    $companyId: ID!, $positionTitle: String!, $difficulty: Int!,
    $result: String, $description: String, $interviewDate: String
  ) {
    createInterviewExperience(
      companyId: $companyId, positionTitle: $positionTitle, difficulty: $difficulty,
      result: $result, description: $description, interviewDate: $interviewDate
    ) { id positionTitle difficulty result description interviewDate }
  }
`;
```

### 8b. Detail Page (`react-fe/src/pages/CompanyDetailPage.jsx`)

- Add `useQuery(GET_INTERVIEW_EXPERIENCES)` with `{ variables: { companyId } }`
- Add `useMutation(CREATE_INTERVIEW_EXPERIENCE)` with `refetchQueries`
- Build the form (position title, difficulty buttons, result select, date, description)
- Display the list of submitted experiences

### 8c. List Page (`react-fe/src/pages/CompaniesPage.jsx`)

- Update `GET_COMPANIES` query to include `interviewExperiences { total }`
- Add "Interviews (N)" link on company cards

---

## Step 9 — E2E Tests

**File:** `e2e-tests/tests/interview-experiences.spec.js`

Write tests in `test.describe.serial` mode (tests share state):

| Test | Purpose |
|------|---------|
| Setup: TH registers | Create Talent Hunter + company |
| Setup: JH registers | Create Job Hunter account |
| IE1: Empty state | Verify "No interview experiences yet" |
| IE2: Submit experience | Fill form, submit, verify success message + list |
| IE3: Average display | Verify average difficulty shows |
| IE4: TH restriction | Talent Hunters shouldn't see the submit form |
| IE5: Unauth access | Unauthenticated users see list but not form |

**Selector tips:**
- Scope form selectors to a `.card` container: `page.locator(".card", { hasText: "Share Interview Experience" })`
- Use `{ exact: true }` for button matching to avoid partial matches (e.g., "Hard" vs "Very Hard")
- Use `page.waitForTimeout(500)` after mutations to let the UI update

---

## Quick Reference: File Checklist

| # | Layer | File(s) |
|---|-------|---------|
| 1 | Proto definition | `protos/<service>.proto` |
| 2 | Code generation | `bash scripts/proto-gen.sh` → `shared/proto-generated/` |
| 3 | Type exports | `shared/proto-types/<service>.ts` |
| 4 | DB migration | `services/<service>/migrations/<timestamp>_<name>.js` |
| 5 | Repository | `services/<service>/src/repository.ts` |
| 6 | gRPC handler | `services/<service>/src/server.ts` |
| 7 | GraphQL BFF | `graphql-bff/src/schema.ts`, `resolvers/queries.ts`, `resolvers/mutations.ts`, `resolvers/fields.ts` |
| 8 | React frontend | `react-fe/src/graphql/queries.js`, `react-fe/src/pages/<Page>.jsx` |
| 9 | E2E tests | `e2e-tests/tests/<feature>.spec.js` |

---

## Common Gotchas

1. **Proto3 empty strings → DB errors:** Use `|| null` (not `?? null`) when inserting optional string fields from proto messages into PostgreSQL. Proto3 default for strings is `""`, and `??` doesn't catch empty strings.

2. **Ambiguous selectors after adding new forms:** When a page now has multiple forms (e.g., Review + Interview Experience), scope test selectors to the containing card using `.locator(".card", { hasText: "..." })`.

3. **Container restart timing:** After rebuilding a service (`docker compose up -d --build <service>`), wait a few seconds before running tests. The `tsx --watch` hot-reload in dev mode picks up source file changes automatically via volume mounts.

4. **Proto field naming:** Proto uses `snake_case`, ts-proto converts to `camelCase`. The mapper function bridges DB `snake_case` ↔ Proto `camelCase`.
