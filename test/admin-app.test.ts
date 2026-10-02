import { expect, test, describe } from 'vitest'
import { build } from '../src/server/admin-app.js'

describe('admin-app', () => {
  test('should register metrics endpoint', async () => {
    const app = build()

    // Test that the app can be started (this will trigger plugin registration)
    await app.ready()

    // Verify that metrics endpoint is available
    const routes = app.printRoutes()
    expect(routes).toContain('metrics')

    await app.close()
  })
})
