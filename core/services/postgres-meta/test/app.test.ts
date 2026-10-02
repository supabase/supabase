import { expect, test, describe } from 'vitest'
import { build } from '../src/server/app.js'

describe('server/app', () => {
  test('should handle root endpoint', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/',
    })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('documentation')
    await app.close()
  })

  test('should handle health endpoint', async () => {
    const app = build()
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data).toHaveProperty('date')
    await app.close()
  })
})
