const http = require('http')
const { spawn } = require('child_process')
const crypto = require('crypto')
const { URL } = require('url')

const listenPort = parseInt(process.env.PORT || '3000', 10)
const listenHost = process.env.HOSTNAME || '0.0.0.0'
const targetPort = parseInt(process.env.STUDIO_INTERNAL_PORT || '3001', 10)
const targetHost = '127.0.0.1'
const pgMetaUrl = (process.env.STUDIO_PG_META_URL || 'http://meta:8080').replace(/\/$/, '')
const edgeSecretDescription =
  process.env.EDGE_FUNCTIONS_SECRET_DESCRIPTION ||
  'Managed by Supabase Studio edge function secrets'
const studioProxySecret = process.env.STUDIO_PROXY_SECRET || ''

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function isValidSecretName(name) {
  return typeof name === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(left || '', 'utf8')
  const rightBuffer = Buffer.from(right || '', 'utf8')
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function isAuthorizedSecretsRequest(req) {
  if (!studioProxySecret) return false
  const header = req.headers['x-studio-proxy-secret']
  if (Array.isArray(header)) {
    return header.some((value) => secureEqual(value, studioProxySecret))
  }
  return typeof header === 'string' && secureEqual(header, studioProxySecret)
}

async function executeSql(query) {
  const response = await fetch(`${pgMetaUrl}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const payload = await response.json()
  if (!response.ok) {
    const message =
      payload?.message || payload?.error?.message || 'Failed to execute SQL against pg-meta'
    throw new Error(message)
  }

  return payload
}

async function listSecrets() {
  const query = `
    select
      name,
      encode(digest(decrypted_secret, 'sha256'), 'hex') as value,
      updated_at::text as updated_at
    from vault.decrypted_secrets
    where description = ${sqlLiteral(edgeSecretDescription)}
    order by name
  `

  return await executeSql(query)
}

async function getSecretIdByName(name) {
  const query = `
    select id
    from vault.secrets
    where
      name = ${sqlLiteral(name)}
      and description = ${sqlLiteral(edgeSecretDescription)}
    limit 1
  `

  const rows = await executeSql(query)
  return rows[0]?.id
}

async function upsertSecrets(secrets) {
  for (const secret of secrets) {
    if (!isValidSecretName(secret.name)) {
      throw new Error(`Invalid secret name: ${secret.name}`)
    }
    if (secret.name.startsWith('SUPABASE_')) {
      throw new Error(`Reserved secret name: ${secret.name}`)
    }
    if (typeof secret.value !== 'string' || secret.value.length === 0) {
      throw new Error(`Secret value is required for: ${secret.name}`)
    }

    const existingId = await getSecretIdByName(secret.name)
    const query = existingId
      ? `
        select vault.update_secret(
          secret_id := ${sqlLiteral(existingId)},
          new_secret := ${sqlLiteral(secret.value)},
          new_name := ${sqlLiteral(secret.name)},
          new_description := ${sqlLiteral(edgeSecretDescription)}
        )
      `
      : `
        select vault.create_secret(
          new_secret := ${sqlLiteral(secret.value)},
          new_name := ${sqlLiteral(secret.name)},
          new_description := ${sqlLiteral(edgeSecretDescription)}
        )
      `

    await executeSql(query)
  }

  return await listSecrets()
}

async function removeSecrets(names) {
  const validNames = names.filter((name) => typeof name === 'string' && name.length > 0)
  if (validNames.length === 0) return await listSecrets()

  const sqlNames = validNames.map(sqlLiteral).join(', ')
  const query = `
    delete from vault.secrets
    where
      description = ${sqlLiteral(edgeSecretDescription)}
      and name in (${sqlNames})
  `

  await executeSql(query)
  return await listSecrets()
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      if (!body) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

async function handleSecretsRoute(req, res) {
  if (!isAuthorizedSecretsRequest(req)) {
    return sendJson(res, 401, { error: { message: 'Unauthorized secrets access' } })
  }

  if (req.method === 'GET') {
    return sendJson(res, 200, await listSecrets())
  }

  if (req.method === 'POST') {
    const body = await readJsonBody(req)
    if (!Array.isArray(body)) {
      return sendJson(res, 400, { error: { message: 'Expected an array of secrets' } })
    }
    return sendJson(
      res,
      200,
      await upsertSecrets(
        body.map((item) => ({
          name: item?.name,
          value: item?.value,
        }))
      )
    )
  }

  if (req.method === 'DELETE') {
    const body = await readJsonBody(req)
    if (!Array.isArray(body)) {
      return sendJson(res, 400, { error: { message: 'Expected an array of secret names' } })
    }
    return sendJson(res, 200, await removeSecrets(body))
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  return sendJson(res, 405, { error: { message: `Method ${req.method} Not Allowed` } })
}

function proxyRequest(req, res) {
  const upstream = http.request(
    {
      host: targetHost,
      port: targetPort,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 500, upstreamRes.headers)
      upstreamRes.pipe(res)
    }
  )

  upstream.on('error', (error) => {
    console.error('Studio upstream proxy error:', error)
    sendJson(res, 502, { error: { message: 'Studio upstream is unavailable' } })
  })

  req.pipe(upstream)
}

const secretsRoutePattern = /^\/api\/v1\/projects\/[^/]+\/secrets\/?$/

const child = spawn('node', ['apps/studio/server.js'], {
  cwd: '/app',
  env: {
    ...process.env,
    PORT: String(targetPort),
    HOSTNAME: targetHost,
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Studio server exited with signal ${signal}`)
  } else if (code !== 0) {
    console.error(`Studio server exited with code ${code}`)
  }
  process.exit(code || 1)
})

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (secretsRoutePattern.test(requestUrl.pathname)) {
      return await handleSecretsRoute(req, res)
    }
    return proxyRequest(req, res)
  } catch (error) {
    console.error('Proxy request failed:', error)
    return sendJson(res, 500, {
      error: { message: error instanceof Error ? error.message : 'Unknown error' },
    })
  }
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal)
    server.close(() => process.exit(0))
  })
}

server.listen(listenPort, listenHost, () => {
  console.log(`Studio proxy listening on http://${listenHost}:${listenPort}`)
})
