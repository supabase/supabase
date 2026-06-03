# Supabase hosting agent

Privileged sidecar for the self-hosted **Sites** product (static/SPA web hosting).
Studio calls this agent over the internal Docker network to manage nginx site
config; the agent is the only component allowed to touch the Docker socket.

## Why a separate agent?

Generating nginx server blocks and reloading nginx are privileged, host-level
operations. Rather than mount the Docker socket into Studio (which would grant
Studio effective root on the host), those operations live here behind a tiny,
token-authenticated HTTP API. Studio holds no host privileges.

## API

All routes except `/health` require `Authorization: Bearer $HOSTING_AGENT_TOKEN`.

| Method | Path           | Body                                                                 | Action |
| ------ | -------------- | -------------------------------------------------------------------- | ------ |
| GET    | `/health`      | —                                                                    | Liveness probe |
| POST   | `/sites/apply` | `{ slug, domain, docroot?, spaFallback?, tls?, apiProxy? }`          | Render + write `sites/<slug>.conf`, reload nginx |
| POST   | `/sites/remove`| `{ slug }`                                                           | Delete `sites/<slug>.conf`, reload nginx |
| POST   | `/reload`      | —                                                                    | Reload nginx |

- `tls`: `off` (HTTP, good for local/dev), `acme` (Let's Encrypt via the
  nginx-certbot image), or `byo` (place certs at `/etc/letsencrypt/live/<domain>/`).
- `apiProxy`: when `true`, the site also proxies `/rest`, `/auth`, `/storage`,
  `/functions`, `/graphql`, `/realtime/v1/` to Kong for a same-origin front+back.

## Configuration

| Env                    | Default          | Purpose |
| ---------------------- | ---------------- | ------- |
| `HOSTING_AGENT_TOKEN`  | — (required)     | Shared bearer token with Studio |
| `HOSTING_AGENT_PORT`   | `9000`           | Listen port |
| `NGINX_SITES_DIR`      | `/etc/nginx/sites` | Where site configs are written (shared volume) |
| `NGINX_CONTAINER_NAME` | `supabase-nginx` | Container to send SIGHUP to |
| `KONG_UPSTREAM`        | `kong_upstream`  | Upstream name for the API proxy block |

## FTPS (optional)

The `ftps` service in `docker-compose.nginx.yml` is behind the `ftps` profile and
disabled by default. To enable it you must provide a TLS certificate and ensure
the passive port range (`40000-40009`) is reachable, then run with
`--profile ftps`. SFTP (the `sftp` service) is recommended and enabled by default.
