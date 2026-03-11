---
title = "Issues serving Edge Functions locally"
topics = [ "functions", "cli" ]
keywords = [ "local", "serve", "development", "debug", "port", "edge function" ]
database_id = "1cff12df-7ad6-48c5-b518-5ea468b54bab"

[api]
cli = ["supabase-functions-serve"]
---

If `supabase functions serve` fails or you're having trouble running Edge Functions locally, follow these steps to diagnose and resolve the issue.

## Debugging steps

### Use debug mode

Run the serve command with the `--debug` flag for detailed output:

```bash
supabase functions serve your-function --debug
```

### Check port availability

Ensure the required ports are available. The Supabase CLI uses ports `54321` and `8081` by default:

```bash
# Check if port 54321 is in use
lsof -i :54321

# Check if port 8081 is in use
lsof -i :8081
```

If these ports are in use, stop the processes using them or configure different ports.

## Common issues

### Port conflicts

Another process may be using the required ports. Check for:

- Other Supabase projects running locally
- Docker containers
- Other development servers

### Deno cache issues

Clear the Deno cache if you're experiencing module resolution problems:

```bash
deno cache --reload /path/to/function/index.ts
```

### Environment variables

Make sure your `.env` file is properly configured and accessible to the CLI.

## Getting more help

If the problem persists, search the following repositories for similar error messages:

- [Edge Runtime repository](https://github.com/supabase/edge-runtime)
- [CLI repository](https://github.com/supabase/cli)

If the output from these commands does not help resolve the issue, open a support ticket via the Supabase Dashboard (by clicking the "Help" button at the top right) and include all output and details about your commands.

## Additional resources

- [Local development guide](/docs/guides/cli/local-development)
- [Edge Functions quickstart](/docs/guides/functions/quickstart)
- [Debugging Edge Functions](/docs/guides/functions/logging)
