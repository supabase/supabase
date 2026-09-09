# Docs GraphQL Architecture

**Verify against live code** before depending on any path here — check
`apps/docs/resources/` and `rootSchema.ts` for the current query list.

## Overview

The `apps/docs/resources` folder contains the GraphQL endpoint architecture for the docs GraphQL endpoint at `/api/graphql`. It follows a modular pattern where each top-level query is organized into its own folder with consistent file structure.

## Architecture Pattern

Each top-level query lives in its own folder. `error/` is the fullest
example; `*Types.ts` and `*Sync.ts` are optional, and `globalSearch/`
uses a `*Interface.ts` for its polymorphic result type instead. `guide/`,
`reference/`, and `troubleshooting/` hold only model + schema files: they
are result types surfaced through `searchDocs`, registered under `types`
in `rootSchema.ts`, not top-level queries.

```
resources/
├── queryObject/
│   ├── queryObjectModel.ts      # Data models and business logic
│   ├── queryObjectSchema.ts     # GraphQL type definitions
│   ├── queryObjectResolver.ts   # Query resolver and arguments
│   ├── queryObjectTypes.ts      # TypeScript interfaces (optional)
│   └── queryObjectSync.ts       # Functions for syncing repo content to the database (optional)
├── utils/
│   ├── connections.ts         # GraphQL connection/pagination utilities
│   └── fields.ts              # GraphQL field selection utilities
├── rootSchema.ts              # Main GraphQL schema with all queries
└── rootSync.ts                # Root sync script for syncing to database
```

## Folders and top-level queries

| Folder             | Exposes                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| `globalSearch/`    | **searchDocs** — vector search across all docs content                               |
| `error/`           | **error** (single code lookup) and **errors** (paginated collection)                 |
| `guide/`           | `Guide` result type (search result), no top-level query                              |
| `reference/`       | `ReferenceCLICommand`, `ReferenceManagementApi`, `ReferenceSDKFunction` result types |
| `troubleshooting/` | `Troubleshooting` result type                                                        |
| `rootSchema.ts`    | **schema** — introspection, plus the root that spreads the query objects above       |

## Key Files

### `rootSchema.ts`

- Main GraphQL schema definition
- Imports all resolvers and combines them into the root query
- Defines the `RootQueryType` with all top-level fields

### `utils/connections.ts`

- Provides `createCollectionType()` for paginated collections
- `GraphQLCollectionBuilder` for building collection responses
- Standard pagination arguments and edge/node patterns

### `utils/fields.ts`

- `graphQLFields()` utility to analyze requested fields in resolvers
- Used for optimizing data fetching based on what fields are actually requested

## Creating a New Top-Level Query

To add a new GraphQL query, follow these steps:

### 1. Create Query Folder Structure

```bash
mkdir resources/newQuery
touch resources/newQuery/newQueryModel.ts
touch resources/newQuery/newQuerySchema.ts
touch resources/newQuery/newQueryResolver.ts
```

### 2. Define GraphQL Schema (`newQuerySchema.ts`)

```typescript
import { GraphQLObjectType, GraphQLString } from 'graphql'

export const GRAPHQL_FIELD_NEW_QUERY = 'newQuery' as const

export const GraphQLObjectTypeNewQuery = new GraphQLObjectType({
  name: 'NewQuery',
  description: 'Description of what this query returns',
  fields: {
    id: {
      type: GraphQLString,
      description: 'Unique identifier',
    },
    // Add other fields...
  },
})
```

### 3. Create Data Model (`newQueryModel.ts`)

> [!NOTE]
> The data model should be agnostic to GraphQL. It may import argument types
> from `~/__generated__/graphql`, but otherwise all functions and classes
> should be unaware of whether they are called for GraphQL resolution.

> [!TIP]
> The types in `~/__generated__/graphql` for a new endpoint will not exist
> until the code generation in step 6 has run.

```typescript
import { type RootQueryTypeNewQueryArgs } from '~/__generated__/graphql'
import { convertPostgrestToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { supabase } from '~/lib/supabase'

export class NewQueryModel {
  constructor(
    public readonly data: {
      id: string
      // other properties...
    }
  ) {}

  static async loadData(
    args: RootQueryTypeNewQueryArgs,
    requestedFields: Array<string>
  ): Promise<Result<NewQueryModel[], ApiErrorGeneric>> {
    // Implement data fetching logic
    const result = new Result(
      await supabase().from('your_table').select('*')
      // Add filters based on args
    )
      .map((data) => data.map((item) => new NewQueryModel(item)))
      .mapError(convertPostgrestToApiError)
    return result
  }
}
```

### 4. Write the resolver (`newQueryResolver.ts`)

Mirror `error/errorResolver.ts`: wrap the model call in
`Result.tryCatchFlat(..., convertUnknownToApiError, args)`, log and
`Sentry.captureException` non-user errors, and return a `GraphQLError`
whose message is `'Internal Server Error'` when `error.isPrivate()`. For
paginated results use `paginationArgs`, `createCollectionType()`, and
`GraphQLCollectionBuilder.create()` from `utils/connections.ts`. Export a
root-field object keyed by the field constant:

```typescript
export const newQueryRoot = {
  [GRAPHQL_FIELD_NEW_QUERY]: {
    description: 'What this query returns',
    args: { id: { type: new GraphQLNonNull(GraphQLString) } },
    type: GraphQLObjectTypeNewQuery,
    resolve: resolveNewQuery,
  },
}
```

### 5. Register it in `rootSchema.ts`

Spread the root-field object into `RootQueryType.fields` next to
`...errorRoot`. Object types that are only reachable through an
interface (search results) go in the `types` array instead.

### 6. Run codegen

```bash
cd apps/docs && pnpm run codegen:graphql
```

This prints the schema to `__generated__/schema.graphql`
(`scripts/graphqlSchema.ts`) and runs `graphql-codegen` (`codegen.ts`) to
produce `~/__generated__/graphql` — the `RootQueryType*Args` and resolver
types the model and resolver import. `predev` and `prebuild` run this
automatically.

## Related

- [`app-map.md`](./app-map.md) — where `resources/` sits in the app layout.
- [`llm-agent-surface.md`](./llm-agent-surface.md) — `searchDocs` as an
  agent entry point.
- [`search-embeddings.md`](./search-embeddings.md) — the offline pipeline
  that populates what `searchDocs` queries.
- [`build-pipeline.md`](./build-pipeline.md) — where `codegen:graphql` runs
  in `predev` / `prebuild`.
