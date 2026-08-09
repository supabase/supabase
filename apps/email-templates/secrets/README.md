# Runtime secrets

Run `./scripts/container-init.sh` to create `templates_api_token` with mode `0600`.

The initialization script creates these optional files empty:

- `resend_api_key` — required only when `ENABLE_SEND=true` and `EMAIL_PROVIDER=resend`.
- `email_webhook_secret` — required only when `ENABLE_SEND=true` and `EMAIL_PROVIDER=webhook`.

Never commit files in this directory.

The host directory remains mode `0700`; secret files are mode `0444` so the non-root container user can read the bind-mounted Docker secrets. To update one:

```bash
chmod 600 secrets/resend_api_key
printf %s 'NEW_KEY' > secrets/resend_api_key
chmod 444 secrets/resend_api_key
docker compose --env-file .env.container restart templates
```
