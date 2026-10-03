import type { Server } from '@tus/server'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import pprofRoutes from '../routes/admin/pprof'
import { publicRoutes } from '../routes/tus'
import { registerApiKeyAuth } from './apikey'
import { blobResponse } from './blob-response'
import { db, dbSuperUser } from './db'
import { headerValidator } from './header-validator'
import { enforceJwtRole } from './jwt'
import { logRequest } from './log-request'
import { httpMetrics } from './metrics'
import { requestContext } from './request-context'
import { signals as signalsPlugin } from './signals'
import { storage } from './storage'
import { adminTenantId, tenantId } from './tenant-id'
import { xmlParser } from './xml'

type CapturedHook = {
  name: string
  hook: HookFunction
}

type HookFunction = (...args: unknown[]) => unknown

const expectedHookArity: Record<string, number> = {
  onClose: 2,
  onRequest: 3,
  onRequestAbort: 2,
  onResponse: 3,
  onSend: 4,
  onTimeout: 3,
  preClose: 1,
  preHandler: 3,
  preSerialization: 4,
}

function captureHooks(app: FastifyInstance): CapturedHook[] {
  const hooks: CapturedHook[] = []
  const addHook = app.addHook.bind(app) as unknown as (
    name: string,
    hook: HookFunction
  ) => FastifyInstance

  vi.spyOn(app, 'addHook').mockImplementation(((name: string, hook: HookFunction) => {
    hooks.push({ name, hook })
    return addHook(name, hook)
  }) as typeof app.addHook)

  return hooks
}

async function collectHooks(register: (app: FastifyInstance) => Promise<unknown> | unknown) {
  const app = Fastify()
  const hooks = captureHooks(app)

  try {
    await register(app)
    await app.ready()
    return hooks
  } finally {
    await app.close()
  }
}

function expectHooksToUseCallbackFastPath(capturedHooks: CapturedHook[], hookNames: string[]) {
  for (const hookName of hookNames) {
    const matches = capturedHooks.filter((candidate) => candidate.name === hookName)
    const expectedArity = expectedHookArity[hookName]

    expect(matches.length, `${hookName} hook should be registered`).toBeGreaterThan(0)
    expect(expectedArity, `${hookName} should have an expected callback arity`).toBeDefined()

    for (const { hook } of matches) {
      expect(hook.constructor.name).not.toBe('AsyncFunction')
      expect(
        hook.length,
        `${hookName} hook should use Fastify callback arity`
      ).toBeGreaterThanOrEqual(expectedArity)
    }
  }
}

describe('sync request lifecycle hooks', () => {
  it.each([
    {
      name: 'blobResponse',
      register: (app: FastifyInstance) => app.register(blobResponse),
      hooks: ['onSend'],
    },
    {
      name: 'requestContext',
      register: (app: FastifyInstance) => app.register(requestContext),
      hooks: ['onRequest'],
    },
    {
      name: 'tenantId',
      register: (app: FastifyInstance) => app.register(tenantId),
      hooks: ['onRequest'],
    },
    {
      name: 'adminTenantId',
      register: (app: FastifyInstance) => app.register(adminTenantId),
      hooks: ['onRequest'],
    },
    {
      name: 'signals',
      register: (app: FastifyInstance) => app.register(signalsPlugin),
      hooks: ['onRequest', 'onRequestAbort'],
    },
    {
      name: 'httpMetrics',
      register: (app: FastifyInstance) => app.register(httpMetrics()),
      hooks: ['onRequest', 'onResponse'],
    },
    {
      name: 'logRequest',
      register: (app: FastifyInstance) => app.register(logRequest({})),
      hooks: ['onRequest', 'preHandler', 'onSend', 'onResponse'],
    },
    {
      name: 'headerValidator',
      register: (app: FastifyInstance) => app.register(headerValidator()),
      hooks: ['onSend'],
    },
    {
      name: 'storage',
      register: (app: FastifyInstance) => app.register(storage),
      hooks: ['preHandler', 'onClose'],
    },
    {
      name: 'db cleanup',
      register: (app: FastifyInstance) => app.register(db),
      hooks: ['onSend', 'onTimeout', 'onRequestAbort'],
    },
    {
      name: 'dbSuperUser cleanup',
      register: (app: FastifyInstance) => app.register(dbSuperUser),
      hooks: ['onSend', 'onTimeout', 'onRequestAbort'],
    },
    {
      name: 'admin API key auth',
      register: (app: FastifyInstance) => registerApiKeyAuth(app),
      hooks: ['onRequest'],
    },
    {
      name: 'JWT role enforcement',
      register: (app: FastifyInstance) =>
        app.register(enforceJwtRole, { roles: ['authenticated'] }),
      hooks: ['preHandler'],
    },
    {
      name: 'pprof response headers',
      register: (app: FastifyInstance) => {
        app.setValidatorCompiler(() => () => true)
        return app.register(pprofRoutes)
      },
      hooks: ['onSend', 'preClose', 'onClose'],
    },
    {
      name: 'public TUS request context',
      register: (app: FastifyInstance) =>
        app.register(publicRoutes, {
          tusServer: { handle: vi.fn() } as unknown as Server,
        }),
      hooks: ['preHandler'],
    },
    {
      name: 'xmlParser',
      register: (app: FastifyInstance) => app.register(xmlParser),
      hooks: ['preSerialization'],
    },
  ])('registers $name hot hooks without async functions', async ({ register, hooks }) => {
    const capturedHooks = await collectHooks(register)

    expectHooksToUseCallbackFastPath(capturedHooks, hooks)
  })

  it('rejects promise-returning hooks without callback arity', () => {
    const promiseReturningHook = () => Promise.resolve()

    expect(() =>
      expectHooksToUseCallbackFastPath(
        [{ name: 'onRequest', hook: promiseReturningHook }],
        ['onRequest']
      )
    ).toThrow(/callback arity/)
  })
})
