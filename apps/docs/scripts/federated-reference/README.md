# Federated reference (beta)

Fetches reference definitions from library repos into `content/reference-beta/`, rendered at `/docs/reference-beta`. Runs before `build` (`build:federated-reference`).

```
content/reference-beta/
  server/
    index.md            authored here: introduction, then the definitions list
    definitions/*.md    fetched, one file per definition
  javascript/v1/        an older version: same shape, its own route
```

## Add a library or version

Add a file under `sources/` that default-exports a `FederatedReferenceSource` (see `types.ts`). Each version sets:

- `path`: where it is mounted under `content/reference-beta`, e.g. `server` or `javascript/v1`
- `ref`: `{ branch: 'main' }` for the latest, `{ tag }` for a pinned version, or `{ latestTag: { pattern } }`
- `definitionsDir`: the directory in the library repo that holds the definition files

Then author `content/reference-beta/<path>/index.md` (see `index.schema.json`).

## Check a library's output

Definitions are Markdown with YAML frontmatter. The fetch validates every file and fails listing all that don't conform. Libraries can run the same check in their own CI against the published JSON Schemas:

- `content/reference-beta/definition.schema.json`
- `content/reference-beta/index.schema.json`

Both are generated from `features/reference-beta/ReferenceBeta.schema.ts`. After changing it, run `pnpm run reference-beta:schema`; a test fails if they are stale. The file name must also match the definition's `id`, which JSON Schema can't express.
