---
title = "Supabase CLI: \"failed SASL auth\" or \"invalid SCRAM server-final-message\""
topics = [ "auth", "cli", "database", "supavisor" ]
keywords = []
database_id = "4a32736f-1d7f-4c41-9c96-ab84e35ad394"
---

When executing `supabase db push` or `supabase link` or any other authenticated actions from the Supabase CLI, you might encounter an authentication error with messages such as `failed SASL auth (invalid SCRAM server-final-message received from server)`.

**Why This Occurs:**
This typically indicates an authentication failure where the database connection pooler (Supavisor) in certain scenarios may be incorrectly caching credentials for the internal Supabase role `cli_login_postgres` used for password-less flows with the CLI. This can lead to the your IP being temporarily banned from repeated failed attempts to connect.

**To resolve this, consider one of the following solutions:**

1.  **Check Network Bans:**

    - Navigate to your project's [Database Settings](/dashboard/project/_/database/settings) page.
    - Review any listed IP addresses that are blocked. Remove any entries that correspond to your current connection and then try the CLI action again.

2.  **Use the old Password-Based authentication flow instead:**

    - Provide your database password directly through an environment variable when running the CLI command.

    ```bash
    SUPABASE_DB_PASSWORD=<your-database-password> supabase db push
    ```

3.  **Skip the Pooler and connect directly to the database with the Supabase CLI (Requires IPv6):**

    - If your network supports IPv6, you can use the beta CLI version with the `--skip-pooler` flag to bypass the connection pooler to avoid this particular issue.

    ```bash
    npx supabase@beta link --skip-pooler
    npx supabase@beta db push
    ```
