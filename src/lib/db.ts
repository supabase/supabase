import pg from 'pg'
import * as Sentry from '@sentry/node'
import { parse as parseArray } from 'postgres-array'
import { PostgresMetaResult, PoolConfig } from './types.js'

pg.types.setTypeParser(pg.types.builtins.INT8, (x) => {
  const asNumber = Number(x)
  if (Number.isSafeInteger(asNumber)) {
    return asNumber
  } else {
    return x
  }
})
pg.types.setTypeParser(pg.types.builtins.DATE, (x) => x)
pg.types.setTypeParser(pg.types.builtins.INTERVAL, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (x) => x)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (x) => x)
pg.types.setTypeParser(1115, parseArray) // _timestamp
pg.types.setTypeParser(1182, parseArray) // _date
pg.types.setTypeParser(1185, parseArray) // _timestamptz
pg.types.setTypeParser(600, (x) => x) // point
pg.types.setTypeParser(1017, (x) => x) // _point

// Ensure any query will have an appropriate error handler on the pool to prevent connections errors
// to bubble up all the stack eventually killing the server
const poolerQueryHandleError = (
  pgpool: pg.Pool,
  sql: string,
  parameters?: unknown[]
): Promise<pg.QueryResult<any>> => {
  return Sentry.startSpan(
    { op: 'db', name: 'poolerQuery' },
    () =>
      new Promise((resolve, reject) => {
        let rejected = false
        const connectionErrorHandler = (err: any) => {
          // If the error hasn't already be propagated to the catch
          if (!rejected) {
            // This is a trick to wait for the next tick, leaving a chance for handled errors such as
            // RESULT_SIZE_LIMIT to take over other stream errors such as `unexpected commandComplete message`
            setTimeout(() => {
              rejected = true
              return reject(err)
            })
          }
        }
        // This listened avoid getting uncaught exceptions for errors happening at connection level within the stream
        // such as parse or RESULT_SIZE_EXCEEDED errors instead, handle the error gracefully by bubbling in up to the caller
        pgpool.once('error', connectionErrorHandler)
        pgpool
          .query(sql, parameters)
          .then((results: pg.QueryResult<any>) => {
            if (!rejected) {
              return resolve(results)
            }
          })
          .catch((err: any) => {
            // If the error hasn't already be handled within the error listener
            if (!rejected) {
              rejected = true
              return reject(err)
            }
          })
      })
  )
}

export const init: (config: PoolConfig) => {
  query: (
    sql: string,
    opts?: { statementQueryTimeout?: number; trackQueryInSentry?: boolean; parameters?: unknown[] }
  ) => Promise<PostgresMetaResult<any>>
  end: () => Promise<void>
} = (config) => {
  return Sentry.startSpan({ op: 'db', name: 'db.init' }, () => {
    // node-postgres ignores config.ssl if any of sslmode, sslca, sslkey, sslcert,
    // sslrootcert are in the connection string. Here we allow setting sslmode in
    // the connection string while setting the rest in config.ssl.
    if (config.connectionString) {
      const u = new URL(config.connectionString)
      const sslmode = u.searchParams.get('sslmode')
      u.searchParams.delete('sslmode')
      // For now, we don't support setting these from the connection string.
      u.searchParams.delete('sslca')
      u.searchParams.delete('sslkey')
      u.searchParams.delete('sslcert')
      u.searchParams.delete('sslrootcert')
      config.connectionString = u.toString()

      // sslmode:    null, 'disable', 'prefer', 'require', 'verify-ca', 'verify-full', 'no-verify'
      // config.ssl: true, false, {}
      if (sslmode === null) {
        // skip
      } else if (sslmode === 'disable') {
        config.ssl = false
      } else {
        if (typeof config.ssl !== 'object') {
          config.ssl = {}
        }
        config.ssl.rejectUnauthorized = sslmode === 'verify-full'
      }
    }

    // NOTE: Race condition could happen here: one async task may be doing
    // `pool.end()` which invalidates the pool and subsequently all existing
    // handles to `query`. Normally you might only deal with one DB so you don't
    // need to call `pool.end()`, but since the server needs this, we make a
    // compromise: if we run `query` after `pool.end()` is called (i.e. pool is
    // `null`), we temporarily create a pool and close it right after.
    let pool: pg.Pool | null = new pg.Pool(config)

    return {
      async query(
        sql,
        { statementQueryTimeout, trackQueryInSentry, parameters } = { trackQueryInSentry: true }
      ) {
        return Sentry.startSpan(
          // For metrics purposes, log the query that will be run if it's not an user provided query (with possibly sentitives infos)
          {
            op: 'db',
            name: 'init.query',
            attributes: { sql: trackQueryInSentry ? sql : 'custom' },
          },
          async () => {
            // Use statement_timeout AND idle_session_timeout to ensure the connection will be killed even if idle after
            // timeout time.
            const statementTimeoutQueryPrefix =
              statementQueryTimeout !== undefined
                ? `SET statement_timeout='${statementQueryTimeout}s'; SET idle_session_timeout='${statementQueryTimeout}s';`
                : ''
            // node-postgres need a statement_timeout to kill the connection when timeout is reached
            // otherwise the query will keep running on the database even if query timeout was reached
            // This need to be added at query and not connection level because poolers (pgbouncer) doesn't
            // allow to set this parameter at connection time
            const sqlWithStatementTimeout = `${statementTimeoutQueryPrefix}${sql}`
            try {
              if (!pool) {
                const pool = new pg.Pool(config)
                let res = await poolerQueryHandleError(pool, sqlWithStatementTimeout, parameters)
                if (Array.isArray(res)) {
                  res = res.reverse().find((x) => x.rows.length !== 0) ?? { rows: [] }
                }
                await pool.end()
                return { data: res.rows, error: null }
              }

              let res = await poolerQueryHandleError(pool, sqlWithStatementTimeout, parameters)
              if (Array.isArray(res)) {
                res = res.reverse().find((x) => x.rows.length !== 0) ?? { rows: [] }
              }
              return { data: res.rows, error: null }
            } catch (error: any) {
              if (error.constructor.name === 'DatabaseError') {
                // Roughly based on:
                // - https://github.com/postgres/postgres/blob/fc4089f3c65a5f1b413a3299ba02b66a8e5e37d0/src/interfaces/libpq/fe-protocol3.c#L1018
                // - https://github.com/brianc/node-postgres/blob/b1a8947738ce0af004cb926f79829bb2abc64aa6/packages/pg/lib/native/query.js#L33
                let formattedError = ''
                {
                  if (error.severity) {
                    formattedError += `${error.severity}:  `
                  }
                  if (error.code) {
                    formattedError += `${error.code}: `
                  }
                  if (error.message) {
                    formattedError += error.message
                  }
                  formattedError += '\n'
                  if (error.position) {
                    // error.position is 1-based
                    // we also remove our `SET statement_timeout = 'XXs';\n` from the position
                    const position = Number(error.position) - 1 - statementTimeoutQueryPrefix.length
                    // we set the new error position
                    error.position = `${position + 1}`

                    let line = ''
                    let lineNumber = 0
                    let lineOffset = 0

                    const lines = sql.split('\n')
                    let currentOffset = 0
                    for (let i = 0; i < lines.length; i++) {
                      if (currentOffset + lines[i].length > position) {
                        line = lines[i]
                        lineNumber = i + 1 // 1-based
                        lineOffset = position - currentOffset
                        break
                      }
                      currentOffset += lines[i].length + 1 // 1 extra offset for newline
                    }
                    formattedError += `LINE ${lineNumber}: ${line}\n${' '.repeat(5 + lineNumber.toString().length + 2 + lineOffset)}^\n`
                  }
                  if (error.detail) {
                    formattedError += `DETAIL:  ${error.detail}\n`
                  }
                  if (error.hint) {
                    formattedError += `HINT:  ${error.hint}\n`
                  }
                  if (error.internalQuery) {
                    formattedError += `QUERY:  ${error.internalQuery}\n`
                  }
                  if (error.where) {
                    formattedError += `CONTEXT:  ${error.where}\n`
                  }
                }

                return {
                  data: null,
                  error: {
                    ...error,
                    // error.message is non-enumerable
                    message: error.message,
                    formattedError,
                  },
                }
              }
              try {
                // Handle stream errors and result size exceeded errors
                if (error.code === 'RESULT_SIZE_EXCEEDED') {
                  // Force kill the connection without waiting for graceful shutdown
                  return {
                    data: null,
                    error: {
                      message: `Query result size (${error.resultSize} bytes) exceeded the configured limit (${error.maxResultSize} bytes)`,
                      code: error.code,
                      resultSize: error.resultSize,
                      maxResultSize: error.maxResultSize,
                    },
                  }
                }
                return { data: null, error: { code: error.code, message: error.message } }
              } finally {
                try {
                  // If the error isn't a "DatabaseError" assume it's a connection related we kill the connection
                  // To attempt a clean reconnect on next try
                  await this.end.bind(this)
                } catch (error) {
                  console.error('Failed to end the connection on error: ', {
                    this: this,
                    end: this.end,
                  })
                }
              }
            }
          }
        )
      },

      async end() {
        Sentry.startSpan({ op: 'db', name: 'init.end' }, async () => {
          try {
            const _pool = pool
            pool = null
            // Gracefully wait for active connections to be idle, then close all
            // connections in the pool.
            if (_pool) {
              await _pool.end()
            }
          } catch (endError) {
            // Ignore any errors during cleanup just log them
            console.error('Failed ending connection pool', endError)
          }
        })
      },
    }
  })
}
