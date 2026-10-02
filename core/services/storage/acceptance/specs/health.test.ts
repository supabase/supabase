import { describeAcceptance, getAcceptanceConfig, requireConfigValue } from '../support/config'
import { createAdminClient, createRestClient } from '../support/http'

describeAcceptance(
  'target health',
  {
    profiles: ['smoke'],
  },
  () => {
    it('serves status and version endpoints', async () => {
      const client = createRestClient()

      await client.request('GET', '/status', { expectedStatus: 200 })
      const version = await client.request('GET', '/version', { expectedStatus: 200 })

      expect(version.body.trim().length).toBeGreaterThan(0)
    })
  }
)

describeAcceptance(
  'admin target health',
  {
    profiles: ['smoke', 'core', 'full'],
    requires: ['admin'],
  },
  () => {
    it('serves admin status and protects admin routes with an API key', async () => {
      const config = getAcceptanceConfig()
      const client = createAdminClient()

      await client.request('GET', '/status', { expectedStatus: 200 })
      await client.request('GET', '/tenants', { expectedStatus: 401 })
      await client.request('GET', '/tenants', {
        expectedStatus: 200,
        headers: {
          apikey: requireConfigValue(config.adminApiKey, 'ACCEPTANCE_ADMIN_API_KEY'),
        },
      })
    })
  }
)
