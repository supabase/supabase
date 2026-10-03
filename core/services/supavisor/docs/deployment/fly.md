The `fly.toml` file should be in the `deploy/fly` directory of Supavisor.

Type the following command in your terminal:

```bash
fly launch
```

Choose a name for your app when prompted, then answer "yes" to the following
question:

```bash
Would you like to copy its configuration to the new app? (y/N)
```

Next, select an organization and choose a region. You don't need to deploy the
app yet.

Since the pooler uses an additional port (7654) for the PostgreSQL protocol, you
need to reserve an IP address:

```bash
fly ips allocate-v4
```

Set your app's secrets by running the following command:

```bash
fly secrets set DATABASE_URL="ecto://postgres:postgres@localhost:6432/postgres" \
VAULT_ENC_KEY="some_vault_secret" \
API_JWT_SECRET="some_api_secret" \
METRICS_JWT_SECRET="some_metrics_secret" \
SECRET_KEY_BASE="some_kb_secret"
```

Replace the example values with your actual secrets.

Finally, deploy your app using the following command:

```bash
fly deploy
```

This will deploy your app on Fly.io
