---
name: turbo-scripts
description: Conventions for package.json scripts and turbo.jsonc tasks in the monorepo. Use
  when adding, changing or reviewing scripts in any apps/* or packages/* package.json, any
  turbo.jsonc (root or per-package), pre/post hooks, script chains (&&, run-p), maybe-turbo,
  or turbo task inputs, outputs, env and caching. Includes an audit script that flags scripts
  that should use maybe-turbo.
---

# Turbo scripts

Task ordering belongs in `turbo.jsonc` (`dependsOn`), not in `package.json`. pnpm `pre`/`post` hooks and `&&`/`run-p` chains hide steps from turbo, so it can't cache or parallelize them, and running the script through turbo can run them twice. `apps/docs` is the reference implementation.

## Audit first

Run the audit for every package you touch, before and after your change:

```sh
node .agents/skills/turbo-scripts/scripts/audit.mjs apps/docs
```

It lists each turbo task the package can run (its own `turbo.jsonc` plus the root's) and reports:

- `NEEDS maybe-turbo`: the task has same-package `dependsOn` entries, but the script isn't wrapped.
- `pre/post hooks to migrate`: `pre<name>`/`post<name>` scripts. `preinstall` is ignored.
- `scripts that call other scripts`: chains such as `pnpm a && pnpm b` or `run-p a b`. An alias that calls a single script with extra args or env (`pnpm run embeddings --refresh`) isn't reported.
- `maybe-turbo scripts with no turbo task`: `turbo run` fails for these with `Could not find task`.

Fix every finding in the package you're changing, or tell the user why one stays.

## Rules

### Ordering

- Express ordering as `dependsOn` in the package's `turbo.jsonc`. Remove the hook or chain it replaces.
- Wrap a script with `maybe-turbo` (from `packages/maybe-turbo`; add `"maybe-turbo": "workspace:*"` to `devDependencies`) when its task has same-package `dependsOn` entries. Outside turbo, `pnpm <script>` then runs `turbo run <script> --filter=<package>`, so prerequisites still run. Leaf scripts with no dependencies don't need it.
- Put compound commands in one quoted argument: `"typecheck": "maybe-turbo \"next typegen && tsc --noEmit\""`. `maybe-turbo` exits with an error if `&&`, `||`, `;` or `|` appears outside the quotes.
- A task that only groups other tasks gets a bare `"<name>": "maybe-turbo"` script, so `pnpm <name>` still works.
- Every wrapped script needs a task in `turbo.jsonc` (the package's or the root's).
- When you override `dependsOn` for a root task such as `build` or `typecheck`, keep `^build` / `^typecheck`.
- Persistent sidecars that must run next to `dev` (for example `velite dev`) go in the task's `with` key, not `run-p`.

### Caching

- Declare `outputs` for every cacheable task that writes files. If two tasks write into the same directory, list only each task's own files.
- Mark tasks that fetch remote content or check local state as `"cache": false`.
- Default `inputs` skip gitignored files, and plain globs are hashed when `turbo` starts, before any task runs. A task that reads gitignored files written by an uncached task must list them in `jit` mode, or a cache hit can restore output built from stale content:

  ```jsonc
  "inputs": ["$TURBO_DEFAULT$", { "mode": "jit", "globs": ["content/guides/**"] }]
  ```

- Keep generated output deterministic (sorted keys, stable order). A tracked file that a task rewrites differently on every run invalidates the whole package's cache.

### Env

- Turbo runs tasks in strict env mode, which drops undeclared variables. Declare every variable the task reads: `env` for values that change the output, `passThroughEnv` for secrets and credentials that don't.
- Check what the script and the modules it imports read (`git grep "process.env"`), including shared packages.

### Side effects

- On a cache hit, turbo restores outputs without running the script. Keep uploads, deploys and database writes in uncached tasks or outside turbo (for example in a `vercel.json` `buildCommand` after `pnpm build`).

### Callers

- Find everything that runs the scripts you change: `.github/workflows`, `vercel.json`, root `package.json`, other apps' scripts, `e2e/*`, and docs/READMEs. A plain `pnpm <script>` keeps working once the script is wrapped with `maybe-turbo`.
- A wrapped script called from inside another turbo task sees `TURBO_HASH` and runs without its prerequisites. Declare the dependency in `turbo.jsonc` instead of calling the script from another script.

## Verify

1. Run the audit again.
2. Check the graph: `pnpm turbo run <task> --filter=<package> --dry=json`.
3. Run the entry point the way callers do, for example `pnpm build` in the package, then run it again and confirm the second run hits the cache. Tasks that use `jit` inputs report `hash: null` in `--dry=json`; that's expected.
