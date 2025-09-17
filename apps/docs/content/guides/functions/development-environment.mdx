---
id: 'development-environment'
title: 'Development Environment'
description: 'Get the best Edge Functions experience with the right local developer environment.'
subtitle: 'Set up your local development environment for Edge Functions.'
tocVideo: 'lFhU3L8VoSQ'
---

<Admonition type="note">

Before getting started, make sure you have the Supabase CLI installed. Check out the [CLI installation guide](/docs/guides/cli) for installation methods and troubleshooting.

</Admonition>

---

## Step 1: Install Deno CLI

The Supabase CLI doesn't use the standard Deno CLI to serve functions locally. Instead, it uses its own Edge Runtime to keep the development and production environment consistent.

You can follow the [Deno guide](https://deno.com/manual@v1.32.5/getting_started/setup_your_environment) for setting up your development environment with your favorite editor/IDE.

The benefit of installing Deno separately is that you can use the Deno LSP to improve your editor's autocompletion, type checking, and testing. You can also use Deno's built-in tools such as `deno fmt`, `deno lint`, and `deno test`.

After installing, you should have Deno installed and available in your terminal. Verify with `deno --version`

---

## Step 2: Set up your editor

Set up your editor environment for proper TypeScript support, autocompletion, and error detection.

### VSCode/Cursor (recommended)

1. **Install the Deno extension** from the VSCode marketplace
2. **Option 1: Auto-generate (easiest)**
   When running `supabase init`, select `y` when prompted "Generate VS Code settings for Deno? [y/N]"
3. **Option 2: Manual setup**

   Create a `.vscode/settings.json` in your project root:

   ```json
   {
     "deno.enablePaths": ["./supabase/functions"],
     "deno.importMap": "./supabase/functions/import_map.json"
   }
   ```

This configuration enables the Deno language server only for the `supabase/functions` folder, while using VSCode's built-in JavaScript/TypeScript language server for all other files.

---

### Multi-root workspaces

The standard `.vscode/settings.json` setup works perfectly for projects where your Edge Functions live alongside your main application code. However, you might need multi-root workspaces if your development setup involves:

- **Multiple repositories:** Edge Functions in one repo, main app in another
- **Microservices:** Several services you need to develop in parallel

For this development workflow, create `edge-functions.code-workspace`:

<$CodeSample
path="/edge-functions/edge-functions.code-workspace"
meta="edge-functions.code-workspace"
language="json"
/>

You can find the complete example on [GitHub](https://github.com/supabase/supabase/tree/master/examples/edge-functions).

---

## Recommended project structure

It's recommended to organize your functions according to the following structure:

```bash
└── supabase
    ├── functions
    │   ├── import_map.json     # Top-level import map
    │   ├── _shared             # Shared code (underscore prefix)
    │   │   ├── supabaseAdmin.ts # Supabase client with SERVICE_ROLE key
    │   │   ├── supabaseClient.ts # Supabase client with ANON key
    │   │   └── cors.ts         # Reusable CORS headers
    │   ├── function-one        # Use hyphens for function names
    │   │   └── index.ts
    │   └── function-two
    │       └── index.ts
    ├── tests
    │   ├── function-one-test.ts
    │   └── function-two-test.ts
    ├── migrations
    └── config.toml
```

- **Use "fat functions"**. Develop few, large functions by combining related functionality. This minimizes cold starts.
- **Name functions with hyphens (`-`)**. This is the most URL-friendly approach
- **Store shared code in `_shared`**. Store any shared code in a folder prefixed with an underscore (`_`).
- **Separate tests**. Use a separate folder for [Unit Tests](/docs/guides/functions/unit-test) that includes the name of the function followed by a `-test` suffix.

---

## Essential CLI commands

Get familiar with the most commonly used CLI commands for developing and deploying Edge Functions.

### `supabase start`

This command spins up your entire Supabase stack locally: database, auth, storage, and Edge Functions runtime. You're developing against the exact same environment you'll deploy to.

### `supabase functions serve [function-name]`

Develop a specific function with hot reloading. Your functions run at `http://localhost:54321/functions/v1/[function-name]`. When you save your file, you’ll see the changes instantly without having to wait.

Alternatively, use `supabase functions serve` to serve all functions at once.

### `supabase functions serve hello-world --no-verify-jwt`

If you want to serve an Edge Function without the default JWT verification. This is important for webhooks from Stripe, GitHub, etc. These services don't have your JWT tokens, so you need to skip auth verification.

<Admonition type="caution">

Be careful when disabling JWT verification, as it allows anyone to call your function, so only use it for functions that are meant to be publicly accessible.

</Admonition>

### `supabase functions deploy hello-world`

Deploy the function when you’re ready
