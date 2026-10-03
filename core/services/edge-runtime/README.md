# Supabase Edge Runtime

A web server based on [Deno](https://deno.land) runtime, capable of running
JavaScript, TypeScript, and WASM services. Edge Runtime is built and maintained
by the [Supabase team](https://supabase.io). For more details, read the
[intro blog post](https://supabase.com/blog/edge-runtime-self-hosted-deno-functions).

You can use it to:

- Locally test and self-host Supabase's Edge Functions (or any Deno Function)
- As a programmable HTTP Proxy: You can intercept / route HTTP requests

**WARNING: Beta Software. There will be breaking changes to APIs / Configuration
Options**

## Architecture

![Sequence diagram of Edge Runtime request flow](assets/edge-runtime-diagram.svg?raw=true)

The edge runtime can be divided into two runtimes with different purposes.

- Main runtime:
  - An instance for the _main runtime_ is responsible for proxying the
    transactions to the _user runtime_.
  - The main runtime is meant to be an entry point before running user
    functions, where you can authentication, etc. before calling the user
    function.
  - Has no user-facing limits
  - Has access to all environment variables.
- User runtime:
  - An instance for the _user runtime_ is responsible for executing users' code.
  - Limits are required to be set such as: Memory and Timeouts.
  - Has access to environment variables explictly allowed by the main runtime.

## Developers

To learn how to build / test Edge Runtime, visit [DEVELOPERS.md](DEVELOPERS.md)

## Contributions

We welcome contributions to Supabase Edge Runtime!

To get started either open an issue on
[GitHub](https://github.com/supabase/edge-runtime/issues) or drop us a message
on [Discord](https://discord.supabase.com)

Edge Runtime follows Supabase's
[Code of Conduct](https://github.com/supabase/.github/blob/main/CODE_OF_CONDUCT.md).
