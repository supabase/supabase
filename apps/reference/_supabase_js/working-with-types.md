---
id: typescript-support
---

# Typescript Support

`supabase-js` supports Typescript.

## Generating types

You can use our CLI to generate types:

```bash
supabase start
supabase gen types typescript --local > lib/database.types.ts
```

These types are generated directly from your database. Given a table `public.movies`, the definition will provide the following data:

```ts
interface Database {
  public: {
    Tables: {
      movies: {
        Row: {} // The data expected to be returned from a "select" statement.
        Insert: {} // The data expected passed to an "insert" statement.
        Update: {} // The data expected passed to an "update" statement.
      }
    }
  }
}
```

There is a different between `selects`, `inserts`, and `updates`, because often you will set default values in your database for specific columns.
With default values you do not need to send any data over the network, even if that column is a "required" field. Our type system is granular
enough to handle these situations.

## Injecting type definitions

You can enrich the supabase client with the types you generated with Supabase.

```ts
import { createClient } from '@supabase/supabase-js'
import { Database } from 'lib/database.types'

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

## Type hints

`supabase-js` always returns a `data` object (for success), and an `error` response (for unsuccessful requests).
This provides a simple interface to get the relevant types returned from any function:

```ts
export async function getMovies() {
  return await supabase.from('movies').select(`id, title`)
}

type MoviesResponse = Awaited<ReturnType<typeof getMovies>>
export type MoviesResponseSuccess = MoviesResponse['data']
export type MoviesResponseError = MoviesResponse['error']
```

## Nested tables

For advanced queries such as nested tables, you may want to construct your own types.

```ts
import supabase from '~/lib/supabase'
import type { Database } from '~/lib/database.types'

async function getMovies() {
  return await supabase.from('movies').select('id, title, actors(*)')
}

type actors = Database['public']['Tables']['actors']['Row']
type MoviesResponse = Awaited<ReturnType<typeof getMovies>>
type MoviesResponseSuccess = MoviesResponse['data'] & {
  actors: actors[]
}
```
