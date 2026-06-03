// Supabase self-hosted web hosting agent.
//
// A small, dependency-free privileged sidecar. Studio calls it over the internal
// Docker network with a bearer token to apply/remove per-site nginx server blocks
// and reload nginx. It is the ONLY component with access to the Docker socket
// (used solely to send nginx a SIGHUP) — Studio never touches the socket itself.

import http from 'node:http'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const PORT = Number(process.env.HOSTING_AGENT_PORT ?? 9000)
const TOKEN = process.env.HOSTING_AGENT_TOKEN ?? ''
const SITES_DIR = process.env.NGINX_SITES_DIR ?? '/etc/nginx/sites'
const NGINX_CONTAINER = process.env.NGINX_CONTAINER_NAME ?? 'supabase-nginx'
const KONG_UPSTREAM = process.env.KONG_UPSTREAM ?? 'kong_upstream'
const DOCKER_SOCKET = process.env.DOCKER_SOCKET ?? '/var/run/docker.sock'

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*$/
const DOMAIN_REGEX = /^[a-zA-Z0-9.-]+$/
const DOCROOT_REGEX = /^[A-Za-z0-9._/-]+$/

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isAuthorized(req) {
  if (!TOKEN) return false
  const header = req.headers['authorization'] ?? ''
  return header === `Bearer ${TOKEN}`
}

/** Validates and normalizes a site definition, throwing on bad input. */
function validateSite(site) {
  const slug = String(site?.slug ?? '')
  if (!SLUG_REGEX.test(slug)) throw new Error('Invalid slug')

  const domain = String(site?.domain ?? '')
  if (!DOMAIN_REGEX.test(domain)) throw new Error('Invalid domain')

  const docroot = String(site?.docroot ?? slug)
  if (!DOCROOT_REGEX.test(docroot) || docroot.includes('..')) throw new Error('Invalid docroot')

  const tls = ['off', 'acme', 'byo'].includes(site?.tls) ? site.tls : 'off'
  return {
    slug,
    domain,
    docroot,
    tls,
    spaFallback: site?.spaFallback !== false,
    apiProxy: site?.apiProxy === true,
  }
}

function apiProxyBlock() {
  const headers = `        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;`

  return `
    location /rest/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
    }

    location /auth/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
    }

    location /functions/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
    }

    location /graphql/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
    }

    location /storage/v1/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 0;
    }

    location /realtime/v1/ {
        proxy_pass http://${KONG_UPSTREAM};
${headers}
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
`
}

/** Renders a complete nginx server block (or two, when TLS is enabled). */
function renderSiteConfig(site) {
  const root = `/var/www/${site.docroot}`
  const fallback = site.spaFallback ? '/index.html' : '=404'
  const proxy = site.apiProxy ? apiProxyBlock() : ''

  const serveBlockBody = `    server_tokens off;
    root ${root};
    index index.html;

    location / {
        try_files $uri $uri/ ${fallback};
    }
${proxy}`

  if (site.tls === 'off') {
    return `# Managed by Supabase Studio — site "${site.slug}"
server {
    listen 80;
    listen [::]:80;
    server_name ${site.domain};

${serveBlockBody}
}
`
  }

  // TLS (acme/byo): redirect 80 -> 443 and serve over HTTPS. jonasal/nginx-certbot
  // auto-requests certs for server_names whose cert paths it finds (acme); for byo
  // place the cert files at the same path manually.
  return `# Managed by Supabase Studio — site "${site.slug}"
server {
    listen 80;
    listen [::]:80;
    server_name ${site.domain};
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${site.domain};

    ssl_certificate /etc/letsencrypt/live/${site.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${site.domain}/privkey.pem;

${serveBlockBody}
}
`
}

/** Atomically writes a site config (temp file + rename) to avoid a half-written include. */
async function writeSiteConfig(site) {
  await mkdir(SITES_DIR, { recursive: true })
  const target = path.join(SITES_DIR, `${site.slug}.conf`)
  const tmp = `${target}.tmp`
  await writeFile(tmp, renderSiteConfig(site), 'utf8')
  await rename(tmp, target)
}

async function removeSiteConfig(slug) {
  if (!SLUG_REGEX.test(slug)) throw new Error('Invalid slug')
  await rm(path.join(SITES_DIR, `${slug}.conf`), { force: true })
}

/** Sends SIGHUP to the nginx container via the Docker Engine API (graceful reload). */
function reloadNginx() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath: DOCKER_SOCKET,
        path: `/containers/${encodeURIComponent(NGINX_CONTAINER)}/kill?signal=HUP`,
        method: 'POST',
      },
      (res) => {
        res.resume()
        // 204 = signal sent. 404 = container not found (nginx not running yet).
        if (res.statusCode === 204) resolve()
        else reject(new Error(`nginx reload failed (status ${res.statusCode})`))
      }
    )
    req.on('error', reject)
    req.end()
  })
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { status: 'ok' })
    }

    if (!isAuthorized(req)) {
      return sendJson(res, 401, { error: 'Unauthorized' })
    }

    if (req.method === 'POST' && req.url === '/sites/apply') {
      const site = validateSite(await readJsonBody(req))
      await writeSiteConfig(site)
      await reloadNginx()
      return sendJson(res, 200, { status: 'applied', slug: site.slug })
    }

    if (req.method === 'POST' && req.url === '/sites/remove') {
      const { slug } = await readJsonBody(req)
      await removeSiteConfig(String(slug ?? ''))
      await reloadNginx()
      return sendJson(res, 200, { status: 'removed', slug })
    }

    if (req.method === 'POST' && req.url === '/reload') {
      await reloadNginx()
      return sendJson(res, 200, { status: 'reloaded' })
    }

    return sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    return sendJson(res, 400, { error: error instanceof Error ? error.message : 'Unknown error' })
  }
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`hosting-agent listening on :${PORT}`)
})
