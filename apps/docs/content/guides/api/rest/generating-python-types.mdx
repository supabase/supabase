---
id: 'generating-python-types'
title: 'Generating Python Types'
description: 'How to generate Python types for your API and Supabase libraries.'
subtitle: 'How to generate Python types for your API and Supabase libraries.'
---

Supabase APIs are generated from your database, which means that we can use database introspection to generate type-safe API definitions.

## Generating types using Supabase CLI

The Supabase CLI is a single binary Go application that provides everything you need to setup a local development environment.

You can [install the CLI](https://www.npmjs.com/package/supabase) via npm or other supported package managers. The minimum required version of the CLI is [v2.66.0](https://github.com/supabase/cli/releases).

```bash
npm i supabase --save-dev
```

Login with your Personal Access Token:

```bash
npx supabase login
```

Before generating types, ensure you initialize your Supabase project:

```bash
npx supabase init
```

Generate types for your project to produce the `database_types.py` file:

```bash
npx supabase gen types --lang=python --project-id "$PROJECT_REF" --schema public > database.types.py
```

or in case of local development:

```bash
npx supabase gen types --lang=python --local > database_types.py
```

These types are generated from your database schema. Given a table `public.movies`, the generated types will look like:

```sql
create table public.movies (
  id bigint generated always as identity primary key,
  name text not null,
  data jsonb null
);
```

```py ./database_types.py
class PublicMovies(BaseModel):
    data: Optional[Json[Any]] = Field(alias="data")
    id: int = Field(alias="id")
    name: str = Field(alias="name")

class PublicMoviesInsert(TypedDict):
    data: NotRequired[Annotated[Json[Any], Field(alias="data")]]
    id: NotRequired[Annotated[int, Field(alias="id")]]
    name: Annotated[str, Field(alias="name")]

class PublicMoviesUpdate(TypedDict):
    data: NotRequired[Annotated[Json[Any], Field(alias="data")]]
    id: NotRequired[Annotated[int, Field(alias="id")]]
    name: NotRequired[Annotated[str, Field(alias="name")]]
```

## Types for select, insert and update

The `PublicMovies` class is used to parse `SELECT` results from the `movies` table, while `PublicMoviesInsert` and `PublicMoviesUpdate` are used to format and provide completion for arguments for `insert` and `update` respectively.

```py
from .database_types import PublicMovies, PublicMoviesInsert, PublicMoviesUpdate
from supabase import create_client

client = create_client("YOUR_SUPABASE_URL", "YOUR_SUPABASE_KEY")
movies = client.table("movies")

# Select
selected = [PublicMovies(m) for m in movies.select("*").execute().data]

# Insert
inserted = [PublicMovies(m) for m in movies.insert(PublicMoviesInsert(name="foo", data="bar")) \
                                          .execute().data]

# Update
updated  = [PublicMovies(m) for m in movies.update(PublicMoviesUpdate(name="bar")) \
                                        .eq("id", 5) \
                                        .execute().data]
```

## Update types automatically with GitHub Actions

One way to keep your type definitions in sync with your database is to set up a GitHub action that runs on a schedule.

Add the following script to your `package.json` to run it using `npm run update-types`

```json
"update-types": "npx supabase gen types --lang=python --project-id \"$PROJECT_REF\" > database_types.py"
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
          git add database_types.py
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

## Resources

- [Generating Supabase types with GitHub Actions](https://blog.esteetey.dev/how-to-create-and-test-a-github-action-that-generates-types-from-supabase-database)
- [Generating TypeScript Types](/docs/guides/api/rest/generating-types)
