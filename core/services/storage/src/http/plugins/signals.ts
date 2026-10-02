import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import type { IncomingMessage, ServerResponse } from 'http'

declare module 'fastify' {
  interface FastifyRequest {
    signals: RequestSignals
  }
}

/**
 * Per-request abort controllers, allocated lazily.
 *
 * Creating `AbortController`s and wiring socket `close` listeners is relatively
 * expensive, and the majority of requests on high-RPS routes never read any of
 * these signals. Mirroring Fastify's own lazy `request.signal` allocation, the
 * controllers and their listeners are only created the first time a signal is
 * accessed — requests that never touch them pay nothing.
 */
export class RequestSignals {
  private _body?: AbortController
  private _response?: AbortController
  private _disconnect?: AbortController
  private wired = false

  constructor(
    private readonly rawReq: IncomingMessage,
    private readonly rawRes: ServerResponse
  ) {}

  /** Aborted when the client terminates before the request body is fully received. */
  get body(): AbortController {
    if (!this._body) {
      this._body = new AbortController()
      this.wire()
      if (this.isRequestAborted()) {
        this._body.abort()
      }
    }
    return this._body
  }

  /** Aborted when the client terminates before the response is fully sent. */
  get response(): AbortController {
    if (!this._response) {
      this._response = new AbortController()
      this.wire()
      if (this.isResponseAborted()) {
        this._response.abort()
      }
    }
    return this._response
  }

  /** Aborted when the client disconnects at any point during the request. */
  get disconnect(): AbortController {
    if (!this._disconnect) {
      this._disconnect = new AbortController()
      this.wire()
      if (this.isRequestAborted() || this.isResponseAborted()) {
        this._disconnect.abort()
      }
    }
    return this._disconnect
  }

  /** Abort the request-side signals. Invoked from Fastify's `onRequestAbort` hook. */
  abortRequest(): void {
    this.onRequestClosed()
  }

  private isRequestAborted(): boolean {
    return this.rawReq.aborted
  }

  private isResponseAborted(): boolean {
    return this.rawRes.closed && !this.rawRes.writableFinished
  }

  private onRequestClosed(): void {
    if (this._body && !this._body.signal.aborted) {
      this._body.abort()
    }
    this.abortDisconnect()
  }

  private onResponseClosed(): void {
    if (this._response && !this._response.signal.aborted) {
      this._response.abort()
    }
    this.abortDisconnect()
  }

  private abortDisconnect(): void {
    if (this._disconnect && !this._disconnect.signal.aborted) {
      this._disconnect.abort()
    }
  }

  /** Wire the socket `close` listeners once, on first access of any signal. */
  private wire(): void {
    if (this.wired) {
      return
    }
    this.wired = true

    // Client terminated the request before the body was fully sent
    this.rawReq.once('close', () => {
      if (this.rawReq.aborted) {
        this.onRequestClosed()
      }
    })

    // Client terminated the request before the server finished sending the response
    this.rawRes.once('close', () => {
      if (!this.rawRes.writableFinished) {
        this.onResponseClosed()
      }
    })
  }
}

export const signals = fastifyPlugin(
  async function (fastify: FastifyInstance) {
    fastify.decorateRequest('signals')

    fastify.addHook('onRequest', (req, res, done) => {
      req.signals = new RequestSignals(req.raw, res.raw)
      done()
    })

    fastify.addHook('onRequestAbort', (req, done) => {
      // A closing connection can skip onRequest before signals are initialized.
      req.signals?.abortRequest()
      done()
    })
  },
  { name: 'request-signals' }
)
