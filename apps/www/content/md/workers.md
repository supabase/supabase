# Supabase Workers

> Run AI-agent sandboxes and production backends on one runtime, next to your database. Now in Private Alpha.

Supabase Workers is a fully managed compute service built for agentic development. Use it as a sandbox platform offering short-lived, isolated environments to execute untrusted code with SSH access, or as a place to run always-on HTTP services written in any language. Every Worker runs in the same region and network as your primary Postgres database.

## Key Features

- **Two workload shapes**: ephemeral sandboxes for untrusted code and always-on HTTP services, on one runtime
- **Any language**: Node, Python, Deno, Rust, static binaries, or any Dockerfile — no wrapper scripts or glue code
- **Next to your database**: same region and network as Postgres, with single-digit-millisecond queries
- **Scale to zero**: idle Workers suspend automatically and resume in under a second
- **No wall-clock limits**: jobs and pipelines run as long as the work takes
- **Preconfigured trust boundary**: access control via Supabase Auth with short-lived credentials; Workers reach the database and Storage with the permissions carried by their key
- **Per-worker firewalls**: define which external services and ports each Worker can reach
- **Cloaked secrets**: scope secrets per Worker; optionally have Supabase inject values only on requests to approved services
- **Automatic patching and dependency scanning**: kernel security patches applied automatically; runtime alerts for newly disclosed vulnerabilities
- **Safe releases**: branching, progressive rollouts, automatic rollback on bad deploys, and auto-scaling
- **Built-in observability**: execution logs, traces, audit logs, and usage metrics in the Supabase dashboard

## Deployment

- Supabase CLI: `supabase workers deploy`
- MCP server: agents provision and manage Workers programmatically
- Management API: script deployments from any environment
- GitHub Actions: ready-made CI/CD workflows
- Workers skill: teach your coding agent the full surface

## Common Use Cases

- Sandboxes for AI agents executing untrusted code
- Agent frameworks and long-running agent sessions
- Transcription, embedding, and data pipelines without runtime limits
- Always-on HTTP APIs and backend services
- Background jobs and scheduled work
- MCP server hosting

## Availability

Workers is in Private Alpha behind a waitlist. Existing Edge Functions keep running unchanged; because Workers supports the Deno runtime, functions can migrate as-is when you choose.

## Links

- Product page: https://supabase.com/workers
