import type { Plugin } from 'ajv'
import fastify from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { addFiniteKeyword, stripFiniteKeyword, withFiniteAjv } from './finite'

const finiteIntegerSchema = {
  type: 'object',
  properties: {
    value: { type: 'integer', finite: true },
  },
  required: ['value'],
} as const

describe('finite AJV keyword', () => {
  it('rejects non-finite query strings after coercion', async () => {
    const app = fastify(withFiniteAjv({}))
    let validatedValue: unknown
    app.get<{ Querystring: { value: number } }>(
      '/',
      { schema: { querystring: finiteIntegerSchema } },
      async (request) => {
        validatedValue = request.query.value
        return { ok: true }
      }
    )

    for (const value of ['Infinity', '-Infinity', '1e999', '-1e999']) {
      const response = await app.inject({ method: 'GET', url: `/?value=${value}` })
      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
      expect(validatedValue).toBeUndefined()
    }

    const response = await app.inject({ method: 'GET', url: '/?value=42' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
    expect(validatedValue).toBe(42)

    await app.close()
  })

  it('rejects quoted non-finite JSON numbers while preserving nullable values', async () => {
    const app = fastify(withFiniteAjv({}))
    let validatedValue: unknown
    app.post<{ Body: { value: number | null } }>(
      '/',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              value: { type: 'number', finite: true, nullable: true },
            },
            required: ['value'],
          },
        },
      },
      async (request) => {
        validatedValue = request.body.value
        return { ok: true }
      }
    )

    for (const value of ['Infinity', '-Infinity', '1e999', '-1e999']) {
      const response = await app.inject({ method: 'POST', url: '/', payload: { value } })
      expect(response.statusCode).toBe(400)
      expect(response.json().message).toContain('finite')
      expect(validatedValue).toBeUndefined()
    }

    const response = await app.inject({ method: 'POST', url: '/', payload: { value: null } })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
    expect(validatedValue).toBeNull()

    await app.close()
  })

  it('preserves AJV plugins supplied by the caller', async () => {
    const existingPlugin: Plugin<unknown> = vi.fn((ajv) => ajv)
    const app = fastify(
      withFiniteAjv({
        ajv: {
          plugins: [existingPlugin],
        },
      })
    )

    app.get('/', { schema: { querystring: finiteIntegerSchema } }, async () => ({}))
    await app.ready()

    expect(existingPlugin).toHaveBeenCalledOnce()

    await app.close()
  })

  it('exports a plugin usable by independent AJV compilers', () => {
    expect(addFiniteKeyword).toBeTypeOf('function')
  })
})

describe('stripFiniteKeyword', () => {
  it('strips boolean finite keywords recursively from nested objects and arrays', () => {
    const schema = {
      anyOf: [
        { type: 'number', finite: true },
        {
          type: 'array',
          items: {
            anyOf: [{ type: 'integer', finite: false }, { type: 'string' }],
          },
        },
      ],
    }

    expect(stripFiniteKeyword(schema)).toEqual({
      anyOf: [
        { type: 'number' },
        {
          type: 'array',
          items: {
            anyOf: [{ type: 'integer' }, { type: 'string' }],
          },
        },
      ],
    })
  })

  it('preserves a schema property named finite', () => {
    const schema = {
      type: 'object',
      properties: {
        finite: {
          anyOf: [{ type: 'number', finite: true }, { type: 'boolean' }],
        },
      },
    }

    expect(stripFiniteKeyword(schema)).toEqual({
      type: 'object',
      properties: {
        finite: {
          anyOf: [{ type: 'number' }, { type: 'boolean' }],
        },
      },
    })
  })

  it('does not mutate the source schema', () => {
    const schema = {
      type: 'object',
      properties: {
        value: { type: 'number', finite: true },
      },
    }

    const stripped = stripFiniteKeyword(schema)

    expect(stripped).not.toBe(schema)
    expect(schema.properties.value).toEqual({ type: 'number', finite: true })
  })
})
