import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('retrieve', async () => {
  const res = await pgMeta.version.retrieve()
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        active_connections: expect.any(Number),
        max_connections: expect.any(Number),
        version: expect.stringMatching(/^PostgreSQL/),
        version_number: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "active_connections": Any<Number>,
        "max_connections": Any<Number>,
        "version": StringMatching /\\^PostgreSQL/,
        "version_number": Any<Number>,
      },
      "error": null,
    }
  `
  )
})
