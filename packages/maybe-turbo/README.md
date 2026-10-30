# maybe-turbo

Runs a package script through [Turborepo](https://turborepo.dev) unless it's already running inside Turborepo.

> **TL;DR:** Think of Turborepo as a monad. `maybe-turbo` lifts a script into it: outside Turborepo it wraps the command in `turbo run`, and inside Turborepo, where the script already is, it runs the command as is. Turborepo inside Turborepo flattens to a single run, so the script runs in Turborepo exactly once.

Prefix a script with `maybe-turbo`, and `pnpm run <script>` gets the task's `dependsOn` prerequisites and caching from `turbo.jsonc`, without pnpm `pre`/`post` hooks.

```jsonc
// package.json
"scripts": {
  "build": "maybe-turbo next build --webpack"
}
```

```jsonc
// turbo.jsonc
"tasks": {
  "build": {
    "dependsOn": ["^build", "codegen"],
    "outputs": [".next/**", "!.next/cache/**"]
  }
}
```

Running `pnpm build` now runs `codegen` first and restores `build` from the cache when its inputs haven't changed.

## Why

Pre/post hooks and `&&` chains hide task ordering from Turborepo, so it can't cache or parallelize the steps. Moving the ordering into `dependsOn` fixes that. However, a script run directly (`pnpm build` in the package, a Vercel build command, a CI step) then skips its prerequisites. `maybe-turbo` keeps those entry points working.

## How it works

Turborepo sets `TURBO_HASH` in the environment of every task it runs.

- **Outside Turborepo** (`TURBO_HASH` isn't set), `maybe-turbo` runs `turbo run <script> --filter=<package>`. Turborepo runs the prerequisites, then runs the same script again.
- **Inside Turborepo** (`TURBO_HASH` is set), `maybe-turbo` runs the wrapped command directly.

The script name and package come from the `npm_lifecycle_event` and `npm_package_name` variables that pnpm sets, so `maybe-turbo` only works when run from a `package.json` script.

## Setup

Add the package to the workspace package that uses it:

```json
"devDependencies": {
  "maybe-turbo": "workspace:*"
}
```

Then define a task in `turbo.jsonc` (the package's or the root's) for every script you wrap. Otherwise `turbo run` fails with `Could not find task`.

## Usage

### Simple commands

Write the command after `maybe-turbo` as you normally would. Quoted arguments are preserved:

```json
"test:smoke": "maybe-turbo vitest -t \"prod smoke test\""
```

### Compound commands

Put commands that use `&&`, `||`, `;` or `|` in one quoted argument. `maybe-turbo` runs it through the shell:

```json
"typecheck": "maybe-turbo \"next typegen && tsc --noEmit\""
```

`maybe-turbo` exits with an error if it finds an operator outside the quotes. Otherwise the shell would run the rest of the chain twice: once inside Turborepo and once after it.

### Tasks that only group dependencies

With no command, `maybe-turbo` does nothing inside Turborepo. Use it for scripts that exist only to run other tasks:

```json
"codegen": "maybe-turbo"
```

```jsonc
"codegen": {
  "dependsOn": ["codegen:graphql", "codegen:types"]
}
```

### Extra arguments

Arguments added after the script name are forwarded to the wrapped command, outside Turborepo through `turbo run … -- <args>`:

```sh
pnpm run embeddings --refresh
```

Turborepo passes these arguments only to the task you ran, not to its dependencies.

## Things to know

- **Strict env mode.** Turborepo only passes environment variables that are declared in the task's `env` or `passThroughEnv`. A script that worked with a pnpm hook can fail under Turborepo if it reads an undeclared variable.
- **Cache hits skip side effects.** On a cache hit, Turborepo restores outputs and logs without running the command. Keep side effects such as uploads and deploys in uncached tasks (`"cache": false`) or outside Turborepo entirely.
- **Nested runs execute directly.** A wrapped script called from inside another Turborepo task (for example `pnpm --filter=docs run build:guides-markdown` from another package's build) sees `TURBO_HASH` and runs without its prerequisites. Declare the dependency in `turbo.jsonc` instead.
- **Gitignored generated files.** Turborepo's default inputs skip gitignored files. If a task reads files written by an uncached task, list them in `inputs` (for example `["$TURBO_DEFAULT$", "content/generated/**"]`), or a cache hit can restore output built from stale content.
