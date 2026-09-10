import { components } from 'api-types'

import { PROJECT_STATUS } from '@/lib/constants'

export const REPLICA_STATUS: {
  [key: string]: components['schemas']['DatabaseStatusResponse']['status']
} = {
  ...PROJECT_STATUS,
  INIT_READ_REPLICA: 'INIT_READ_REPLICA',
  INIT_READ_REPLICA_FAILED: 'INIT_READ_REPLICA_FAILED',
}
