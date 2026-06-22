---
id: 'generating-types'
title: 'Generating TypeScript Types'
description: 'How to generate types for your API and Supabase libraries.'
subtitle: 'How to generate types for your API and Supabase libraries.'
tocVideo: '/7CqlTU9aOR4'
---

Supabase APIs are generated from your database, which means that we can use database introspection to generate type-safe API definitions.

## Generating types from project dashboard

Supabase allows you to generate and download TypeScript types directly from the [project dashboard](/dashboard/project/_/api?page=tables-intro).

## Generating types using Supabase CLI

The Supabase CLI is a single binary Go application that provides everything you need to setup a local development environment.

You can [install the CLI](https://www.npmjs.com/package/supabase) via npm or other supported package managers. The minimum required version of the CLI is [v1.8.1](https://github.com/supabase/cli/releases).

```bash
npm i supabase@">=1.8.1" --save-dev
```

Login with your Personal Access Token:

```bash
npx supabase login
```

Before generating types, ensure you initialize your Supabase project:

```bash
npx supabase init
```

Generate types for your project to produce the `database.types.ts` file:

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > database.types.ts
```

or in case of local development:

```bash
npx supabase gen types typescript --local > database.types.ts
```

or in case of a self-hosted instance (see [Accessing Postgres](/docs/guides/self-hosting/docker#accessing-postgres) for more information):

```bash
npx supabase gen types typescript --db-url postgres://postgres.[POOLER_TENANT_ID]:[POSTGRES_PASSWORD]@[your-domain-or-ip]:5432/postgres --schema public > database.types.ts
```

These types are generated from your database schema. Given a table `public.movies`, the generated types will look like:

```sql
create table public.movies (
  id bigint generated always as identity primary key,
  name text not null,
  data jsonb null
);
```

```ts ./database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          // the data expected from .select()
          id: number
          name: string
          data: Json | null
        }
        Insert: {
          // the data to be passed to .insert()
          id?: never // generated columns must not be supplied
          name: string // `not null` columns with no default must be supplied
          data?: Json | null // nullable columns can be omitted
        }
        Update: {
          // the data to be passed to .update()
          id?: never
          name?: string // `not null` columns are optional on .update()
          data?: Json | null
        }
      }
    }
  }
}
```

## Using TypeScript type definitions

You can supply the type definitions to `supabase-js` like so:

```ts ./index.tsx
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
)
```

## Helper types for tables and joins

You can use the following helper types to make the generated TypeScript types easier to use.

Sometimes the generated types are not what you expect. For example, a view's column may show up as nullable when you expect it to be `not null`. Using [type-fest](https://github.com/sindresorhus/type-fest), you can override the types like so:

```ts ./database-generated.types.ts
export type Json = // ...

export interface Database {
  // ...
}
```

```ts ./database.types.ts
import { MergeDeep } from 'type-fest'
import { Database as DatabaseGenerated } from './database-generated.types'
export { Json } from './database-generated.types'

// Override the type for a specific column in a view:
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        movies_view: {
          Row: {
            // id is a primary key in public.movies, so it must be `not null`
            id: number
          }
        }
      }
    }
  }
>
```

<Admonition type="note">

To use `MergeDeep`, set `compilerOptions.strictNullChecks` to `true` in your `tsconfig.json`.

</Admonition>

## Enhanced type inference for JSON fields

Starting from [supabase-js v2.48.0](https://github.com/supabase/supabase-js/releases/tag/v2.48.0), you can define custom types for JSON fields and get enhanced type inference when using JSON selectors with the `->` and `->>` operators. This makes your code more type-safe and intuitive when working with JSON/JSONB columns.

### Defining custom JSON types

You can extend your generated database types to include custom JSON schemas using `MergeDeep`:

```ts ./database.types.ts
import { MergeDeep } from 'type-fest'
import { Database as DatabaseGenerated } from './database-generated.types'

// Define your custom JSON type
type CustomJsonType = {
  foo: string
  bar: { baz: number }
  en: 'ONE' | 'TWO' | 'THREE'
}

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        your_table: {
          Row: {
            data: CustomJsonType | null
          }
          // Optional: Use if you want type-checking for inserts and updates
          // Insert: {
          //   data?: CustomJsonType | null;
          // };
          // Update: {
          //   data?: CustomJsonType | null;
          // };
        }
      }
      Views: {
        your_view: {
          Row: {
            data: CustomJsonType | null
          }
        }
      }
    }
  }
>
```

### Type-safe JSON querying

Once you've defined your custom JSON types, TypeScript will automatically infer the correct types when using JSON selectors:

```ts
const res = await client.from('your_table').select('data->bar->baz, data->en, data->bar')

if (res.data) {
  console.log(res.data)
  // TypeScript infers the shape of your JSON data:
  // [
  //   {
  //     baz: number;
  //     en: 'ONE' | 'TWO' | 'THREE';
  //     bar: { baz: number };
  //   }
  // ]
}
```

This feature works with:

- Single-level JSON access: `data->foo`
- Nested JSON access: `data->bar->baz`
- Text extraction: `data->>foo` (returns string)
- Mixed selections combining multiple JSON paths

The type inference automatically handles the difference between `->` (returns JSON) and `->>` (returns text) operators, ensuring your TypeScript types match the actual runtime behavior.

You can also override the type of an individual successful response if needed:

```ts
// Partial type override allows you to only override some of the properties in your results
const { data } = await supabase.from('countries').select().overrideTypes<Array<{ id: string }>>()
// For a full replacement of the original return type use the `{ merge: false }` property as second argument
const { data } = await supabase
  .from('countries')
  .select()
  .overrideTypes<Array<{ id: string }>, { merge: false }>()
// Use it with `maybeSingle` or `single`
const { data } = await supabase.from('countries').select().single().overrideTypes<{ id: string }>()
```

### Type shorthands

The generated types provide shorthands for accessing tables and enums.

```ts ./index.ts
import { Database, Tables, Enums } from "./database.types.ts";

// Before 😕
let movie: Database['public']['Tables']['movies']['Row'] = // ...

// After 😍
let movie: Tables<'movies'>
```

### Response types for complex queries

`supabase-js` always returns a `data` object (for success), and an `error` object (for unsuccessful requests).

These helper types provide the result types from any query, including nested types for database joins.

Given the following schema with a relation between cities and countries:

```sql
create table countries (
  "id" serial primary key,
  "name" text
);

create table cities (
  "id" serial primary key,
  "name" text,
  "country_id" int references "countries"
);
```

We can get the nested `CountriesWithCities` type like this:

```ts
import { QueryResult, QueryData, QueryError } from '@supabase/supabase-js'

const countriesWithCitiesQuery = supabase.from('countries').select(`
  id,
  name,
  cities (
    id,
    name
  )
`)
type CountriesWithCities = QueryData<typeof countriesWithCitiesQuery>

const { data, error } = await countriesWithCitiesQuery
if (error) throw error
const countriesWithCities: CountriesWithCities = data
```

## Update types automatically with GitHub Actions

One way to keep your type definitions in sync with your database is to set up a GitHub action that runs on a schedule.

Add the following script to your `package.json` to run it using `npm run update-types`

```json
"update-types": "npx supabase gen types --lang=typescript --project-id \"$PROJECT_REF\" > database.types.ts"
```

Create a file `.github/workflows/update-types.yml` with the following snippet to define the action along with the environment variables. This script will commit new type changes to your repo every night.

```yaml
name: Update database types

on:
  schedule:
    # sets the action to run daily. You can modify this to run the action more or less frequently
    - cron: '0 0 * * *'

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
      PROJECT_REF: <your-project-id>
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm run update-types
      - name: check for file changes
        id: git_status
        run: |
          echo "status=$(git status -s)" >> $GITHUB_OUTPUT
      - name: Commit files
        if: ${{contains(steps.git_status.outputs.status, ' ')}}
        run: |
          git add database.types.ts
          git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git commit -m "Update database types" -a
      - name: Push changes
        if: ${{contains(steps.git_status.outputs.status, ' ')}}
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref }}
```

Alternatively, you can use a community-supported GitHub action: [`generate-supabase-db-types-github-action`](https://github.com/lyqht/generate-supabase-db-types-github-action).

## Resources

- [Generating Supabase types with GitHub Actions](https://blog.esteetey.dev/how-to-create-and-test-a-github-action-that-generates-types-from-supabase-database)
