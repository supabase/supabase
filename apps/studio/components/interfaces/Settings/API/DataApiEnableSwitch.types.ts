import { z } from 'zod'

import type { ExposedEntity } from './DataApiEnableSwitch.utils'

export const dataApiFormSchema = z.object({
  enableDataApi: z.boolean(),
})

export type DataApiFormValues = z.infer<typeof dataApiFormSchema>

export type EnableCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'confirming'; unsafeEntities: Array<ExposedEntity> }

export type EnableCheckAction =
  | { type: 'START_CHECK' }
  | { type: 'ENTITIES_FOUND'; unsafeEntities: Array<ExposedEntity> }
  | { type: 'DISMISS' }
