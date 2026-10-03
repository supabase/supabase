import { afterEach, expect, it, vi } from 'vitest'
import { getConfig } from '../../config'
import { assertLifecycleApiEnabled, assertLifecycleWriteReady } from './guards'

afterEach(() => {
  vi.unstubAllEnvs()
  getConfig({ reload: true })
})

it('applies config reloads to lifecycle access without reloading the guard module', async () => {
  const database = { hasMigration: vi.fn().mockResolvedValue(true) }

  vi.stubEnv('STORAGE_LIFECYCLE_ENABLED', 'false')
  getConfig({ reload: true })
  expect(() => assertLifecycleApiEnabled('avatars')).toThrow()
  await expect(assertLifecycleWriteReady(database, 'avatars')).rejects.toMatchObject({
    code: 'FeatureNotEnabled',
  })
  expect(database.hasMigration).not.toHaveBeenCalled()

  vi.stubEnv('STORAGE_LIFECYCLE_ENABLED', 'true')
  getConfig({ reload: true })
  expect(() => assertLifecycleApiEnabled('avatars')).not.toThrow()
  await expect(assertLifecycleWriteReady(database, 'avatars')).resolves.toBeUndefined()
  expect(database.hasMigration).toHaveBeenCalledWith('bucket-lifecycle-configuration')

  database.hasMigration.mockClear()
  vi.stubEnv('STORAGE_LIFECYCLE_ENABLED', 'false')
  getConfig({ reload: true })
  expect(() => assertLifecycleApiEnabled('avatars')).toThrow()
  await expect(assertLifecycleWriteReady(database, 'avatars')).rejects.toMatchObject({
    code: 'FeatureNotEnabled',
  })
  expect(database.hasMigration).not.toHaveBeenCalled()
})
