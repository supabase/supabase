import { getServiceKeyUser, PgPoolManager } from '@internal/database'
import { getConfig } from '../config'

const { databaseURL, databasePoolURL, tenantId } = getConfig()

describe('TenantPool Database', () => {
  it('cannot acquire from a pool retired by its manager', async () => {
    const superUser = await getServiceKeyUser(tenantId)
    const poolManager = new PgPoolManager()
    const pool = poolManager.getPool({
      tenantId,
      isExternalPool: true,
      maxConnections: 20,
      dbUrl: databasePoolURL || databaseURL,
      user: superUser,
      superUser,
    })

    try {
      const result = await pool.value.acquire().query<{ n: number }>('SELECT 1 as n')
      expect(result.rows[0].n).toEqual(1)

      await poolManager.destroy(tenantId)

      expect(() => pool.value.acquire()).toThrow(
        expect.objectContaining({
          code: 'InternalError',
          message: 'Cannot acquire from a disposed pool strategy',
        })
      )
    } finally {
      await poolManager.destroy(tenantId)
    }
  })
})
