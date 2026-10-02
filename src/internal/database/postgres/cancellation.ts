import type { PoolClient } from 'pg'
import PgConnection from 'pg/lib/connection'

export type CancellableClient = Omit<PoolClient, 'host' | 'port'> & {
  processID?: number
  secretKey?: number
  host?: string | string[]
  port?: number
  connectionParameters?: {
    host?: string | string[]
    port?: number
  }
}

export type CancelTarget =
  | {
      type: 'socket'
      path: string
    }
  | {
      type: 'tcp'
      host: string
      port: number
    }

export async function cancelQuery(client: CancellableClient): Promise<void> {
  // PostgreSQL cancel requests are best effort. node-postgres sends them over a
  // fresh raw protocol connection, so SSL-required proxies can close the socket
  // before the backend sees the cancel request.
  const processID = client.processID
  const secretKey = client.secretKey

  if (!processID || !secretKey) {
    return
  }

  const cancelConnection = new PgConnection()
  cancelConnection.unref()
  const target = getCancelTarget(client)

  return new Promise((resolve) => {
    let resolved = false

    const done = () => {
      if (resolved) {
        return
      }

      resolved = true
      clearTimeout(timeout)
      cancelConnection.end()
      resolve()
    }

    const timeout = setTimeout(done, 5000)
    timeout.unref()

    cancelConnection.on('error', done)
    cancelConnection.on('end', done)
    cancelConnection.on('connect', () => {
      try {
        cancelConnection.cancel(processID, secretKey)
      } catch {
        done()
      }
    })

    if (target.type === 'socket') {
      cancelConnection.connect(target.path)
    } else {
      cancelConnection.connect(target.port, target.host)
    }
  })
}

export function getCancelTarget(
  client: Pick<CancellableClient, 'host' | 'port' | 'connectionParameters'>
): CancelTarget {
  const rawHost = client.host || client.connectionParameters?.host || 'localhost'
  const host = Array.isArray(rawHost) ? rawHost[0] || 'localhost' : rawHost
  const port = client.port || client.connectionParameters?.port || 5432

  if (host.startsWith('/')) {
    return {
      type: 'socket',
      path: `${host}/.s.PGSQL.${port}`,
    }
  }

  return {
    type: 'tcp',
    host,
    port,
  }
}
