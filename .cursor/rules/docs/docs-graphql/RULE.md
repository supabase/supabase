---
description: "Docs: GraphQL architecture for apps/docs/resources"
globs:
  - apps/docs/resources/**/*.ts
alwaysApply: false
---

# Docs GraphQL Architecture

## Overview

The `apps/docs/resources` folder contains the GraphQL endpoint architecture for the docs GraphQL endpoint at `/api/graphql`. It follows a modular pattern where each top-level query is organized into its own folder with consistent file structure.

## Architecture Pattern

Each GraphQL query follows this structure:

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

## Example queries

1. **searchDocs** (`globalSearch/`) - Vector-based search across all docs content
2. **error** (`error/`) - Error code lookup for Supabase services
3. **schema** - GraphQL schema introspection

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
> until the code generation is run in the next step.

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
      await supabase()
        .from('your_table')
        .select('*')
      // Add filters based on args
    )
      .map((data) => data.map((item) => new NewQueryModel(item)))
      .mapError(convertPostgrestToApiError)
    return result
  }
}
```
