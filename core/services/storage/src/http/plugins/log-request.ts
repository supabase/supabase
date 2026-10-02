import {
  getValidTraceparent,
  logSchema,
  serializeReplyLog,
  serializeRequestLog,
} from '@internal/monitoring'
import type { FastifyReply, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

interface RequestLoggerOptions {
  excludeUrls?: Set<string>
}

// Fixed positions in a validated W3C traceparent value.
const TRACE_ID_START = 3
const TRACE_ID_END = 35
const SPAN_ID_START = 36
const SPAN_ID_END = 52

type BivariantHandler<Args extends unknown[], Return> = {
  bivarianceHack(...args: Args): Return
}['bivarianceHack']

declare module 'http' {
  interface IncomingMessage {
    executionError?: Error
    resources?: string[]
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    executionError?: Error
    operation?: string
    resources?: string[]
    startTime: number
    executionTime?: number
  }

  interface FastifyContextConfig {
    operation?: string
    resources?: BivariantHandler<[req: FastifyRequest], string[]>
    logMetadata?: BivariantHandler<[req: FastifyRequest], Record<string, unknown>>
  }
}

/**
 * Request logger plugin
 * @param options
 */
export const logRequest = (options: RequestLoggerOptions) =>
  fastifyPlugin(
    async (fastify) => {
      const excludeUrls = options.excludeUrls?.size ? options.excludeUrls : undefined

      fastify.addHook('onRequest', (req, res, done) => {
        req.startTime = performance.now()

        if (excludeUrls?.has(req.url)) {
          done()
          return
        }

        res.raw.once('close', () => {
          if (req.raw.aborted) {
            doRequestLog(req, {
              statusCode: 'ABORTED REQ',
              responseTime: performance.now() - req.startTime,
            })
            return
          }

          if (!res.raw.writableFinished) {
            doRequestLog(req, {
              statusCode: 'ABORTED RES',
              responseTime: performance.now() - req.startTime,
            })
          }
        })
        done()
      })

      /**
       * Adds req.resources and req.operation to the request object
       */
      fastify.addHook('preHandler', (req, _reply, done) => {
        let resources = req.resources

        if (resources === undefined) {
          resources = req.routeOptions.config.resources?.(req)
        }

        if (resources === undefined) {
          resources = req.raw.resources
        }

        if (resources === undefined) {
          const resourceFromParams = getResourceFromParams(req.params)
          resources = resourceFromParams ? [resourceFromParams] : []
        }

        if (resources && resources.length > 0) {
          for (let index = 0; index < resources.length; index++) {
            const resource = resources[index]
            if (!resource.startsWith('/')) {
              resources[index] = `/${resource}`
            }
          }
        }

        req.resources = resources
        req.operation = req.routeOptions.config.operation

        if (req.operation && typeof req.opentelemetry === 'function') {
          req.opentelemetry()?.span?.setAttribute('http.operation', req.operation)
        }
        done()
      })

      fastify.addHook('onSend', (req, _reply, payload, done) => {
        req.executionTime = Math.round(performance.now() - req.startTime)
        done(null, payload)
      })

      fastify.addHook('onResponse', (req, reply, done) => {
        if (excludeUrls?.has(req.url)) {
          done()
          return
        }

        doRequestLog(req, {
          reply,
          statusCode: reply.statusCode,
          responseTime: reply.elapsedTime,
          executionTime: req.executionTime,
        })
        done()
      })
    },
    { name: 'log-request' }
  )

interface LogRequestOptions {
  reply?: FastifyReply
  statusCode: number | 'ABORTED REQ' | 'ABORTED RES'
  responseTime: number
  executionTime?: number
}

function doRequestLog(req: FastifyRequest, options: LogRequestOptions) {
  const requestLog = serializeRequestLog(req)
  const replyLog = serializeReplyLog(options.reply)
  const rMeth = requestLog.method
  const rUrl = requestLog.url
  const uAgent = req.headers['user-agent']
  const rId = req.id
  const cIP = req.ip
  const statusCode = options.statusCode
  const error = req.raw.executionError || req.executionError
  const tenantId = req.tenantId
  const traceparent = getValidTraceparent(req.headers)
  const traceId = traceparent?.slice(TRACE_ID_START, TRACE_ID_END) ?? ''
  const spanId = traceparent?.slice(SPAN_ID_START, SPAN_ID_END) ?? ''

  let reqMetadata = '{}'

  if (req.routeOptions.config.logMetadata) {
    try {
      const metadata = req.routeOptions.config.logMetadata(req)

      if (metadata) {
        try {
          reqMetadata = JSON.stringify(metadata)

          if (typeof req.opentelemetry === 'function') {
            req.opentelemetry()?.span?.setAttribute('http.metadata', reqMetadata)
          }
        } catch (e) {
          // do nothing
          logSchema.warning(req.log, 'Failed to serialize log metadata', {
            type: 'otel',
            tenantId,
            project: tenantId,
            reqId: rId,
            sbReqId: req.sbReqId,
            error: e,
          })
        }
      }
    } catch (e) {
      logSchema.error(req.log, 'Failed to get log metadata', {
        type: 'request',
        tenantId,
        project: tenantId,
        reqId: rId,
        sbReqId: req.sbReqId,
        error: e,
      })
    }
  }

  const buildLogMessage = `${tenantId} | ${rMeth} | ${statusCode} | ${cIP} | ${rId} | ${rUrl} | ${uAgent}`

  logSchema.request(req.log, buildLogMessage, {
    type: 'request',
    tenantId,
    project: tenantId,
    reqId: rId,
    sbReqId: req.sbReqId,
    traceId,
    spanId,
    req: requestLog,
    reqMetadata,
    res: replyLog,
    responseTime: options.responseTime,
    executionTime: options.executionTime,
    error,
    owner: req.owner,
    role: req.jwtPayload?.role,
    resources: req.resources,
    operation: req.operation ?? req.routeOptions.config.operation,
    serverTimes: req.serverTimings,
  })
}

function getResourceFromParams(params: unknown): string {
  if (!params || typeof params !== 'object') {
    return ''
  }

  let resource = ''
  let first = true

  for (const key in params) {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      continue
    }

    if (!first) {
      resource += '/'
    }

    const value = (params as Record<string, unknown>)[key]
    resource += value == null ? '' : String(value)
    first = false
  }

  return resource
}
