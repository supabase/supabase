import CryptoJS from 'crypto-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { app } from './utils'
import { CRYPTO_KEY, DEFAULT_POOL_CONFIG } from '../../src/server/constants'

// @ts-ignore: Harmless type error on import.meta.
const cwd = path.dirname(fileURLToPath(import.meta.url))
const sslRootCertPath = path.join(cwd, '../db/server.crt')
const sslRootCert = fs.readFileSync(sslRootCertPath, { encoding: 'utf8' })

test('query with no ssl', async () => {
  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(
        'postgresql://postgres:postgres@localhost:5432/postgres',
        CRYPTO_KEY
      ).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.json()).toMatchInlineSnapshot(`
    [
      {
        "?column?": 1,
      },
    ]
  `)
})

test('query with ssl w/o root cert', async () => {
  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(
        'postgresql://postgres:postgres@localhost:5432/postgres?sslmode=verify-full',
        CRYPTO_KEY
      ).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.json()?.error).toMatch(/^self[ -]signed certificate$/)
})

test('query with ssl with root cert', async () => {
  const defaultSsl = DEFAULT_POOL_CONFIG.ssl
  DEFAULT_POOL_CONFIG.ssl = { ca: sslRootCert }

  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(
        `postgresql://postgres:postgres@localhost:5432/postgres?sslmode=verify-full`,
        CRYPTO_KEY
      ).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.json()).toMatchInlineSnapshot(`
    [
      {
        "?column?": 1,
      },
    ]
  `)

  DEFAULT_POOL_CONFIG.ssl = defaultSsl
})

test('query with invalid space empty encrypted connection string', async () => {
  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(` `, CRYPTO_KEY).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.statusCode).toBe(500)
  expect(res.json()).toMatchInlineSnapshot(`
    {
      "error": "failed to get upstream connection details",
    }
  `)
})

test('query with invalid empty encrypted connection string', async () => {
  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(``, CRYPTO_KEY).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.statusCode).toBe(500)
  expect(res.json()).toMatchInlineSnapshot(`
    {
      "error": "failed to get upstream connection details",
    }
  `)
})

test('query with missing host connection string encrypted connection string', async () => {
  const res = await app.inject({
    method: 'POST',
    path: '/query',
    headers: {
      'x-connection-encrypted': CryptoJS.AES.encrypt(
        `postgres://name:password@:5432/postgres?sslmode=prefer`,
        CRYPTO_KEY
      ).toString(),
    },
    payload: { query: 'select 1;' },
  })
  expect(res.statusCode).toBe(500)
  expect(res.json()).toMatchInlineSnapshot(`
    {
      "error": "failed to process upstream connection details",
    }
  `)
})
