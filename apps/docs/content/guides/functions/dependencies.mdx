---
id: 'functions-import-maps'
title: 'Managing dependencies'
description: 'Managing packages and dependencies.'
subtitle: 'Handle dependencies within Edge Functions.'
tocVideo: 'ILr3cneZuFk'
---

## Importing dependencies

Supabase Edge Functions support several ways to import dependencies:

- JavaScript modules from npm (https://docs.deno.com/examples/npm/)
- Built-in [Node APIs](https://docs.deno.com/runtime/manual/node/compatibility)
- Modules published to [JSR](https://jsr.io/) or [deno.land/x](https://deno.land/x)

```ts
// NPM packages (recommended)
import { createClient } from 'npm:@supabase/supabase-js@2'

// Node.js built-ins
import process from 'node:process'

// JSR modules (Deno's registry)
import path from 'jsr:@std/path@1.0.8'
```

### Using `deno.json` (recommended)

Each function should have its own `deno.json` file to manage dependencies and configure Deno-specific settings. This ensures proper isolation between functions and is the recommended approach for deployment. When you update the dependencies for one function, it won't accidentally break another function that needs different versions.

```json
{
  "imports": {
    "supabase": "npm:@supabase/supabase-js@2",
    "lodash": "https://cdn.skypack.dev/lodash"
  }
}
```

You can add this file directly to the function’s own directory:

```bash
└── supabase
    ├── functions
    │   ├── function-one
    │   │   ├── index.ts
    │   │   └── deno.json    # Function-specific Deno configuration
    │   └── function-two
    │       ├── index.ts
    │       └── deno.json    # Function-specific Deno configuration
    └── config.toml
```

<Admonition type="caution">

It's possible to use a global `deno.json` in the `/supabase/functions` directory for local development, but this approach is not recommended for deployment. Each function should maintain its own configuration to ensure proper isolation and dependency management.

</Admonition>

### Using import maps (legacy)

Import Maps are a legacy way to manage dependencies, similar to a `package.json` file. While still supported, we recommend using `deno.json`. If both exist, `deno.json` takes precedence.

Each function should have its own `import_map.json` file for proper isolation:

```json
# /function-one/import_map.json
{
  "imports": {
    "lodash": "https://cdn.skypack.dev/lodash"
  }
}
```

This JSON file should be located within the function’s own directory:

```bash
└── supabase
    ├── functions
    │   ├── function-one
    │   │   ├── index.ts
    │   │   └── import_map.json    # Function-specific import map
```

<Admonition type="caution">

It's possible to use a global `import_map.json` in the `/supabase/functions` directory for local development, but this approach is not recommended for deployment. Each function should maintain its own configuration to ensure proper isolation and dependency management.

</Admonition>

If you’re using import maps with VSCode, update your `.vscode/settings.json` to point to your function-specific import map:

```json
{
  "deno.enable": true,
  "deno.unstable": ["bare-node-builtins", "byonm"],
  "deno.importMap": "./supabase/functions/function-one/import_map.json"
}
```

You can override the default import map location using the `--import-map <string>` flag with serve and deploy commands, or by setting the `import_map` property in your `config.toml` file:

```toml
[functions.my-function]
import_map = "./supabase/functions/function-one/import_map.json"
```

---

## Private NPM packages

To use private npm packages, create a `.npmrc` file within your function’s own directory.

<Admonition type="note">This feature requires Supabase CLI version 1.207.9 or higher.</Admonition>

```bash
└── supabase
    └── functions
        └── my-function
            ├── index.ts
            ├── deno.json
            └── .npmrc       # Function-specific npm configuration
```

<Admonition type="caution">

It's possible to use a global `.npmrc` in the `/supabase/functions` directory for local development, but this approach is not recommended for deployment. Each function should maintain its own configuration to ensure proper isolation and dependency management.

</Admonition>

Add your registry details in the `.npmrc` file. Follow [this guide](https://docs.npmjs.com/cli/v10/configuring-npm/npmrc) to learn more about the syntax of npmrc files.

```bash
# /my-function/.npmrc
@myorg:registry=https://npm.registryhost.com
//npm.registryhost.com/:_authToken=VALID_AUTH_TOKEN
```

After configuring your `.npmrc`, you can import the private package in your function code:

```bash
import package from 'npm:@myorg/private-package@v1.0.1'
```

---

## Using a custom NPM registry

<Admonition type="info">This feature requires Supabase CLI version 2.2.8 or higher.</Admonition>

Some organizations require a custom NPM registry for security and compliance purposes. In such cases, you can specify the custom NPM registry to use via `NPM_CONFIG_REGISTRY` environment variable.

You can define it in the project's `.env` file or directly specify it when running the deploy command:

```bash
NPM_CONFIG_REGISTRY=https://custom-registry/ supabase functions deploy my-function
```

---

## Importing types

If your [environment is set up properly](/docs/guides/functions/development-environment) and the module you're importing is exporting types, the import will have types and autocompletion support.

Some npm packages may not ship out of the box types and you may need to import them from a separate package. You can specify their types with a `@deno-types` directive:

```tsx
// @deno-types="npm:@types/express@^4.17"
import express from 'npm:express@^4.17'
```

To include types for built-in Node APIs, add the following line to the top of your imports:

```tsx
/// <reference types="npm:@types/node" />
```
