import pgcs from 'pg-connection-string'
import { FastifyRequest } from 'fastify'
import { DEFAULT_POOL_CONFIG } from './constants.js'
import { PoolConfig } from '../lib/types.js'

export const extractRequestForLogging = (request: FastifyRequest) => {
  let pg: string = 'unknown'
  try {
    if (request.headers.pg) {
      pg = pgcs.parse(request.headers.pg as string).host || pg
    }
  } catch (e: any) {
    console.warn('failed to parse PG connstring for ' + request.url)
  }

  const additional = request.headers['x-supabase-info']?.toString() || ''

  return {
    method: request.method,
    url: request.url,
    pg,
    opt: additional,
  }
}

export function createConnectionConfig(
  request: FastifyRequest,
  queryTimeoutSecs?: number | string
): PoolConfig {
  const connectionString = request.headers.pg as string
  const timeout = queryTimeoutSecs !== undefined ? Number(queryTimeoutSecs) : undefined
  const config = {
    ...DEFAULT_POOL_CONFIG,
    connectionString,
    ...(timeout !== undefined && {
      query_timeout: timeout === 0 ? undefined : timeout * 1000,
    }),
  }

  // Override application_name if custom one provided in header
  if (request.headers['x-pg-application-name']) {
    config.application_name = request.headers['x-pg-application-name'] as string
  }

  return config
}

export function translateErrorToResponseCode(
  error: { message: string },
  defaultResponseCode = 400
): number {
  if (error.message === 'Connection terminated due to connection timeout') {
    return 504
  } else if (error.message === 'sorry, too many clients already') {
    return 503
  } else if (error.message === 'Query read timeout') {
    return 408
  }
  return defaultResponseCode
}
