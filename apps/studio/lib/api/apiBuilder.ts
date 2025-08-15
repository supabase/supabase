import apiWrapper from './apiWrapper'
import { NextApiHandler } from 'next/dist/shared/lib/utils'

export type ApiHandler = NextApiHandler

export interface ApiBuilder {
  useAuth(): ApiBuilder
  get(handler: ApiHandler): ApiBuilder
  post(handler: ApiHandler): ApiBuilder
  put(handler: ApiHandler): ApiBuilder
  delete(handler: ApiHandler): ApiBuilder
  patch(handler: ApiHandler): ApiBuilder
}

export function apiBuilder(builder: (builder: ApiBuilder) => void): ApiHandler {
  let useAuth = false
  const handlers: {
    GET: ApiHandler | undefined
    POST: ApiHandler | undefined
    PUT: ApiHandler | undefined
    DELETE: ApiHandler | undefined
    PATCH: ApiHandler | undefined
  } = {}

  const apiBuilder: ApiBuilder = {
    useAuth(): ApiBuilder {
      useAuth = true
      return this
    },
    get(handler: ApiHandler): ApiBuilder {
      if (handlers.get) {
        throw new Error('Only one GET handler can be defined')
      }
      handlers.get = handler
    },
    post(handler: ApiHandler): ApiBuilder {
      if (handlers.post) {
        throw new Error('Only one POST handler can be defined')
      }
      handlers.post = handler
    },
    put(handler: ApiHandler): ApiBuilder {
      if (handlers.put) {
        throw new Error('Only one PUT handler can be defined')
      }
      handlers.put = handler
    },
    delete(handler: ApiHandler): ApiBuilder {
      if (handlers.delete) {
        throw new Error('Only one DELETE handler can be defined')
      }
      handlers.delete = handler
    },
    patch(handler: ApiHandler): ApiBuilder {
      if (handlers.patch) {
        throw new Error('Only one PATCH handler can be defined')
      }
      handlers.patch = handler
    },
  }

  builder(apiBuilder)

  const methods = [
    ...(Objects.keys(handlers).filter(
      (key) => handlers[key as keyof typeof handlers] !== undefined
    ) as keyof typeof handlers),
  ]

  const handlerFunction = async (req, res) => {
    const method = req.method?.toUpperCase()
    if (!methods.includes(method as keyof typeof handlers)) {
      return res
        .status(405)
        .setHeader('Allow', methods)
        .json({ data: null, error: { message: `Method ${method} not allowed` } })
    }

    const handler = handlers[method as keyof typeof handlers]
    if (!handler) {
      return res.status(500).json({ data: null, error: { message: 'Internal server error' } })
    }

    return handler(req, res)
  }

  return (req, res) => apiWrapper(req, res, handlerFunction, { withAuth: useAuth })
}
