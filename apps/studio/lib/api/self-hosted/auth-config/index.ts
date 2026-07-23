import assert from 'node:assert'

import { assertSelfHosted } from '../util'
import { FileSystemAuthConfigStore } from './fileStore'

export function getAuthConfigStore() {
  assertSelfHosted()
  assert(process.env.AUTH_CONFIG_MANAGEMENT_FOLDER, 'AUTH_CONFIG_MANAGEMENT_FOLDER is required')

  return new FileSystemAuthConfigStore(process.env.AUTH_CONFIG_MANAGEMENT_FOLDER)
}
